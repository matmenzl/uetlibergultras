import { serve } from 'https://deno.land/std@0.168.0/http/server.ts';
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.7.1';

// Strava API Policy 2026, Sections 2.5 / 7.4: users must be able to request
// deletion of all their data, and we must confirm the deletion in writing.

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

const GATEWAY_URL = 'https://connector-gateway.lovable.dev/resend';

async function sendDeletionEmail(toEmail: string, deletedAt: string) {
  const lovableKey = Deno.env.get('LOVABLE_API_KEY');
  const resendKey = Deno.env.get('RESEND_API_KEY');
  if (!lovableKey || !resendKey) {
    console.warn('Email gateway not configured; skipping confirmation email');
    return false;
  }

  const html = `
    <div style="font-family: Arial, sans-serif; max-width: 560px; margin: 0 auto; padding: 24px; color: #1a1a1a;">
      <h1 style="font-size: 22px; margin: 0 0 16px;">Konto gelöscht</h1>
      <p>Hoi</p>
      <p>
        Wir bestätigen, dass dein Uetliberg-Ultras-Konto und alle verbundenen
        Daten am <strong>${deletedAt}</strong> gelöscht wurden.
      </p>
      <p>Was gelöscht wurde:</p>
      <ul>
        <li>Dein Profil und Profilbild</li>
        <li>Alle Check-ins und Run-Daten</li>
        <li>Die Strava-Verknüpfung und gespeicherten Tokens</li>
        <li>Manuelle Run-Uploads und Vorschläge</li>
        <li>Errungene Badges</li>
      </ul>
      <p>
        Die Strava-Autorisierung für diese App ist damit auf unserer Seite entfernt.
        Falls du auch in deinen Strava-Einstellungen die App entfernen möchtest,
        kannst du das unter
        <a href="https://www.strava.com/settings/apps">strava.com/settings/apps</a> tun.
      </p>
      <p>Bis bald am Üetliberg.</p>
      <p style="color:#666; font-size:12px; margin-top:32px;">
        Uetliberg Ultras · uetlibergultras.ch
      </p>
    </div>
  `;

  try {
    const resp = await fetch(`${GATEWAY_URL}/emails`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${lovableKey}`,
        'X-Connection-Api-Key': resendKey,
      },
      body: JSON.stringify({
        from: 'Uetliberg Ultras <noreply@uetlibergultras.ch>',
        to: [toEmail],
        subject: 'Dein Uetliberg-Ultras-Konto wurde gelöscht',
        html,
      }),
    });
    if (!resp.ok) {
      const body = await resp.text();
      console.error('Resend send failed:', resp.status, body);
      return false;
    }
    return true;
  } catch (e) {
    console.error('Resend send error:', e);
    return false;
  }
}

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders });
  }

  const supabaseAdmin = createClient(
    Deno.env.get('SUPABASE_URL') ?? '',
    Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? ''
  );

  // Validate caller
  const authHeader = req.headers.get('Authorization');
  if (!authHeader?.startsWith('Bearer ')) {
    return new Response(JSON.stringify({ error: 'Unauthorized' }), {
      status: 401, headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  }
  const jwt = authHeader.replace('Bearer ', '');
  const { data: userData, error: userErr } = await supabaseAdmin.auth.getUser(jwt);
  if (userErr || !userData?.user) {
    return new Response(JSON.stringify({ error: 'Unauthorized' }), {
      status: 401, headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  }

  const userId = userData.user.id;
  const email = userData.user.email ?? null;
  console.log(`Account deletion requested for user ${userId}`);

  // Best-effort sequential delete. Service role bypasses RLS.
  // We don't fail the whole flow on individual table errors; we log and
  // continue so user_roles+auth.user still get removed.
  const tables = [
    'check_ins',
    'strava_credentials',
    'manual_run_uploads',
    'user_achievements',
    'monthly_challenge_winners',
    'segment_suggestions',
    'achievement_suggestions',
    'user_roles',
  ] as const;

  for (const t of tables) {
    const { error } = await supabaseAdmin.from(t).delete().eq('user_id', userId);
    if (error) console.error(`Delete from ${t} failed:`, error.message);
  }

  // Profile avatar – remove from storage if hosted by us
  try {
    const { data: prof } = await supabaseAdmin
      .from('profiles')
      .select('profile_picture')
      .eq('id', userId)
      .single();
    if (prof?.profile_picture && prof.profile_picture.includes('/profile-pictures/')) {
      const path = prof.profile_picture.split('/profile-pictures/')[1];
      if (path) {
        await supabaseAdmin.storage.from('profile-pictures').remove([path]);
      }
    }
    // Also try wiping user's folder in case multiple files exist
    const { data: files } = await supabaseAdmin.storage
      .from('profile-pictures')
      .list(userId);
    if (files && files.length > 0) {
      await supabaseAdmin.storage
        .from('profile-pictures')
        .remove(files.map((f: { name: string }) => `${userId}/${f.name}`));
    }
  } catch (e) {
    console.error('Avatar cleanup error:', e);
  }

  // Delete profile row
  const { error: profDelErr } = await supabaseAdmin
    .from('profiles')
    .delete()
    .eq('id', userId);
  if (profDelErr) console.error('Delete profile failed:', profDelErr.message);

  // Audit log + delete auth user
  const deletedAtIso = new Date().toISOString();
  await supabaseAdmin
    .from('account_deletions')
    .insert({ deleted_user_id: userId, deleted_email: email, reason: 'user_request' });

  let emailSent = false;
  if (email) {
    emailSent = await sendDeletionEmail(email, new Date().toLocaleDateString('de-CH'));
    if (emailSent) {
      await supabaseAdmin
        .from('account_deletions')
        .update({ confirmation_sent: true })
        .eq('deleted_user_id', userId);
    }
  }

  const { error: authDelErr } = await supabaseAdmin.auth.admin.deleteUser(userId);
  if (authDelErr) console.error('Delete auth user failed:', authDelErr.message);

  return new Response(
    JSON.stringify({
      success: true,
      deleted_at: deletedAtIso,
      confirmation_email_sent: emailSent,
    }),
    { status: 200, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
  );
});