import { serve } from 'https://deno.land/std@0.168.0/http/server.ts';
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.7.1';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

serve(async (req) => {
  // Handle CORS preflight requests
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    // Get and validate Authorization header
    const authHeader = req.headers.get('Authorization');
    console.log('Authorization header present:', !!authHeader);
    
    if (!authHeader) {
      console.error('No Authorization header provided');
      return new Response(
        JSON.stringify({ error: 'No authorization header' }),
        { status: 401, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // Extract JWT token from "Bearer <token>"
    const token = authHeader.replace('Bearer ', '');
    
    // Create Supabase admin client to verify JWT
    const supabaseAdmin = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? ''
    );

    // Verify JWT and get user
    const { data: { user }, error: userError } = await supabaseAdmin.auth.getUser(token);

    if (userError || !user) {
      console.error('Auth error:', userError);
      return new Response(
        JSON.stringify({ error: 'Unauthorized - invalid token' }),
        { status: 401, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    console.log('Fetching Uetliberg runs for user:', user.id);

    // Get Strava credentials
    const { data: credentials, error: credsError } = await supabaseAdmin.rpc(
      'get_strava_credentials',
      { _user_id: user.id }
    );

    if (credsError || !credentials || credentials.length === 0) {
      console.error('Failed to get credentials:', credsError);
      return new Response(
        JSON.stringify({ error: 'No Strava credentials found' }),
        { status: 404, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    const creds = credentials[0];
    let accessToken = creds.strava_access_token;
    const refreshToken = creds.strava_refresh_token;
    const expiresAt = new Date(creds.strava_token_expires_at);

    // Check if token is expired and refresh if needed
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
        return new Response(
          JSON.stringify({ error: 'Failed to refresh Strava token' }),
          { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
        );
      }

      const refreshData = await refreshResponse.json();
      accessToken = refreshData.access_token;

      // Update credentials in database
      const newExpiresAt = new Date(refreshData.expires_at * 1000);
      await supabaseAdmin.rpc('upsert_strava_credentials', {
        _user_id: user.id,
        _access_token: accessToken,
        _refresh_token: refreshData.refresh_token,
        _expires_at: newExpiresAt.toISOString(),
      });

      console.log('Token refreshed successfully');
    }

    // Get Uetliberg segments from database
    const { data: uetlibergSegments, error: segmentsError } = await supabaseAdmin
      .from('uetliberg_segments')
      .select('segment_id');

    if (segmentsError) {
      console.error('Failed to fetch Uetliberg segments from database:', segmentsError);
      return new Response(
        JSON.stringify({ error: 'Failed to fetch Uetliberg segments from database' }),
        { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    const uetlibergSegmentIds = new Set(
      (uetlibergSegments || []).map(s => s.segment_id)
    );
    
    console.log(`Found ${uetlibergSegmentIds.size} Uetliberg segments in database`);

    if (uetlibergSegmentIds.size === 0) {
      console.log('No Uetliberg segments found. User needs to fetch segments first.');
      return new Response(
        JSON.stringify({ 
          activities: [],
          message: 'No Uetliberg segments found. Please fetch segments first.',
        }),
        { status: 200, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // Fetch all activities from 2025
    console.log('Fetching activities from Strava for 2025...');
    const after2025 = 1735689600; // January 1, 2025, 00:00:00 UTC
    const activitiesResponse = await fetch(
      `https://www.strava.com/api/v3/athlete/activities?per_page=200&after=${after2025}`,
      {
        headers: {
          Authorization: `Bearer ${accessToken}`,
        },
      }
    );

    if (!activitiesResponse.ok) {
      console.error('Failed to fetch activities from Strava');
      return new Response(
        JSON.stringify({ error: 'Failed to fetch activities from Strava' }),
        { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    const allActivities = await activitiesResponse.json();
    console.log(`Fetched ${allActivities.length} activities from Strava`);

    // Filter for runs only
    const runs = allActivities.filter((activity: any) => activity.type === 'Run');
    console.log(`Filtered to ${runs.length} runs`);

    // For each run, check if it contains any Uetliberg segments
    const uetlibergRuns = [];
    
    for (const run of runs) {
      // Fetch detailed activity with segment efforts
      const detailResponse = await fetch(
        `https://www.strava.com/api/v3/activities/${run.id}?include_all_efforts=true`,
        {
          headers: {
            Authorization: `Bearer ${accessToken}`,
          },
        }
      );

      if (!detailResponse.ok) {
        console.error(`Failed to fetch details for activity ${run.id}`);
        continue;
      }

      const detailedActivity = await detailResponse.json();
      const segmentEfforts = detailedActivity.segment_efforts || [];
      
      // Check if any segment effort matches our Uetliberg segments
      const hasUetlibergSegment = segmentEfforts.some((effort: any) => 
        uetlibergSegmentIds.has(effort.segment.id)
      );

      if (hasUetlibergSegment) {
        const uetlibergEfforts = segmentEfforts.filter((effort: any) => 
          uetlibergSegmentIds.has(effort.segment.id)
        );
        
        uetlibergRuns.push({
          ...run,
          uetliberg_segments: uetlibergEfforts.map((effort: any) => ({
            segment_id: effort.segment.id,
            segment_name: effort.segment.name,
            elapsed_time: effort.elapsed_time,
            moving_time: effort.moving_time,
            distance: effort.distance,
            average_grade: effort.segment.average_grade,
          })),
        });
        
        console.log(`Activity ${run.id} has ${uetlibergEfforts.length} Uetliberg segments`);
      }
    }

    console.log(`Filtered to ${uetlibergRuns.length} Uetliberg runs`);

    return new Response(
      JSON.stringify({ 
        activities: uetlibergRuns,
        total_activities: allActivities.length,
        total_runs: runs.length,
        uetliberg_runs: uetlibergRuns.length,
      }),
      { status: 200, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  } catch (error) {
    console.error('Error:', error);
    const errorMessage = error instanceof Error ? error.message : 'Unknown error';
    return new Response(
      JSON.stringify({ error: errorMessage }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  }
});