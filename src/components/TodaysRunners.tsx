import { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Skeleton } from '@/components/ui/skeleton';
import { Avatar, AvatarImage, AvatarFallback } from '@/components/ui/avatar';
import { Badge } from '@/components/ui/badge';
import { Users, Clock, Mountain, RefreshCw, Calendar } from 'lucide-react';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';

interface Runner {
  user_id: string;
  display_name: string;
  profile_picture: string | null;
  total_segments: number;
  best_time: number;
}

const formatTime = (seconds: number) => {
  const minutes = Math.floor(seconds / 60);
  const secs = seconds % 60;
  return `${minutes}:${secs.toString().padStart(2, '0')}`;
};

const getDateRange = (range: string): { start: Date; end: Date } => {
  const now = new Date();
  const today = new Date(now.getFullYear(), now.getMonth(), now.getDate());
  
  switch (range) {
    case 'today':
      return { start: today, end: now };
    case 'this_week': {
      const dayOfWeek = today.getDay();
      const monday = new Date(today);
      monday.setDate(today.getDate() - (dayOfWeek === 0 ? 6 : dayOfWeek - 1));
      return { start: monday, end: now };
    }
    case 'this_month':
      return { start: new Date(now.getFullYear(), now.getMonth(), 1), end: now };
    case 'this_year':
      return { start: new Date(now.getFullYear(), 0, 1), end: now };
    default:
      return { start: today, end: now };
  }
};

const getDateRangeLabel = (range: string): string => {
  switch (range) {
    case 'today':
      return 'Heute';
    case 'this_week':
      return 'Diese Woche';
    case 'this_month':
      return 'Diesen Monat';
    case 'this_year':
      return 'Dieses Jahr';
    default:
      return range;
  }
};

