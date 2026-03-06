import { useEffect, useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { Card } from '@/components/ui/card';
import { Skeleton } from '@/components/ui/skeleton';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Trophy, Medal, Award, Mountain, User, Calendar, Timer, Lock } from 'lucide-react';
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from '@/components/ui/tooltip';
import { Button } from '@/components/ui/button';
import stravaConnectButton from '@/assets/btn_strava_connect_with_orange.svg';
import { useNavigate, Link } from 'react-router-dom';
import { differenceInDays } from 'date-fns';

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

const TEASER_COUNT = 3; // Show top 3 to non-logged-in users

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
      const { data, error } = await supabase
        .from('leaderboard_stats')
        .select('*')
        .order('total_runs', { ascending: false })
        .order('achievement_count', { ascending: false })
        .limit(10);
      
      if (error) throw error;
      return data as LeaderboardEntry[];
    },
    // Fetch for everyone - leaderboard_stats view is accessible
  });

  // Fetch alternativliga achievements for all leaderboard users
  const { data: alternativligaUsers } = useQuery({
    queryKey: ['alternativliga-achievements', leaderboard?.map(e => e.user_id)],
    queryFn: async () => {
      if (!leaderboard) return [];
      const { data, error } = await supabase
        .from('user_achievements')
        .select('user_id')
        .eq('achievement', 'alternativliga')
        .in('user_id', leaderboard.map(e => e.user_id));
      
      if (error) return [];
      return data.map(a => a.user_id);
    },
    enabled: !!leaderboard && leaderboard.length > 0,
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
              <img 
                src={stravaConnectButton} 
                alt="Mit Strava verbinden" 
                className="h-10"
              />
            </button>
          )}
        </div>
      </Card>
    );
  }

  const renderEntry = (entry: LeaderboardEntry, index: number) => {
    const rank = leaderboard.findIndex(
      (e) => e.total_runs === entry.total_runs && e.achievement_count === entry.achievement_count
    ) + 1;

    const content = (
      <div className={`flex items-center gap-3 p-3 rounded-lg transition-colors hover:bg-muted/50 ${getRankBackground(rank)}`}>
        <div className="w-6 flex justify-center">
          {getRankIcon(rank)}
        </div>
        <Avatar className="w-8 h-8">
          <AvatarImage src={entry.profile_picture || undefined} />
          <AvatarFallback>
            <User className="w-4 h-4" />
          </AvatarFallback>
        </Avatar>
        <div className="flex-1 min-w-0 flex items-center gap-1.5">
          <p className="font-medium truncate text-sm">
            {entry.display_name}
          </p>
          {alternativligaUsers?.includes(entry.user_id) && (
            <TooltipProvider>
              <Tooltip>
                <TooltipTrigger asChild>
                  <Timer className="w-3.5 h-3.5 text-emerald-500 flex-shrink-0" />
                </TooltipTrigger>
                <TooltipContent>
                  <p>GPS-nein-Danke! Hier wird von Hand gestoppt</p>
                </TooltipContent>
              </Tooltip>
            </TooltipProvider>
          )}
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
    );

    if (user) {
      return (
        <Link to={`/runner/${entry.user_id}`} key={entry.user_id}>
          {content}
        </Link>
      );
    }
    return <div key={entry.user_id}>{content}</div>;
  };

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
      
      <div className="space-y-2">
        {/* Show top entries clearly */}
        {leaderboard.slice(0, user ? leaderboard.length : TEASER_COUNT).map((entry, index) => 
          renderEntry(entry, index)
        )}
        
        {/* Blurred teaser for non-logged-in users */}
        {!user && leaderboard.length > TEASER_COUNT && (
          <div className="relative">
            <div className="blur-[6px] pointer-events-none select-none space-y-2">
              {leaderboard.slice(TEASER_COUNT, Math.min(leaderboard.length, 7)).map((entry, index) => 
                renderEntry(entry, index + TEASER_COUNT)
              )}
            </div>
            {/* Overlay CTA */}
            <div className="absolute inset-0 flex flex-col items-center justify-center bg-gradient-to-t from-card/90 via-card/60 to-transparent rounded-lg">
              <Lock className="w-5 h-5 text-muted-foreground mb-2" />
              <p className="text-sm font-medium text-foreground mb-3">
                Melde dich an um das volle Ranking zu sehen
              </p>
              <Button 
                onClick={() => navigate('/auth')} 
                size="sm"
                variant="default"
              >
                Jetzt mitmachen
              </Button>
            </div>
          </div>
        )}
      </div>
    </Card>
  );
}
