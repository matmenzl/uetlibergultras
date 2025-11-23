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
    const { segmentIds } = await req.json();

    if (!segmentIds || !Array.isArray(segmentIds)) {
      return new Response(
        JSON.stringify({ error: 'segmentIds array is required' }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    console.log(`Fetching details for ${segmentIds.length} segments...`);

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

    // Fetch details for each segment
    const segmentDetails = await Promise.all(
      segmentIds.map(async (segmentId) => {
        try {
          const response = await fetch(
            `https://www.strava.com/api/v3/segments/${segmentId}`,
            {
              headers: {
                'Authorization': `Bearer ${access_token}`,
              },
            }
          );

          if (!response.ok) {
            console.error(`Failed to fetch segment ${segmentId}:`, response.status);
            return null;
          }

          const data = await response.json();
          
          return {
            id: data.id,
            name: data.name,
            polyline: data.map?.polyline || null,
            distance: data.distance,
            average_grade: data.average_grade,
            elevation_high: data.elevation_high,
            elevation_low: data.elevation_low,
            start_latlng: data.start_latlng,
            end_latlng: data.end_latlng,
          };
        } catch (error) {
          console.error(`Error fetching segment ${segmentId}:`, error);
          return null;
        }
      })
    );

    // Filter out null values (failed requests)
    const validSegments = segmentDetails.filter(s => s !== null);

    console.log(`Successfully fetched ${validSegments.length} segments`);

    return new Response(
      JSON.stringify({ segments: validSegments }),
      { 
        headers: { 
          ...corsHeaders, 
          'Content-Type': 'application/json' 
        } 
      }
    );

  } catch (error) {
    console.error('Error in strava-activity-segments:', error);
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
