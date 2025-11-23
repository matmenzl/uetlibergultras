import { Trophy, Award, Target } from "lucide-react";
import { Card } from "@/components/ui/card";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { LeaderboardEntry } from "@/types/leaderboard";

interface LeaderboardCardProps {
  entry: LeaderboardEntry & { isAppUser?: boolean };
  isCurrentUser?: boolean;
  showUniqueSegments?: boolean;
}

export const LeaderboardCard = ({ entry, isCurrentUser, showUniqueSegments }: LeaderboardCardProps) => {
  const getRankIcon = (rank: number) => {
    if (rank === 1) return <Trophy className="w-5 h-5 text-[hsl(45,100%,51%)]" />;
    if (rank === 2) return <Award className="w-5 h-5 text-[hsl(0,0%,75%)]" />;
    if (rank === 3) return <Target className="w-5 h-5 text-[hsl(25,75%,47%)]" />;
    return <span className="text-sm font-medium text-muted-foreground">#{rank}</span>;
  };

  const getInitials = () => {
    return `${entry.firstName[0]}${entry.lastName[0]}`.toUpperCase();
  };

  return (
    <Card className={`p-4 transition-all hover:shadow-md ${isCurrentUser ? 'bg-primary/5 border-primary/20' : ''}`}>
      <div className="flex items-center gap-4">
        {/* Rank */}
        <div className="flex items-center justify-center w-10 h-10 shrink-0">
          {getRankIcon(entry.rank)}
        </div>

        {/* Avatar */}
        <Avatar className="h-12 w-12 shrink-0">
          <AvatarImage src={entry.profilePicture} alt={`${entry.firstName} ${entry.lastName}`} />
          <AvatarFallback className="bg-primary/10 text-primary font-semibold">
            {getInitials()}
          </AvatarFallback>
        </Avatar>

        {/* User Info */}
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2 flex-wrap">
            <p className="font-semibold text-foreground truncate">
              {entry.firstName} {entry.lastName}
            </p>
            {isCurrentUser && (
              <span className="text-xs px-2 py-0.5 bg-primary/10 text-primary rounded-full">
                Du
              </span>
            )}
            {entry.isAppUser === false && (
              <span className="text-xs px-2 py-0.5 bg-muted text-muted-foreground rounded-full">
                Strava
              </span>
            )}
          </div>
          <p className="text-sm text-muted-foreground">
            {entry.lastActivity 
              ? `Zuletzt aktiv: ${new Date(entry.lastActivity).toLocaleDateString('de-DE')}`
              : 'Strava Athlete'}
          </p>
        </div>

        {/* Stats */}
        <div className="text-right shrink-0">
          <p className="text-2xl font-bold text-primary">{entry.totalActivities}</p>
          <p className="text-xs text-muted-foreground">
            {showUniqueSegments ? `${entry.uniqueSegments} Segmente` : 'Läufe'}
          </p>
        </div>
      </div>
    </Card>
  );
};
