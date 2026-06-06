import { serve } from 'https://deno.land/std@0.168.0/http/server.ts';
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.7.1';

// Strava API Policy 2026, Section 6.2: Strava Data must not be retained
// longer than 7 days. Aggregates / counts derived from data are not "Strava
// Data" and may be kept. This function NULLs the raw Strava fields on
// check_ins older than 7 days. Counts and segment matches survive.

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders });
  }

  const supabase = createClient(
    Deno.env.get('SUPABASE_URL') ?? '',
    Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? ''
  );

  // Optional manual trigger by admin user
  let triggeredBy = 'cron';
  try {
    const authHeader = req.headers.get('Authorization');
    if (authHeader?.startsWith('Bearer ')) {
      const jwt = authHeader.replace('Bearer ', '');
      const { data: userData } = await supabase.auth.getUser(jwt);
      if (userData?.user) {
        triggeredBy = `admin:${userData.user.id}`;
      }
    }
  } catch (_) {
    // ignore
  }

  // Create audit row
  const { data: runRow, error: runErr } = await supabase
    .from('strava_retention_runs')
    .insert({ status: 'running', triggered_by: triggeredBy })
    .select('id')
    .single();

  if (runErr || !runRow) {
    console.error('Failed to create retention run row', runErr);
    return new Response(JSON.stringify({ error: 'Failed to start' }), {
      status: 500,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  }

  const runId = runRow.id as string;
  const cutoff = new Date(Date.now() - 7 * 24 * 60 * 60 * 1000).toISOString();
  let redacted = 0;
  let segmentsRefreshed = 0;
  let errorMsg: string | null = null;

  try {
    // Redact Strava raw fields on old check_ins (skip manual check-ins:
    // those values are entered by the user, not "Strava Data").
    const { data: oldRows, error: scanErr } = await supabase
      .from('check_ins')
      .select('id')
      .lt('checked_in_at', cutoff)
      .not('activity_name', 'is', null)
      .eq('is_manual', false)
      .limit(2000);

    if (scanErr) throw scanErr;

    if (oldRows && oldRows.length > 0) {
      const ids = oldRows.map((r: { id: string }) => r.id);
      const { error: updErr } = await supabase
        .from('check_ins')
        .update({
          activity_name: null,
          activity_distance: null,
          distance: null,
          elapsed_time: null,
          activity_elapsed_time: null,
          elevation_gain: null,
        })
        .in('id', ids);

      if (updErr) throw updErr;
      redacted = ids.length;
      console.log(`Redacted Strava raw fields on ${redacted} check_ins`);
    }
  } catch (e) {
    errorMsg = e instanceof Error ? e.message : String(e);
    console.error('Retention scan failed:', errorMsg);
  }

  await supabase
    .from('strava_retention_runs')
    .update({
      finished_at: new Date().toISOString(),
      status: errorMsg ? 'failed' : 'success',
      checkins_redacted: redacted,
      segments_refreshed: segmentsRefreshed,
      error: errorMsg,
    })
    .eq('id', runId);

  return new Response(
    JSON.stringify({
      success: !errorMsg,
      run_id: runId,
      checkins_redacted: redacted,
      segments_refreshed: segmentsRefreshed,
      error: errorMsg,
    }),
    { status: 200, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
  );
});