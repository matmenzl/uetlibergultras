import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.84.0";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const supabaseUrl = Deno.env.get('SUPABASE_URL')!;
    const supabaseServiceKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;
    const supabase = createClient(supabaseUrl, supabaseServiceKey);

    const requestBody = await req.json().catch(() => ({}));
    const type = requestBody.type || 'most-efforts-overall';
    const segment_id = requestBody.segment_id;
    
    console.log(`Fetching leaderboard for type: ${type}`, segment_id ? `for segment: ${segment_id}` : '');

    interface LeaderboardEntry {
      id: string;
      rank: number;
      firstName: string;
      lastName: string;
      profilePicture?: string;
      totalEfforts: number;
      uniqueSegments: number;
      lastActivity: string | null;
    }

    let leaderboardData: LeaderboardEntry[] = [];

    if (type === 'most-efforts-overall') {
      // Gesamtzahl aller Efforts pro User
      const { data, error } = await supabase
        .from('segment_efforts')
        .select(`
          user_id,
          profiles!inner(first_name, last_name, profile_picture)
        `);

      if (error) {
        console.error('Error fetching efforts:', error);
        throw error;
      }

      // Aggregiere die Daten manuell
      const userMap = new Map();
      data.forEach((effort: any) => {
        const userId = effort.user_id;
        if (!userMap.has(userId)) {
          userMap.set(userId, {
            userId,
            firstName: effort.profiles.first_name,
            lastName: effort.profiles.last_name,
            profilePicture: effort.profiles.profile_picture,
            totalEfforts: 0,
            segmentIds: new Set(),
            lastActivity: null,
          });
        }
        const user = userMap.get(userId);
        user.totalEfforts += 1;
      });

      // Hole unique segments und last activity separat
      for (const [userId, user] of userMap.entries()) {
        const { data: segmentData } = await supabase
          .from('segment_efforts')
          .select('segment_id, start_date')
          .eq('user_id', userId)
          .order('start_date', { ascending: false });

        if (segmentData && segmentData.length > 0) {
          user.uniqueSegments = new Set(segmentData.map((e: any) => e.segment_id)).size;
          user.lastActivity = segmentData[0].start_date;
        }
      }

      leaderboardData = Array.from(userMap.values())
        .sort((a, b) => b.totalEfforts - a.totalEfforts)
        .slice(0, 10)
        .map((user, index) => ({
          id: user.userId,
          rank: index + 1,
          firstName: user.firstName,
          lastName: user.lastName,
          profilePicture: user.profilePicture,
          totalEfforts: user.totalEfforts,
          uniqueSegments: user.uniqueSegments,
          lastActivity: user.lastActivity,
        }));

    } else if (type === 'most-efforts-monthly') {
      // Efforts im aktuellen Monat
      const now = new Date();
      const firstDayOfMonth = new Date(now.getFullYear(), now.getMonth(), 1).toISOString();

      const { data, error } = await supabase
        .from('segment_efforts')
        .select(`
          user_id,
          start_date,
          profiles!inner(first_name, last_name, profile_picture)
        `)
        .gte('start_date', firstDayOfMonth);

      if (error) {
        console.error('Error fetching monthly efforts:', error);
        throw error;
      }

      const userMap = new Map();
      data.forEach((effort: any) => {
        const userId = effort.user_id;
        if (!userMap.has(userId)) {
          userMap.set(userId, {
            userId,
            firstName: effort.profiles.first_name,
            lastName: effort.profiles.last_name,
            profilePicture: effort.profiles.profile_picture,
            totalEfforts: 0,
            segmentIds: new Set(),
            lastActivity: null,
          });
        }
        const user = userMap.get(userId);
        user.totalEfforts += 1;
        if (!user.lastActivity || effort.start_date > user.lastActivity) {
          user.lastActivity = effort.start_date;
        }
      });

      // Hole unique segments für diesen Monat
      for (const [userId, user] of userMap.entries()) {
        const { data: segmentData } = await supabase
          .from('segment_efforts')
          .select('segment_id')
          .eq('user_id', userId)
          .gte('start_date', firstDayOfMonth);

        if (segmentData) {
          user.uniqueSegments = new Set(segmentData.map((e: any) => e.segment_id)).size;
        }
      }

      leaderboardData = Array.from(userMap.values())
        .sort((a, b) => b.totalEfforts - a.totalEfforts)
        .slice(0, 10)
        .map((user, index) => ({
          id: user.userId,
          rank: index + 1,
          firstName: user.firstName,
          lastName: user.lastName,
          profilePicture: user.profilePicture,
          totalEfforts: user.totalEfforts,
          uniqueSegments: user.uniqueSegments,
          lastActivity: user.lastActivity,
        }));

    } else if (type === 'most-efforts-segment') {
      // Meiste Efforts für ein spezifisches Segment
      if (!segment_id) {
        throw new Error('segment_id is required for most-efforts-segment type');
      }

      const { data, error } = await supabase
        .from('segment_efforts')
        .select(`
          user_id,
          profiles!inner(first_name, last_name, profile_picture)
        `)
        .eq('segment_id', segment_id);

      if (error) {
        console.error('Error fetching segment efforts:', error);
        throw error;
      }

      const userMap = new Map();
      data.forEach((effort: any) => {
        const userId = effort.user_id;
        if (!userMap.has(userId)) {
          userMap.set(userId, {
            userId,
            firstName: effort.profiles.first_name,
            lastName: effort.profiles.last_name,
            profilePicture: effort.profiles.profile_picture,
            totalEfforts: 0,
            lastActivity: null,
          });
        }
        const user = userMap.get(userId);
        user.totalEfforts += 1;
      });

      // Hole last activity separat
      for (const [userId, user] of userMap.entries()) {
        const { data: activityData } = await supabase
          .from('segment_efforts')
          .select('start_date')
          .eq('user_id', userId)
          .eq('segment_id', segment_id)
          .order('start_date', { ascending: false })
          .limit(1)
          .maybeSingle();

        if (activityData) {
          user.lastActivity = activityData.start_date;
        }
      }

      leaderboardData = Array.from(userMap.values())
        .sort((a, b) => b.totalEfforts - a.totalEfforts)
        .slice(0, 10)
        .map((user, index) => ({
          id: user.userId,
          rank: index + 1,
          firstName: user.firstName,
          lastName: user.lastName,
          profilePicture: user.profilePicture,
          totalEfforts: user.totalEfforts,
          uniqueSegments: 1, // Not relevant for segment-specific view
          lastActivity: user.lastActivity,
        }));

    } else if (type === 'most-unique-segments') {
      // Meiste verschiedene Segmente
      const { data, error } = await supabase
        .from('segment_efforts')
        .select(`
          user_id,
          segment_id,
          start_date,
          profiles!inner(first_name, last_name, profile_picture)
        `);

      if (error) {
        console.error('Error fetching segments:', error);
        throw error;
      }

      const userMap = new Map();
      data.forEach((effort: any) => {
        const userId = effort.user_id;
        if (!userMap.has(userId)) {
          userMap.set(userId, {
            userId,
            firstName: effort.profiles.first_name,
            lastName: effort.profiles.last_name,
            profilePicture: effort.profiles.profile_picture,
            totalEfforts: 0,
            segmentIds: new Set(),
            lastActivity: null,
          });
        }
        const user = userMap.get(userId);
        user.totalEfforts += 1;
        user.segmentIds.add(effort.segment_id);
        if (!user.lastActivity || effort.start_date > user.lastActivity) {
          user.lastActivity = effort.start_date;
        }
      });

      leaderboardData = Array.from(userMap.values())
        .map(user => ({
          id: user.userId,
          firstName: user.firstName,
          lastName: user.lastName,
          profilePicture: user.profilePicture,
          totalEfforts: user.totalEfforts,
          uniqueSegments: user.segmentIds.size,
          lastActivity: user.lastActivity,
        }))
        .sort((a, b) => b.uniqueSegments - a.uniqueSegments)
        .slice(0, 10)
        .map((user, index) => ({
          ...user,
          rank: index + 1,
        }));
    }

    console.log(`Found ${leaderboardData.length} entries for leaderboard type: ${type}`);

    return new Response(
      JSON.stringify({ entries: leaderboardData }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );

  } catch (error) {
    console.error('Error in get-activity-leaderboards:', error);
    const errorMessage = error instanceof Error ? error.message : 'Unknown error occurred';
    return new Response(
      JSON.stringify({ error: errorMessage }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  }
});
