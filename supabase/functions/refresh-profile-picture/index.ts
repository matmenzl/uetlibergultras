import { serve } from 'https://deno.land/std@0.168.0/http/server.ts';
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.7.1';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const { user_id } = await req.json();
    if (!user_id) {
      return new Response(JSON.stringify({ error: 'user_id required' }), {
        status: 400,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    const supabaseAdmin = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? ''
    );

    // Get credentials
    const { data: credentials, error: credsError } = await supabaseAdmin.rpc(
      'get_strava_credentials',
      { _user_id: user_id }
    );

    if (credsError || !credentials || credentials.length === 0) {
      return new Response(JSON.stringify({ error: 'No credentials found' }), {
        status: 404,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    const creds = credentials[0];
    let accessToken = creds.strava_access_token;
    const expiresAt = new Date(creds.strava_token_expires_at);

    // Refresh token if expired
    if (expiresAt <= new Date()) {
      const refreshResponse = await fetch('https://www.strava.com/oauth/token', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          client_id: Deno.env.get('STRAVA_CLIENT_ID'),
          client_secret: Deno.env.get('STRAVA_CLIENT_SECRET'),
          refresh_token: creds.strava_refresh_token,
          grant_type: 'refresh_token',
        }),
      });

      if (!refreshResponse.ok) {
        return new Response(JSON.stringify({ error: 'Token refresh failed' }), {
          status: 500,
          headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        });
      }

      const refreshData = await refreshResponse.json();
      accessToken = refreshData.access_token;

      await supabaseAdmin.rpc('upsert_strava_credentials', {
        _user_id: user_id,
        _access_token: accessToken,
        _refresh_token: refreshData.refresh_token,
        _expires_at: new Date(refreshData.expires_at * 1000).toISOString(),
      });
    }

    // Fetch athlete profile
    const athleteResponse = await fetch('https://www.strava.com/api/v3/athlete', {
      headers: { Authorization: `Bearer ${accessToken}` },
    });

    if (!athleteResponse.ok) {
      return new Response(JSON.stringify({ error: `Strava API error: ${athleteResponse.status}` }), {
        status: 500,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    const athlete = await athleteResponse.json();
    const newPictureUrl = athlete.profile;

    const { error: updateError } = await supabaseAdmin
      .from('profiles')
      .update({ profile_picture: newPictureUrl })
      .eq('id', user_id);

    if (updateError) {
      return new Response(JSON.stringify({ error: 'DB update failed', details: updateError }), {
        status: 500,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    return new Response(JSON.stringify({ success: true, profile_picture: newPictureUrl }), {
      status: 200,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  } catch (error) {
    return new Response(JSON.stringify({ error: error instanceof Error ? error.message : 'Unknown error' }), {
      status: 500,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  }
});
