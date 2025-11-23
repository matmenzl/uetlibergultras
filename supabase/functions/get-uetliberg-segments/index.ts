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

    // Uetliberg coordinates (approximate bounds for segment search)
    // Southwest: 47.33, 8.47 | Northeast: 47.37, 8.51
    const bounds = '47.33,8.47,47.37,8.51';
    
    console.log('Fetching Uetliberg segments from Strava API...');
    
    // Note: Strava Segment Explorer API returns max 10 segments per request
    // To get more segments, we would need multiple requests with different parameters
    const segmentsResponse = await fetch(
      `https://www.strava.com/api/v3/segments/explore?bounds=${bounds}&activity_type=running`,
      {
        headers: {
          Authorization: `Bearer ${accessToken}`,
        },
      }
    );

    if (!segmentsResponse.ok) {
      console.error('Failed to fetch segments from Strava');
      const errorText = await segmentsResponse.text();
      console.error('Error response:', errorText);
      return new Response(
        JSON.stringify({ error: 'Failed to fetch segments from Strava' }),
        { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    const segmentsData = await segmentsResponse.json();
    const segments = segmentsData.segments || [];
    
    console.log(`Fetched ${segments.length} Uetliberg segments from Strava`);

    // Store segments in database
    for (const segment of segments) {
      const { error: insertError } = await supabaseAdmin
        .from('uetliberg_segments')
        .upsert({
          segment_id: segment.id,
          name: segment.name,
          distance: segment.distance,
          avg_grade: segment.avg_grade,
          elevation_high: segment.elev_high,
          elevation_low: segment.elev_low,
          climb_category: segment.climb_category,
          start_latlng: `(${segment.start_latlng[0]},${segment.start_latlng[1]})`,
          end_latlng: `(${segment.end_latlng[0]},${segment.end_latlng[1]})`,
          polyline: segment.points,
          effort_count: segment.effort_count || 0,
        }, {
          onConflict: 'segment_id',
        });

      if (insertError) {
        console.error('Error inserting segment:', insertError);
      }
    }

    console.log('Segments stored in database');

    return new Response(
      JSON.stringify({ 
        segments: segments.map((s: any) => ({
          id: s.id,
          name: s.name,
          distance: s.distance,
          avg_grade: s.avg_grade,
          elevation_high: s.elev_high,
          elevation_low: s.elev_low,
          climb_category: s.climb_category,
        })),
        count: segments.length,
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