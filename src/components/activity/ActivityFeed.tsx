import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { ActivityCard } from "./ActivityCard";
import { Skeleton } from "@/components/ui/skeleton";
import { Activity, Zap } from "lucide-react";
import { useEffect, useState } from "react";

interface Activity {
  id: string;
  activity_id: number | null;
  activity_name: string;
  user_id: string;
  start_date: string;
  total_distance: number;
  total_time: number;
  segment_count: number;
  segments: string[];
  profiles: {
    first_name: string;
    last_name: string;
    profile_picture: string | null;
  };
}

export const ActivityFeed = () => {
  const [realtimeKey, setRealtimeKey] = useState(0);

  // Fetch recent activities grouped by start_date
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
        .limit(100);

      if (error) {
        console.error("Error fetching activities:", error);
        throw error;
      }

      // Group by activity_id to get unique activities
      const activityMap = new Map<string, Activity>();
      
      data?.forEach((effort: any) => {
        // Only use activity_id for grouping to ensure one entry per activity
        // For old data without activity_id, group by date (without time)
        let activityKey: string;
        if (effort.activity_id) {
          activityKey = `${effort.activity_id}`;
        } else {
          // Group by user and date (YYYY-MM-DD) for legacy data
          const dateOnly = effort.start_date.split('T')[0];
          activityKey = `legacy_${effort.user_id}_${dateOnly}`;
        }
        
        if (!activityMap.has(activityKey)) {
          // Generate a better fallback name if activity_name is missing
          const fallbackName = effort.activity_name || 
            `Lauf am ${new Date(effort.start_date).toLocaleDateString('de-DE', { day: '2-digit', month: '2-digit' })}`;
          
          activityMap.set(activityKey, {
            id: activityKey,
            activity_id: effort.activity_id,
            activity_name: fallbackName,
            user_id: effort.user_id,
            start_date: effort.start_date,
            total_distance: 0,
            total_time: 0,
            segment_count: 0,
            segments: [],
            profiles: effort.profiles,
          });
        }
        
        const activity = activityMap.get(activityKey)!;
        activity.total_distance += effort.distance;
        activity.total_time += effort.elapsed_time;
        activity.segment_count += 1;
        if (!activity.segments.includes(effort.segment_name)) {
          activity.segments.push(effort.segment_name);
        }
      });

      // Convert to array and sort by date, limit to 20
      const groupedActivities = Array.from(activityMap.values())
        .sort((a, b) => new Date(b.start_date).getTime() - new Date(a.start_date).getTime())
        .slice(0, 20);

      return groupedActivities;
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
