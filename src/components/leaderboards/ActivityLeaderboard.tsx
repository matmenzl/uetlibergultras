import { useState, useEffect } from "react";
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { LeaderboardCard } from "./LeaderboardCard";
import { LeaderboardTabs } from "./LeaderboardTabs";
import { LeaderboardType, LeaderboardEntry } from "@/types/leaderboard";
import { Trophy, Loader2 } from "lucide-react";
import { Skeleton } from "@/components/ui/skeleton";

export const ActivityLeaderboard = () => {
  const [activeTab, setActiveTab] = useState<LeaderboardType>("most-efforts-overall");
  
  const { data: leaderboardData, isLoading, refetch } = useQuery({
    queryKey: ["activity-leaderboard", activeTab],
    queryFn: async () => {
      console.log(`Fetching leaderboard for type: ${activeTab}`);
      
      // Use hybrid leaderboard for overall and unique segments
      const functionName = (activeTab === 'most-efforts-overall' || activeTab === 'most-unique-segments')
        ? 'get-hybrid-leaderboard'
        : 'get-activity-leaderboards';
      
      const { data, error } = await supabase.functions.invoke(functionName, {
        body: { type: activeTab },
      });

      if (error) {
        console.error("Error fetching leaderboard:", error);
        throw error;
      }

      console.log("Leaderboard data received:", data);
      return data?.entries || [];
    },
    staleTime: 1000 * 60 * 5, // 5 Minuten Cache
  });

  // Listen for refetch events from sync
  useEffect(() => {
    const handleRefetch = () => refetch();
    window.addEventListener('refetch-leaderboard', handleRefetch);
    return () => window.removeEventListener('refetch-leaderboard', handleRefetch);
  }, [refetch]);

  const currentEntries = leaderboardData || [];
  const showUniqueSegments = activeTab === "most-unique-segments";

  return (
    <section className="container mx-auto px-4 py-12 bg-card/50">
      <div className="max-w-4xl mx-auto">
        {/* Header */}
        <div className="text-center mb-8">
          <div className="flex items-center justify-center gap-2 mb-3">
            <Trophy className="w-8 h-8 text-primary" />
            <h2 className="text-3xl font-bold text-foreground">Community Leaderboards</h2>
          </div>
          <p className="text-muted-foreground text-lg">
            Die aktivsten Athletes auf dem Uetliberg
          </p>
        </div>

        {/* Tabs */}
        <LeaderboardTabs activeTab={activeTab} onTabChange={setActiveTab}>
          {isLoading ? (
            <div className="space-y-3">
              {[1, 2, 3, 4, 5].map((i) => (
                <Skeleton key={i} className="h-20 w-full" />
              ))}
            </div>
          ) : currentEntries.length === 0 ? (
            <div className="text-center py-12">
              <Trophy className="w-12 h-12 text-muted-foreground mx-auto mb-3" />
              <p className="text-muted-foreground">
                Noch keine Daten verfügbar. Sei der Erste, der seine Strava-Daten synchronisiert!
              </p>
            </div>
          ) : (
            <div className="space-y-3">
              {currentEntries.map((entry: LeaderboardEntry) => (
                <LeaderboardCard
                  key={entry.id}
                  entry={entry}
                  showUniqueSegments={showUniqueSegments}
                />
              ))}
            </div>
          )}
        </LeaderboardTabs>

        {/* Footer Note */}
        <p className="text-center text-sm text-muted-foreground mt-6">
          Logge dich ein und synchronisiere deine Strava-Daten, um im Leaderboard zu erscheinen
        </p>
      </div>
    </section>
  );
};
