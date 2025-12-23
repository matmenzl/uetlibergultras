import { serve } from 'https://deno.land/std@0.168.0/http/server.ts';
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.7.1';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

const UETLIBERG_CENTER = { lat: 47.350393, lng: 8.489874 };
const RADIUS_KM = 2.0;

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

    // Get all segments that need updating (placeholder names starting with "Segment ")
    const { data: segmentsToUpdate, error: fetchError } = await supabaseAdmin
      .from('uetliberg_segments')
      .select('segment_id, name')
      .or('name.like.Segment %,distance.eq.0');

    if (fetchError) {
      console.error('Error fetching segments:', fetchError);
      return new Response(
        JSON.stringify({ error: 'Failed to fetch segments' }),
        { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    console.log(`Found ${segmentsToUpdate?.length || 0} segments to update`);

    const updated = [];
    const errors = [];

    for (const seg of segmentsToUpdate || []) {
      try {
        console.log(`Fetching details for segment ${seg.segment_id}...`);
        
        // Add delay to respect rate limits
        await new Promise(resolve => setTimeout(resolve, 200));

        const segmentResponse = await fetch(
          `https://www.strava.com/api/v3/segments/${seg.segment_id}`,
          { headers: { Authorization: `Bearer ${accessToken}` } }
        );

        if (!segmentResponse.ok) {
          console.error(`Failed to fetch segment ${seg.segment_id}: ${segmentResponse.status}`);
          errors.push({ segment_id: seg.segment_id, error: `Strava API error: ${segmentResponse.status}` });
          continue;
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

        // Update segment in database
        const { error: updateError } = await supabaseAdmin
          .from('uetliberg_segments')
          .update({
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
            updated_at: new Date().toISOString(),
          })
          .eq('segment_id', seg.segment_id);

        if (updateError) {
          console.error(`Error updating segment ${seg.segment_id}:`, updateError);
          errors.push({ segment_id: seg.segment_id, error: updateError.message });
        } else {
          updated.push({ segment_id: seg.segment_id, name: segment.name });
          console.log(`Updated segment ${seg.segment_id}: ${segment.name}`);
        }
      } catch (error) {
        console.error(`Error processing segment ${seg.segment_id}:`, error);
        errors.push({ segment_id: seg.segment_id, error: error instanceof Error ? error.message : 'Unknown error' });
      }
    }

    return new Response(
      JSON.stringify({
        success: true,
        updated: updated,
        updated_count: updated.length,
        errors: errors.length > 0 ? errors : undefined,
      }),
      { status: 200, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  } catch (error) {
    console.error('Error:', error);
    return new Response(
      JSON.stringify({ error: error instanceof Error ? error.message : 'Unknown error' }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  }
});
