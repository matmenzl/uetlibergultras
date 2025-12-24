import { useEffect, useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Skeleton } from '@/components/ui/skeleton';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Trophy, Medal, Award, Mountain, User, Sparkles, Calendar } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { FoundingMemberBadge } from './FoundingMemberBadge';
import { differenceInDays } from 'date-fns';
import stravaConnectButton from '@/assets/btn_strava_connect_with_orange.svg';

const getDaysRemaining = () => {
  const now = new Date();
  const endOfYear = new Date(now.getFullYear(), 11, 31);
  return differenceInDays(endOfYear, now);
};

interface LeaderboardEntry {
  user_id: string;
  display_name: string;
  profile_picture: string | null;
  total_runs: number;
  unique_segments: number;
  achievement_count: number;
  is_founding_member?: boolean;
  user_number?: number;
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
  const navigate = useNavigate();
  const [user, setUser] = useState<any>(null);

  useEffect(() => {
    supabase.auth.getSession().then(({ data: { session } }) => {
      setUser(session?.user ?? null);
    });
  }, []);

  const { data: leaderboard, isLoading } = useQuery({
    queryKey: ['leaderboard'],
    queryFn: async () => {
      // Fetch leaderboard stats
      const { data: stats, error } = await supabase
        .from('leaderboard_stats')
        .select('*')
        .order('total_runs', { ascending: false })
        .limit(10);
      
      if (error) throw error;
      
      // Fetch founding member status for each user
      const userIds = stats?.map(s => s.user_id).filter(Boolean) || [];
      const { data: profiles } = await supabase
        .from('profiles')
        .select('id, is_founding_member, user_number')
        .in('id', userIds);
      
      // Merge the data
      return (stats || []).map(entry => ({
        ...entry,
        is_founding_member: profiles?.find(p => p.id === entry.user_id)?.is_founding_member,
        user_number: profiles?.find(p => p.id === entry.user_id)?.user_number,
      })) as LeaderboardEntry[];
    },
  });

  if (isLoading) {
    return (
      <Card className="p-6">
      <div className="flex items-center gap-2 mb-4">
        <Trophy className="w-5 h-5 text-primary" />
        <h3 className="font-bold text-lg">365-Tage Challenge {new Date().getFullYear()}</h3>
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
        <h3 className="font-bold text-lg">365-Tage Challenge {new Date().getFullYear()}</h3>
      </div>
      <div className="text-center py-6">
        <Trophy className="w-12 h-12 text-primary/30 mx-auto mb-3" />
        <p className="text-muted-foreground text-sm mb-4">
          Verbinde dich mit Strava und schau wer die 365-Tage Challenge {new Date().getFullYear()} anführt
        </p>
          {!user && (
            <button 
              onClick={() => navigate('/auth')}
              className="hover:opacity-90 transition-opacity"
            >
              <img src={stravaConnectButton} alt="Connect with Strava" className="h-10 mx-auto" />
            </button>
          )}
        </div>
      </Card>
    );
  }

  return (
    <Card className="p-6">
      <div className="flex items-center justify-between mb-4">
        <div className="flex items-center gap-2">
          <Trophy className="w-5 h-5 text-primary" />
          <h3 className="font-bold text-lg">365-Tage Challenge {new Date().getFullYear()}</h3>
        </div>
        <div className="flex items-center gap-1 text-xs text-muted-foreground bg-muted/50 px-2 py-1 rounded-full">
          <Calendar className="w-3 h-3" />
          <span>Noch {getDaysRemaining()} Tage</span>
        </div>
      </div>
      
      {/* CTA for non-logged-in users */}
      {!user && (
        <div className="bg-muted/50 rounded-lg p-4 mb-4 text-center">
          <p className="text-sm text-muted-foreground mb-3">
            Verbinde dich mit Strava und schau wer die 365-Tage Challenge {new Date().getFullYear()} anführt
          </p>
          <button 
            onClick={() => navigate('/auth')}
            className="hover:opacity-90 transition-opacity"
          >
            <img src={stravaConnectButton} alt="Connect with Strava" className="h-10 mx-auto" />
          </button>
        </div>
      )}
      
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
              <div className="flex items-center gap-2">
                <p className="font-medium truncate text-sm">
                  {entry.display_name}
                </p>
                {entry.is_founding_member && (
                  <Sparkles className="w-3 h-3 text-amber-500 flex-shrink-0" />
                )}
              </div>
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