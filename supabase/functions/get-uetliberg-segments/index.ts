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

    // Get segment IDs from request body
    const body = await req.json().catch(() => ({}));
    const segmentIds = body.segment_ids || [];

    if (segmentIds.length === 0) {
      return new Response(
        JSON.stringify({ error: 'No segment IDs provided. Please provide segment_ids array in request body.' }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    console.log(`Fetching details for ${segmentIds.length} manual segments from Strava API...`);
    console.log(`Segment IDs (as strings):`, segmentIds);

    const segments = [];
    const errors = [];

    // Fetch details for each segment ID (keep as string to preserve precision)
    for (const segmentId of segmentIds) {
      try {
        // Ensure segment ID is a string
        const segmentIdStr = String(segmentId);
        console.log(`Fetching segment ${segmentIdStr} from Strava...`);
        
        const segmentResponse = await fetch(
          `https://www.strava.com/api/v3/segments/${segmentIdStr}`,
          {
            headers: {
              Authorization: `Bearer ${accessToken}`,
            },
          }
        );

        console.log(`Strava API response status for segment ${segmentIdStr}: ${segmentResponse.status}`);

        if (!segmentResponse.ok) {
          const errorText = await segmentResponse.text();
          console.error(`Failed to fetch segment ${segmentIdStr}: ${segmentResponse.status} - ${errorText}`);
          errors.push({ segment_id: segmentIdStr, error: `Strava API error: ${segmentResponse.status}`, details: errorText });
          continue;
        }

        const segment = await segmentResponse.json();
        segments.push(segment);

        // Store segment in database
        const { error: insertError } = await supabaseAdmin
          .from('uetliberg_segments')
          .upsert({
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
          }, {
            onConflict: 'segment_id',
          });

        if (insertError) {
          console.error('Error inserting segment:', insertError);
          errors.push({ segment_id: segmentId, error: insertError.message });
        } else {
          console.log(`Segment ${segment.id} (${segment.name}) stored successfully`);
        }
      } catch (error) {
        console.error(`Error processing segment ${segmentId}:`, error);
        const errorMessage = error instanceof Error ? error.message : 'Unknown error';
        errors.push({ segment_id: segmentId, error: errorMessage });
      }
    }

    console.log(`Successfully fetched and stored ${segments.length} segments`);

    return new Response(
      JSON.stringify({ 
        segments: segments.map((s: any) => ({
          id: s.id,
          name: s.name,
          distance: s.distance,
          avg_grade: s.average_grade,
          elevation_high: s.elevation_high,
          elevation_low: s.elevation_low,
          climb_category: s.climb_category,
        })),
        count: segments.length,
        errors: errors.length > 0 ? errors : undefined,
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