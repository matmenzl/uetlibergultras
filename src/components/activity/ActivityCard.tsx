import { useState, useEffect } from "react";
import { Card } from "@/components/ui/card";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Clock, Mountain } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { formatDistance } from "date-fns";
import { de } from "date-fns/locale";

interface ActivityCardProps {
  activity: {
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
  };
}

export const ActivityCard = ({ activity }: ActivityCardProps) => {
  const [currentUserId, setCurrentUserId] = useState<string | null>(null);

  const formatTime = (seconds: number): string => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins}:${secs.toString().padStart(2, "0")}`;
  };

  const formatDistanceValue = (meters: number): string => {
    return (meters / 1000).toFixed(2) + " km";
  };

  // Fetch current user
  useEffect(() => {
    const fetchUser = async () => {
      const {
        data: { user },
      } = await supabase.auth.getUser();
      setCurrentUserId(user?.id || null);
    };
    fetchUser();
  }, []);

  const timeAgo = formatDistance(new Date(activity.start_date), new Date(), {
    addSuffix: true,
    locale: de,
  });

  return (
    <Card className="p-6 hover:shadow-lg transition-shadow">
      {/* User Header */}
      <div className="flex items-center gap-3 mb-4">
        <Avatar className="h-12 w-12">
          <AvatarImage
            src={activity.profiles.profile_picture || undefined}
            alt={`${activity.profiles.first_name} ${activity.profiles.last_name}`}
          />
          <AvatarFallback className="bg-primary/10 text-primary font-semibold">
            {activity.profiles.first_name[0]}
            {activity.profiles.last_name[0]}
          </AvatarFallback>
        </Avatar>
        <div className="flex-1">
          <p className="font-semibold text-foreground">
            {activity.profiles.first_name} {activity.profiles.last_name}
          </p>
          <p className="text-sm text-muted-foreground">{timeAgo}</p>
        </div>
      </div>

      {/* Activity Details - Clickable to Strava */}
      <a
        href={activity.activity_id ? `https://www.strava.com/activities/${activity.activity_id}` : undefined}
        target="_blank"
        rel="noopener noreferrer"
        className={activity.activity_id ? "block hover:opacity-80 transition-opacity cursor-pointer" : "block"}
      >
        <h3 className="text-lg font-semibold text-foreground mb-2 flex items-center gap-2">
          {activity.activity_name}
          {activity.activity_id && (
            <span className="text-xs text-muted-foreground">↗</span>
          )}
        </h3>
        <div className="flex gap-4 text-sm text-muted-foreground mb-2">
          <div className="flex items-center gap-1">
            <Clock className="w-4 h-4" />
            <span>{formatTime(activity.total_time)}</span>
          </div>
          <div className="flex items-center gap-1">
            <Mountain className="w-4 h-4" />
            <span>{formatDistanceValue(activity.total_distance)}</span>
          </div>
        </div>
        <div className="text-xs text-muted-foreground">
          {activity.segment_count} Uetliberg-{activity.segment_count === 1 ? 'Segment' : 'Segmente'}: {activity.segments.slice(0, 2).join(', ')}
          {activity.segments.length > 2 && ` +${activity.segments.length - 2} weitere`}
        </div>
      </a>
    </Card>
  );
};
