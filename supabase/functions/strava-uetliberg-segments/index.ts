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

    // Uetliberg bounds: Southwest (47.340, 8.475) to Northeast (47.358, 8.507)
    const bounds = '47.340,8.475,47.358,8.507';
    
    console.log('Fetching segments from Strava API...');
    const segmentsResponse = await fetch(
      `https://www.strava.com/api/v3/segments/explore?bounds=${bounds}&activity_type=running`,
      {
        headers: {
          'Authorization': `Bearer ${access_token}`,
        },
      }
    );

    if (!segmentsResponse.ok) {
      const error = await segmentsResponse.text();
      console.error('Segments error:', error);
      throw new Error('Failed to fetch segments from Strava');
    }

    const data = await segmentsResponse.json();
    console.log(`Found ${data.segments?.length || 0} segments`);

    const segments = (data.segments || []).map((segment: any) => ({
      id: segment.id,
      name: segment.name,
      distance: segment.distance,
      avg_grade: segment.avg_grade,
      elevation_high: segment.elev_high,
      elevation_low: segment.elev_low,
      climb_category: segment.climb_category,
      polyline: segment.points,
      start_latlng: segment.start_latlng,
      end_latlng: segment.end_latlng,
      effort_count: segment.effort_count || 0,
    }));

    return new Response(
      JSON.stringify({ segments }),
      {
        headers: {
          ...corsHeaders,
          'Content-Type': 'application/json',
          'Cache-Control': 'public, max-age=86400', // 24h cache
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
