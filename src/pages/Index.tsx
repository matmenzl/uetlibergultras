import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { supabase } from '@/integrations/supabase/client';
import { User } from '@supabase/supabase-js';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Skeleton } from '@/components/ui/skeleton';
import NavBar from '@/components/NavBar';
import { Footer } from '@/components/Footer';
import { useQuery } from '@tanstack/react-query';

interface StravaActivity {
  id: number;
  name: string;
  distance: number;
  moving_time: number;
  type: string;
  start_date: string;
  total_elevation_gain: number;
}

export default function Index() {
  const navigate = useNavigate();
  const [user, setUser] = useState<User | null>(null);

  useEffect(() => {
    supabase.auth.getSession().then(({ data: { session } }) => {
      setUser(session?.user ?? null);
    });

    const { data: { subscription } } = supabase.auth.onAuthStateChange((_event, session) => {
      setUser(session?.user ?? null);
    });

    return () => subscription.unsubscribe();
  }, []);

  // Fetch Uetliberg segments first (only once)
  const { data: segmentsData } = useQuery({
    queryKey: ['uetliberg-segments', user?.id],
    queryFn: async () => {
      const { data: { session } } = await supabase.auth.getSession();
      
      if (!session?.access_token) {
        throw new Error('Keine aktive Sitzung gefunden');
      }

      console.log('Fetching Uetliberg segments...');
      
      const { data, error } = await supabase.functions.invoke('get-uetliberg-segments', {
        headers: {
          Authorization: `Bearer ${session.access_token}`,
        },
      });
      
      if (error) {
        console.error('Segments fetch error:', error);
        throw error;
      }
      
      return data;
    },
    enabled: !!user,
    retry: false,
    staleTime: Infinity, // Only fetch segments once per session
  });

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
        throw error;
      }
      
      return data;
    },
    enabled: !!user && !!segmentsData, // Only fetch runs after segments are loaded
    retry: false,
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

  return (
    <div className="min-h-screen flex flex-col bg-background">
      <NavBar />
      
      <main className="flex-1 container mx-auto px-4 py-8">
        <div className="max-w-4xl mx-auto">
          <h1 className="text-4xl font-bold mb-8 text-foreground">
            Uetliberg Läufe 2025
          </h1>
          
          {activitiesData && (
            <div className="mb-6 p-4 bg-muted rounded-lg">
              <p className="text-sm text-muted-foreground">
                <strong>Statistik:</strong> {activitiesData.uetliberg_runs} Uetliberg-Läufe 
                von insgesamt {activitiesData.total_runs} Läufen 
                ({activitiesData.total_activities} Aktivitäten gesamt)
              </p>
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
              <p className="text-destructive mb-4">
                Fehler beim Laden der Aktivitäten
              </p>
              <Button onClick={() => window.location.reload()}>
                Erneut versuchen
              </Button>
            </Card>
          ) : activitiesData?.activities?.length > 0 ? (
            <div className="space-y-4">
              {activitiesData.activities.map((activity: any) => (
                <Card key={activity.id} className="p-6 hover:shadow-lg transition-shadow">
                  <h3 className="text-xl font-bold mb-2 text-foreground">
                    {activity.name}
                  </h3>
                  <div className="grid grid-cols-2 gap-4 text-sm text-muted-foreground mb-4">
                    <div>
                      <p><strong>Typ:</strong> {activity.type}</p>
                      <p><strong>Distanz:</strong> {formatDistance(activity.distance)}</p>
                      <p><strong>Zeit:</strong> {formatTime(activity.moving_time)}</p>
                    </div>
                    <div>
                      <p><strong>Höhenmeter:</strong> {Math.round(activity.total_elevation_gain)}m</p>
                      <p><strong>Datum:</strong> {formatDate(activity.start_date)}</p>
                    </div>
                  </div>
                  
                  {activity.uetliberg_segments && activity.uetliberg_segments.length > 0 && (
                    <div className="mt-4 pt-4 border-t border-border">
                      <p className="font-semibold mb-2 text-sm">Uetliberg Segmente:</p>
                      <div className="space-y-2">
                        {activity.uetliberg_segments.map((segment: any) => (
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
