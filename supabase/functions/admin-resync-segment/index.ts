import { serve } from 'https://deno.land/std@0.168.0/http/server.ts';
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.7.1';

// Declare EdgeRuntime for TypeScript
declare const EdgeRuntime: {
  waitUntil(promise: Promise<any>): void;
};

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

// Rate limiting configuration
const RATE_LIMIT = {
  delayBetweenRequests: 100,
  delayEvery10Requests: 1000,
  delayBetweenUsers: 5000,
  rateLimitRetryDelay: 60000,
};

const delay = (ms: number) => new Promise((resolve) => setTimeout(resolve, ms));

// Refresh Strava token if expired
async function refreshTokenIfNeeded(
  supabaseAdmin: any,
  userId: string,
  accessToken: string,
  refreshToken: string,
  expiresAt: Date
): Promise<string> {
  if (expiresAt > new Date()) {
    return accessToken;
  }

  console.log(`Refreshing token for user ${userId}...`);
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
    throw new Error(`Failed to refresh token: ${refreshResponse.status}`);
  }

  const refreshData = await refreshResponse.json();

  await supabaseAdmin.rpc('upsert_strava_credentials', {
    _user_id: userId,
    _access_token: refreshData.access_token,
    _refresh_token: refreshData.refresh_token,
    _expires_at: new Date(refreshData.expires_at * 1000).toISOString(),
  });

  return refreshData.access_token;
}

