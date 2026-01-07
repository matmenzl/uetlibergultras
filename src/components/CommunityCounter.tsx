import { useQuery, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { Card } from "@/components/ui/card";
import { Users, Mountain, Route } from "lucide-react";
import { useEffect, useState } from "react";

export const CommunityCounter = () => {
  const [displayCount, setDisplayCount] = useState(0);
  const [displayDistance, setDisplayDistance] = useState(0);
  const queryClient = useQueryClient();

  const { data: stats } = useQuery({
    queryKey: ["community-stats"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("community_stats")
        .select("total_runs, total_runners, total_distance_km")
        .single();

      if (error) throw error;

      return {
        totalRuns: data?.total_runs ?? 0,
        totalRunners: data?.total_runners ?? 0,
        totalDistanceKm: Number(data?.total_distance_km ?? 0),
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

  // Animated counter effect for runs
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

  // Animated counter effect for distance
  useEffect(() => {
    if (!stats?.totalDistanceKm) return;

    const target = stats.totalDistanceKm;
    const duration = 1000;
    const steps = 30;
    const increment = target / steps;
    let current = 0;

    const timer = setInterval(() => {
      current += increment;
      if (current >= target) {
        setDisplayDistance(target);
        clearInterval(timer);
      } else {
        setDisplayDistance(current);
      }
    }, duration / steps);

    return () => clearInterval(timer);
  }, [stats?.totalDistanceKm]);

  return (
    <Card className="p-5 text-center bg-gradient-to-br from-amber-500/10 to-orange-500/10 border-amber-500/20">
      <div className="flex items-center justify-center gap-2 mb-2">
        <Mountain className="w-5 h-5 text-amber-600" />
        <Users className="w-5 h-5 text-amber-600" />
      </div>
      <p className="text-3xl font-bold text-amber-600">{displayCount}</p>
      <p className="text-sm text-muted-foreground">Community Runs</p>
      
      {displayDistance > 0 && (
        <div className="mt-3 pt-3 border-t border-amber-500/20">
          <div className="flex items-center justify-center gap-1 mb-1">
            <Route className="w-4 h-4 text-amber-600" />
          </div>
          <p className="text-2xl font-bold text-amber-600">
            {displayDistance.toFixed(1)} km
          </p>
          <p className="text-xs text-muted-foreground">Gesamtdistanz</p>
        </div>
      )}
      
      {stats?.totalRunners && stats.totalRunners > 0 && (
        <p className="text-xs text-muted-foreground mt-2">
          von {stats.totalRunners} {stats.totalRunners === 1 ? "Läufer" : "Läufern"}
        </p>
      )}
    </Card>
  );
};
