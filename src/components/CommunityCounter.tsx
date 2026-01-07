import { useQuery, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { Card } from "@/components/ui/card";
import { Users, Mountain } from "lucide-react";
import { useEffect, useState } from "react";

export const CommunityCounter = () => {
  const [displayCount, setDisplayCount] = useState(0);
  const queryClient = useQueryClient();

  const { data: stats } = useQuery({
    queryKey: ["community-stats"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("community_stats")
        .select("total_runs, total_runners")
        .single();

      if (error) throw error;

      return {
        totalRuns: data?.total_runs ?? 0,
        totalRunners: data?.total_runners ?? 0,
      };
    },
  });

  // Realtime subscription for live updates
  useEffect(() => {
    const channel = supabase
      .channel("community-counter")
      .on(
        "postgres_changes",
        {
          event: "INSERT",
          schema: "public",
          table: "check_ins",
        },
        () => {
          queryClient.invalidateQueries({ queryKey: ["community-stats"] });
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [queryClient]);

  // Animated counter effect
  useEffect(() => {
    if (!stats?.totalRuns) return;

    const target = stats.totalRuns;
    const duration = 1000;
    const steps = 30;
    const increment = target / steps;
    let current = 0;

    const timer = setInterval(() => {
      current += increment;
      if (current >= target) {
        setDisplayCount(target);
        clearInterval(timer);
      } else {
        setDisplayCount(Math.floor(current));
      }
    }, duration / steps);

    return () => clearInterval(timer);
  }, [stats?.totalRuns]);

  return (
    <Card className="p-5 text-center bg-gradient-to-br from-amber-500/10 to-orange-500/10 border-amber-500/20">
      <div className="flex items-center justify-center gap-2 mb-2">
        <Mountain className="w-5 h-5 text-amber-600" />
        <Users className="w-5 h-5 text-amber-600" />
      </div>
      <p className="text-3xl font-bold text-amber-600">{displayCount}</p>
      <p className="text-sm text-muted-foreground">Community Runs</p>
      {stats?.totalRunners && stats.totalRunners > 0 && (
        <p className="text-xs text-muted-foreground mt-1">
          von {stats.totalRunners} {stats.totalRunners === 1 ? "Läufer" : "Läufern"}
        </p>
      )}
    </Card>
  );
};
