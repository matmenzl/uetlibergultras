import { serve } from 'https://deno.land/std@0.168.0/http/server.ts';
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.7.1';
import polyline from 'https://esm.sh/@mapbox/polyline@1.2.1';

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

// Check if activity passes through Uetliberg region
function isInUetlibergRegion(activity: any): boolean {
  try {
    // Check start and end coordinates
    if (activity.start_latlng && activity.start_latlng.length === 2) {
      const startDistance = calculateDistance(UETLIBERG_CENTER, {
        lat: activity.start_latlng[0],
        lng: activity.start_latlng[1],
      });
      if (startDistance <= RADIUS_KM) return true;
    }

    if (activity.end_latlng && activity.end_latlng.length === 2) {
      const endDistance = calculateDistance(UETLIBERG_CENTER, {
        lat: activity.end_latlng[0],
        lng: activity.end_latlng[1],
      });
      if (endDistance <= RADIUS_KM) return true;
    }

    // Check polyline (sample every 5th point for performance)
    if (activity.map?.summary_polyline) {
      const points = polyline.decode(activity.map.summary_polyline);
      for (let i = 0; i < points.length; i += 5) {
        const distance = calculateDistance(UETLIBERG_CENTER, {
          lat: points[i][0],
          lng: points[i][1],
        });
        if (distance <= RADIUS_KM) return true;
      }
    }

    return false;
  } catch (error) {
    console.error('Error checking region:', error);
    return false;
  }
}

