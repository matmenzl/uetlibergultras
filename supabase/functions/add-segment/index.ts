import { serve } from 'https://deno.land/std@0.168.0/http/server.ts';
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.7.1';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

// Uetliberg center coordinates
const UETLIBERG_CENTER = { lat: 47.350393, lng: 8.489874 };
const RADIUS_KM = 2.0;

// Calculate distance between two points using Haversine formula
function calculateDistance(
  point1: { lat: number; lng: number },
  point2: { lat: number; lng: number }
): number {
  const R = 6371;
  const lat1 = (point1.lat * Math.PI) / 180;
  const lat2 = (point2.lat * Math.PI) / 180;
  const deltaLat = ((point2.lat - point1.lat) * Math.PI) / 180;
  const deltaLng = ((point2.lng - point1.lng) * Math.PI) / 180;

  const a =
    Math.sin(deltaLat / 2) * Math.sin(deltaLat / 2) +
    Math.cos(lat1) * Math.cos(lat2) * Math.sin(deltaLng / 2) * Math.sin(deltaLng / 2);

  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
  return R * c;
}

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const authHeader = req.headers.get('Authorization');
    if (!authHeader) {
      return new Response(
        JSON.stringify({ error: 'No authorization header' }),
        { status: 401, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    const { segment_id } = await req.json();
    
    if (!segment_id) {
      return new Response(
        JSON.stringify({ error: 'segment_id is required' }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    console.log(`Adding segment: ${segment_id}`);

    const token = authHeader.replace('Bearer ', '');
    const supabaseAdmin = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? ''
    );

    const { data: { user }, error: userError } = await supabaseAdmin.auth.getUser(token);
    if (userError || !user) {
      return new Response(
        JSON.stringify({ error: 'Unauthorized' }),
        { status: 401, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // Get Strava credentials
    const { data: credentials, error: credsError } = await supabaseAdmin.rpc(
      'get_strava_credentials',
      { _user_id: user.id }
    );

    if (credsError || !credentials || credentials.length === 0) {
      return new Response(
        JSON.stringify({ error: 'No Strava credentials found' }),
        { status: 404, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
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
        return new Response(
          JSON.stringify({ error: 'Failed to refresh Strava token' }),
          { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
        );
      }

      const refreshData = await refreshResponse.json();
      accessToken = refreshData.access_token;

      await supabaseAdmin.rpc('upsert_strava_credentials', {
        _user_id: user.id,
        _access_token: accessToken,
        _refresh_token: refreshData.refresh_token,
        _expires_at: new Date(refreshData.expires_at * 1000).toISOString(),
      });
    }

    // Fetch segment details from Strava
    console.log(`Fetching segment ${segment_id} from Strava...`);
    const segmentResponse = await fetch(
      `https://www.strava.com/api/v3/segments/${segment_id}`,
      {
        headers: { Authorization: `Bearer ${accessToken}` },
      }
    );

    if (!segmentResponse.ok) {
      const errorText = await segmentResponse.text();
      console.error(`Strava API error: ${segmentResponse.status} - ${errorText}`);
      return new Response(
        JSON.stringify({ 
          error: 'Segment not found or Strava API error',
          details: errorText,
          status: segmentResponse.status
        }),
        { status: segmentResponse.status === 404 ? 404 : 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    const segment = await segmentResponse.json();
    console.log(`Found segment: ${segment.name}`);

    // Calculate distance to Uetliberg center
    const endPoint = {
      lat: segment.end_latlng[0],
      lng: segment.end_latlng[1],
    };
    const distanceToCenter = calculateDistance(UETLIBERG_CENTER, endPoint);
    const endsAtUetliberg = distanceToCenter <= RADIUS_KM;
    const priority = endsAtUetliberg ? 'high' : 'medium';

    // Store segment in database
    const { error: insertError } = await supabaseAdmin.from('uetliberg_segments').upsert(
      {
        segment_id: segment.id,
        name: segment.name,
        distance: segment.distance,
        avg_grade: segment.average_grade,
        elevation_high: segment.elevation_high,
        elevation_low: segment.elevation_low,
        climb_category: segment.climb_category,
        start_latlng: `(${segment.start_latlng[0]},${segment.start_latlng[1]})`,
        end_latlng: `(${segment.end_latlng[0]},${segment.end_latlng[1]})`,
        polyline: segment.map.polyline,
        effort_count: segment.effort_count || 0,
        distance_to_center: distanceToCenter,
        ends_at_uetliberg: endsAtUetliberg,
        priority: priority,
      },
      { onConflict: 'segment_id' }
    );

    if (insertError) {
      console.error('Database error:', insertError);
      return new Response(
        JSON.stringify({ error: 'Failed to save segment', details: insertError.message }),
        { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    console.log(`Segment ${segment_id} added successfully`);

    return new Response(
      JSON.stringify({
        success: true,
        segment: {
          id: segment.id,
          name: segment.name,
          distance: segment.distance,
          avg_grade: segment.average_grade,
          priority: priority,
          ends_at_uetliberg: endsAtUetliberg,
          distance_to_center: distanceToCenter,
        },
      }),
      { status: 200, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  } catch (error) {
    console.error('Error:', error);
    const errorMessage = error instanceof Error ? error.message : 'Unknown error';
    return new Response(JSON.stringify({ error: errorMessage }), {
      status: 500,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  }
});
