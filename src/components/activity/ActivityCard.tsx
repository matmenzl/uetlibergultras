import { useState, useEffect } from "react";
import { Card } from "@/components/ui/card";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Heart, MessageCircle, Clock, Mountain } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/components/ui/use-toast";
import { formatDistance } from "date-fns";
import { de } from "date-fns/locale";
import { z } from "zod";

const CommentSchema = z.object({
  comment_text: z.string()
    .min(2, "Kommentar muss mindestens 2 Zeichen lang sein")
    .max(1000, "Kommentar darf maximal 1000 Zeichen lang sein")
    .trim()
});

interface ActivityCardProps {
  activity: {
    id: string;
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

interface Kudo {
  id: string;
  user_id: string;
}

interface Comment {
  id: string;
  user_id: string;
  comment_text: string;
  created_at: string;
  profiles: {
    first_name: string;
    last_name: string;
    profile_picture: string | null;
  };
}

export const ActivityCard = ({ activity }: ActivityCardProps) => {
  const { toast } = useToast();
  const [kudos, setKudos] = useState<Kudo[]>([]);
  const [comments, setComments] = useState<Comment[]>([]);
  const [showComments, setShowComments] = useState(false);
  const [commentText, setCommentText] = useState("");
  const [currentUserId, setCurrentUserId] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);

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

  // Fetch kudos and comments
  useEffect(() => {
    const fetchKudosAndComments = async () => {
      // Fetch kudos
      const { data: kudosData } = await supabase
        .from("kudos")
        .select("id, user_id")
        .eq("effort_id", activity.id);

      if (kudosData) setKudos(kudosData);

      // Fetch comments
      const { data: commentsData } = await supabase
        .from("comments")
        .select(
          `
          id,
          user_id,
          comment_text,
          created_at,
          profiles:user_id (
            first_name,
            last_name,
            profile_picture
          )
        `
        )
        .eq("effort_id", activity.id)
        .order("created_at", { ascending: true });

      if (commentsData) setComments(commentsData as Comment[]);
    };

    fetchKudosAndComments();

    // Set up realtime subscription for kudos and comments
    const kudosChannel = supabase
      .channel(`kudos-${activity.id}`)
      .on(
        "postgres_changes",
        {
          event: "*",
          schema: "public",
          table: "kudos",
          filter: `effort_id=eq.${activity.id}`,
        },
        () => {
          fetchKudosAndComments();
        }
      )
      .subscribe();

    const commentsChannel = supabase
      .channel(`comments-${activity.id}`)
      .on(
        "postgres_changes",
        {
          event: "*",
          schema: "public",
          table: "comments",
          filter: `effort_id=eq.${activity.id}`,
        },
        () => {
          fetchKudosAndComments();
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(kudosChannel);
      supabase.removeChannel(commentsChannel);
    };
  }, [activity.id]);

  const hasUserGivenKudo = kudos.some((k) => k.user_id === currentUserId);

  const handleKudoToggle = async () => {
    if (!currentUserId) {
      toast({
        title: "Nicht eingeloggt",
        description: "Bitte logge dich ein, um Kudos zu geben",
        variant: "destructive",
      });
      return;
    }

    try {
      if (hasUserGivenKudo) {
        // Remove kudo
        const { error } = await supabase
          .from("kudos")
          .delete()
          .eq("effort_id", activity.id)
          .eq("user_id", currentUserId);

        if (error) throw error;
      } else {
        // Add kudo
        const { error } = await supabase.from("kudos").insert({
          effort_id: activity.id,
          user_id: currentUserId,
        });

        if (error) throw error;
      }
    } catch (error) {
      console.error("Error toggling kudo:", error);
      toast({
        title: "Fehler",
        description: "Kudo konnte nicht gespeichert werden",
        variant: "destructive",
      });
    }
  };

  const handleCommentSubmit = async () => {
    if (!currentUserId) {
      toast({
        title: "Nicht eingeloggt",
        description: "Bitte logge dich ein, um zu kommentieren",
        variant: "destructive",
      });
      return;
    }

    // Validate comment with zod
    const validationResult = CommentSchema.safeParse({ 
      comment_text: commentText 
    });
    
    if (!validationResult.success) {
      const errorMessage = validationResult.error.issues[0].message;
      toast({
        title: "Ungültiger Kommentar",
        description: errorMessage,
        variant: "destructive",
      });
      return;
    }

    setIsSubmitting(true);
    try {
      const { error } = await supabase.from("comments").insert({
        effort_id: activity.id,
        user_id: currentUserId,
        comment_text: validationResult.data.comment_text,
      });

      if (error) throw error;

      setCommentText("");
      toast({
        title: "Kommentar gepostet",
        description: "Dein Kommentar wurde erfolgreich hinzugefügt",
      });
    } catch (error) {
      console.error("Error posting comment:", error);
      toast({
        title: "Fehler",
        description: "Kommentar konnte nicht gepostet werden",
        variant: "destructive",
      });
    } finally {
      setIsSubmitting(false);
    }
  };

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

      {/* Activity Details */}
      <div className="mb-4">
        <h3 className="text-lg font-semibold text-foreground mb-2">
          Lauf mit {activity.segment_count} Uetliberg-{activity.segment_count === 1 ? 'Segment' : 'Segmenten'}
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
          Segmente: {activity.segments.slice(0, 3).join(', ')}
          {activity.segments.length > 3 && ` +${activity.segments.length - 3} weitere`}
        </div>
      </div>

      {/* Actions */}
      <div className="flex items-center gap-4 pt-4 border-t">
        <Button
          variant="ghost"
          size="sm"
          onClick={handleKudoToggle}
          className={hasUserGivenKudo ? "text-red-500" : ""}
        >
          <Heart
            className="w-4 h-4 mr-1"
            fill={hasUserGivenKudo ? "currentColor" : "none"}
          />
          {kudos.length > 0 && <span>{kudos.length}</span>}
        </Button>
        <Button
          variant="ghost"
          size="sm"
          onClick={() => setShowComments(!showComments)}
        >
          <MessageCircle className="w-4 h-4 mr-1" />
          {comments.length > 0 && <span>{comments.length}</span>}
        </Button>
      </div>

      {/* Comments Section */}
      {showComments && (
        <div className="mt-4 pt-4 border-t space-y-4">
          {/* Existing Comments */}
          {comments.map((comment) => (
            <div key={comment.id} className="flex gap-3">
              <Avatar className="h-8 w-8 shrink-0">
                <AvatarImage
                  src={comment.profiles.profile_picture || undefined}
                  alt={`${comment.profiles.first_name} ${comment.profiles.last_name}`}
                />
                <AvatarFallback className="bg-primary/10 text-xs">
                  {comment.profiles.first_name[0]}
                  {comment.profiles.last_name[0]}
                </AvatarFallback>
              </Avatar>
              <div className="flex-1">
                <p className="text-sm font-medium">
                  {comment.profiles.first_name} {comment.profiles.last_name}
                </p>
                <p className="text-sm text-muted-foreground">
                  {comment.comment_text}
                </p>
              </div>
            </div>
          ))}

          {/* Add Comment */}
          {currentUserId && (
            <div className="space-y-2">
              <div className="flex gap-2">
                <Textarea
                  placeholder="Schreibe einen Kommentar..."
                  value={commentText}
                  onChange={(e) => setCommentText(e.target.value)}
                  className="flex-1"
                  rows={2}
                  maxLength={1000}
                />
                <Button
                  onClick={handleCommentSubmit}
                  disabled={!commentText.trim() || isSubmitting}
                >
                  Posten
                </Button>
              </div>
              <p className="text-xs text-muted-foreground">
                {commentText.length}/1000 Zeichen
              </p>
            </div>
          )}
        </div>
      )}
    </Card>
  );
};
