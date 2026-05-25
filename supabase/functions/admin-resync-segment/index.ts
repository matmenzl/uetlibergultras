import { serve } from 'https://deno.land/std@0.168.0/http/server.ts';
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.7.1';
import {
  createBudget,
  stravaFetch,
  ShortLimitReachedError,
  LongLimitReachedError,
  type RateBudget,
} from '../_shared/stravaRateLimit.ts';

// Declare EdgeRuntime for TypeScript
declare const EdgeRuntime: {
  waitUntil(promise: Promise<any>): void;
};

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

// Self-trigger if more work remains. Keep well under Edge Function timeout.
const MAX_INVOCATION_MS = 110_000;

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

async function processUser(
  supabaseAdmin: any,
  userId: string,
  segmentIds: number[],
  budget: RateBudget,
  deadline: number
): Promise<number> {
  // Load credentials
  const { data: creds, error: credsError } = await supabaseAdmin
    .from('strava_credentials')
    .select('strava_access_token, strava_refresh_token, strava_token_expires_at')
    .eq('user_id', userId)
    .maybeSingle();

  if (credsError || !creds) {
    console.warn(`No credentials for user ${userId}, skipping`);
    return 0;
  }

  let accessToken = await refreshTokenIfNeeded(
    supabaseAdmin,
    userId,
    creds.strava_access_token,
    creds.strava_refresh_token,
    new Date(creds.strava_token_expires_at)
  );

  const SYNC_CUTOFF = new Date(Date.UTC(2026, 0, 1));
  const now = new Date();
  const currentYear = now.getUTCFullYear();
  const currentMonth = now.getUTCMonth();
  const monthsSinceJan2026 = (currentYear - 2026) * 12 + currentMonth + 1;
  const monthsToSync = Math.max(1, monthsSinceJan2026);

  let userCheckIns = 0;

  for (let i = 0; i < monthsToSync; i++) {
    if (Date.now() > deadline) {
      throw new Error('TIME_BUDGET_EXCEEDED');
    }

    const targetDate = new Date(Date.UTC(currentYear, currentMonth - i, 1));
    if (targetDate < SYNC_CUTOFF) break;

    const year = targetDate.getUTCFullYear();
    const month = targetDate.getUTCMonth() + 1;
    const startOfMonth = Math.floor(Date.UTC(year, month - 1, 1, 0, 0, 0) / 1000);
    const endOfMonth = Math.floor(Date.UTC(year, month, 0, 23, 59, 59) / 1000);

    const perPage = 50;
    const maxPages = 3;
    const allActivities: any[] = [];

    for (let page = 1; page <= maxPages; page++) {
      const res = await stravaFetch(
        `https://www.strava.com/api/v3/athlete/activities?per_page=${perPage}&page=${page}&after=${startOfMonth}&before=${endOfMonth}`,
        accessToken,
        budget
      );
      if (!res.ok) {
        console.error(`Activities fetch failed: ${res.status}`);
        break;
      }
      const pageActivities = await res.json();
      if (!Array.isArray(pageActivities) || pageActivities.length === 0) break;
      allActivities.push(...pageActivities);
      if (pageActivities.length < perPage) break;
    }

    const runs = allActivities.filter((a: any) => a.type === 'Run');

    for (const run of runs) {
      if (Date.now() > deadline) {
        throw new Error('TIME_BUDGET_EXCEEDED');
      }

      const detailRes = await stravaFetch(
        `https://www.strava.com/api/v3/activities/${run.id}?include_all_efforts=true`,
        accessToken,
        budget
      );
      if (!detailRes.ok) continue;
      const detailedActivity = await detailRes.json();
      const segmentEfforts = detailedActivity.segment_efforts || [];
      const matchingEfforts = segmentEfforts.filter((effort: any) =>
        segmentIds.includes(effort.segment.id)
      );

      for (const effort of matchingEfforts) {
        const { error: upsertError } = await supabaseAdmin.from('check_ins').upsert(
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
        if (!upsertError) userCheckIns++;
      }
    }
  }

  return userCheckIns;
}

async function runJob(jobId: string) {
  const supabaseAdmin = createClient(
    Deno.env.get('SUPABASE_URL') ?? '',
    Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? ''
  );

  const startedAt = Date.now();
  const deadline = startedAt + MAX_INVOCATION_MS;

  const { data: job, error: jobError } = await supabaseAdmin
    .from('resync_jobs')
    .select('*')
    .eq('id', jobId)
    .maybeSingle();

  if (jobError || !job) {
    console.error(`Job ${jobId} not found`);
    return;
  }

  if (job.status === 'done' || job.status === 'failed') {
    console.log(`Job ${jobId} already ${job.status}, skipping`);
    return;
  }
  if (job.resume_after && new Date(job.resume_after) > new Date()) {
    console.log(`Job ${jobId} not due yet (resume_after=${job.resume_after})`);
    return;
  }

  // Resolve segments
  let segments: any[];
  if (job.segment_id) {
    const { data } = await supabaseAdmin
      .from('uetliberg_segments')
      .select('segment_id')
      .eq('segment_id', job.segment_id);
    segments = data ?? [];
  } else {
    const { data } = await supabaseAdmin.from('uetliberg_segments').select('segment_id');
    segments = data ?? [];
  }
  const segmentIds: number[] = segments.map((s: any) => s.segment_id);

  // Resolve user list (frozen on first run)
  let userIds: string[] = [];
  if (!job.total_users || job.total_users === 0) {
    const { data: creds } = await supabaseAdmin
      .from('strava_credentials')
      .select('user_id');
    userIds = (creds ?? []).map((c: any) => c.user_id);
    await supabaseAdmin
      .from('resync_jobs')
      .update({
        total_users: userIds.length,
        status: 'running',
        started_at: job.started_at ?? new Date().toISOString(),
        last_heartbeat_at: new Date().toISOString(),
      })
      .eq('id', jobId);
  } else {
    const { data: creds } = await supabaseAdmin
      .from('strava_credentials')
      .select('user_id');
    userIds = (creds ?? []).map((c: any) => c.user_id);
    await supabaseAdmin
      .from('resync_jobs')
      .update({ status: 'running', last_heartbeat_at: new Date().toISOString() })
      .eq('id', jobId);
  }

  const processed = new Set<string>(job.processed_user_ids ?? []);
  const remaining = userIds.filter((u) => !processed.has(u));

  if (remaining.length === 0) {
    await supabaseAdmin
      .from('resync_jobs')
      .update({ status: 'done', finished_at: new Date().toISOString() })
      .eq('id', jobId);
    console.log(`Job ${jobId} complete`);
    return;
  }

  const budget = createBudget({
    short: job.rate_limit_short ?? 0,
    long: job.rate_limit_long ?? 0,
    shortMax: job.rate_limit_short_max ?? 100,
    longMax: job.rate_limit_long_max ?? 1000,
  });

  let totalCheckIns = job.check_ins_created ?? 0;
  let pauseReason: 'short' | 'long' | 'time' | null = null;
  let resumeAfter: Date | null = null;

  for (const userId of remaining) {
    await supabaseAdmin
      .from('resync_jobs')
      .update({
        current_user_id: userId,
        last_heartbeat_at: new Date().toISOString(),
        rate_limit_short: budget.short,
        rate_limit_long: budget.long,
      })
      .eq('id', jobId);

    try {
      const created = await processUser(supabaseAdmin, userId, segmentIds, budget, deadline);
      totalCheckIns += created;
      processed.add(userId);

      await supabaseAdmin
        .from('resync_jobs')
        .update({
          processed_user_ids: Array.from(processed),
          check_ins_created: totalCheckIns,
          rate_limit_short: budget.short,
          rate_limit_long: budget.long,
          last_heartbeat_at: new Date().toISOString(),
        })
        .eq('id', jobId);

      console.log(`User ${userId}: +${created} check-ins (short=${budget.short}, long=${budget.long})`);
    } catch (err) {
      if (err instanceof LongLimitReachedError) {
        pauseReason = 'long';
        resumeAfter = err.resumeAfter;
        break;
      }
      if (err instanceof ShortLimitReachedError) {
        pauseReason = 'short';
        resumeAfter = err.resumeAfter;
        break;
      }
      if (err instanceof Error && err.message === 'TIME_BUDGET_EXCEEDED') {
        pauseReason = 'time';
        // mark current user as processed only if we got a partial — keep unprocessed for retry
        // (we leave user in remaining; partial check-ins are upserted)
        resumeAfter = new Date(Date.now() + 2_000);
        break;
      }
      console.error(`Error processing user ${userId}:`, err);
      // Mark as processed to avoid infinite loop on a broken user
      processed.add(userId);
      await supabaseAdmin
        .from('resync_jobs')
        .update({
          processed_user_ids: Array.from(processed),
          last_error: err instanceof Error ? err.message : String(err),
          last_heartbeat_at: new Date().toISOString(),
        })
        .eq('id', jobId);
    }

    if (Date.now() > deadline) {
      pauseReason = 'time';
      resumeAfter = new Date(Date.now() + 2_000);
      break;
    }
  }

  const stillRemaining = userIds.filter((u) => !processed.has(u));

  if (stillRemaining.length === 0 && !pauseReason) {
    await supabaseAdmin
      .from('resync_jobs')
      .update({
        status: 'done',
        finished_at: new Date().toISOString(),
        current_user_id: null,
        rate_limit_short: budget.short,
        rate_limit_long: budget.long,
      })
      .eq('id', jobId);
    console.log(`Job ${jobId} done. Total check-ins: ${totalCheckIns}`);
    return;
  }

  // Pause
  await supabaseAdmin
    .from('resync_jobs')
    .update({
      status: 'paused',
      resume_after: (resumeAfter ?? new Date(Date.now() + 60_000)).toISOString(),
      last_error: pauseReason === 'long'
        ? 'Strava daily limit reached'
        : pauseReason === 'short'
        ? 'Strava 15-min limit reached'
        : 'Edge function time budget exceeded',
      rate_limit_short: budget.short,
      rate_limit_long: budget.long,
      last_heartbeat_at: new Date().toISOString(),
    })
    .eq('id', jobId);

  console.log(
    `Job ${jobId} paused (reason=${pauseReason}), resume_after=${resumeAfter?.toISOString()}, remaining=${stillRemaining.length}`
  );

  // Self-trigger only if pause is short (≤ 5s, i.e. time budget). Otherwise rely on cron runner.
  if (pauseReason === 'time') {
    const url = `${Deno.env.get('SUPABASE_URL')}/functions/v1/admin-resync-segment`;
    fetch(url, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')}`,
      },
      body: JSON.stringify({ job_id: jobId, internal: true }),
    }).catch((e) => console.error('Self-trigger failed:', e));
  }
}

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const supabaseAdmin = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? ''
    );

    const body = await req.json().catch(() => ({}));
    const serviceRoleKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? '';
    const authHeader = req.headers.get('Authorization') ?? '';
    const isInternalCall =
      body?.internal === true && authHeader === `Bearer ${serviceRoleKey}`;

    // --- Internal continuation call (from self-trigger or cron) ---
    if (isInternalCall && body.job_id) {
      EdgeRuntime.waitUntil(runJob(body.job_id));
      return new Response(
        JSON.stringify({ status: 'resumed', job_id: body.job_id }),
        { status: 200, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // --- Public call: admin starts or checks a job ---
    if (!authHeader?.startsWith('Bearer ')) {
      return new Response(
        JSON.stringify({ error: 'Unauthorized' }),
        { status: 401, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    const token = authHeader.replace('Bearer ', '');
    const { data: claimsData, error: claimsError } = await supabaseAdmin.auth.getUser(token);

    if (claimsError || !claimsData.user) {
      return new Response(
        JSON.stringify({ error: 'Unauthorized' }),
        { status: 401, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

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

    const segmentId = body.segment_id ? parseInt(body.segment_id, 10) : null;
    const cancelJobId: string | null = body.cancel_job_id ?? null;

    // Cancel an active job
    if (cancelJobId) {
      await supabaseAdmin
        .from('resync_jobs')
        .update({ status: 'failed', finished_at: new Date().toISOString(), last_error: 'Cancelled by admin' })
        .eq('id', cancelJobId)
        .in('status', ['queued', 'running', 'paused']);
      return new Response(
        JSON.stringify({ status: 'cancelled', job_id: cancelJobId }),
        { status: 200, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // Reject if there's already an active job
    const { data: activeJobs } = await supabaseAdmin
      .from('resync_jobs')
      .select('id, status')
      .in('status', ['queued', 'running', 'paused'])
      .limit(1);

    if (activeJobs && activeJobs.length > 0) {
      return new Response(
        JSON.stringify({
          status: 'already_running',
          job_id: activeJobs[0].id,
          message: 'Es läuft bereits ein Resync-Job. Bitte zuerst abwarten oder abbrechen.',
        }),
        { status: 409, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // Create new job
    const { data: newJob, error: insertError } = await supabaseAdmin
      .from('resync_jobs')
      .insert({
        segment_id: segmentId,
        status: 'queued',
        created_by: claimsData.user.id,
      })
      .select('id')
      .single();

    if (insertError || !newJob) {
      throw new Error(insertError?.message ?? 'Failed to create job');
    }

    console.log(`Admin ${claimsData.user.id} queued resync job ${newJob.id} (segment=${segmentId ?? 'ALL'})`);

    EdgeRuntime.waitUntil(runJob(newJob.id));

    return new Response(
      JSON.stringify({
        status: 'started',
        job_id: newJob.id,
        message: segmentId
          ? `Re-Sync für Segment ${segmentId} gestartet`
          : 'Re-Sync für alle Segmente gestartet',
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
