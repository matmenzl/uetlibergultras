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

interface RunnerSegment {
  segment_id: number;
  segment_name: string;
  elapsed_time: number;
  rank: number;
}

interface Runner {
  athlete_name: string;
  athlete_photo: string | null;
  segments: RunnerSegment[];
  best_time: number;
  total_segments: number;
}

interface TodaysRunnersResponse {
  runners: Runner[];
  date_range: string;
  segments_fetched: number;
  total_entries: number;
  errors?: string[];
}

const formatTime = (seconds: number) => {
  const minutes = Math.floor(seconds / 60);
  const secs = seconds % 60;
  return `${minutes}:${secs.toString().padStart(2, '0')}`;
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

  const { data, isLoading, error, refetch, isFetching } = useQuery<TodaysRunnersResponse>({
    queryKey: ['todays-runners', dateRange],
    queryFn: async () => {
      const { data: { session } } = await supabase.auth.getSession();
      
      if (!session?.access_token) {
        throw new Error('Nicht eingeloggt');
      }

      const { data, error } = await supabase.functions.invoke('get-todays-runners', {
        headers: {
          Authorization: `Bearer ${session.access_token}`,
        },
        body: { date_range: dateRange },
      });

      if (error) throw error;
      return data as TodaysRunnersResponse;
    },
    staleTime: 15 * 60 * 1000, // Cache for 15 minutes
    refetchOnWindowFocus: false,
  });

  const runners = data?.runners || [];

  return (
    <Card className="p-6">
      <div className="flex items-center justify-between mb-4">
        <div className="flex items-center gap-2">
          <Users className="w-5 h-5 text-primary" />
          <h2 className="text-xl font-bold">Am Uetliberg unterwegs</h2>
        </div>
        <div className="flex items-center gap-2">
          <Select value={dateRange} onValueChange={setDateRange}>
            <SelectTrigger className="w-[140px]">
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
              key={`${runner.athlete_name}-${index}`}
              className="flex items-center gap-3 p-2 rounded-lg hover:bg-muted/50 transition-colors"
            >
              <Avatar className="h-10 w-10 border-2 border-primary/20">
                {runner.athlete_photo ? (
                  <AvatarImage src={runner.athlete_photo} alt={runner.athlete_name} />
                ) : null}
                <AvatarFallback className="bg-primary/10 text-primary font-medium">
                  {runner.athlete_name.split(' ').map(n => n[0]).join('').slice(0, 2)}
                </AvatarFallback>
              </Avatar>
              
              <div className="flex-1 min-w-0">
                <p className="font-medium truncate">{runner.athlete_name}</p>
                <div className="flex items-center gap-2 text-xs text-muted-foreground">
                  <span className="flex items-center gap-1">
                    <Mountain className="w-3 h-3" />
                    {runner.total_segments} {runner.total_segments === 1 ? 'Segment' : 'Segmente'}
                  </span>
                  <span className="flex items-center gap-1">
                    <Clock className="w-3 h-3" />
                    {formatTime(runner.best_time)}
                  </span>
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

          {data?.segments_fetched && (
            <p className="text-xs text-center text-muted-foreground pt-2 border-t">
              {data.segments_fetched} Segmente abgefragt • {data.total_entries} Einträge gefunden
            </p>
          )}
        </div>
      )}
    </Card>
  );
};
