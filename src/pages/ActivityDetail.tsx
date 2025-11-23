import { useParams, Link } from "react-router-dom";
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { NavBar } from "@/components/NavBar";
import { Footer } from "@/components/Footer";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import { ArrowLeft, Clock, Mountain, Calendar, TrendingUp } from "lucide-react";
import { formatDistance } from "date-fns";
import { de } from "date-fns/locale";
import { ActivityMap } from "@/components/activity/ActivityMap";

export default function ActivityDetail() {
  const { activityId } = useParams<{ activityId: string }>();

  const { data: activity, isLoading } = useQuery({
    queryKey: ["activity-detail", activityId],
    queryFn: async () => {
      // Fetch all segment efforts for this activity
      let query = supabase
        .from("segment_efforts")
        .select(`
          *,
          profiles:user_id (
            first_name,
            last_name,
            profile_picture
          )
        `)
        .order("start_date", { ascending: true });

      // Handle both real activity_id and legacy format
      if (activityId?.startsWith("legacy_")) {
        const parts = activityId.split("_");
        const userId = parts[1];
        const date = parts[2];
        query = query.eq("user_id", userId).gte("start_date", `${date}T00:00:00`).lt("start_date", `${date}T23:59:59`);
      } else {
        query = query.eq("activity_id", parseInt(activityId || "0"));
      }

      const { data, error } = await query;

      if (error) throw error;
      if (!data || data.length === 0) return null;

      // Aggregate activity data
      const totalDistance = data.reduce((sum, e) => sum + e.distance, 0);
      const totalTime = data.reduce((sum, e) => sum + e.elapsed_time, 0);
      const activityName = data.find(e => e.activity_name)?.activity_name || 
        `Lauf am ${new Date(data[0].start_date).toLocaleDateString('de-DE', { day: '2-digit', month: '2-digit' })}`;

      return {
        id: activityId,
        activity_id: data[0].activity_id,
        activity_name: activityName,
        user_id: data[0].user_id,
        start_date: data[0].start_date,
        total_distance: totalDistance,
        total_time: totalTime,
        segment_count: data.length,
        profiles: data[0].profiles,
        segments: data,
      };
    },
    enabled: !!activityId,
  });

  const formatTime = (seconds: number): string => {
    const hours = Math.floor(seconds / 3600);
    const mins = Math.floor((seconds % 3600) / 60);
    const secs = seconds % 60;
    if (hours > 0) {
      return `${hours}:${mins.toString().padStart(2, "0")}:${secs.toString().padStart(2, "0")}`;
    }
    return `${mins}:${secs.toString().padStart(2, "0")}`;
  };

  const formatDistanceValue = (meters: number): string => {
    return (meters / 1000).toFixed(2) + " km";
  };

  const formatPace = (distanceMeters: number, timeSeconds: number): string => {
    const paceSecondsPerKm = (timeSeconds / distanceMeters) * 1000;
    const mins = Math.floor(paceSecondsPerKm / 60);
    const secs = Math.floor(paceSecondsPerKm % 60);
    return `${mins}:${secs.toString().padStart(2, "0")} min/km`;
  };

  if (isLoading) {
    return (
      <div className="min-h-screen flex flex-col">
        <NavBar />
        <main className="flex-1 container mx-auto px-4 py-8">
          <Skeleton className="h-8 w-32 mb-6" />
          <Skeleton className="h-96 w-full mb-6" />
          <Skeleton className="h-64 w-full" />
        </main>
        <Footer />
      </div>
    );
  }

  if (!activity) {
    return (
      <div className="min-h-screen flex flex-col">
        <NavBar />
        <main className="flex-1 container mx-auto px-4 py-8">
          <Link to="/">
            <Button variant="ghost" className="mb-6">
              <ArrowLeft className="w-4 h-4 mr-2" />
              Zurück
            </Button>
          </Link>
          <Card className="p-8 text-center">
            <p className="text-muted-foreground">Aktivität nicht gefunden</p>
          </Card>
        </main>
        <Footer />
      </div>
    );
  }

  const timeAgo = formatDistance(new Date(activity.start_date), new Date(), {
    addSuffix: true,
    locale: de,
  });

  return (
    <div className="min-h-screen flex flex-col">
      <NavBar />
      <main className="flex-1 container mx-auto px-4 py-8">
        <Link to="/">
          <Button variant="ghost" className="mb-6">
            <ArrowLeft className="w-4 h-4 mr-2" />
            Zurück zum Feed
          </Button>
        </Link>

        {/* Activity Header */}
        <Card className="p-6 mb-6">
          <div className="flex items-start gap-4 mb-4">
            <Avatar className="h-16 w-16">
              <AvatarImage
                src={activity.profiles.profile_picture || undefined}
                alt={`${activity.profiles.first_name} ${activity.profiles.last_name}`}
              />
              <AvatarFallback className="bg-primary/10 text-primary font-semibold text-xl">
                {activity.profiles.first_name[0]}
                {activity.profiles.last_name[0]}
              </AvatarFallback>
            </Avatar>
            <div className="flex-1">
              <div className="flex items-center gap-2 mb-1">
                <h1 className="text-2xl font-bold text-foreground">
                  {activity.activity_name}
                </h1>
                {activity.activity_id && (
                  <a
                    href={`https://www.strava.com/activities/${activity.activity_id}`}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="text-xs text-muted-foreground hover:text-primary transition-colors"
                  >
                    Auf Strava ansehen ↗
                  </a>
                )}
              </div>
              <p className="text-lg font-medium text-foreground mb-1">
                {activity.profiles.first_name} {activity.profiles.last_name}
              </p>
              <div className="flex items-center gap-2 text-sm text-muted-foreground">
                <Calendar className="w-4 h-4" />
                <span>
                  {new Date(activity.start_date).toLocaleDateString('de-DE', {
                    weekday: 'long',
                    year: 'numeric',
                    month: 'long',
                    day: 'numeric',
                  })}
                </span>
                <span className="mx-2">•</span>
                <span>{timeAgo}</span>
              </div>
            </div>
          </div>

          {/* Stats Grid */}
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mt-6">
            <div className="flex flex-col items-center p-4 bg-muted/30 rounded-lg">
              <Mountain className="w-5 h-5 text-primary mb-2" />
              <div className="text-2xl font-bold text-foreground">
                {formatDistanceValue(activity.total_distance)}
              </div>
              <div className="text-xs text-muted-foreground">Distanz</div>
            </div>
            <div className="flex flex-col items-center p-4 bg-muted/30 rounded-lg">
              <Clock className="w-5 h-5 text-primary mb-2" />
              <div className="text-2xl font-bold text-foreground">
                {formatTime(activity.total_time)}
              </div>
              <div className="text-xs text-muted-foreground">Zeit</div>
            </div>
            <div className="flex flex-col items-center p-4 bg-muted/30 rounded-lg">
              <TrendingUp className="w-5 h-5 text-primary mb-2" />
              <div className="text-2xl font-bold text-foreground">
                {formatPace(activity.total_distance, activity.total_time)}
              </div>
              <div className="text-xs text-muted-foreground">Pace</div>
            </div>
            <div className="flex flex-col items-center p-4 bg-muted/30 rounded-lg">
              <Mountain className="w-5 h-5 text-primary mb-2" />
              <div className="text-2xl font-bold text-foreground">
                {activity.segment_count}
              </div>
              <div className="text-xs text-muted-foreground">Segmente</div>
            </div>
          </div>
        </Card>

        {/* Map */}
        <Card className="p-6 mb-6">
          <h2 className="text-xl font-bold text-foreground mb-4">Route</h2>
          <ActivityMap segments={activity.segments} />
        </Card>

        {/* Segments List */}
        <Card className="p-6">
          <h2 className="text-xl font-bold text-foreground mb-4">
            Segmente ({activity.segment_count})
          </h2>
          <div className="space-y-3">
            {activity.segments.map((segment: any, index: number) => (
              <div
                key={segment.id}
                className="flex items-center justify-between p-4 bg-muted/30 rounded-lg hover:bg-muted/50 transition-colors"
              >
                <div className="flex items-center gap-3 flex-1">
                  <Badge variant="outline" className="font-mono">
                    {index + 1}
                  </Badge>
                  <div className="flex-1">
                    <h3 className="font-semibold text-foreground">
                      {segment.segment_name}
                    </h3>
                    <div className="flex gap-4 text-sm text-muted-foreground mt-1">
                      <span className="flex items-center gap-1">
                        <Mountain className="w-3 h-3" />
                        {formatDistanceValue(segment.distance)}
                      </span>
                      <span className="flex items-center gap-1">
                        <Clock className="w-3 h-3" />
                        {formatTime(segment.elapsed_time)}
                      </span>
                    </div>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </Card>
      </main>
      <Footer />
    </div>
  );
}
