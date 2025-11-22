import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { ActivityCard } from "./ActivityCard";
import { Skeleton } from "@/components/ui/skeleton";
import { Activity, Zap } from "lucide-react";
import { useEffect, useState } from "react";

interface SegmentEffort {
  id: string;
  user_id: string;
  segment_id: number;
  segment_name: string;
  elapsed_time: number;
  distance: number;
  start_date: string;
  profiles: {
    first_name: string;
    last_name: string;
    profile_picture: string | null;
  };
}

export const ActivityFeed = () => {
  const [realtimeKey, setRealtimeKey] = useState(0);

  // Fetch recent activities (segment efforts) with profile data
  const { data: activities, isLoading, refetch } = useQuery({
    queryKey: ["activity-feed", realtimeKey],
    queryFn: async () => {
      console.log("Fetching activity feed...");
      const { data, error } = await supabase
        .from("segment_efforts")
        .select(`
          *,
          profiles:user_id (
            first_name,
            last_name,
            profile_picture
          )
        `)
        .order("start_date", { ascending: false })
        .limit(20);

      if (error) {
        console.error("Error fetching activities:", error);
        throw error;
      }

      return (data || []) as SegmentEffort[];
    },
    staleTime: 1000 * 30, // 30 seconds
  });

  // Set up realtime subscription for new activities
  useEffect(() => {
    console.log("Setting up realtime subscription for activities...");
    
    const channel = supabase
      .channel("activity-feed-changes")
      .on(
        "postgres_changes",
        {
          event: "INSERT",
          schema: "public",
          table: "segment_efforts",
        },
        (payload) => {
          console.log("New activity inserted:", payload);
          setRealtimeKey((prev) => prev + 1);
        }
      )
      .subscribe();

    return () => {
      console.log("Cleaning up realtime subscription");
      supabase.removeChannel(channel);
    };
  }, []);

  return (
    <section className="container mx-auto px-4 py-12">
      <div className="max-w-2xl mx-auto">
        {/* Header */}
        <div className="mb-8">
          <div className="flex items-center gap-3 mb-3">
            <div className="relative">
              <Activity className="w-8 h-8 text-primary" />
              <Zap className="w-4 h-4 text-yellow-500 absolute -top-1 -right-1" />
            </div>
            <h2 className="text-3xl font-bold text-foreground">
              Live Activity Feed
            </h2>
          </div>
          <p className="text-muted-foreground text-lg">
            Sieh was die Community gerade läuft
          </p>
        </div>

        {/* Activities List */}
        {isLoading ? (
          <div className="space-y-4">
            {[1, 2, 3].map((i) => (
              <Skeleton key={i} className="h-48 w-full" />
            ))}
          </div>
        ) : activities && activities.length > 0 ? (
          <div className="space-y-4">
            {activities.map((activity) => (
              <ActivityCard key={activity.id} activity={activity} />
            ))}
          </div>
        ) : (
          <div className="text-center py-12 bg-muted/30 rounded-lg">
            <Activity className="w-16 h-16 text-muted-foreground mx-auto mb-4" />
            <p className="text-muted-foreground text-lg">
              Noch keine Activities. Synchronisiere deine Strava-Daten!
            </p>
          </div>
        )}
      </div>
    </section>
  );
};
