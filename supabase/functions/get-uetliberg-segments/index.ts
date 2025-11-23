import { serve } from 'https://deno.land/std@0.168.0/http/server.ts';
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.7.1';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

// Uetliberg center coordinates
const UETLIBERG_CENTER = { lat: 47.350393, lng: 8.489874 };
const RADIUS_KM = 2.0;

// Rate limiting configuration
const RATE_LIMIT = {
  delayBetweenRequests: 200, // ms
  delayEvery10Requests: 2000, // ms
};

// Calculate distance between two points using Haversine formula
function calculateDistance(
  point1: { lat: number; lng: number },
  point2: { lat: number; lng: number }
): number {
  const R = 6371; // Earth's radius in km
  const lat1 = (point1.lat * Math.PI) / 180;
  const lat2 = (point2.lat * Math.PI) / 180;
  const deltaLat = ((point2.lat - point1.lat) * Math.PI) / 180;
  const deltaLng = ((point2.lng - point1.lng) * Math.PI) / 180;

  const a =
    Math.sin(deltaLat / 2) * Math.sin(deltaLat / 2) +
    Math.cos(lat1) * Math.cos(lat2) * Math.sin(deltaLng / 2) * Math.sin(deltaLng / 2);

  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
  return R * c; // Distance in km
}

