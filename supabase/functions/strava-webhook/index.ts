import { serve } from 'https://deno.land/std@0.168.0/http/server.ts';
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.7.1';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

// Rate limiting configuration for Strava API calls
const RATE_LIMIT = {
  delayBetweenRequests: 200,
};

const delay = (ms: number) => new Promise((resolve) => setTimeout(resolve, ms));

// Process a single activity webhook event
async function processActivityEvent(
  supabaseAdmin: any,
  objectId: number,
  aspectType: string,
  ownerId: number
) {
  console.log(`Processing activity event: ${aspectType} for activity ${objectId}, owner ${ownerId}`);

  // Find user by strava_id
  const { data: profile, error: profileError } = await supabaseAdmin
    .from('profiles')
    .select('id, strava_id')
    .eq('strava_id', ownerId)
    .single();

  if (profileError || !profile) {
    console.log(`No profile found for Strava athlete ${ownerId}`);
    return;
  }

  const userId = profile.id;
  console.log(`Found user ${userId} for Strava athlete ${ownerId}`);

  if (aspectType === 'delete') {
    // Remove check-ins for deleted activity
    const { error: deleteError } = await supabaseAdmin
      .from('check_ins')
      .delete()
      .eq('user_id', userId)
      .eq('activity_id', objectId);

    if (deleteError) {
      console.error(`Failed to delete check-ins for activity ${objectId}:`, deleteError);
    } else {
      console.log(`Deleted check-ins for activity ${objectId}`);
    }
    return;
  }

  // For create/update events, fetch the activity and process it
  if (aspectType === 'create' || aspectType === 'update') {
    // Get Strava credentials
    const { data: credentials, error: credsError } = await supabaseAdmin.rpc(
      'get_strava_credentials',
      { _user_id: userId }
    );

    if (credsError || !credentials || credentials.length === 0) {
      console.error(`No Strava credentials found for user ${userId}`);
      return;
    }

    const creds = credentials[0];
    let accessToken = creds.strava_access_token;
    const refreshToken = creds.strava_refresh_token;
    const expiresAt = new Date(creds.strava_token_expires_at);

    // Refresh token if expired
    if (expiresAt <= new Date()) {
      console.log('Token expired, refreshing...');
      const clientId = Deno.env.get('STRAVA_CLIENT_ID');
      const clientSecret = Deno.env.get('STRAVA_CLIENT_SECRET');

      const refreshResponse = await fetch('https://www.strava.com/oauth/token', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          client_id: clientId,
          client_secret: clientSecret,
          refresh_token: refreshToken,
          grant_type: 'refresh_token',
        }),
      });

      if (!refreshResponse.ok) {
        console.error('Failed to refresh token');
        return;
      }

      const refreshData = await refreshResponse.json();
      accessToken = refreshData.access_token;

      // Update credentials in database
      const newExpiresAt = new Date(refreshData.expires_at * 1000);
      await supabaseAdmin.rpc('upsert_strava_credentials', {
        _user_id: userId,
        _access_token: accessToken,
        _refresh_token: refreshData.refresh_token,
        _expires_at: newExpiresAt.toISOString(),
      });
      console.log('Token refreshed successfully');
    }

    // Fetch activity details
    await delay(RATE_LIMIT.delayBetweenRequests);
    
    const activityResponse = await fetch(
      `https://www.strava.com/api/v3/activities/${objectId}?include_all_efforts=true`,
      {
        headers: { Authorization: `Bearer ${accessToken}` },
      }
    );

    if (!activityResponse.ok) {
      console.error(`Failed to fetch activity ${objectId}: ${activityResponse.status}`);
      return;
    }

    const activity = await activityResponse.json();
    console.log(`Fetched activity: ${activity.name} (type: ${activity.type})`);

    // Only process runs
    if (activity.type !== 'Run') {
      console.log(`Skipping non-run activity (type: ${activity.type})`);
      return;
    }

    // Get Uetliberg segments
    const { data: uetlibergSegments, error: segmentsError } = await supabaseAdmin
      .from('uetliberg_segments')
      .select('segment_id, name, priority, ends_at_uetliberg');

    if (segmentsError || !uetlibergSegments) {
      console.error('Failed to fetch Uetliberg segments:', segmentsError);
      return;
    }

    const segmentIds = new Set(uetlibergSegments.map((s: any) => s.segment_id));
    const segmentEfforts = activity.segment_efforts || [];

    // Find matching Uetliberg segment efforts
    const matchingEfforts = segmentEfforts.filter((effort: any) =>
      segmentIds.has(effort.segment.id)
    );

    console.log(`Found ${matchingEfforts.length} Uetliberg segment efforts`);

    if (matchingEfforts.length === 0) {
      console.log('No Uetliberg segments in this activity');
      return;
    }

    // Create check-ins for each matching segment
    for (const effort of matchingEfforts) {
      const { error: checkInError } = await supabaseAdmin
        .from('check_ins')
        .upsert({
          user_id: userId,
          segment_id: effort.segment.id,
          activity_id: activity.id,
          activity_name: activity.name,
          elapsed_time: effort.elapsed_time,
          distance: effort.distance,
          checked_in_at: activity.start_date,
          activity_distance: activity.distance,
          activity_elapsed_time: activity.elapsed_time,
        }, {
          onConflict: 'user_id,segment_id,activity_id',
        });

      if (checkInError) {
        console.error(`Failed to create check-in for segment ${effort.segment.id}:`, checkInError);
      } else {
        console.log(`Created/updated check-in for segment ${effort.segment.name} (${effort.segment.id})`);
      }
    }

    // Check for new achievements
    try {
      const { error: achievementError } = await supabaseAdmin.functions.invoke('check-achievements', {
        body: { user_id: userId },
      });
      
      if (achievementError) {
        console.error('Failed to check achievements:', achievementError);
      } else {
        console.log('Achievement check triggered successfully');
      }
    } catch (err) {
      console.error('Error invoking check-achievements:', err);
    }
  }
}

