import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { Card } from '@/components/ui/card';
import { Skeleton } from '@/components/ui/skeleton';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Trophy, Medal, Award, Mountain, User } from 'lucide-react';

interface LeaderboardEntry {
  user_id: string;
  display_name: string;
  profile_picture: string | null;
  total_runs: number;
  unique_segments: number;
  achievement_count: number;
}

const getRankIcon = (rank: number) => {
  switch (rank) {
    case 1:
      return <Trophy className="w-5 h-5 text-yellow-500" />;
    case 2:
      return <Medal className="w-5 h-5 text-gray-400" />;
    case 3:
      return <Medal className="w-5 h-5 text-amber-600" />;
    default:
      return <span className="w-5 h-5 flex items-center justify-center text-sm font-bold text-muted-foreground">{rank}</span>;
  }
};

const getRankBackground = (rank: number) => {
  switch (rank) {
    case 1:
      return 'bg-gradient-to-r from-yellow-500/10 to-yellow-500/5 border-yellow-500/30';
    case 2:
      return 'bg-gradient-to-r from-gray-400/10 to-gray-400/5 border-gray-400/30';
    case 3:
      return 'bg-gradient-to-r from-amber-600/10 to-amber-600/5 border-amber-600/30';
    default:
      return '';
  }
};

export function Leaderboard() {
  const { data: leaderboard, isLoading } = useQuery({
    queryKey: ['leaderboard'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('leaderboard_stats')
        .select('*')
        .order('total_runs', { ascending: false })
        .limit(10);
      
      if (error) throw error;
      return data as LeaderboardEntry[];
    },
  });

  if (isLoading) {
    return (
      <Card className="p-6">
        <div className="flex items-center gap-2 mb-4">
          <Trophy className="w-5 h-5 text-primary" />
          <h3 className="font-bold text-lg">Leaderboard</h3>
        </div>
        <div className="space-y-3">
          {[1, 2, 3].map((i) => (
            <div key={i} className="flex items-center gap-3">
              <Skeleton className="w-8 h-8 rounded-full" />
              <Skeleton className="h-4 flex-1" />
            </div>
          ))}
        </div>
      </Card>
    );
  }

  if (!leaderboard || leaderboard.length === 0) {
    return (
      <Card className="p-6">
        <div className="flex items-center gap-2 mb-4">
          <Trophy className="w-5 h-5 text-primary" />
          <h3 className="font-bold text-lg">Leaderboard</h3>
        </div>
        <p className="text-muted-foreground text-sm text-center py-4">
          Noch keine Läufer auf dem Leaderboard. Sei der Erste! 🏃
        </p>
      </Card>
    );
  }

  return (
    <Card className="p-6">
      <div className="flex items-center gap-2 mb-4">
        <Trophy className="w-5 h-5 text-primary" />
        <h3 className="font-bold text-lg">Leaderboard</h3>
      </div>
      <div className="space-y-2">
        {leaderboard.map((entry, index) => (
          <div
            key={entry.user_id}
            className={`flex items-center gap-3 p-3 rounded-lg transition-colors hover:bg-muted/50 ${getRankBackground(index + 1)}`}
          >
            <div className="w-6 flex justify-center">
              {getRankIcon(index + 1)}
            </div>
            <Avatar className="w-8 h-8">
              <AvatarImage src={entry.profile_picture || undefined} />
              <AvatarFallback>
                <User className="w-4 h-4" />
              </AvatarFallback>
            </Avatar>
            <div className="flex-1 min-w-0">
              <p className="font-medium truncate text-sm">
                {entry.display_name}
              </p>
            </div>
            <div className="flex items-center gap-4 text-xs text-muted-foreground">
              <span className="flex items-center gap-1">
                <Mountain className="w-3 h-3" />
                {entry.total_runs}
              </span>
              <span className="flex items-center gap-1">
                <Award className="w-3 h-3" />
                {entry.achievement_count}
              </span>
            </div>
          </div>
        ))}
      </div>
    </Card>
  );
}