// Calculate bounding box for explore API
function calculateBoundingBox(center: { lat: number; lng: number }, radiusKm: number) {
  // Approximate degrees per km (varies by latitude, but close enough)
  const latDegPerKm = 1 / 111.32;
  const lngDegPerKm = 1 / (111.32 * Math.cos((center.lat * Math.PI) / 180));

  return {
    sw_lat: center.lat - radiusKm * latDegPerKm,
    sw_lng: center.lng - radiusKm * lngDegPerKm,
    ne_lat: center.lat + radiusKm * latDegPerKm,
    ne_lng: center.lng + radiusKm * lngDegPerKm,
  };
}

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

    console.log('Fetching Uetliberg segments for user:', user.id);

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

    // Calculate bounding box around Uetliberg
    const bounds = calculateBoundingBox(UETLIBERG_CENTER, RADIUS_KM * 1.5); // Use 1.5x radius for explore
    const boundsStr = `${bounds.sw_lat},${bounds.sw_lng},${bounds.ne_lat},${bounds.ne_lng}`;

    console.log(`Using bounding box: ${boundsStr}`);
    console.log('Fetching segments from Strava Explore API...');

    // Use Strava Explore API to discover segments
    const exploreResponse = await fetch(
      `https://www.strava.com/api/v3/segments/explore?bounds=${boundsStr}&activity_type=running`,
      {
        headers: {
          Authorization: `Bearer ${accessToken}`,
        },
      }
    );

    console.log(`Explore API response status: ${exploreResponse.status}`);

    if (!exploreResponse.ok) {
      const errorText = await exploreResponse.text();
      console.error(`Failed to fetch segments from Explore API: ${exploreResponse.status} - ${errorText}`);
      return new Response(
        JSON.stringify({
          error: 'Failed to fetch segments from Strava',
          details: errorText,
          status: exploreResponse.status,
        }),
        { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    const exploreData = await exploreResponse.json();
    const discoveredSegments = exploreData.segments || [];

    console.log(`Discovered ${discoveredSegments.length} segments from Explore API`);

    // Delay to respect rate limits
    const delay = (ms: number) => new Promise((resolve) => setTimeout(resolve, ms));

    const segments = [];
    const errors = [];
    let requestCount = 0;

    // Fetch detailed information for each segment
    for (const segment of discoveredSegments) {
      try {
        requestCount++;
        if (requestCount % 10 === 0) {
          console.log(`Processed ${requestCount} requests, adding delay...`);
          await delay(RATE_LIMIT.delayEvery10Requests);
        } else {
          await delay(RATE_LIMIT.delayBetweenRequests);
        }

        const segmentId = segment.id;
        console.log(`Fetching details for segment ${segmentId}...`);

        const detailResponse = await fetch(
          `https://www.strava.com/api/v3/segments/${segmentId}`,
          {
            headers: {
              Authorization: `Bearer ${accessToken}`,
            },
          }
        );

        console.log(`Segment detail API response status for ${segmentId}: ${detailResponse.status}`);

        if (!detailResponse.ok) {
          const errorText = await detailResponse.text();
          console.error(`Failed to fetch segment ${segmentId}: ${detailResponse.status} - ${errorText}`);
          errors.push({
            segment_id: segmentId,
            error: `Strava API error: ${detailResponse.status}`,
            details: errorText,
          });
          continue;
        }

        const segmentDetail = await detailResponse.json();

        // Calculate distance from segment end to Uetliberg center
        const endPoint = {
          lat: segmentDetail.end_latlng[0],
          lng: segmentDetail.end_latlng[1],
        };

        const distanceToCenter = calculateDistance(UETLIBERG_CENTER, endPoint);
        const endsAtUetliberg = distanceToCenter <= RADIUS_KM;
        const priority = endsAtUetliberg ? 'high' : 'medium';

        console.log(
          `Segment ${segmentId} (${segmentDetail.name}): ${distanceToCenter.toFixed(2)}km from center, priority: ${priority}`
        );

        // Store segment in database
        const { error: insertError } = await supabaseAdmin.from('uetliberg_segments').upsert(
          {
            segment_id: segmentDetail.id,
            name: segmentDetail.name,
            distance: segmentDetail.distance,
            avg_grade: segmentDetail.average_grade,
            elevation_high: segmentDetail.elevation_high,
            elevation_low: segmentDetail.elevation_low,
            climb_category: segmentDetail.climb_category,
            start_latlng: `(${segmentDetail.start_latlng[0]},${segmentDetail.start_latlng[1]})`,
            end_latlng: `(${segmentDetail.end_latlng[0]},${segmentDetail.end_latlng[1]})`,
            polyline: segmentDetail.map.polyline,
            effort_count: segmentDetail.effort_count || 0,
            distance_to_center: distanceToCenter,
            ends_at_uetliberg: endsAtUetliberg,
            priority: priority,
          },
          {
            onConflict: 'segment_id',
          }
        );

        if (insertError) {
          console.error('Error inserting segment:', insertError);
          errors.push({ segment_id: segmentId, error: insertError.message });
        } else {
          segments.push({
            id: segmentDetail.id,
            name: segmentDetail.name,
            distance: segmentDetail.distance,
            avg_grade: segmentDetail.average_grade,
            distance_to_center: distanceToCenter,
            ends_at_uetliberg: endsAtUetliberg,
            priority: priority,
          });
          console.log(`Segment ${segmentId} stored successfully`);
        }
      } catch (error) {
        console.error(`Error processing segment ${segment.id}:`, error);
        const errorMessage = error instanceof Error ? error.message : 'Unknown error';
        errors.push({ segment_id: segment.id, error: errorMessage });
      }
    }

    // Sort segments by priority and distance
    segments.sort((a, b) => {
      if (a.priority !== b.priority) {
        return a.priority === 'high' ? -1 : 1;
      }
      return a.distance_to_center - b.distance_to_center;
    });

    const highPriorityCount = segments.filter((s) => s.priority === 'high').length;
    const mediumPriorityCount = segments.filter((s) => s.priority === 'medium').length;

    console.log(`Successfully fetched and stored ${segments.length} segments`);
    console.log(`High priority (ending at Uetliberg): ${highPriorityCount}`);
    console.log(`Medium priority (passing through): ${mediumPriorityCount}`);

    return new Response(
      JSON.stringify({
        segments: segments,
        count: segments.length,
        high_priority_count: highPriorityCount,
        medium_priority_count: mediumPriorityCount,
        errors: errors.length > 0 ? errors : undefined,
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
