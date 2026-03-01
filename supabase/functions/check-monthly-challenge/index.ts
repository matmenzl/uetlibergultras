import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers":
    "authorization, x-client-info, apikey, content-type",
};

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const supabase = createClient(
      Deno.env.get("SUPABASE_URL")!,
      Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!
    );

    // Parse parameters - default to previous month
    const now = new Date();
    let { year, month } = await req.json().catch(() => ({}));

    if (!year || !month) {
      // Default: previous month
      const prevMonth = new Date(now.getFullYear(), now.getMonth() - 1, 1);
      year = prevMonth.getFullYear();
      month = prevMonth.getMonth() + 1;
    }

    // Check if winners already exist for this month
    const { data: existing } = await supabase
      .from("monthly_challenge_winners")
      .select("id")
      .eq("year", year)
      .eq("month", month)
      .limit(1);

    if (existing && existing.length > 0) {
      return new Response(
        JSON.stringify({
          message: `Winners for ${year}-${month} already evaluated`,
          already_exists: true,
        }),
        { headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    // Don't evaluate current or future months
    const evaluationDate = new Date(year, month - 1, 1);
    const currentMonthStart = new Date(now.getFullYear(), now.getMonth(), 1);
    if (evaluationDate >= currentMonthStart) {
      return new Response(
        JSON.stringify({
          message: `Cannot evaluate current or future month ${year}-${month}`,
          skipped: true,
        }),
        { headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    // Calculate start/end of the month
    const startDate = new Date(year, month - 1, 1).toISOString();
    const endDate = new Date(year, month, 1).toISOString();

    // Get all check-ins for the month, counting distinct activities per user
    const { data: checkIns, error: checkInsError } = await supabase
      .from("check_ins")
      .select("user_id, activity_id, segment_id")
      .gte("checked_in_at", startDate)
      .lt("checked_in_at", endDate);

    if (checkInsError) throw checkInsError;

    if (!checkIns || checkIns.length === 0) {
      return new Response(
        JSON.stringify({
          message: `No check-ins found for ${year}-${month}`,
          winners: [],
        }),
        { headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    // Count distinct activities and unique segments per user
    const userStats = new Map<
      string,
      { activities: Set<number>; segments: Set<number> }
    >();

    for (const ci of checkIns) {
      if (!userStats.has(ci.user_id)) {
        userStats.set(ci.user_id, {
          activities: new Set(),
          segments: new Set(),
        });
      }
      const stats = userStats.get(ci.user_id)!;
      stats.activities.add(ci.activity_id);
      if (ci.segment_id !== 0) {
        stats.segments.add(ci.segment_id);
      }
    }

    // Sort: primary by activity count desc, secondary by unique segments desc
    const ranked = Array.from(userStats.entries())
      .map(([user_id, stats]) => ({
        user_id,
        total_runs: stats.activities.size,
        unique_segments: stats.segments.size,
      }))
      .sort((a, b) => {
        if (b.total_runs !== a.total_runs) return b.total_runs - a.total_runs;
        return b.unique_segments - a.unique_segments;
      });

    // Take top 3
    const winners = ranked.slice(0, 3).map((entry, index) => ({
      user_id: entry.user_id,
      year,
      month,
      rank: index + 1,
      total_runs: entry.total_runs,
    }));

    if (winners.length > 0) {
      const { error: insertError } = await supabase
        .from("monthly_challenge_winners")
        .insert(winners);

      if (insertError) throw insertError;

      // Also award achievement badges (monthly_gold, monthly_silver, monthly_bronze)
      const rankToAchievement: Record<number, string> = {
        1: "monthly_gold",
        2: "monthly_silver",
        3: "monthly_bronze",
      };

      for (const winner of winners) {
        const achievement = rankToAchievement[winner.rank];
        if (!achievement) continue;

        // Check if user already has this achievement type
        const { data: existingAchievement } = await supabase
          .from("user_achievements")
          .select("id")
          .eq("user_id", winner.user_id)
          .eq("achievement", achievement)
          .limit(1);

        if (!existingAchievement || existingAchievement.length === 0) {
          await supabase.from("user_achievements").insert({
            user_id: winner.user_id,
            achievement,
          });
        }
      }
    }

    return new Response(
      JSON.stringify({
        message: `Evaluated ${year}-${month}`,
        winners,
      }),
      { headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  } catch (error) {
    console.error("Error:", error);
    return new Response(
      JSON.stringify({ error: error instanceof Error ? error.message : 'Unknown error' }),
      {
        status: 500,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      }
    );
  }
});
