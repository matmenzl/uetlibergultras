import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { useQuery } from "@tanstack/react-query";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import { toast } from "sonner";
import { NavBar } from "@/components/NavBar";
import { Footer } from "@/components/Footer";

interface StravaActivity {
  id: number;
  name: string;
  distance: number;
  moving_time: number;
  type: string;
  start_date: string;
  total_elevation_gain: number;
}

const MyActivities = () => {
  const navigate = useNavigate();
  const [user, setUser] = useState<any>(null);
  const [isConnected, setIsConnected] = useState(false);

  useEffect(() => {
    supabase.auth.getSession().then(({ data: { session } }) => {
      setUser(session?.user ?? null);
      if (!session?.user) {
        navigate('/auth');
      }
    });

    const { data: { subscription } } = supabase.auth.onAuthStateChange((_event, session) => {
      setUser(session?.user ?? null);
      if (!session?.user) {
        navigate('/auth');
      }
    });

    return () => subscription.unsubscribe();
  }, [navigate]);

  // Check if user has Strava connected
  useEffect(() => {
    const checkStravaConnection = async () => {
      if (!user) return;
      
      const { data } = await supabase
        .from('strava_credentials')
        .select('id')
        .eq('user_id', user.id)
        .single();
      
      setIsConnected(!!data);
    };
    
    checkStravaConnection();
  }, [user]);

  const { data: activitiesData, isLoading, error } = useQuery({
    queryKey: ['my-strava-activities', user?.id],
    queryFn: async () => {
      if (!user || !isConnected) return null;

      const { data, error } = await supabase.functions.invoke('get-my-strava-activities', {
        headers: {
          Authorization: `Bearer ${(await supabase.auth.getSession()).data.session?.access_token}`,
        },
      });

      if (error) throw error;
      return data;
    },
    enabled: !!user && isConnected,
  });

  const handleStravaLogin = () => {
    const clientId = '137865';
    const redirectUri = `${window.location.origin}/auth/strava-callback`;
    const scope = 'read,activity:read_all,activity:read';
    
    window.location.href = `https://www.strava.com/oauth/authorize?client_id=${clientId}&response_type=code&redirect_uri=${redirectUri}&approval_prompt=auto&scope=${scope}`;
  };

  const formatDistance = (meters: number) => {
    return (meters / 1000).toFixed(2) + ' km';
  };

  const formatTime = (seconds: number) => {
    const hours = Math.floor(seconds / 3600);
    const minutes = Math.floor((seconds % 3600) / 60);
    return hours > 0 ? `${hours}h ${minutes}min` : `${minutes}min`;
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('de-DE', {
      day: '2-digit',
      month: '2-digit',
      year: 'numeric',
    });
  };

  if (!user) {
    return null;
  }

  return (
    <div className="min-h-screen flex flex-col">
      <NavBar />
      <main className="flex-grow container mx-auto px-4 py-8">
        <div className="max-w-4xl mx-auto">
          <h1 className="text-4xl font-bold mb-2">Meine Aktivitäten</h1>
          <p className="text-muted-foreground mb-8">
            Deine letzten 10 Strava-Aktivitäten
          </p>

          {!isConnected ? (
            <Card>
              <CardHeader>
                <CardTitle>Strava verbinden</CardTitle>
                <CardDescription>
                  Verbinde dein Strava-Konto, um deine Aktivitäten zu sehen
                </CardDescription>
              </CardHeader>
              <CardContent>
                <Button onClick={handleStravaLogin} className="w-full">
                  Mit Strava verbinden
                </Button>
              </CardContent>
            </Card>
          ) : isLoading ? (
            <div className="space-y-4">
              {[...Array(5)].map((_, i) => (
                <Card key={i}>
                  <CardHeader>
                    <Skeleton className="h-6 w-3/4" />
                    <Skeleton className="h-4 w-1/2" />
                  </CardHeader>
                  <CardContent>
                    <Skeleton className="h-4 w-full" />
                  </CardContent>
                </Card>
              ))}
            </div>
          ) : error ? (
            <Card>
              <CardHeader>
                <CardTitle>Fehler</CardTitle>
                <CardDescription className="text-destructive">
                  {error instanceof Error ? error.message : 'Aktivitäten konnten nicht geladen werden'}
                </CardDescription>
              </CardHeader>
            </Card>
          ) : (
            <div className="space-y-4">
              {activitiesData?.activities?.map((activity: StravaActivity) => (
                <Card key={activity.id}>
                  <CardHeader>
                    <CardTitle>{activity.name}</CardTitle>
                    <CardDescription>
                      {activity.type} • {formatDate(activity.start_date)}
                    </CardDescription>
                  </CardHeader>
                  <CardContent>
                    <div className="grid grid-cols-3 gap-4 text-sm">
                      <div>
                        <span className="text-muted-foreground">Distanz:</span>
                        <br />
                        <span className="font-semibold">{formatDistance(activity.distance)}</span>
                      </div>
                      <div>
                        <span className="text-muted-foreground">Zeit:</span>
                        <br />
                        <span className="font-semibold">{formatTime(activity.moving_time)}</span>
                      </div>
                      <div>
                        <span className="text-muted-foreground">Höhenmeter:</span>
                        <br />
                        <span className="font-semibold">{activity.total_elevation_gain.toFixed(0)} m</span>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          )}
        </div>
      </main>
      <Footer />
    </div>
  );
};

export default MyActivities;
