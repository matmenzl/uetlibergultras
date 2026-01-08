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

function extractSegmentId(url: string): number | null {
  // Handle URLs like https://www.strava.com/segments/1186289
  const match = url.match(/segments\/(\d+)/);
  return match ? parseInt(match[1], 10) : null;
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

    // Verify user is admin
    const { data: { user }, error: userError } = await supabaseAdmin.auth.getUser(token);
    if (userError || !user) {
      return new Response(
        JSON.stringify({ error: 'Unauthorized' }),
        { status: 401, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // Check admin role
    const { data: isAdmin } = await supabaseAdmin.rpc('has_role', {
      _user_id: user.id,
      _role: 'admin'
    });

    if (!isAdmin) {
      return new Response(
        JSON.stringify({ error: 'Admin access required' }),
        { status: 403, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    const { suggestion_id, admin_notes } = await req.json();

    if (!suggestion_id) {
      return new Response(
        JSON.stringify({ error: 'suggestion_id is required' }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // Get the suggestion
    const { data: suggestion, error: suggestionError } = await supabaseAdmin
      .from('segment_suggestions')
      .select('*')
      .eq('id', suggestion_id)
      .single();

    if (suggestionError || !suggestion) {
      return new Response(
        JSON.stringify({ error: 'Suggestion not found' }),
        { status: 404, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // Extract segment ID from URL
    const segmentId = extractSegmentId(suggestion.strava_segment_url);
    if (!segmentId) {
      return new Response(
        JSON.stringify({ error: 'Could not extract segment ID from URL' }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    console.log(`Processing segment ${segmentId} from ${suggestion.strava_segment_url}`);

    // Check if segment already exists
    const { data: existingSegment } = await supabaseAdmin
      .from('uetliberg_segments')
      .select('segment_id')
      .eq('segment_id', segmentId)
      .single();

    if (existingSegment) {
      // Segment already exists, just update the suggestion status
      await supabaseAdmin
        .from('segment_suggestions')
        .update({
          status: 'approved',
          reviewed_at: new Date().toISOString(),
          reviewed_by: user.id,
          admin_notes: admin_notes || 'Segment bereits vorhanden'
        })
        .eq('id', suggestion_id);

      return new Response(
        JSON.stringify({ 
          success: true, 
          message: 'Segment already exists, suggestion marked as approved',
          segment_id: segmentId
        }),
        { status: 200, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // Get Strava credentials from admin user
    const { data: credentials, error: credsError } = await supabaseAdmin.rpc(
      'get_strava_credentials',
      { _user_id: user.id }
    );

    if (credsError || !credentials || credentials.length === 0) {
      return new Response(
        JSON.stringify({ error: 'No Strava credentials found for admin user' }),
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
    console.log(`Fetching segment ${segmentId} from Strava...`);
    const segmentResponse = await fetch(
      `https://www.strava.com/api/v3/segments/${segmentId}`,
      { headers: { Authorization: `Bearer ${accessToken}` } }
    );

    if (!segmentResponse.ok) {
      const errorText = await segmentResponse.text();
      console.error(`Strava API error: ${segmentResponse.status} - ${errorText}`);
      return new Response(
        JSON.stringify({ error: `Strava API error: ${segmentResponse.status}` }),
        { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
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

    // Insert segment into database
    const { error: insertError } = await supabaseAdmin
      .from('uetliberg_segments')
      .insert({
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
      });

    if (insertError) {
      console.error('Error inserting segment:', insertError);
      return new Response(
        JSON.stringify({ error: `Failed to insert segment: ${insertError.message}` }),
        { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // Update suggestion status
    await supabaseAdmin
      .from('segment_suggestions')
      .update({
        status: 'approved',
        reviewed_at: new Date().toISOString(),
        reviewed_by: user.id,
        admin_notes: admin_notes || null
      })
      .eq('id', suggestion_id);

    console.log(`Successfully approved suggestion and added segment: ${segment.name}`);

    return new Response(
      JSON.stringify({
        success: true,
        segment: {
          id: segment.id,
          name: segment.name,
          distance: segment.distance,
          avg_grade: segment.average_grade,
          priority: priority,
          ends_at_uetliberg: endsAtUetliberg
        }
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
