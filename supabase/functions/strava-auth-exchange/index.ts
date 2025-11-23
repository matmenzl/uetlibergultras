import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.84.0';
import { encode as base64Encode } from "https://deno.land/std@0.168.0/encoding/base64.ts";
import { checkRateLimit, getClientIdentifier } from '../_shared/rateLimit.ts';
import { validateRequest, StravaAuthExchangeSchema } from '../_shared/validation.ts';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    // Rate limiting - 10 requests per minute per IP
    const rateLimitClientId = getClientIdentifier(req);
    const rateCheck = await checkRateLimit(rateLimitClientId, {
      requests: 10,
      windowMs: 60000
    });
    
    if (!rateCheck.allowed) {
      return new Response(
        JSON.stringify({ 
          success: false,
          error: 'Rate limit exceeded. Please try again later.' 
        }),
        { 
          status: 429, 
          headers: {
            ...corsHeaders,
            'Retry-After': '60'
          } 
        }
      );
    }

    // Input validation
    const body = await req.json().catch(() => ({}));
    const validation = validateRequest(StravaAuthExchangeSchema, body);
    
    if (!validation.success) {
      return new Response(
        JSON.stringify({ 
          success: false,
          error: validation.error 
        }),
        { status: 400, headers: corsHeaders }
      );
    }
    
    const { code } = validation.data;

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
    const athlete = tokenData.athlete;
    console.log(`Token exchange successful for athlete: ${athlete.id}`);

    // Create unique email for Strava user
    const stravaEmail = `strava_${athlete.id}@strava.user`;
    
    // SECURITY: Generate cryptographically secure random password (32 bytes = 256 bits)
    const randomBytes = crypto.getRandomValues(new Uint8Array(32));
    const stravaPassword = base64Encode(randomBytes.buffer);

    // Check if user exists by looking up Strava ID in profiles
    let userId: string;
    const { data: existingProfile } = await supabase
      .from('profiles')
      .select('id')
      .eq('strava_id', athlete.id)
      .single();

    if (existingProfile) {
      // User exists - update their password and metadata
      userId = existingProfile.id;
      console.log(`Existing user found: ${userId}`);
      
      // SECURITY: Update to new random password
      const { error: updateError } = await supabase.auth.admin.updateUserById(
        userId,
        { 
          password: stravaPassword,
          user_metadata: {
            strava_id: athlete.id,
            first_name: athlete.firstname,
            last_name: athlete.lastname,
          }
        }
      );
      
      if (updateError) {
        console.error('User update error:', updateError);
        throw new Error('Failed to update user account');
      }
      
      console.log(`User credentials updated: ${userId}`);
    } else {
      // User doesn't exist, create new user
      console.log('Creating new user account...');
      const { data: signUpData, error: signUpError } = await supabase.auth.admin.createUser({
        email: stravaEmail,
        password: stravaPassword,
        email_confirm: true,
        user_metadata: {
          strava_id: athlete.id,
          first_name: athlete.firstname,
          last_name: athlete.lastname,
        }
      });

      if (signUpError || !signUpData.user) {
        console.error('Sign up error:', signUpError);
        throw new Error('Failed to create user account');
      }

      userId = signUpData.user.id;
      console.log(`New user created: ${userId}`);
    }

    // Store Strava tokens securely (server-side only)
    const { error: credentialsError } = await supabase.rpc('upsert_strava_credentials', {
      _user_id: userId,
      _access_token: tokenData.access_token,
      _refresh_token: tokenData.refresh_token,
      _expires_at: new Date(tokenData.expires_at * 1000).toISOString(),
    });

    if (credentialsError) {
      console.error('Credentials upsert error:', credentialsError);
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
    }

    // Create session for the user (for client to use)
    const { data: sessionData, error: sessionError } = await supabase.auth.signInWithPassword({
      email: stravaEmail,
      password: stravaPassword,
    });

    if (sessionError || !sessionData.session) {
      console.error('Session error:', sessionError);
      throw new Error('Failed to create session');
    }

    console.log('Authentication successful');

    return new Response(
      JSON.stringify({ 
        success: true,
        session: sessionData.session
      }),
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
      JSON.stringify({ 
        success: false,
        error: errorMessage 
      }),
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
