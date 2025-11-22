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
    const supabaseUrl = Deno.env.get('SUPABASE_URL');
    const supabaseServiceKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY');
    const authHeader = req.headers.get('Authorization');

    if (!supabaseUrl || !supabaseServiceKey || !authHeader) {
      throw new Error('Missing required configuration');
    }

    // Create Supabase client with user's auth
    const supabase = createClient(supabaseUrl, supabaseServiceKey, {
      global: { headers: { Authorization: authHeader } }
    });

    // Get current user
    const { data: { user }, error: userError } = await supabase.auth.getUser();
    if (userError || !user) {
      throw new Error('Not authenticated');
    }

    // Get user's Strava tokens from secure storage
    const { data: credentialsArray, error: credentialsError } = await supabase
      .rpc('get_strava_credentials', { _user_id: user.id });

    if (credentialsError || !credentialsArray || credentialsArray.length === 0) {
      throw new Error('Strava account not connected');
    }

    const credentials = credentialsArray[0];
    let accessToken = credentials.strava_access_token;

    // Check if token needs refresh
    const expiresAt = new Date(credentials.strava_token_expires_at);
    if (expiresAt <= new Date()) {
      console.log('Refreshing access token...');
      const clientId = Deno.env.get('STRAVA_CLIENT_ID');
      const clientSecret = Deno.env.get('STRAVA_CLIENT_SECRET');

      const refreshResponse = await fetch('https://www.strava.com/oauth/token', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          client_id: parseInt(clientId!, 10),
          client_secret: clientSecret,
          refresh_token: credentials.strava_refresh_token,
          grant_type: 'refresh_token',
        }),
      });

      if (refreshResponse.ok) {
        const refreshData = await refreshResponse.json();
        accessToken = refreshData.access_token;

        // Update tokens securely
        await supabase.rpc('upsert_strava_credentials', {
          _user_id: user.id,
          _access_token: refreshData.access_token,
          _refresh_token: refreshData.refresh_token,
          _expires_at: new Date(refreshData.expires_at * 1000).toISOString(),
        });
      }
    }

    // Fetch athlete's recent activities
    console.log('Fetching recent activities...');
    const activitiesResponse = await fetch(
      'https://www.strava.com/api/v3/athlete/activities?per_page=50',
      {
        headers: {
          'Authorization': `Bearer ${accessToken}`,
        },
      }
    );

    if (!activitiesResponse.ok) {
      throw new Error('Failed to fetch activities');
    }

    const activities = await activitiesResponse.json();
    console.log(`Found ${activities.length} recent activities`);

    // Extract segment efforts from activities
    let totalEfforts = 0;
    const effortsToInsert = [];

    for (const activity of activities) {
      if (activity.segment_efforts && activity.segment_efforts.length > 0) {
        console.log(`Activity "${activity.name}" has ${activity.segment_efforts.length} segment efforts`);
        for (const effort of activity.segment_efforts) {
          effortsToInsert.push({
            user_id: user.id,
            segment_id: effort.segment.id,
            segment_name: effort.segment.name,
            elapsed_time: effort.elapsed_time,
            moving_time: effort.moving_time,
            start_date: effort.start_date,
            distance: effort.distance,
            average_speed: effort.average_speed || null,
            max_speed: effort.max_speed || null,
            kom_rank: effort.kom_rank || null,
            pr_rank: effort.pr_rank || null,
          });
          totalEfforts++;
        }
      }
    }

    console.log(`Total segment efforts found: ${totalEfforts}`);

    // Bulk insert efforts (on conflict do nothing to avoid duplicates)
    if (effortsToInsert.length > 0) {
      console.log(`Attempting to insert ${effortsToInsert.length} segment efforts...`);
      const { error: insertError } = await supabase
        .from('segment_efforts')
        .upsert(effortsToInsert, { onConflict: 'user_id,segment_id,start_date', ignoreDuplicates: true });

      if (insertError) {
        console.error('Insert error:', insertError);
        throw new Error(`Failed to insert efforts: ${insertError.message}`);
      } else {
        console.log(`Successfully inserted ${effortsToInsert.length} segment efforts`);
      }
    } else {
      console.log('No segment efforts found in recent activities. Make sure you have runs with segment efforts on Strava.');
    }

    // Check for achievements
    await checkAchievements(supabase, user.id, effortsToInsert);

    return new Response(
      JSON.stringify({ 
        success: true, 
        activitiesCount: activities.length,
        effortsCount: totalEfforts 
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

async function checkAchievements(supabase: any, userId: string, efforts: any[]) {
  const achievements = [];

  // First segment achievement
  const { count: totalCount } = await supabase
    .from('segment_efforts')
    .select('*', { count: 'exact', head: true })
    .eq('user_id', userId);

  if (totalCount === 1) {
    achievements.push({
      user_id: userId,
      achievement_type: 'first_segment',
      metadata: { message: 'Erstes Segment abgeschlossen!' }
    });
  }

  // 10 segments achievement
  if (totalCount === 10) {
    achievements.push({
      user_id: userId,
      achievement_type: '10_segments',
      metadata: { message: '10 Segmente abgeschlossen!' }
    });
  }

  // PR achievement
  const prs = efforts.filter(e => e.pr_rank === 1);
  if (prs.length > 0) {
    for (const pr of prs) {
      achievements.push({
        user_id: userId,
        achievement_type: 'personal_record',
        segment_id: pr.segment_id,
        metadata: { 
          segment_name: pr.segment_name,
          time: pr.elapsed_time 
        }
      });
    }
  }

  // Insert achievements
  if (achievements.length > 0) {
    await supabase
      .from('achievements')
      .upsert(achievements, { onConflict: 'user_id,achievement_type,segment_id', ignoreDuplicates: true });
  }
}
