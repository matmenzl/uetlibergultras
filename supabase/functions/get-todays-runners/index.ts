import { serve } from 'https://deno.land/std@0.168.0/http/server.ts';
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.7.1';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

// Rate limiting configuration
const RATE_LIMIT = {
  delayBetweenRequests: 300, // ms between segment requests
  maxSegmentsToFetch: 20, // Limit segments to avoid rate limits
};

interface LeaderboardEntry {
  athlete_name: string;
  athlete_photo: string | null;
  elapsed_time: number;
  rank: number;
  segment_id: number;
  segment_name: string;
}

interface AggregatedRunner {
  athlete_name: string;
  athlete_photo: string | null;
  segments: { segment_id: number; segment_name: string; elapsed_time: number; rank: number }[];
  best_time: number;
  total_segments: number;
}

serve(async (req) => {
  // Handle CORS preflight requests
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    // Parse optional date_range parameter (default: today)
    const body = await req.json().catch(() => ({}));
    const dateRange = body.date_range || 'today'; // today, this_week, this_month, this_year
    
    console.log(`Fetching runners for date_range: ${dateRange}`);

    // Get and validate Authorization header
    const authHeader = req.headers.get('Authorization');
    if (!authHeader) {
      console.error('No Authorization header provided');
      return new Response(
        JSON.stringify({ error: 'No authorization header' }),
        { status: 401, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    const token = authHeader.replace('Bearer ', '');

    // Create Supabase admin client
    const supabaseAdmin = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? ''
    );

    // Verify JWT and get user
    const { data: { user }, error: userError } = await supabaseAdmin.auth.getUser(token);

    if (userError || !user) {
      console.error('Auth error:', userError);
      return new Response(
        JSON.stringify({ error: 'Unauthorized - invalid token' }),
        { status: 401, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    console.log('Fetching today\'s runners for user:', user.id);

    // Get Strava credentials
    const { data: credentials, error: credsError } = await supabaseAdmin.rpc(
      'get_strava_credentials',
      { _user_id: user.id }
    );

    if (credsError || !credentials || credentials.length === 0) {
      console.error('Failed to get credentials:', credsError);
      return new Response(
        JSON.stringify({ error: 'No Strava credentials found' }),
        { status: 404, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    const creds = credentials[0];
    let accessToken = creds.strava_access_token;
    const refreshToken = creds.strava_refresh_token;
    const expiresAt = new Date(creds.strava_token_expires_at);

    // Check if token is expired and refresh if needed
    if (expiresAt <= new Date()) {
      console.log('Token expired, refreshing...');
      const clientId = Deno.env.get('STRAVA_CLIENT_ID');
      const clientSecret = Deno.env.get('STRAVA_CLIENT_SECRET');

      const refreshResponse = await fetch('https://www.strava.com/oauth/token', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          client_id: clientId,
          client_secret: clientSecret,
          refresh_token: refreshToken,
          grant_type: 'refresh_token',
        }),
      });

      if (!refreshResponse.ok) {
        console.error('Failed to refresh token');
        return new Response(
          JSON.stringify({ error: 'Failed to refresh Strava token' }),
          { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
        );
      }

      const refreshData = await refreshResponse.json();
      accessToken = refreshData.access_token;

      // Update credentials in database
      const newExpiresAt = new Date(refreshData.expires_at * 1000);
      await supabaseAdmin.rpc('upsert_strava_credentials', {
        _user_id: user.id,
        _access_token: accessToken,
        _refresh_token: refreshData.refresh_token,
        _expires_at: newExpiresAt.toISOString(),
      });

      console.log('Token refreshed successfully');
    }

    // Get Uetliberg segments from database (prioritize high priority ones)
    const { data: uetlibergSegments, error: segmentsError } = await supabaseAdmin
      .from('uetliberg_segments')
      .select('segment_id, name, priority, ends_at_uetliberg')
      .order('priority', { ascending: true })
      .limit(RATE_LIMIT.maxSegmentsToFetch);

    if (segmentsError) {
      console.error('Failed to fetch segments:', segmentsError);
      return new Response(
        JSON.stringify({ error: 'Failed to fetch segments from database' }),
        { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    if (!uetlibergSegments || uetlibergSegments.length === 0) {
      console.log('No Uetliberg segments found');
      return new Response(
        JSON.stringify({ runners: [], message: 'No segments found' }),
        { status: 200, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    console.log(`Fetching leaderboards for ${uetlibergSegments.length} segments`);

    // Fetch leaderboard for each segment
    const allLeaderboardEntries: LeaderboardEntry[] = [];
    const errors: string[] = [];
    let fetchedCount = 0;

    for (const segment of uetlibergSegments) {
      try {
        // Add delay between requests to avoid rate limiting
        if (fetchedCount > 0) {
          await new Promise((resolve) => setTimeout(resolve, RATE_LIMIT.delayBetweenRequests));
        }

        const leaderboardUrl = `https://www.strava.com/api/v3/segments/${segment.segment_id}/leaderboard?date_range=${dateRange}&per_page=20`;
        console.log(`Fetching leaderboard for segment ${segment.segment_id}: ${segment.name}`);

        const leaderboardResponse = await fetch(leaderboardUrl, {
          headers: {
            Authorization: `Bearer ${accessToken}`,
          },
        });

        if (!leaderboardResponse.ok) {
          const errorText = await leaderboardResponse.text();
          console.error(`Leaderboard error for segment ${segment.segment_id}: ${leaderboardResponse.status} - ${errorText}`);
          
          // Handle rate limiting
          if (leaderboardResponse.status === 429) {
            console.log('Rate limit hit, stopping fetch');
            errors.push(`Rate limit reached after ${fetchedCount} segments`);
            break;
          }
          
          errors.push(`Segment ${segment.segment_id}: ${leaderboardResponse.status}`);
          continue;
        }

        const leaderboardData = await leaderboardResponse.json();
        const entries = leaderboardData.entries || [];

        console.log(`Found ${entries.length} entries for segment ${segment.name}`);

        for (const entry of entries) {
          allLeaderboardEntries.push({
            athlete_name: entry.athlete_name || 'Unknown Athlete',
            athlete_photo: entry.athlete_profile || null,
            elapsed_time: entry.elapsed_time,
            rank: entry.rank,
            segment_id: segment.segment_id,
            segment_name: segment.name,
          });
        }

        fetchedCount++;
      } catch (error) {
        console.error(`Error fetching leaderboard for segment ${segment.segment_id}:`, error);
        errors.push(`Segment ${segment.segment_id}: ${error instanceof Error ? error.message : 'Unknown error'}`);
      }
    }

    console.log(`Total leaderboard entries collected: ${allLeaderboardEntries.length}`);

    // Aggregate runners (deduplicate by athlete name)
    const runnersMap = new Map<string, AggregatedRunner>();

    for (const entry of allLeaderboardEntries) {
      const existing = runnersMap.get(entry.athlete_name);

      if (existing) {
        // Add segment to existing runner
        existing.segments.push({
          segment_id: entry.segment_id,
          segment_name: entry.segment_name,
          elapsed_time: entry.elapsed_time,
          rank: entry.rank,
        });
        existing.total_segments = existing.segments.length;
        // Update best time if this is faster
        if (entry.elapsed_time < existing.best_time) {
          existing.best_time = entry.elapsed_time;
        }
        // Use photo if not already set
        if (!existing.athlete_photo && entry.athlete_photo) {
          existing.athlete_photo = entry.athlete_photo;
        }
      } else {
        // Create new runner entry
        runnersMap.set(entry.athlete_name, {
          athlete_name: entry.athlete_name,
          athlete_photo: entry.athlete_photo,
          segments: [{
            segment_id: entry.segment_id,
            segment_name: entry.segment_name,
            elapsed_time: entry.elapsed_time,
            rank: entry.rank,
          }],
          best_time: entry.elapsed_time,
          total_segments: 1,
        });
      }
    }

    // Convert to array and sort by total segments (most active first), then by best time
    const runners = Array.from(runnersMap.values())
      .sort((a, b) => {
        if (b.total_segments !== a.total_segments) {
          return b.total_segments - a.total_segments;
        }
        return a.best_time - b.best_time;
      });

    console.log(`Aggregated to ${runners.length} unique runners`);

    return new Response(
      JSON.stringify({
        runners,
        date_range: dateRange,
        segments_fetched: fetchedCount,
        total_entries: allLeaderboardEntries.length,
        errors: errors.length > 0 ? errors : undefined,
      }),
      { status: 200, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  } catch (error) {
    console.error('Error:', error);
    const errorMessage = error instanceof Error ? error.message : 'Unknown error';
    return new Response(JSON.stringify({ error: errorMessage }), {
      status: 500,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  }
});
