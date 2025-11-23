import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.84.0";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const supabaseUrl = Deno.env.get('SUPABASE_URL')!;
    const supabaseServiceKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;
    const supabase = createClient(supabaseUrl, supabaseServiceKey);

    const authHeader = req.headers.get('Authorization');
    if (!authHeader) {
      return new Response(
        JSON.stringify({ error: 'No authorization header' }),
        { status: 401, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    const token = authHeader.replace('Bearer ', '');
    const { data: { user }, error: userError } = await supabase.auth.getUser(token);

    if (userError || !user) {
      return new Response(
        JSON.stringify({ error: 'Unauthorized' }),
        { status: 401, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    const { activityId, userId, date } = await req.json();

    console.log(`Fetching activity details for user ${userId}, activity ${activityId || 'date: ' + date}`);

    // Get user's Strava credentials
    const { data: credentials } = await supabase.rpc('get_strava_credentials', {
      _user_id: userId,
    });

    if (!credentials || credentials.length === 0) {
      return new Response(
        JSON.stringify({ error: 'No Strava credentials found' }),
        { status: 404, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    let accessToken = credentials[0].strava_access_token;
    const refreshToken = credentials[0].strava_refresh_token;
    const expiresAt = new Date(credentials[0].strava_token_expires_at);

    // Refresh token if expired
    if (expiresAt <= new Date()) {
      console.log('Token expired, refreshing...');
      const clientId = Deno.env.get('STRAVA_CLIENT_ID');
      const clientSecret = Deno.env.get('STRAVA_CLIENT_SECRET');

      const tokenResponse = await fetch('https://www.strava.com/oauth/token', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          client_id: parseInt(clientId!, 10),
          client_secret: clientSecret,
          refresh_token: refreshToken,
          grant_type: 'refresh_token',
        }),
      });

      if (!tokenResponse.ok) {
        throw new Error('Failed to refresh Strava token');
      }

      const tokenData = await tokenResponse.json();
      accessToken = tokenData.access_token;

      // Update token in database
      await supabase.rpc('upsert_strava_credentials', {
        _user_id: userId,
        _access_token: tokenData.access_token,
        _refresh_token: tokenData.refresh_token,
        _expires_at: new Date(tokenData.expires_at * 1000).toISOString(),
      });
    }

    // If we have an activity_id, fetch it directly
    if (activityId) {
      console.log(`Fetching activity ${activityId} from Strava...`);
      const activityResponse = await fetch(
        `https://www.strava.com/api/v3/activities/${activityId}`,
        {
          headers: {
            'Authorization': `Bearer ${accessToken}`,
          },
        }
      );

      if (!activityResponse.ok) {
        throw new Error(`Failed to fetch activity: ${activityResponse.status}`);
      }

      const activity = await activityResponse.json();

      return new Response(
        JSON.stringify({
          activity: {
            id: activity.id,
            name: activity.name,
            distance: activity.distance,
            moving_time: activity.moving_time,
            elapsed_time: activity.elapsed_time,
            total_elevation_gain: activity.total_elevation_gain,
            type: activity.type,
            start_date: activity.start_date,
          }
        }),
        { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // For legacy data without activity_id, try to find activities on that date
    if (date) {
      console.log(`Fetching activities for date ${date}...`);
      const after = new Date(date + 'T00:00:00Z').getTime() / 1000;
      const before = new Date(date + 'T23:59:59Z').getTime() / 1000;

      const activitiesResponse = await fetch(
        `https://www.strava.com/api/v3/athlete/activities?after=${after}&before=${before}`,
        {
          headers: {
            'Authorization': `Bearer ${accessToken}`,
          },
        }
      );

      if (!activitiesResponse.ok) {
        throw new Error(`Failed to fetch activities: ${activitiesResponse.status}`);
      }

      const activities = await activitiesResponse.json();

      if (activities.length === 0) {
        return new Response(
          JSON.stringify({ error: 'No activities found for this date' }),
          { status: 404, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
        );
      }

      // For now, return the first running activity
      const runningActivity = activities.find((a: any) => a.type === 'Run') || activities[0];

      return new Response(
        JSON.stringify({
          activity: {
            id: runningActivity.id,
            name: runningActivity.name,
            distance: runningActivity.distance,
            moving_time: runningActivity.moving_time,
            elapsed_time: runningActivity.elapsed_time,
            total_elevation_gain: runningActivity.total_elevation_gain,
            type: runningActivity.type,
            start_date: runningActivity.start_date,
          }
        }),
        { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    return new Response(
      JSON.stringify({ error: 'Either activityId or date is required' }),
      { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );

  } catch (error) {
    console.error('Error in strava-activity-details:', error);
    const errorMessage = error instanceof Error ? error.message : 'Unknown error';
    return new Response(
      JSON.stringify({ error: errorMessage }),
      { 
        status: 500, 
        headers: { 
          ...corsHeaders, 
          'Content-Type': 'application/json' 
        } 
      }
    );
  }
});
