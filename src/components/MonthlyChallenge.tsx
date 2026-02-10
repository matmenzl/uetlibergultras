import { useEffect, useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { Card } from '@/components/ui/card';
import { Skeleton } from '@/components/ui/skeleton';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Trophy, Medal, Mountain, User, Calendar, History } from 'lucide-react';
import { Link, useNavigate } from 'react-router-dom';
import { differenceInDays, lastDayOfMonth } from 'date-fns';
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from '@/components/ui/collapsible';
import stravaConnectButton from '@/assets/btn_strava_connect_with_orange.svg';

const MONTHS_DE = [
  'Januar', 'Februar', 'März', 'April', 'Mai', 'Juni',
  'Juli', 'August', 'September', 'Oktober', 'November', 'Dezember'
];

interface MonthlyEntry {
  user_id: string;
  display_name: string | null;
  profile_picture: string | null;
  total_runs: number;
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

export function MonthlyChallenge() {
  const navigate = useNavigate();
  const [user, setUser] = useState<any>(null);
  const now = new Date();
  const currentYear = now.getFullYear();
  const currentMonth = now.getMonth() + 1; // 1-12
  const daysRemaining = differenceInDays(lastDayOfMonth(now), now);

  useEffect(() => {
    supabase.auth.getSession().then(({ data: { session } }) => {
      setUser(session?.user ?? null);
    });
  }, []);

  // Lazy evaluation: trigger check for previous month winners
  useQuery({
    queryKey: ['check-monthly-challenge'],
    queryFn: async () => {
      const { data: { session } } = await supabase.auth.getSession();
      if (!session) return null;
      
      const { data } = await supabase.functions.invoke('check-monthly-challenge', {
        headers: { Authorization: `Bearer ${session.access_token}` },
      });
      return data;
    },
    enabled: !!user,
    staleTime: 1000 * 60 * 60, // Only check once per hour
  });

  // Live leaderboard for current month from check_ins
  const { data: monthlyLeaderboard, isLoading } = useQuery({
    queryKey: ['monthly-leaderboard', currentYear, currentMonth],
    queryFn: async () => {
      const startDate = new Date(currentYear, currentMonth - 1, 1).toISOString();
      const endDate = new Date(currentYear, currentMonth, 1).toISOString();

      const { data: checkIns, error } = await supabase
        .from('check_ins')
        .select('user_id, activity_id')
        .gte('checked_in_at', startDate)
        .lt('checked_in_at', endDate);

      if (error) throw error;

      // Count distinct activities per user
      const userActivities = new Map<string, Set<number>>();
      checkIns?.forEach(ci => {
        if (!userActivities.has(ci.user_id)) {
          userActivities.set(ci.user_id, new Set());
        }
        userActivities.get(ci.user_id)!.add(ci.activity_id);
      });

      // Sort by count
      const sorted = Array.from(userActivities.entries())
        .map(([user_id, activities]) => ({ user_id, total_runs: activities.size }))
        .sort((a, b) => b.total_runs - a.total_runs)
        .slice(0, 10);

      if (sorted.length === 0) return [];

      // Fetch profiles
      const { data: profiles } = await supabase
        .from('public_profiles')
        .select('id, display_name, profile_picture')
        .in('id', sorted.map(s => s.user_id));

      const profileMap = new Map(profiles?.map(p => [p.id, p]) || []);

      return sorted.map(entry => ({
        ...entry,
        display_name: profileMap.get(entry.user_id)?.display_name || 'Unbekannt',
        profile_picture: profileMap.get(entry.user_id)?.profile_picture || null,
      })) as MonthlyEntry[];
    },
    enabled: !!user,
  });

  // Past winners from monthly_challenge_winners table
  const { data: pastWinners } = useQuery({
    queryKey: ['monthly-challenge-history'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('monthly_challenge_winners')
        .select('user_id, year, month, rank, total_runs')
        .order('year', { ascending: false })
        .order('month', { ascending: false })
        .order('rank', { ascending: true });

      if (error) throw error;
      if (!data || data.length === 0) return [];

      // Fetch profiles for all winners
      const userIds = [...new Set(data.map(w => w.user_id))];
      const { data: profiles } = await supabase
        .from('public_profiles')
        .select('id, display_name, profile_picture')
        .in('id', userIds);

      const profileMap = new Map(profiles?.map(p => [p.id, p]) || []);

      // Group by year-month
      const grouped = new Map<string, { year: number; month: number; winners: { user_id: string; rank: number; total_runs: number; display_name: string; profile_picture: string | null }[] }>();

      data.forEach(w => {
        const key = `${w.year}-${w.month}`;
        if (!grouped.has(key)) {
          grouped.set(key, { year: w.year, month: w.month, winners: [] });
        }
        grouped.get(key)!.winners.push({
          user_id: w.user_id,
          rank: w.rank,
          total_runs: w.total_runs,
          display_name: profileMap.get(w.user_id)?.display_name || 'Unbekannt',
          profile_picture: profileMap.get(w.user_id)?.profile_picture || null,
        });
      });

      return Array.from(grouped.values());
    },
    enabled: !!user,
  });

  if (isLoading) {
    return (
      <Card className="p-6">
        <div className="flex items-center gap-2 mb-4">
          <Trophy className="w-5 h-5 text-primary" />
          <h3 className="font-bold text-lg">Monats-Challenge {MONTHS_DE[currentMonth - 1]}</h3>
        </div>
        <div className="space-y-3">
          {[1, 2, 3].map(i => (
            <div key={i} className="flex items-center gap-3">
              <Skeleton className="w-8 h-8 rounded-full" />
              <Skeleton className="h-4 flex-1" />
            </div>
          ))}
        </div>
      </Card>
    );
  }

  if (!monthlyLeaderboard || monthlyLeaderboard.length === 0) {
    return (
      <Card className="p-6">
        <div className="flex items-center gap-2 mb-4">
          <Trophy className="w-5 h-5 text-primary" />
          <h3 className="font-bold text-lg">Monats-Challenge {MONTHS_DE[currentMonth - 1]}</h3>
        </div>
        <div className="text-center py-6">
          <Trophy className="w-12 h-12 text-primary/30 mx-auto mb-3" />
          <p className="text-muted-foreground text-sm mb-4">
            Noch keine Runs in {MONTHS_DE[currentMonth - 1]}. Sei der Erste!
          </p>
          {!user && (
            <button
              onClick={() => navigate('/auth')}
              className="hover:opacity-90 transition-opacity"
            >
              <img src={stravaConnectButton} alt="Mit Strava verbinden" className="h-10" />
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
          <h3 className="font-bold text-lg">Monats-Challenge {MONTHS_DE[currentMonth - 1]}</h3>
        </div>
        <div className="flex items-center gap-1 text-xs text-muted-foreground bg-muted/50 px-2 py-1 rounded-full">
          <Calendar className="w-3 h-3" />
          <span>Noch {daysRemaining} Tage</span>
        </div>
      </div>

      {/* CTA for non-logged-in users */}
      {!user && (
        <div className="bg-muted/50 rounded-lg p-4 mb-4 text-center">
          <p className="text-sm text-muted-foreground mb-3">
            Melde dich an um an der Monats-Challenge teilzunehmen
          </p>
          <button
            onClick={() => navigate('/auth')}
            className="hover:opacity-90 transition-opacity"
          >
            <img src={stravaConnectButton} alt="Mit Strava verbinden" className="h-10" />
          </button>
        </div>
      )}

      {user && (
        <div className="space-y-2">
          {monthlyLeaderboard.map((entry, index) => {
            const rank = index + 1;
            return (
              <Link
                to={`/runner/${entry.user_id}`}
                key={entry.user_id}
                className={`flex items-center gap-3 p-3 rounded-lg transition-colors hover:bg-muted/50 ${getRankBackground(rank)}`}
              >
                <div className="w-6 flex justify-center">
                  {getRankIcon(rank)}
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
                <div className="flex items-center gap-1 text-xs text-muted-foreground">
                  <Mountain className="w-3 h-3" />
                  {entry.total_runs}
                </div>
              </Link>
            );
          })}
        </div>
      )}
      {/* Past Winners History */}
      {user && pastWinners && pastWinners.length > 0 && (
        <Collapsible className="mt-4">
          <CollapsibleTrigger className="w-full flex items-center gap-2 text-sm text-muted-foreground hover:text-foreground transition-colors py-2">
            <History className="w-4 h-4" />
            <span>Vergangene Monate</span>
          </CollapsibleTrigger>
          <CollapsibleContent>
            <div className="space-y-3 pt-2">
              {pastWinners.map(monthData => (
                <div key={`${monthData.year}-${monthData.month}`} className="border-t border-border/50 pt-3">
                  <p className="text-xs font-medium text-muted-foreground mb-2">
                    {MONTHS_DE[monthData.month - 1]} {monthData.year}
                  </p>
                  <div className="flex flex-wrap gap-x-4 gap-y-1">
                    {monthData.winners.map(winner => (
                      <Link
                        key={winner.user_id}
                        to={`/runner/${winner.user_id}`}
                        className="flex items-center gap-1.5 text-sm hover:text-primary transition-colors"
                      >
                        {getRankIcon(winner.rank)}
                        <span className="truncate max-w-[120px]">{winner.display_name}</span>
                        <span className="text-xs text-muted-foreground">({winner.total_runs})</span>
                      </Link>
                    ))}
                  </div>
                </div>
              ))}
            </div>
          </CollapsibleContent>
        </Collapsible>
      )}
    </Card>
  );
}
