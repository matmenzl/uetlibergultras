import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { Users, Mountain, Route } from "lucide-react";
import { useEffect, useState } from "react";

function AnimatedNumber({ target, decimals = 0, duration = 1200 }: { target: number; decimals?: number; duration?: number }) {
  const [display, setDisplay] = useState(0);

  useEffect(() => {
    if (!target) { setDisplay(0); return; }
    const steps = 40;
    const increment = target / steps;
    let current = 0;
    const timer = setInterval(() => {
      current += increment;
      if (current >= target) {
        setDisplay(target);
        clearInterval(timer);
      } else {
        setDisplay(current);
      }
    }, duration / steps);
    return () => clearInterval(timer);
  }, [target, duration]);

  return <>{decimals > 0 ? display.toFixed(decimals) : Math.floor(display)}</>;
}

export function HeroStats() {
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

  if (!stats || (stats.totalRuns === 0 && stats.totalRunners === 0)) return null;

  return (
    <div className="absolute bottom-0 left-0 right-0 z-20">
      <div className="bg-black/40 backdrop-blur-sm border-t border-white/10">
        <div className="flex items-center justify-center gap-6 sm:gap-10 py-3 px-4">
          <div className="flex items-center gap-2 text-white">
            <Users className="w-4 h-4 text-amber-400" />
            <span className="text-lg sm:text-xl font-bold">
              <AnimatedNumber target={stats.totalRunners} />
            </span>
            <span className="text-xs sm:text-sm text-white/70">Läufer</span>
          </div>
          <div className="w-px h-6 bg-white/20" />
          <div className="flex items-center gap-2 text-white">
            <Mountain className="w-4 h-4 text-amber-400" />
            <span className="text-lg sm:text-xl font-bold">
              <AnimatedNumber target={stats.totalRuns} />
            </span>
            <span className="text-xs sm:text-sm text-white/70">Runs</span>
          </div>
          <div className="w-px h-6 bg-white/20" />
          <div className="flex items-center gap-2 text-white">
            <Route className="w-4 h-4 text-amber-400" />
            <span className="text-lg sm:text-xl font-bold">
              <AnimatedNumber target={stats.totalDistanceKm} decimals={0} />
            </span>
            <span className="text-xs sm:text-sm text-white/70">km</span>
          </div>
        </div>
      </div>
    </div>
  );
}
