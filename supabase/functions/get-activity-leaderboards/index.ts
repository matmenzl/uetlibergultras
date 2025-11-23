import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.84.0";
import { checkRateLimit, getClientIdentifier } from '../_shared/rateLimit.ts';
import { validateRequest, ActivityLeaderboardSchema } from '../_shared/validation.ts';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

// Simple in-memory cache
const cache = new Map<string, { data: any; expiresAt: number }>();
const CACHE_TTL = 2 * 60 * 1000; // 2 minutes

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    // Rate limiting - 30 requests per minute per IP
    const rateLimitClientId = getClientIdentifier(req);
    const rateCheck = await checkRateLimit(rateLimitClientId, {
      requests: 30,
      windowMs: 60000
    });
    
    if (!rateCheck.allowed) {
      return new Response(
        JSON.stringify({ error: 'Rate limit exceeded. Please try again later.' }),
        { 
          status: 429, 
          headers: {
            ...corsHeaders,
            'Retry-After': '60',
            'X-RateLimit-Remaining': '0'
          } 
        }
      );
    }

    // Input validation
    const requestBody = await req.json().catch(() => ({}));
    const validation = validateRequest(ActivityLeaderboardSchema, requestBody);
    
    if (!validation.success) {
      return new Response(
        JSON.stringify({ error: validation.error }),
        { status: 400, headers: corsHeaders }
      );
    }
    
    const { type, segment_id } = validation.data;
    
    // Check cache
    const cacheKey = `leaderboard_${type}_${segment_id || 'all'}`;
    const cached = cache.get(cacheKey);
    
    if (cached && Date.now() < cached.expiresAt) {
      console.log('Returning cached leaderboard data');
      return new Response(
        JSON.stringify(cached.data),
        { headers: { ...corsHeaders, 'Content-Type': 'application/json', 'X-Cache': 'HIT' } }
      );
    }

    
    const supabaseUrl = Deno.env.get('SUPABASE_URL')!;
    const supabaseServiceKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;
    const supabase = createClient(supabaseUrl, supabaseServiceKey);
    
    console.log(`Fetching leaderboard for type: ${type}`, segment_id ? `for segment: ${segment_id}` : '');

    interface LeaderboardEntry {
      id: string;
      rank: number;
      firstName: string;
      lastName: string;
      profilePicture?: string;
      totalActivities: number;
      uniqueSegments: number;
      lastActivity: string | null;
    }

    let leaderboardData: LeaderboardEntry[] = [];

    if (type === 'most-efforts-overall') {
      // Gesamtzahl aller Aktivitäten (Läufe) pro User
      const { data, error } = await supabase
        .from('segment_efforts')
        .select(`
          user_id,
          start_date,
          segment_id,
          profiles!inner(first_name, last_name, profile_picture)
        `);

      if (error) {
        console.error('Error fetching efforts:', error);
        throw error;
      }

      // Gruppiere nach User und zähle einzigartige Aktivitäten (start_date)
      const userMap = new Map();
      data.forEach((effort: any) => {
        const userId = effort.user_id;
        if (!userMap.has(userId)) {
          userMap.set(userId, {
            userId,
            firstName: effort.profiles.first_name,
            lastName: effort.profiles.last_name,
            profilePicture: effort.profiles.profile_picture,
            activityDates: new Set(), // Eindeutige Aktivitäten (nach Datum)
            segmentIds: new Set(),
            lastActivity: null,
          });
        }
        const user = userMap.get(userId);
        user.activityDates.add(effort.start_date);
        user.segmentIds.add(effort.segment_id);
        if (!user.lastActivity || effort.start_date > user.lastActivity) {
          user.lastActivity = effort.start_date;
        }
      });

      leaderboardData = Array.from(userMap.values())
        .sort((a, b) => b.activityDates.size - a.activityDates.size)
        .slice(0, 10)
        .map((user, index) => ({
          id: user.userId,
          rank: index + 1,
          firstName: user.firstName,
          lastName: user.lastName,
          profilePicture: user.profilePicture,
          totalActivities: user.activityDates.size,
          uniqueSegments: user.segmentIds.size,
          lastActivity: user.lastActivity,
        }));

    } else if (type === 'most-efforts-monthly') {
      // Aktivitäten im aktuellen Monat
      const now = new Date();
      const firstDayOfMonth = new Date(now.getFullYear(), now.getMonth(), 1).toISOString();

      const { data, error } = await supabase
        .from('segment_efforts')
        .select(`
          user_id,
          start_date,
          segment_id,
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
            activityDates: new Set(),
            segmentIds: new Set(),
            lastActivity: null,
          });
        }
        const user = userMap.get(userId);
        user.activityDates.add(effort.start_date);
        user.segmentIds.add(effort.segment_id);
        if (!user.lastActivity || effort.start_date > user.lastActivity) {
          user.lastActivity = effort.start_date;
        }
      });

      leaderboardData = Array.from(userMap.values())
        .sort((a, b) => b.activityDates.size - a.activityDates.size)
        .slice(0, 10)
        .map((user, index) => ({
          id: user.userId,
          rank: index + 1,
          firstName: user.firstName,
          lastName: user.lastName,
          profilePicture: user.profilePicture,
          totalActivities: user.activityDates.size,
          uniqueSegments: user.segmentIds.size,
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
          totalActivities: user.totalEfforts,
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
          totalActivities: user.totalEfforts,
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

    // Cache the response
    cache.set(cacheKey, {
      data: { entries: leaderboardData },
      expiresAt: Date.now() + CACHE_TTL
    });

    return new Response(
      JSON.stringify({ entries: leaderboardData }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json', 'X-Cache': 'MISS' } }
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