serve(async (req) => {
  // Handle CORS preflight requests
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    // Parse scan parameters from request body
    const body = await req.json().catch(() => ({}));
    const maxPages = Math.max(1, Math.min(Number(body.max_pages ?? 3), 10));
    const perPage = Math.max(1, Math.min(Number(body.per_page ?? 30), 50));
    
    // Month-based filtering (default: current month)
    const now = new Date();
    const year = Number(body.year ?? now.getFullYear());
    const month = Number(body.month ?? (now.getMonth() + 1)); // 1-12
    
    // Calculate start and end timestamps for the specified month
    const startOfMonth = Math.floor(new Date(Date.UTC(year, month - 1, 1, 0, 0, 0)).getTime() / 1000);
    const endOfMonth = Math.floor(new Date(Date.UTC(year, month, 0, 23, 59, 59)).getTime() / 1000);
    
    console.log(`Scanning activities for ${year}-${month.toString().padStart(2, '0')}`);
    console.log(`Time range: ${new Date(startOfMonth * 1000).toISOString()} to ${new Date(endOfMonth * 1000).toISOString()}`);

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

    console.log('Fetching Uetliberg runs for user:', user.id);

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

    // Get Uetliberg segments from database with priority
    const { data: uetlibergSegments, error: segmentsError } = await supabaseAdmin
      .from('uetliberg_segments')
      .select('segment_id, name, priority, ends_at_uetliberg, distance_to_center')
      .order('priority', { ascending: true })
      .order('distance_to_center', { ascending: true });

    if (segmentsError) {
      console.error('Failed to fetch Uetliberg segments from database:', segmentsError);
      return new Response(
        JSON.stringify({ error: 'Failed to fetch Uetliberg segments from database' }),
        { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    const allSegments = uetlibergSegments || [];
    const highPrioritySegments = allSegments.filter((s) => s.ends_at_uetliberg);
    const mediumPrioritySegments = allSegments.filter((s) => !s.ends_at_uetliberg);

    const uetlibergSegmentIds = new Set(allSegments.map((s) => s.segment_id));

    console.log(`Found ${allSegments.length} Uetliberg segments in database`);
    console.log(`- ${highPrioritySegments.length} high priority (ending at Uetliberg)`);
    console.log(`- ${mediumPrioritySegments.length} medium priority (passing through)`);

    if (uetlibergSegmentIds.size === 0) {
      console.log('No Uetliberg segments found. User needs to fetch segments first.');
      return new Response(
        JSON.stringify({
          activities: [],
          message: 'No Uetliberg segments found. Please fetch segments first.',
        }),
        { status: 200, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // Fetch activities for the specified month only
    let scannedPages = 0;
    const allActivities: any[] = [];

    for (let currentPage = 1; currentPage <= maxPages; currentPage++) {
      console.log(
        `Fetching activities from Strava for ${year}-${month.toString().padStart(2, '0')} (page ${currentPage}/${maxPages}, per_page=${perPage})...`
      );

      const activitiesResponse = await fetch(
        `https://www.strava.com/api/v3/athlete/activities?per_page=${perPage}&page=${currentPage}&after=${startOfMonth}&before=${endOfMonth}`,
        {
          headers: {
            Authorization: `Bearer ${accessToken}`,
          },
        }
      );

      console.log(`Activities API response status: ${activitiesResponse.status}`);

      if (!activitiesResponse.ok) {
        const errorText = await activitiesResponse.text();
        console.error(
          `Failed to fetch activities from Strava: ${activitiesResponse.status} - ${errorText}`
        );

        // Handle rate limiting specifically
        if (activitiesResponse.status === 429) {
          return new Response(
            JSON.stringify({
              error: 'Strava API Rate Limit erreicht',
              message:
                'Bitte warte ein paar Minuten und versuche es dann erneut. Strava limitiert die Anzahl der API-Anfragen.',
              status: 429,
            }),
            { status: 429, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
          );
        }

        return new Response(
          JSON.stringify({
            error: 'Failed to fetch activities from Strava',
            details: errorText,
            status: activitiesResponse.status,
          }),
          { status: activitiesResponse.status, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
        );
      }

      const pageActivities = await activitiesResponse.json();
      scannedPages++;
      console.log(`Fetched ${pageActivities.length} activities from Strava`);

      if (!Array.isArray(pageActivities) || pageActivities.length === 0) {
        break;
      }

      allActivities.push(...pageActivities);

      // If Strava returned fewer than requested, we've reached the end
      if (pageActivities.length < perPage) {
        break;
      }

      // Small pause between page fetches (avoid burst)
      await new Promise((resolve) => setTimeout(resolve, 200));
    }

    // Filter for runs only
    const runs = allActivities.filter((activity: any) => activity.type === 'Run');
    console.log(`Filtered to ${runs.length} runs`);

    // Helper function to add delay between requests
    const delay = (ms: number) => new Promise((resolve) => setTimeout(resolve, ms));

    // For each run, check if it contains any Uetliberg segments or passes through region
    const uetlibergRuns = [];
    let requestCount = 0;

    for (const run of runs) {
      // First check: Quick geographical filter
      const inRegion = isInUetlibergRegion(run);

      // Rate limiting
      requestCount++;
      if (requestCount % 10 === 0) {
        console.log(`Processed ${requestCount} requests, adding delay...`);
        await delay(RATE_LIMIT.delayEvery10Requests);
      } else {
        await delay(RATE_LIMIT.delayBetweenRequests);
      }

      try {
        // Fetch detailed activity with segment efforts
        const detailResponse = await fetch(
          `https://www.strava.com/api/v3/activities/${run.id}?include_all_efforts=true`,
          {
            headers: {
              Authorization: `Bearer ${accessToken}`,
            },
          }
        );

        if (!detailResponse.ok) {
          const errorText = await detailResponse.text();
          console.error(`Failed to fetch details for activity ${run.id}: ${detailResponse.status} - ${errorText}`);
          
          // If rate limited, stop processing and return what we have
          if (detailResponse.status === 429) {
            console.log('Rate limit hit during detail fetch, returning partial results');
            break;
          }
          continue;
        }

        const detailedActivity = await detailResponse.json();
        const segmentEfforts = detailedActivity.segment_efforts || [];

        // Check segment matches
        const highPriorityEfforts = segmentEfforts.filter((effort: any) =>
          highPrioritySegments.some((seg) => seg.segment_id === effort.segment.id)
        );

        const mediumPriorityEfforts = segmentEfforts.filter((effort: any) =>
          mediumPrioritySegments.some((seg) => seg.segment_id === effort.segment.id)
        );

        // Calculate Uetliberg score (high priority = 2 points, medium = 1 point, in region = 0.5 points)
        const uetlibergScore =
          highPriorityEfforts.length * 2 + mediumPriorityEfforts.length * 1 + (inRegion ? 0.5 : 0);

        // Include if it has Uetliberg segments (not just in region)
        if (highPriorityEfforts.length > 0 || mediumPriorityEfforts.length > 0) {
          const allSegmentEfforts = [...highPriorityEfforts, ...mediumPriorityEfforts];
          
          // Auto check-in: Create check-ins for each segment effort
          for (const effort of allSegmentEfforts) {
            try {
              const { error: checkInError } = await supabaseAdmin
                .from('check_ins')
                .upsert({
                  user_id: user.id,
                  segment_id: effort.segment.id,
                  activity_id: run.id,
                  activity_name: run.name,
                  elapsed_time: effort.elapsed_time,
                  distance: effort.distance,
                  checked_in_at: run.start_date,
                  activity_distance: run.distance,
                  activity_elapsed_time: run.elapsed_time,
                }, {
                  onConflict: 'user_id,segment_id,activity_id',
                  ignoreDuplicates: true,
                });
              
              if (checkInError) {
                console.error(`Failed to create check-in for segment ${effort.segment.id}:`, checkInError);
              } else {
                console.log(`Auto check-in created for segment ${effort.segment.id} from activity ${run.id}`);
              }
            } catch (checkInErr) {
              console.error(`Error creating check-in:`, checkInErr);
            }
          }
          
          uetlibergRuns.push({
            ...run,
            uetliberg_score: uetlibergScore,
            in_region: inRegion,
            segments: allSegmentEfforts.map((effort: any) => ({
              segment_id: effort.segment.id,
              segment_name: effort.segment.name,
              elapsed_time: effort.elapsed_time,
              moving_time: effort.moving_time,
              distance: effort.distance,
              average_grade: effort.segment.average_grade,
              priority: highPrioritySegments.some((seg) => seg.segment_id === effort.segment.id) ? 'high' : 'medium',
            })),
          });

          console.log(
            `Activity ${run.id}: score=${uetlibergScore.toFixed(1)}, segments=${allSegmentEfforts.length}`
          );
        }
      } catch (error) {
        console.error(`Error processing activity ${run.id}:`, error);
        continue;
      }
    }

    // Keep chronological order (newest first) - Strava API already returns this order

    console.log(`Filtered to ${uetlibergRuns.length} Uetliberg runs`);

    return new Response(
      JSON.stringify({
        activities: uetlibergRuns,
        scanned_year: year,
        scanned_month: month,
        scanned_pages: scannedPages,
        per_page: perPage,
        max_pages: maxPages,
        total_runs_scanned: runs.length,
        uetliberg_runs: uetlibergRuns.length,
        high_priority_segments: highPrioritySegments.length,
        medium_priority_segments: mediumPrioritySegments.length,
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