// Process athlete deauthorization event
async function processAthleteEvent(
  supabaseAdmin: any,
  objectId: number,
  aspectType: string,
  updates: any
) {
  console.log(`Processing athlete event: ${aspectType} for athlete ${objectId}`);

  if (updates?.authorized === 'false') {
    console.log(`Athlete ${objectId} has deauthorized the app`);
    
    // Find user by strava_id
    const { data: profile, error: profileError } = await supabaseAdmin
      .from('profiles')
      .select('id')
      .eq('strava_id', objectId)
      .single();

    if (profileError || !profile) {
      console.log(`No profile found for Strava athlete ${objectId}`);
      return;
    }

    // Delete Strava credentials
    const { error: deleteError } = await supabaseAdmin
      .from('strava_credentials')
      .delete()
      .eq('user_id', profile.id);

    if (deleteError) {
      console.error(`Failed to delete credentials for user ${profile.id}:`, deleteError);
    } else {
      console.log(`Deleted Strava credentials for user ${profile.id}`);
    }
  }
}

serve(async (req) => {
  const url = new URL(req.url);
  
  // Handle CORS preflight
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  // GET request: Webhook subscription validation
  if (req.method === 'GET') {
    const hubMode = url.searchParams.get('hub.mode');
    const hubChallenge = url.searchParams.get('hub.challenge');
    const hubVerifyToken = url.searchParams.get('hub.verify_token');

    console.log(`Webhook validation request: mode=${hubMode}, verify_token=${hubVerifyToken}`);

    const verifyToken = Deno.env.get('STRAVA_WEBHOOK_VERIFY_TOKEN');

    if (hubMode === 'subscribe' && hubVerifyToken === verifyToken) {
      console.log('Webhook validation successful');
      return new Response(
        JSON.stringify({ 'hub.challenge': hubChallenge }),
        { 
          status: 200, 
          headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
        }
      );
    }

    console.error('Webhook validation failed: token mismatch');
    return new Response(
      JSON.stringify({ error: 'Verification failed' }),
      { status: 403, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  }

  // POST request: Webhook event
  if (req.method === 'POST') {
    try {
      const event = await req.json();
      console.log('Received webhook event:', JSON.stringify(event));

      const {
        object_type,
        object_id,
        aspect_type,
        updates,
        owner_id,
        subscription_id,
        event_time,
      } = event;

      console.log(`Event: ${object_type} ${aspect_type} | Object: ${object_id} | Owner: ${owner_id}`);

      // Create Supabase admin client
      const supabaseAdmin = createClient(
        Deno.env.get('SUPABASE_URL') ?? '',
        Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? ''
      );

      // Process event asynchronously (don't block the response)
      // Use a self-executing async function that we don't await
      (async () => {
        try {
          if (object_type === 'activity') {
            await processActivityEvent(supabaseAdmin, object_id, aspect_type, owner_id);
          } else if (object_type === 'athlete') {
            await processAthleteEvent(supabaseAdmin, object_id, aspect_type, updates);
          } else {
            console.log(`Unknown object type: ${object_type}`);
          }
        } catch (error) {
          console.error('Error processing webhook event:', error);
        }
      })();

      // Return 200 immediately (Strava requires response within 2 seconds)
      return new Response(
        JSON.stringify({ success: true }),
        { status: 200, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    } catch (error) {
      console.error('Error parsing webhook event:', error);
      return new Response(
        JSON.stringify({ error: 'Invalid event data' }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }
  }

  return new Response(
    JSON.stringify({ error: 'Method not allowed' }),
    { status: 405, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
  );
});
