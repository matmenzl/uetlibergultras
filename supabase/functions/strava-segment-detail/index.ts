import { serve } from "https://deno.land/std@0.168.0/http/server.ts";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const { segmentId } = await req.json();
    
    if (!segmentId) {
      throw new Error('Segment ID is required');
    }

    const clientId = Deno.env.get('STRAVA_CLIENT_ID');
    const clientSecret = Deno.env.get('STRAVA_CLIENT_SECRET');
    const refreshToken = Deno.env.get('STRAVA_REFRESH_TOKEN');

    if (!clientId || !clientSecret || !refreshToken) {
      throw new Error('Strava credentials not configured');
    }

    // Get access token using refresh token
    console.log('Getting Strava access token...');
    const tokenResponse = await fetch('https://www.strava.com/oauth/token', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        client_id: parseInt(clientId, 10),
        client_secret: clientSecret,
        refresh_token: refreshToken,
        grant_type: 'refresh_token',
      }),
    });

    if (!tokenResponse.ok) {
      const error = await tokenResponse.text();
      console.error('Token error:', error);
      throw new Error('Failed to get Strava access token');
    }

    const { access_token } = await tokenResponse.json();

    // Fetch segment details
    console.log(`Fetching details for segment ${segmentId}...`);
    const segmentResponse = await fetch(
      `https://www.strava.com/api/v3/segments/${segmentId}`,
      {
        headers: {
          'Authorization': `Bearer ${access_token}`,
        },
      }
    );

    if (!segmentResponse.ok) {
      const error = await segmentResponse.text();
      console.error('Segment error:', error);
      throw new Error('Failed to fetch segment details');
    }

    const segmentData = await segmentResponse.json();

    // Fetch leaderboard
    console.log(`Fetching leaderboard for segment ${segmentId}...`);
    const leaderboardResponse = await fetch(
      `https://www.strava.com/api/v3/segments/${segmentId}/leaderboard?per_page=10`,
      {
        headers: {
          'Authorization': `Bearer ${access_token}`,
        },
      }
    );

    let leaderboard = [];
    if (leaderboardResponse.ok) {
      const leaderboardData = await leaderboardResponse.json();
      leaderboard = (leaderboardData.entries || []).map((entry: any) => ({
        athlete_name: entry.athlete_name,
        elapsed_time: entry.elapsed_time,
        rank: entry.rank,
      }));
      console.log(`Found ${leaderboard.length} leaderboard entries`);
    } else {
      const errorText = await leaderboardResponse.text();
      console.error('Leaderboard fetch failed:', leaderboardResponse.status, errorText);
    }

    // Fetch streams for elevation profile
    console.log(`Fetching elevation data for segment ${segmentId}...`);
    const streamsResponse = await fetch(
      `https://www.strava.com/api/v3/segments/${segmentId}/streams?keys=altitude,distance&key_by_type=true`,
      {
        headers: {
          'Authorization': `Bearer ${access_token}`,
        },
      }
    );

    let elevationProfile = [];
    if (streamsResponse.ok) {
      const streamsData = await streamsResponse.json();
      if (streamsData.altitude && streamsData.distance) {
        elevationProfile = streamsData.distance.data.map((dist: number, idx: number) => [
          dist,
          streamsData.altitude.data[idx]
        ]);
        console.log(`Found ${elevationProfile.length} elevation points`);
      }
    } else {
      console.warn('Failed to fetch elevation profile');
    }

    return new Response(
      JSON.stringify({
        segment: {
          elevation_high: segmentData.elevation_high,
          elevation_low: segmentData.elevation_low,
        },
        leaderboard,
        elevation_profile: elevationProfile,
      }),
      {
        headers: {
          ...corsHeaders,
          'Content-Type': 'application/json',
          'Cache-Control': 'public, max-age=3600', // 1h cache
        },
      }
    );
  } catch (error) {
    console.error('Error:', error);
    const errorMessage = error instanceof Error ? error.message : 'Unknown error';
    return new Response(
      JSON.stringify({ error: errorMessage }),
      {
        status: 500,
        headers: {
          ...corsHeaders,
          'Content-Type': 'application/json',
        },
      }
    );
  }
});
