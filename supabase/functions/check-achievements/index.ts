import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

type AchievementType = 
  | 'first_run'
  | 'runs_5'
  | 'runs_10'
  | 'runs_25'
  | 'runs_50'
  | 'runs_100'
  | 'all_segments'
  | 'streak_2'
  | 'streak_4'
  | 'streak_8'
  | 'early_bird'
  | 'night_owl'
  | 'pioneer_10'
  | 'denzlerweg_king'
  | 'coiffeur'
  | 'snow_bunny'
  | 'frosty';

const DENZLERWEG_SEGMENT_ID = 5762702;
const COIFFEUR_SEGMENT_IDS = [4185072, 10683811];

// WMO weather codes for snow conditions
const SNOW_CODES = [71, 73, 75, 77, 85, 86];

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const authHeader = req.headers.get('Authorization');
    if (!authHeader) {
      throw new Error('Missing authorization header');
    }

    const supabaseUrl = Deno.env.get('SUPABASE_URL')!;
    const supabaseAnonKey = Deno.env.get('SUPABASE_ANON_KEY')!;
    const supabaseServiceKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;
    
    // Client for user authentication
    const supabaseUser = createClient(supabaseUrl, supabaseAnonKey, {
      global: { headers: { Authorization: authHeader } }
    });
    
    // Service client for inserting achievements
    const supabaseAdmin = createClient(supabaseUrl, supabaseServiceKey);

    const { data: { user }, error: userError } = await supabaseUser.auth.getUser();
    if (userError || !user) {
      throw new Error('Authentication failed');
    }

    const userId = user.id;
    const newAchievements: AchievementType[] = [];

    // Get existing achievements
    const { data: existingAchievements } = await supabaseAdmin
      .from('user_achievements')
      .select('achievement')
      .eq('user_id', userId);
    
    const existingSet = new Set(existingAchievements?.map(a => a.achievement) || []);

    // Get check-in stats (including weather data)
    const { data: checkIns } = await supabaseAdmin
      .from('check_ins')
      .select('activity_id, segment_id, checked_in_at, weather_code, temperature')
      .eq('user_id', userId);

    if (!checkIns || checkIns.length === 0) {
      return new Response(JSON.stringify({ newAchievements: [] }), {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' }
      });
    }

    // Count unique activities (runs)
    const uniqueActivities = new Set(checkIns.map(c => c.activity_id));
    const runCount = uniqueActivities.size;
    
    // Count unique segments
    const uniqueSegments = new Set(checkIns.map(c => c.segment_id));

    // Check run milestones
    if (runCount >= 1 && !existingSet.has('first_run')) {
      newAchievements.push('first_run');
    }
    if (runCount >= 5 && !existingSet.has('runs_5')) {
      newAchievements.push('runs_5');
    }
    if (runCount >= 10 && !existingSet.has('runs_10')) {
      newAchievements.push('runs_10');
    }
    if (runCount >= 25 && !existingSet.has('runs_25')) {
      newAchievements.push('runs_25');
    }
    if (runCount >= 50 && !existingSet.has('runs_50')) {
      newAchievements.push('runs_50');
    }
    if (runCount >= 100 && !existingSet.has('runs_100')) {
      newAchievements.push('runs_100');
    }

    // Check early bird / night owl
    checkIns.forEach(checkIn => {
      const hour = new Date(checkIn.checked_in_at).getHours();
      if (hour < 7 && !existingSet.has('early_bird') && !newAchievements.includes('early_bird')) {
        newAchievements.push('early_bird');
      }
      if (hour >= 20 && !existingSet.has('night_owl') && !newAchievements.includes('night_owl')) {
        newAchievements.push('night_owl');
      }
    });

    // Check streak (simplified - count consecutive weeks)
    const getWeekNumber = (date: Date): string => {
      const d = new Date(Date.UTC(date.getFullYear(), date.getMonth(), date.getDate()));
      d.setUTCDate(d.getUTCDate() + 4 - (d.getUTCDay() || 7));
      const yearStart = new Date(Date.UTC(d.getUTCFullYear(), 0, 1));
      const weekNo = Math.ceil((((d.getTime() - yearStart.getTime()) / 86400000) + 1) / 7);
      return `${d.getUTCFullYear()}-W${weekNo}`;
    };

    const weeksWithActivity = new Set<string>();
    checkIns.forEach(checkIn => {
      weeksWithActivity.add(getWeekNumber(new Date(checkIn.checked_in_at)));
    });

    // Calculate current streak
    const now = new Date();
    let streak = 0;
    let weekDate = new Date(now);
    
    while (true) {
      const week = getWeekNumber(weekDate);
      if (weeksWithActivity.has(week)) {
        streak++;
        weekDate.setDate(weekDate.getDate() - 7);
      } else {
        break;
      }
    }

    if (streak >= 2 && !existingSet.has('streak_2')) {
      newAchievements.push('streak_2');
    }
    if (streak >= 4 && !existingSet.has('streak_4')) {
      newAchievements.push('streak_4');
    }
    if (streak >= 8 && !existingSet.has('streak_8')) {
      newAchievements.push('streak_8');
    }

    // Check all segments (need to know total segment count)
    const { count: totalSegments } = await supabaseAdmin
      .from('uetliberg_segments')
      .select('*', { count: 'exact', head: true });

    if (totalSegments && uniqueSegments.size >= totalSegments && !existingSet.has('all_segments')) {
      newAchievements.push('all_segments');
    }

    // Check Top 10 Leaderboard achievement
    const { data: leaderboardData } = await supabaseAdmin
      .from('leaderboard_stats')
      .select('user_id, total_runs')
      .order('total_runs', { ascending: false })
      .limit(10);

    if (leaderboardData) {
      const top10UserIds = leaderboardData.map(entry => entry.user_id);
      
      if (top10UserIds.includes(userId) && !existingSet.has('pioneer_10')) {
        newAchievements.push('pioneer_10');
      } else if (!top10UserIds.includes(userId) && existingSet.has('pioneer_10')) {
        // Remove achievement if user is no longer in Top 10
        await supabaseAdmin
          .from('user_achievements')
          .delete()
          .eq('user_id', userId)
          .eq('achievement', 'pioneer_10');
        console.log(`Top 10 achievement removed from user ${userId}`);
      }
    }

    // Check Denzlerweg King - competitive achievement
    // Get the user with most runs on Denzlerweg
    const { data: denzlerwegLeader } = await supabaseAdmin
      .from('check_ins')
      .select('user_id')
      .eq('segment_id', DENZLERWEG_SEGMENT_ID);

    if (denzlerwegLeader && denzlerwegLeader.length > 0) {
      // Count runs per user
      const runsByUser: Record<string, number> = {};
      denzlerwegLeader.forEach(run => {
        runsByUser[run.user_id] = (runsByUser[run.user_id] || 0) + 1;
      });

      // Find the user with most runs
      let maxRuns = 0;
      let leaderId: string | null = null;
      Object.entries(runsByUser).forEach(([uid, count]) => {
        if (count > maxRuns) {
          maxRuns = count;
          leaderId = uid;
        }
      });

      // If current user is the leader and has at least 1 run
      if (leaderId === userId && maxRuns >= 1) {
        if (!existingSet.has('denzlerweg_king')) {
          newAchievements.push('denzlerweg_king');
        }
      } else if (existingSet.has('denzlerweg_king') && leaderId !== userId) {
        // Remove achievement if user is no longer the leader
        await supabaseAdmin
          .from('user_achievements')
          .delete()
          .eq('user_id', userId)
          .eq('achievement', 'denzlerweg_king');
        console.log(`Denzlerweg King achievement removed from user ${userId}, new leader is ${leaderId}`);
      }
    }

    // Check Coiffeur achievement - 10 runs per year on specific segments
    if (!existingSet.has('coiffeur')) {
      const currentYear = new Date().getFullYear();
      const coiffeurRuns = checkIns.filter(c => {
        const checkInYear = new Date(c.checked_in_at).getFullYear();
        return checkInYear === currentYear && COIFFEUR_SEGMENT_IDS.includes(c.segment_id);
      });
      
      // Count unique activities on coiffeur segments this year
      const uniqueCoiffeurActivities = new Set(coiffeurRuns.map(c => c.activity_id));
      if (uniqueCoiffeurActivities.size >= 10) {
        newAchievements.push('coiffeur');
      }
    }

    // Check weather-based achievements
    // Snow-Bunny: 3 runs in snow conditions (WMO codes 71-77, 85-86)
    const snowRuns = checkIns.filter(c => 
      c.weather_code !== null && SNOW_CODES.includes(c.weather_code)
    );
    const uniqueSnowActivities = new Set(snowRuns.map(c => c.activity_id));
    if (uniqueSnowActivities.size >= 3 && !existingSet.has('snow_bunny')) {
      newAchievements.push('snow_bunny');
    }

    // Frosty: 5 runs below 0°C
    const frostRuns = checkIns.filter(c => 
      c.temperature !== null && c.temperature < 0
    );
    const uniqueFrostActivities = new Set(frostRuns.map(c => c.activity_id));
    if (uniqueFrostActivities.size >= 5 && !existingSet.has('frosty')) {
      newAchievements.push('frosty');
    }

    // Insert new achievements
    if (newAchievements.length > 0) {
      const achievementsToInsert = newAchievements.map(achievement => ({
        user_id: userId,
        achievement,
      }));

      const { error: insertError } = await supabaseAdmin
        .from('user_achievements')
        .insert(achievementsToInsert);

      if (insertError) {
        console.error('Error inserting achievements:', insertError);
      }
    }

    return new Response(JSON.stringify({ 
      newAchievements,
      stats: {
        runCount,
        uniqueSegments: uniqueSegments.size,
        streak,
      }
    }), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' }
    });

  } catch (error) {
    console.error('Error checking achievements:', error);
    const message = error instanceof Error ? error.message : 'Unknown error';
    return new Response(JSON.stringify({ error: message }), {
      status: 500,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' }
    });
  }
});