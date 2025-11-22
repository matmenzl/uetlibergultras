import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.84.0";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

// Uetliberg Segment IDs (same as in strava-uetliberg-segments)
const UETLIBERG_SEGMENT_IDS = [
  649151, 644430, 678943, 29634173, 2445567, 640791, 5185133,
  5191879, 7419938, 640795, 1835936, 644304, 29634046, 1815632,
  640796, 29633981, 849617, 652213, 36353577, 640792, 632456,
  36248088, 7188526, 652203, 640810
];

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

    console.log(`Fetching hybrid leaderboard for type: ${type}`);

    interface HybridEntry {
      name: string;
      profilePicture?: string;
      totalEfforts: number;
      uniqueSegments: number;
      lastActivity: string | null;
      isAppUser: boolean;
      stravaId?: number;
    }

    let hybridData: Map<string, HybridEntry> = new Map();

    // Step 1: Get all app users data from database
    const { data: appUsersData, error: dbError } = await supabase
      .from('segment_efforts')
      .select(`
        user_id,
        segment_id,
        start_date,
        profiles!inner(first_name, last_name, profile_picture, strava_id)
      `);

    if (dbError) {
      console.error('Error fetching app users data:', dbError);
      throw dbError;
    }

    // Aggregate app users data
    const appUserMap = new Map();
    (appUsersData || []).forEach((effort: any) => {
      const userId = effort.user_id;
      const name = `${effort.profiles.first_name || ''} ${effort.profiles.last_name || ''}`.trim();
      
      if (!appUserMap.has(userId)) {
        appUserMap.set(userId, {
          name,
          profilePicture: effort.profiles.profile_picture,
          totalEfforts: 0,
          uniqueSegments: new Set(),
          lastActivity: null,
          isAppUser: true,
          stravaId: effort.profiles.strava_id,
        });
      }

      const user = appUserMap.get(userId);
      user.totalEfforts += 1;
      user.uniqueSegments.add(effort.segment_id);
      
      if (!user.lastActivity || effort.start_date > user.lastActivity) {
        user.lastActivity = effort.start_date;
      }
    });

    // Convert Sets to counts
    appUserMap.forEach((user, userId) => {
      user.uniqueSegments = user.uniqueSegments.size;
      hybridData.set(userId, user);
    });

    console.log(`Found ${hybridData.size} app users`);

    // Step 2: Get Strava access token
    const clientId = Deno.env.get('STRAVA_CLIENT_ID');
    const clientSecret = Deno.env.get('STRAVA_CLIENT_SECRET');
    const refreshToken = Deno.env.get('STRAVA_REFRESH_TOKEN');

    if (!clientId || !clientSecret || !refreshToken) {
      console.log('Strava credentials not configured, showing only app users');
    } else {
      // Get access token
      const tokenResponse = await fetch('https://www.strava.com/oauth/token', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          client_id: parseInt(clientId, 10),
          client_secret: clientSecret,
          refresh_token: refreshToken,
          grant_type: 'refresh_token',
        }),
      });

      if (tokenResponse.ok) {
        const tokenData = await tokenResponse.json();
        const accessToken = tokenData.access_token;

        console.log('Fetching Strava leaderboards for top Uetliberg segments...');

        // Step 3: Get top 5 most popular segments by effort count
        const topSegments = UETLIBERG_SEGMENT_IDS.slice(0, 5); // First 5 are most popular

        // Fetch leaderboards for all Uetliberg segments
        const stravaAthletes = new Map<number, {
          name: string;
          profilePicture?: string;
          segmentEfforts: Map<number, number>; // segment_id -> effort count
        }>();

        // Fetch leaderboards with better rate limiting
        for (const segmentId of topSegments) {
          try {
            // Wait 500ms between requests to respect rate limits
            await new Promise(resolve => setTimeout(resolve, 500));
            
            const leaderboardResponse = await fetch(
              `https://www.strava.com/api/v3/segments/${segmentId}/leaderboard?per_page=50`,
              {
                headers: { 'Authorization': `Bearer ${accessToken}` },
              }
            );

            if (!leaderboardResponse.ok) {
              const errorText = await leaderboardResponse.text();
              console.log(`Failed to fetch leaderboard for segment ${segmentId}: ${leaderboardResponse.status} - ${errorText}`);
              continue;
            }

            const leaderboardData = await leaderboardResponse.json();
            console.log(`Segment ${segmentId}: Found ${leaderboardData.entries?.length || 0} entries`);
            
            (leaderboardData.entries || []).forEach((entry: any) => {
              const athleteId = entry.athlete_id;
              const athleteName = entry.athlete_name;
              
              // Skip if this is an app user (we already have their data)
              const isAppUser = Array.from(hybridData.values()).some(
                u => u.stravaId === athleteId
              );
              
              if (!isAppUser) {
                if (!stravaAthletes.has(athleteId)) {
                  stravaAthletes.set(athleteId, {
                    name: athleteName,
                    segmentEfforts: new Map(),
                  });
                }

                const athlete = stravaAthletes.get(athleteId)!;
                athlete.segmentEfforts.set(segmentId, entry.effort_count || 1);
              }
            });
          } catch (error) {
            console.error(`Error fetching segment ${segmentId}:`, error);
          }
        }

        console.log(`Found ${stravaAthletes.size} external Strava athletes`);

        // Add Strava athletes to hybrid data
        stravaAthletes.forEach((athlete, athleteId) => {
          const totalEfforts = Array.from(athlete.segmentEfforts.values()).reduce((a, b) => a + b, 0);
          const uniqueSegments = athlete.segmentEfforts.size;

          hybridData.set(`strava-${athleteId}`, {
            name: athlete.name,
            profilePicture: athlete.profilePicture,
            totalEfforts,
            uniqueSegments,
            lastActivity: null,
            isAppUser: false,
            stravaId: athleteId,
          });
        });
      } else {
        console.log('Failed to get Strava access token');
      }
    }

    // Step 4: Sort and format results
    let sortedEntries = Array.from(hybridData.values());

    if (type === 'most-efforts-overall') {
      sortedEntries.sort((a, b) => b.totalEfforts - a.totalEfforts);
    } else if (type === 'most-unique-segments') {
      sortedEntries.sort((a, b) => b.uniqueSegments - a.uniqueSegments);
    }

    // Take top 20
    sortedEntries = sortedEntries.slice(0, 20);

    const leaderboardData = sortedEntries.map((entry, index) => ({
      id: entry.stravaId?.toString() || entry.name,
      rank: index + 1,
      firstName: entry.name.split(' ')[0] || entry.name,
      lastName: entry.name.split(' ').slice(1).join(' ') || '',
      profilePicture: entry.profilePicture,
      totalEfforts: entry.totalEfforts,
      uniqueSegments: entry.uniqueSegments,
      lastActivity: entry.lastActivity,
      isAppUser: entry.isAppUser,
    }));

    console.log(`Returning ${leaderboardData.length} hybrid entries`);

    return new Response(
      JSON.stringify({ entries: leaderboardData }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );

  } catch (error) {
    console.error('Error in get-hybrid-leaderboard:', error);
    const errorMessage = error instanceof Error ? error.message : 'Unknown error occurred';
    return new Response(
      JSON.stringify({ error: errorMessage }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  }
});
