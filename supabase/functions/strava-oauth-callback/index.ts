import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.84.0';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const { code, userId } = await req.json();
    
    if (!code || !userId) {
      throw new Error('Code and userId are required');
    }

    const clientId = Deno.env.get('STRAVA_CLIENT_ID');
    const clientSecret = Deno.env.get('STRAVA_CLIENT_SECRET');
    const supabaseUrl = Deno.env.get('SUPABASE_URL');
    const supabaseServiceKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY');

    if (!clientId || !clientSecret || !supabaseUrl || !supabaseServiceKey) {
      throw new Error('Missing required environment variables');
    }

    const supabase = createClient(supabaseUrl, supabaseServiceKey);

    // Exchange code for tokens
    console.log('Exchanging authorization code for tokens...');
    const tokenResponse = await fetch('https://www.strava.com/oauth/token', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        client_id: parseInt(clientId, 10),
        client_secret: clientSecret,
        code: code,
        grant_type: 'authorization_code',
      }),
    });

    if (!tokenResponse.ok) {
      const error = await tokenResponse.text();
      console.error('Token exchange error:', error);
      throw new Error('Failed to exchange authorization code');
    }

    const tokenData = await tokenResponse.json();
    console.log('Token exchange successful');

    // Fetch athlete data
    console.log('Fetching athlete data...');
    const athleteResponse = await fetch('https://www.strava.com/api/v3/athlete', {
      headers: {
        'Authorization': `Bearer ${tokenData.access_token}`,
      },
    });

    if (!athleteResponse.ok) {
      throw new Error('Failed to fetch athlete data');
    }

    const athlete = await athleteResponse.json();
    console.log(`Athlete data fetched: ${athlete.id}`);

    // Store Strava tokens securely (server-side only)
    const { error: credentialsError } = await supabase.rpc('upsert_strava_credentials', {
      _user_id: userId,
      _access_token: tokenData.access_token,
      _refresh_token: tokenData.refresh_token,
      _expires_at: new Date(tokenData.expires_at * 1000).toISOString(),
    });

    if (credentialsError) {
      console.error('Credentials upsert error:', credentialsError);
      throw new Error('Failed to save credentials');
    }

    // Store public profile data (without tokens)
    const { error: profileError } = await supabase
      .from('profiles')
      .upsert({
        id: userId,
        strava_id: athlete.id,
        first_name: athlete.firstname,
        last_name: athlete.lastname,
        profile_picture: athlete.profile,
      });

    if (profileError) {
      console.error('Profile upsert error:', profileError);
      throw new Error('Failed to save profile data');
    }

    console.log('Profile saved successfully');

    return new Response(
      JSON.stringify({ success: true }),
      {
        headers: {
          ...corsHeaders,
          'Content-Type': 'application/json',
        },
      }
    );
  } catch (error) {
    console.error('Error:', error);
    const errorMessage = error instanceof Error ? error.message : 'Unknown error';
    return new Response(
      JSON.stringify({ error: errorMessage }),
      {
        status: 500,
        headers: {
          ...corsHeaders,
          'Content-Type': 'application/json',
        },
      }
    );
  }
});