// Process re-sync for a specific segment
async function performResync(segmentId: number | null) {
  console.log(`Starting admin re-sync for segment: ${segmentId ?? 'ALL'}`);

  const supabaseAdmin = createClient(
    Deno.env.get('SUPABASE_URL') ?? '',
    Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? ''
  );

  try {
    // Get segments to check
    let segments: any[];
    if (segmentId) {
      const { data, error } = await supabaseAdmin
        .from('uetliberg_segments')
        .select('segment_id, name, priority, ends_at_uetliberg')
        .eq('segment_id', segmentId);
      
      if (error || !data || data.length === 0) {
        console.error('Segment not found:', segmentId);
        return;
      }
      segments = data;
    } else {
      const { data, error } = await supabaseAdmin
        .from('uetliberg_segments')
        .select('segment_id, name, priority, ends_at_uetliberg');
      
      if (error || !data) {
        console.error('Failed to fetch segments:', error);
        return;
      }
      segments = data;
    }

    console.log(`Re-syncing ${segments.length} segment(s)`);

    // Get all users with Strava credentials
    const { data: credentials, error: credsError } = await supabaseAdmin
      .from('strava_credentials')
      .select('user_id, strava_access_token, strava_refresh_token, strava_token_expires_at');

    if (credsError || !credentials || credentials.length === 0) {
      console.log('No users with Strava credentials found');
      return;
    }

    console.log(`Processing ${credentials.length} user(s)`);

    // Sync cutoff: 1. Januar 2026
    const SYNC_CUTOFF = new Date(Date.UTC(2026, 0, 1));
    const now = new Date();
    const segmentIds = segments.map(s => s.segment_id);

    let totalCheckInsCreated = 0;

    for (const creds of credentials) {
      try {
        console.log(`Processing user ${creds.user_id}`);

        // Refresh token if needed
        const accessToken = await refreshTokenIfNeeded(
          supabaseAdmin,
          creds.user_id,
          creds.strava_access_token,
          creds.strava_refresh_token,
          new Date(creds.strava_token_expires_at)
        );

        // Calculate months to sync
        const currentYear = now.getUTCFullYear();
        const currentMonth = now.getUTCMonth();
        const monthsSinceJan2026 = (currentYear - 2026) * 12 + currentMonth + 1;
        const monthsToSync = Math.max(1, monthsSinceJan2026);

        let userCheckIns = 0;
        let requestCount = 0;

        for (let i = 0; i < monthsToSync; i++) {
          const targetDate = new Date(now.getFullYear(), now.getMonth() - i, 1);
          if (targetDate < SYNC_CUTOFF) break;

          const year = targetDate.getFullYear();
          const month = targetDate.getMonth() + 1;
          
          const startOfMonth = Math.floor(new Date(Date.UTC(year, month - 1, 1, 0, 0, 0)).getTime() / 1000);
          const endOfMonth = Math.floor(new Date(Date.UTC(year, month, 0, 23, 59, 59)).getTime() / 1000);

          // Fetch activities for the month
          const maxPages = 3;
          const perPage = 50;
          const allActivities: any[] = [];

          for (let page = 1; page <= maxPages; page++) {
            await delay(RATE_LIMIT.delayBetweenRequests);
            requestCount++;

            if (requestCount % 10 === 0) {
              await delay(RATE_LIMIT.delayEvery10Requests);
            }

            const activitiesResponse = await fetch(
              `https://www.strava.com/api/v3/athlete/activities?per_page=${perPage}&page=${page}&after=${startOfMonth}&before=${endOfMonth}`,
              { headers: { Authorization: `Bearer ${accessToken}` } }
            );

            if (activitiesResponse.status === 429) {
              console.log('Rate limit hit, waiting 60s...');
              await delay(RATE_LIMIT.rateLimitRetryDelay);
              page--;
              continue;
            }

            if (!activitiesResponse.ok) {
              console.error(`Activities fetch failed: ${activitiesResponse.status}`);
              break;
            }

            const pageActivities = await activitiesResponse.json();
            if (!Array.isArray(pageActivities) || pageActivities.length === 0) break;

            allActivities.push(...pageActivities);
            if (pageActivities.length < perPage) break;
          }

          // Filter runs
          const runs = allActivities.filter((a: any) => a.type === 'Run');

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

              // Find matching efforts for target segments
              const matchingEfforts = segmentEfforts.filter((effort: any) =>
                segmentIds.includes(effort.segment.id)
              );

              for (const effort of matchingEfforts) {
                const { error: upsertError } = await supabaseAdmin.from('check_ins').upsert(
                  {
                    user_id: creds.user_id,
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

                if (!upsertError) {
                  userCheckIns++;
                  totalCheckInsCreated++;
                }
              }
            } catch (err) {
              console.error(`Error processing activity ${run.id}:`, err);
            }
          }
        }

        console.log(`User ${creds.user_id}: ${userCheckIns} check-in(s) created/updated`);

        // Pause between users
        await delay(RATE_LIMIT.delayBetweenUsers);
      } catch (error) {
        console.error(`Error processing user ${creds.user_id}:`, error);
      }
    }

    console.log(`Re-sync complete! Total check-ins created/updated: ${totalCheckInsCreated}`);
  } catch (error) {
    console.error('Re-sync error:', error);
  }
}

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const authHeader = req.headers.get('Authorization');
    if (!authHeader?.startsWith('Bearer ')) {
      return new Response(
        JSON.stringify({ error: 'Unauthorized' }),
        { status: 401, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    const supabaseAdmin = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? ''
    );

    // Verify user and check admin role
    const token = authHeader.replace('Bearer ', '');
    const { data: claimsData, error: claimsError } = await supabaseAdmin.auth.getUser(token);

    if (claimsError || !claimsData.user) {
      return new Response(
        JSON.stringify({ error: 'Unauthorized' }),
        { status: 401, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // Check if user is admin
    const { data: isAdmin } = await supabaseAdmin.rpc('has_role', {
      _user_id: claimsData.user.id,
      _role: 'admin',
    });

    if (!isAdmin) {
      return new Response(
        JSON.stringify({ error: 'Forbidden: Admin access required' }),
        { status: 403, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // Parse request body
    const body = await req.json().catch(() => ({}));
    const segmentId = body.segment_id ? parseInt(body.segment_id, 10) : null;

    console.log(`Admin ${claimsData.user.id} triggered re-sync for segment: ${segmentId ?? 'ALL'}`);

    // Start background sync
    EdgeRuntime.waitUntil(performResync(segmentId));

    return new Response(
      JSON.stringify({
        status: 'started',
        message: segmentId
          ? `Re-Sync für Segment ${segmentId} gestartet`
          : 'Re-Sync für alle Segmente gestartet',
        segment_id: segmentId,
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
