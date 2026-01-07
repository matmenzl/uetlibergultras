import { serve } from 'https://deno.land/std@0.168.0/http/server.ts';
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.7.1';
import polyline from 'https://esm.sh/@mapbox/polyline@1.2.1';

// Declare EdgeRuntime for TypeScript
declare const EdgeRuntime: {
  waitUntil(promise: Promise<any>): void;
};

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

// Uetliberg center coordinates
const UETLIBERG_CENTER = { lat: 47.350393, lng: 8.489874 };
const RADIUS_KM = 2.0;

// Rate limiting configuration (optimized for new Strava limits)
const RATE_LIMIT = {
  delayBetweenRequests: 100, // ms
  delayEvery10Requests: 1000, // ms
  delayBetweenMonths: 3000, // 3 seconds between months
  rateLimitRetryDelay: 60000, // 60 seconds on 429
};

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

// Check if activity passes through Uetliberg region
function isInUetlibergRegion(activity: any): boolean {
  try {
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

const delay = (ms: number) => new Promise((resolve) => setTimeout(resolve, ms));

// Process a single month's activities
async function processMonth(
  supabaseAdmin: any,
  userId: string,
  accessToken: string,
  year: number,
  month: number,
  uetlibergSegments: any[],
  highPrioritySegments: any[],
  mediumPrioritySegments: any[]
): Promise<{ success: boolean; runsFound: number; error?: string }> {
  const maxPages = 5;
  const perPage = 50;

  const startOfMonth = Math.floor(new Date(Date.UTC(year, month - 1, 1, 0, 0, 0)).getTime() / 1000);
  const endOfMonth = Math.floor(new Date(Date.UTC(year, month, 0, 23, 59, 59)).getTime() / 1000);

  console.log(`Processing ${year}-${month.toString().padStart(2, '0')}`);

  const allActivities: any[] = [];

  // Fetch all activities for the month
  for (let currentPage = 1; currentPage <= maxPages; currentPage++) {
    await delay(RATE_LIMIT.delayBetweenRequests);

    const activitiesResponse = await fetch(
      `https://www.strava.com/api/v3/athlete/activities?per_page=${perPage}&page=${currentPage}&after=${startOfMonth}&before=${endOfMonth}`,
      { headers: { Authorization: `Bearer ${accessToken}` } }
    );

    if (activitiesResponse.status === 429) {
      console.log('Rate limit hit, waiting 60s...');
      await delay(RATE_LIMIT.rateLimitRetryDelay);
      currentPage--; // Retry this page
      continue;
    }

    if (!activitiesResponse.ok) {
      console.error(`Failed to fetch activities: ${activitiesResponse.status}`);
      return { success: false, runsFound: 0, error: `API error: ${activitiesResponse.status}` };
    }

    const pageActivities = await activitiesResponse.json();
    if (!Array.isArray(pageActivities) || pageActivities.length === 0) break;

    allActivities.push(...pageActivities);
    if (pageActivities.length < perPage) break;
  }

  const runs = allActivities.filter((a: any) => a.type === 'Run');
  let uetlibergRunsFound = 0;
  let requestCount = 0;

  for (const run of runs) {
    requestCount++;
    if (requestCount % 10 === 0) {
      await delay(RATE_LIMIT.delayEvery10Requests);
    } else {
      await delay(RATE_LIMIT.delayBetweenRequests);
    }

    try {
      const detailResponse = await fetch(
        `https://www.strava.com/api/v3/activities/${run.id}?include_all_efforts=true`,
        { headers: { Authorization: `Bearer ${accessToken}` } }
      );

      if (detailResponse.status === 429) {
        console.log('Rate limit on detail fetch, waiting 60s...');
        await delay(RATE_LIMIT.rateLimitRetryDelay);
        continue;
      }

      if (!detailResponse.ok) continue;

      const detailedActivity = await detailResponse.json();
      const segmentEfforts = detailedActivity.segment_efforts || [];

      const highPriorityEfforts = segmentEfforts.filter((effort: any) =>
        highPrioritySegments.some((seg) => seg.segment_id === effort.segment.id)
      );

      const mediumPriorityEfforts = segmentEfforts.filter((effort: any) =>
        mediumPrioritySegments.some((seg) => seg.segment_id === effort.segment.id)
      );

      if (highPriorityEfforts.length > 0 || mediumPriorityEfforts.length > 0) {
        uetlibergRunsFound++;
        const allSegmentEfforts = [...highPriorityEfforts, ...mediumPriorityEfforts];

        for (const effort of allSegmentEfforts) {
          try {
            await supabaseAdmin.from('check_ins').upsert(
              {
                user_id: userId,
                segment_id: effort.segment.id,
                activity_id: run.id,
                activity_name: run.name,
                elapsed_time: effort.elapsed_time,
                distance: effort.distance,
                checked_in_at: run.start_date,
                activity_distance: run.distance,
                activity_elapsed_time: run.elapsed_time,
              },
              { onConflict: 'user_id,segment_id,activity_id' }
            );
          } catch (err) {
            console.error('Check-in error:', err);
          }
        }
      }
    } catch (error) {
      console.error(`Error processing activity ${run.id}:`, error);
    }
  }

  console.log(`Month ${year}-${month}: ${uetlibergRunsFound} Uetliberg runs found`);
  return { success: true, runsFound: uetlibergRunsFound };
}

// Background sync function
async function performBackgroundSync(userId: string, token: string) {
  console.log(`Starting background sync for user ${userId}`);

  const supabaseAdmin = createClient(
    Deno.env.get('SUPABASE_URL') ?? '',
    Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? ''
  );

  try {
    // Mark sync as started
    await supabaseAdmin
      .from('profiles')
      .update({
        initial_sync_started_at: new Date().toISOString(),
        initial_sync_months_done: 0,
      })
      .eq('id', userId);

    // Get Strava credentials
    const { data: credentials, error: credsError } = await supabaseAdmin.rpc(
      'get_strava_credentials',
      { _user_id: userId }
    );

    if (credsError || !credentials || credentials.length === 0) {
      console.error('Failed to get credentials:', credsError);
      return;
    }

    const creds = credentials[0];
    let accessToken = creds.strava_access_token;
    const refreshToken = creds.strava_refresh_token;
    const expiresAt = new Date(creds.strava_token_expires_at);

    // Refresh token if expired
    if (expiresAt <= new Date()) {
      console.log('Refreshing token...');
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
        return;
      }

      const refreshData = await refreshResponse.json();
      accessToken = refreshData.access_token;

      await supabaseAdmin.rpc('upsert_strava_credentials', {
        _user_id: userId,
        _access_token: accessToken,
        _refresh_token: refreshData.refresh_token,
        _expires_at: new Date(refreshData.expires_at * 1000).toISOString(),
      });
    }

    // Get Uetliberg segments
    const { data: uetlibergSegments } = await supabaseAdmin
      .from('uetliberg_segments')
      .select('segment_id, name, priority, ends_at_uetliberg, distance_to_center')
      .order('priority', { ascending: true });

    if (!uetlibergSegments || uetlibergSegments.length === 0) {
      console.log('No Uetliberg segments found, marking sync as complete');
      await supabaseAdmin
        .from('profiles')
        .update({ initial_sync_completed: true, initial_sync_months_done: 12 })
        .eq('id', userId);
      return;
    }

    const highPrioritySegments = uetlibergSegments.filter((s) => s.ends_at_uetliberg);
    const mediumPrioritySegments = uetlibergSegments.filter((s) => !s.ends_at_uetliberg);

    // Process 12 months backwards
    const now = new Date();
    let totalRuns = 0;

    for (let i = 0; i < 12; i++) {
      const targetDate = new Date(now.getFullYear(), now.getMonth() - i, 1);
      const year = targetDate.getFullYear();
      const month = targetDate.getMonth() + 1;

      const result = await processMonth(
        supabaseAdmin,
        userId,
        accessToken,
        year,
        month,
        uetlibergSegments,
        highPrioritySegments,
        mediumPrioritySegments
      );

      totalRuns += result.runsFound;

      // Update progress
      await supabaseAdmin
        .from('profiles')
        .update({ initial_sync_months_done: i + 1 })
        .eq('id', userId);

      console.log(`Progress: ${i + 1}/12 months done`);

      // Pause between months
      if (i < 11) {
        await delay(RATE_LIMIT.delayBetweenMonths);
      }
    }

    // Mark as complete
    await supabaseAdmin
      .from('profiles')
      .update({ initial_sync_completed: true })
      .eq('id', userId);

    console.log(`Sync complete! Found ${totalRuns} Uetliberg runs across 12 months`);
  } catch (error) {
    console.error('Background sync error:', error);
  }
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

    // Check if sync already completed or in progress
    const { data: profile } = await supabaseAdmin
      .from('profiles')
      .select('initial_sync_completed, initial_sync_started_at')
      .eq('id', user.id)
      .single();

    if (profile?.initial_sync_completed) {
      return new Response(
        JSON.stringify({ status: 'already_completed', message: 'Initial sync already done' }),
        { status: 200, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // Check if sync is stuck (started more than 30 minutes ago)
    if (profile?.initial_sync_started_at) {
      const startedAt = new Date(profile.initial_sync_started_at);
      const thirtyMinutesAgo = new Date(Date.now() - 30 * 60 * 1000);
      
      if (startedAt > thirtyMinutesAgo) {
        return new Response(
          JSON.stringify({ status: 'in_progress', message: 'Sync already running' }),
          { status: 200, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
        );
      }
      // If older than 30 minutes, allow restart
      console.log('Previous sync appears stuck, restarting...');
    }

    // Start background sync
    EdgeRuntime.waitUntil(performBackgroundSync(user.id, token));

    return new Response(
      JSON.stringify({ status: 'started', message: 'Background sync started' }),
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