export const TodaysRunners = () => {
  const [dateRange, setDateRange] = useState<string>('today');

  const { data: runners = [], isLoading, error, refetch, isFetching } = useQuery<Runner[]>({
    queryKey: ['todays-runners', dateRange],
    queryFn: async () => {
      const { start, end } = getDateRange(dateRange);
      
      // Get check-ins within the date range
      const { data: checkIns, error: checkInsError } = await supabase
        .from('check_ins')
        .select('user_id, segment_id, elapsed_time, checked_in_at')
        .gte('checked_in_at', start.toISOString())
        .lte('checked_in_at', end.toISOString());

      if (checkInsError) throw checkInsError;
      if (!checkIns || checkIns.length === 0) return [];

      // Get unique user IDs
      const userIds = [...new Set(checkIns.map(c => c.user_id))];

      // Get profiles for these users
      const { data: profiles, error: profilesError } = await supabase
        .from('profiles')
        .select('id, display_name, profile_picture')
        .in('id', userIds);

      if (profilesError) throw profilesError;

      // Aggregate stats per user
      const userStats = new Map<string, { segments: Set<number>; bestTime: number }>();
      
      for (const checkIn of checkIns) {
        const existing = userStats.get(checkIn.user_id) || { segments: new Set(), bestTime: Infinity };
        existing.segments.add(checkIn.segment_id);
        if (checkIn.elapsed_time && checkIn.elapsed_time < existing.bestTime) {
          existing.bestTime = checkIn.elapsed_time;
        }
        userStats.set(checkIn.user_id, existing);
      }

      // Build runner list
      const runnerList: Runner[] = userIds.map(userId => {
        const profile = profiles?.find(p => p.id === userId);
        const stats = userStats.get(userId)!;
        return {
          user_id: userId,
          display_name: profile?.display_name || 'Unbekannt',
          profile_picture: profile?.profile_picture || null,
          total_segments: stats.segments.size,
          best_time: stats.bestTime === Infinity ? 0 : stats.bestTime,
        };
      });

      // Sort by total segments (descending), then by best time
      runnerList.sort((a, b) => {
        if (b.total_segments !== a.total_segments) {
          return b.total_segments - a.total_segments;
        }
        return a.best_time - b.best_time;
      });

      return runnerList;
    },
    staleTime: 5 * 60 * 1000,
    refetchOnWindowFocus: false,
  });

  return (
    <Card className="p-6">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 mb-4">
        <div className="flex items-center gap-2">
          <Users className="w-5 h-5 text-primary" />
          <h2 className="text-lg sm:text-xl font-bold">Am Uetliberg unterwegs</h2>
        </div>
        <div className="flex items-center gap-2">
          <Select value={dateRange} onValueChange={setDateRange}>
            <SelectTrigger className="w-full sm:w-[140px]">
              <Calendar className="w-4 h-4 mr-2" />
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="today">Heute</SelectItem>
              <SelectItem value="this_week">Diese Woche</SelectItem>
              <SelectItem value="this_month">Diesen Monat</SelectItem>
              <SelectItem value="this_year">Dieses Jahr</SelectItem>
            </SelectContent>
          </Select>
          <Button
            variant="ghost"
            size="icon"
            onClick={() => refetch()}
            disabled={isFetching}
            className="flex-shrink-0"
          >
            <RefreshCw className={`w-4 h-4 ${isFetching ? 'animate-spin' : ''}`} />
          </Button>
        </div>
      </div>

      {isLoading ? (
        <div className="space-y-3">
          {[1, 2, 3].map((i) => (
            <div key={i} className="flex items-center gap-3">
              <Skeleton className="h-10 w-10 rounded-full" />
              <div className="flex-1">
                <Skeleton className="h-4 w-32 mb-1" />
                <Skeleton className="h-3 w-24" />
              </div>
            </div>
          ))}
        </div>
      ) : error ? (
        <div className="text-center py-6 text-muted-foreground">
          <p>Fehler beim Laden der Daten</p>
          <Button variant="outline" size="sm" onClick={() => refetch()} className="mt-2">
            Erneut versuchen
          </Button>
        </div>
      ) : runners.length === 0 ? (
        <div className="text-center py-8 text-muted-foreground">
          <Mountain className="w-12 h-12 mx-auto mb-2 opacity-50" />
          <p className="font-medium">{getDateRangeLabel(dateRange)} noch keine Läufer</p>
          <p className="text-sm">Sei der Erste am Uetliberg! 🏔️</p>
        </div>
      ) : (
        <div className="space-y-3">
          {runners.slice(0, 10).map((runner, index) => (
            <div
              key={runner.user_id}
              className="flex items-center gap-3 p-2 rounded-lg hover:bg-muted/50 transition-colors"
            >
              <Avatar className="h-10 w-10 border-2 border-primary/20">
                {runner.profile_picture ? (
                  <AvatarImage src={runner.profile_picture} alt={runner.display_name} />
                ) : null}
                <AvatarFallback className="bg-primary/10 text-primary font-medium">
                  {runner.display_name.split(' ').map(n => n[0]).join('').slice(0, 2)}
                </AvatarFallback>
              </Avatar>
              
              <div className="flex-1 min-w-0">
                <p className="font-medium truncate">{runner.display_name}</p>
                <div className="flex items-center gap-2 text-xs text-muted-foreground">
                  <span className="flex items-center gap-1">
                    <Mountain className="w-3 h-3" />
                    {runner.total_segments} {runner.total_segments === 1 ? 'Segment' : 'Segmente'}
                  </span>
                  {runner.best_time > 0 && (
                    <span className="flex items-center gap-1">
                      <Clock className="w-3 h-3" />
                      {formatTime(runner.best_time)}
                    </span>
                  )}
                </div>
              </div>

              {index < 3 && (
                <Badge variant={index === 0 ? 'default' : 'secondary'} className="flex-shrink-0">
                  #{index + 1}
                </Badge>
              )}
            </div>
          ))}

          {runners.length > 10 && (
            <p className="text-sm text-center text-muted-foreground pt-2">
              +{runners.length - 10} weitere Läufer
            </p>
          )}
        </div>
      )}
    </Card>
  );
};
