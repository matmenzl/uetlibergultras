import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { supabase } from '@/integrations/supabase/client';
import { User } from '@supabase/supabase-js';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Skeleton } from '@/components/ui/skeleton';
import { Badge } from '@/components/ui/badge';
import { useToast } from '@/hooks/use-toast';
import NavBar from '@/components/NavBar';
import { Footer } from '@/components/Footer';
import { useQuery } from '@tanstack/react-query';
import { MapPin } from 'lucide-react';

interface StravaActivity {
  id: number;
  name: string;
  distance: number;
  moving_time: number;
  type: string;
  start_date: string;
  total_elevation_gain: number;
  uetliberg_score?: number;
  in_region?: boolean;
  primary_segments?: any[];
  secondary_segments?: any[];
  uetliberg_segments?: any[];
}

export default function Index() {
  const navigate = useNavigate();
  const [user, setUser] = useState<User | null>(null);
  const { toast } = useToast();

  useEffect(() => {
    supabase.auth.getSession().then(({ data: { session } }) => {
      setUser(session?.user ?? null);
    });

    const { data: { subscription } } = supabase.auth.onAuthStateChange((_event, session) => {
      setUser(session?.user ?? null);
    });

    return () => subscription.unsubscribe();
  }, []);

  // Fetch Uetliberg runs
  const { data: activitiesData, isLoading, error, refetch } = useQuery({
    queryKey: ['uetliberg-runs', user?.id],
    queryFn: async () => {
      const { data: { session } } = await supabase.auth.getSession();
      
      if (!session?.access_token) {
        throw new Error('Keine aktive Sitzung gefunden');
      }

      console.log('Calling get-uetliberg-runs with user:', user?.id);
      
      const { data, error } = await supabase.functions.invoke('get-uetliberg-runs', {
        headers: {
          Authorization: `Bearer ${session.access_token}`,
        },
      });
      
      if (error) {
        console.error('Edge function error:', error);
        // Check if it's a rate limit error
        if (error.message?.includes('429') || error.context?.status === 429) {
          throw new Error('RATE_LIMIT');
        }
        throw error;
      }
      
      return data;
    },
    enabled: !!user,
    retry: (failureCount, error) => {
      // Don't retry on rate limit errors
      if (error instanceof Error && error.message === 'RATE_LIMIT') {
        return false;
      }
      return failureCount < 2;
    },
  });


  const formatDistance = (meters: number) => {
    return (meters / 1000).toFixed(2) + ' km';
  };

  const formatTime = (seconds: number) => {
    const hours = Math.floor(seconds / 3600);
    const minutes = Math.floor((seconds % 3600) / 60);
    return hours > 0 ? `${hours}h ${minutes}m` : `${minutes}m`;
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('de-DE', {
      year: 'numeric',
      month: 'long',
      day: 'numeric'
    });
  };

  const getScoreBadgeVariant = (score: number) => {
    if (score >= 4) return 'default';
    if (score >= 2) return 'secondary';
    return 'outline';
  };

  return (
    <div className="min-h-screen flex flex-col bg-background">
      <NavBar />
      
      <main className="flex-1 container mx-auto px-4 py-8">
        <div className="max-w-4xl mx-auto">
          <div className="flex items-center gap-3 mb-8">
            <MapPin className="w-10 h-10 text-primary" />
            <h1 className="text-4xl font-bold text-foreground">
              Uetliberg Läufe 2025
            </h1>
          </div>
          
          {activitiesData && (
            <div className="mb-6 p-4 bg-muted rounded-lg">
              <p className="text-sm text-muted-foreground">
                <strong>Statistik:</strong> {activitiesData.uetliberg_runs} Uetliberg-Läufe 
                von insgesamt {activitiesData.total_runs} Läufen 
                ({activitiesData.total_activities} Aktivitäten gesamt)
              </p>
              {activitiesData.high_priority_segments !== undefined && (
                <p className="text-xs text-muted-foreground mt-1">
                  🎯 {activitiesData.high_priority_segments} Segmente am Uetliberg • 
                  📍 {activitiesData.medium_priority_segments} Segmente in der Region
                </p>
              )}
            </div>
          )}

          {!user ? (
            <Card className="p-8 text-center">
              <h2 className="text-2xl font-bold mb-4">Willkommen!</h2>
              <p className="text-muted-foreground mb-6">
                Melde dich mit Strava an, um deine Aktivitäten zu sehen
              </p>
              <Button onClick={() => navigate('/auth')}>
                Mit Strava anmelden
              </Button>
            </Card>
          ) : isLoading ? (
            <div className="space-y-4">
              {[1, 2, 3].map((i) => (
                <Card key={i} className="p-6">
                  <Skeleton className="h-6 w-3/4 mb-4" />
                  <Skeleton className="h-4 w-1/2 mb-2" />
                  <Skeleton className="h-4 w-1/3" />
                </Card>
              ))}
            </div>
          ) : error ? (
            <Card className="p-8 text-center border-destructive">
              <p className="text-destructive mb-4 font-semibold">
                {error instanceof Error && error.message === 'RATE_LIMIT'
                  ? '🕒 Strava API Rate Limit erreicht'
                  : 'Fehler beim Laden der Aktivitäten'}
              </p>
              <p className="text-sm text-muted-foreground mb-6">
                {error instanceof Error && error.message === 'RATE_LIMIT'
                  ? 'Strava limitiert die Anzahl der API-Anfragen. Bitte warte 10-15 Minuten und versuche es dann erneut.'
                  : 'Es ist ein Fehler beim Laden der Daten aufgetreten.'}
              </p>
              <Button onClick={() => refetch()}>
                Erneut versuchen
              </Button>
            </Card>
          ) : activitiesData?.activities?.length > 0 ? (
            <div className="space-y-4">
              {activitiesData.activities.map((activity: StravaActivity) => (
                <Card key={activity.id} className="p-6 hover:shadow-lg transition-shadow">
                  <div className="flex items-start justify-between mb-2">
                    <h3 className="text-xl font-bold text-foreground flex-1">
                      {activity.name}
                    </h3>
                    {activity.uetliberg_score !== undefined && (
                      <Badge variant={getScoreBadgeVariant(activity.uetliberg_score)}>
                        Score: {activity.uetliberg_score.toFixed(1)}
                      </Badge>
                    )}
                  </div>

                  <div className="grid grid-cols-2 gap-4 text-sm text-muted-foreground mb-4">
                    <div>
                      <p><strong>Typ:</strong> {activity.type}</p>
                      <p><strong>Distanz:</strong> {formatDistance(activity.distance)}</p>
                      <p><strong>Zeit:</strong> {formatTime(activity.moving_time)}</p>
                    </div>
                    <div>
                      <p><strong>Höhenmeter:</strong> {Math.round(activity.total_elevation_gain)}m</p>
                      <p><strong>Datum:</strong> {formatDate(activity.start_date)}</p>
                      {activity.in_region && (
                        <Badge variant="outline" className="mt-1">
                          <MapPin className="w-3 h-3 mr-1" />
                          In Uetliberg-Region
                        </Badge>
                      )}
                    </div>
                  </div>
                  
                  {activity.primary_segments && activity.primary_segments.length > 0 && (
                    <div className="mt-4 pt-4 border-t border-border">
                      <p className="font-semibold mb-2 text-sm flex items-center gap-2">
                        🎯 Haupt-Segmente (am Uetliberg):
                      </p>
                      <div className="space-y-2">
                        {activity.primary_segments.map((segment: any) => (
                          <div key={segment.segment_id} className="text-xs bg-primary/10 p-2 rounded">
                            <p className="font-medium">{segment.segment_name}</p>
                            <p className="text-muted-foreground">
                              {formatDistance(segment.distance)} • {formatTime(segment.moving_time)} • 
                              Steigung: {segment.average_grade.toFixed(1)}%
                            </p>
                          </div>
                        ))}
                      </div>
                    </div>
                  )}

                  {activity.secondary_segments && activity.secondary_segments.length > 0 && (
                    <div className="mt-4 pt-4 border-t border-border">
                      <p className="font-semibold mb-2 text-sm flex items-center gap-2">
                        📍 Zusätzliche Segmente (in der Region):
                      </p>
                      <div className="space-y-2">
                        {activity.secondary_segments.map((segment: any) => (
                          <div key={segment.segment_id} className="text-xs bg-accent/10 p-2 rounded">
                            <p className="font-medium">{segment.segment_name}</p>
                            <p className="text-muted-foreground">
                              {formatDistance(segment.distance)} • {formatTime(segment.moving_time)} • 
                              Steigung: {segment.average_grade.toFixed(1)}%
                            </p>
                          </div>
                        ))}
                      </div>
                    </div>
                  )}
                </Card>
              ))}
            </div>
          ) : (
            <Card className="p-8 text-center">
              <p className="text-muted-foreground mb-4">
                Keine Uetliberg-Läufe gefunden
              </p>
              {activitiesData?.message && (
                <p className="text-sm text-muted-foreground">
                  {activitiesData.message}
                </p>
              )}
            </Card>
          )}
        </div>
      </main>

      <Footer />
    </div>
  );
}
