import { useEffect, useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { Card } from '@/components/ui/card';
import { Skeleton } from '@/components/ui/skeleton';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Trophy, Medal, Mountain, User, Calendar, Lock } from 'lucide-react';
import { Link, useNavigate } from 'react-router-dom';
import { differenceInCalendarDays, lastDayOfMonth } from 'date-fns';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Button } from '@/components/ui/button';

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

const TEASER_COUNT = 3;

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
  const now = new Date();
  const currentYear = now.getFullYear();
  const currentMonth = now.getMonth() + 1;
  const currentMonthKey = `${currentYear}-${currentMonth}`;
  const [selectedMonth, setSelectedMonth] = useState<string>(currentMonthKey);
  const [user, setUser] = useState<any>(null);
  const daysRemaining = differenceInCalendarDays(lastDayOfMonth(now), now);

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
    staleTime: 1000 * 60 * 60,
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

      const userActivities = new Map<string, Set<number>>();
      checkIns?.forEach(ci => {
        if (!userActivities.has(ci.user_id)) {
          userActivities.set(ci.user_id, new Set());
        }
        userActivities.get(ci.user_id)!.add(ci.activity_id);
      });

      const sorted = Array.from(userActivities.entries())
        .map(([user_id, activities]) => ({ user_id, total_runs: activities.size }))
        .sort((a, b) => b.total_runs - a.total_runs)
        .slice(0, 10);

      if (sorted.length === 0) return [];

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
    // Fetch for everyone - check_ins has public read policy for leaderboard
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

      const userIds = [...new Set(data.map(w => w.user_id))];
      const { data: profiles } = await supabase
        .from('public_profiles')
        .select('id, display_name, profile_picture')
        .in('id', userIds);

      const profileMap = new Map(profiles?.map(p => [p.id, p]) || []);

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
  });

  const renderEntry = (entry: { user_id: string; display_name: string | null; profile_picture: string | null; total_runs: number }, rank: number) => {
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
        <div className="flex-1 min-w-0">
          <p className="font-medium truncate text-sm">
            {entry.display_name}
          </p>
        </div>
        <div className="flex items-center gap-1 text-xs text-muted-foreground">
          <Mountain className="w-3 h-3" />
          {entry.total_runs}
        </div>
      </div>
    );

    if (user) {
      return (
        <Link to={`/runner/${entry.user_id}`} key={entry.user_id} className="block">
          {content}
        </Link>
      );
    }
    return <div key={entry.user_id}>{content}</div>;
  };

  if (isLoading) {
    return (
      <Card className="p-6">
        <div className="flex items-center gap-2 mb-4">
          <Trophy className="w-5 h-5 text-primary" />
          <h3 className="font-bold text-lg">Monats-Challenge</h3>
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
          <h3 className="font-bold text-lg">Monats-Challenge</h3>
        </div>
        <div className="text-center py-6">
          <Trophy className="w-12 h-12 text-primary/30 mx-auto mb-3" />
          <p className="text-muted-foreground text-sm mb-4">
            Noch keine Runs in {MONTHS_DE[currentMonth - 1]}. Sei der Erste!
          </p>
          {!user && (
            <Button onClick={() => navigate('/auth')} size="sm">
              Jetzt mitmachen
            </Button>
          )}
        </div>
      </Card>
    );
  }

  return (
    <Card className="p-6">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 mb-4">
        <div className="flex items-center gap-2">
          <Trophy className="w-5 h-5 text-primary shrink-0" />
          <h3 className="font-bold text-lg whitespace-nowrap">Monats-Challenge</h3>
        </div>
        <div className="flex items-center gap-2">
          {selectedMonth === currentMonthKey && (
            <div className="flex items-center gap-1 text-xs text-muted-foreground bg-muted/50 px-2 py-1 rounded-full whitespace-nowrap">
              <Calendar className="w-3 h-3 shrink-0" />
              <span>Noch {daysRemaining} Tage</span>
            </div>
          )}
          <Select value={selectedMonth} onValueChange={setSelectedMonth}>
            <SelectTrigger className="w-[150px] h-8 text-xs shrink-0">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value={currentMonthKey}>
                {MONTHS_DE[currentMonth - 1]} {currentYear}
              </SelectItem>
              {pastWinners?.map(monthData => (
                <SelectItem key={`${monthData.year}-${monthData.month}`} value={`${monthData.year}-${monthData.month}`}>
                  {MONTHS_DE[monthData.month - 1]} {monthData.year}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
      </div>

      {selectedMonth === currentMonthKey && (
        <div className="space-y-2">
          {/* Show top entries */}
          {monthlyLeaderboard.slice(0, user ? monthlyLeaderboard.length : TEASER_COUNT).map((entry, index) => 
            renderEntry(entry, index + 1)
          )}
          
          {/* Blurred teaser for non-logged-in */}
          {!user && monthlyLeaderboard.length > TEASER_COUNT && (
            <div className="relative">
              <div className="blur-[6px] pointer-events-none select-none space-y-2">
                {monthlyLeaderboard.slice(TEASER_COUNT, Math.min(monthlyLeaderboard.length, 7)).map((entry, index) => 
                  renderEntry(entry, index + TEASER_COUNT + 1)
                )}
              </div>
              <div className="absolute inset-0 flex flex-col items-center justify-center bg-gradient-to-t from-card/90 via-card/60 to-transparent rounded-lg">
                <Lock className="w-5 h-5 text-muted-foreground mb-2" />
                <p className="text-sm font-medium text-foreground mb-3">
                  Melde dich an für das volle Ranking
                </p>
                <Button onClick={() => navigate('/auth')} size="sm">
                  Jetzt mitmachen
                </Button>
              </div>
            </div>
          )}
        </div>
      )}
      
      {selectedMonth !== currentMonthKey && (() => {
        const activeHistory = pastWinners?.find(m => `${m.year}-${m.month}` === selectedMonth);
        if (!activeHistory) return null;
        return (
          <div className="space-y-2">
            {activeHistory.winners.map(winner => 
              renderEntry(winner, winner.rank)
            )}
          </div>
        );
      })()}
    </Card>
  );
}
