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
import { AddSegmentDialog } from '@/components/AddSegmentDialog';
import { useQuery } from '@tanstack/react-query';
import { MapPin, CheckCircle2, Clock, RefreshCw } from 'lucide-react';

interface CheckIn {
  id: string;
  segment_id: number;
  activity_id: number;
  activity_name: string | null;
  elapsed_time: number | null;
  distance: number | null;
  checked_in_at: string;
  created_at: string;
}

interface SegmentInfo {
  segment_id: number;
  name: string;
  priority: string;
}

export default function Index() {
  const navigate = useNavigate();
  const [user, setUser] = useState<User | null>(null);
  const [isScanning, setIsScanning] = useState(false);
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

  // Fetch check-in history
  const { data: checkIns, isLoading: checkInsLoading, refetch: refetchCheckIns } = useQuery({
    queryKey: ['check-ins', user?.id],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('check_ins')
        .select('*')
        .order('checked_in_at', { ascending: false });
      
      if (error) throw error;
      return data as CheckIn[];
    },
    enabled: !!user,
  });

  // Fetch segment info for names
  const { data: segments, refetch: refetchSegments } = useQuery({
    queryKey: ['segments'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('uetliberg_segments')
        .select('segment_id, name, priority');
      
      if (error) throw error;
      return data as SegmentInfo[];
    },
  });

  // Scan for new activities
  const scanForActivities = async () => {
    if (!user) return;
    
    setIsScanning(true);
    try {
      const { data: { session } } = await supabase.auth.getSession();
      
      if (!session?.access_token) {
        throw new Error('Keine aktive Sitzung gefunden');
      }

      const { error } = await supabase.functions.invoke('get-uetliberg-runs', {
        headers: {
          Authorization: `Bearer ${session.access_token}`,
        },
        body: { page: 1, limit: 10 },
      });
      
      if (error) throw error;
      
      await refetchCheckIns();
      toast({
        title: 'Scan abgeschlossen',
        description: 'Neue Aktivitäten wurden gescannt und Check-ins erstellt.',
      });
    } catch (error) {
      console.error('Scan error:', error);
      toast({
        title: 'Fehler beim Scannen',
        description: error instanceof Error ? error.message : 'Unbekannter Fehler',
        variant: 'destructive',
      });
    } finally {
      setIsScanning(false);
    }
  };

  const getSegmentName = (segmentId: number) => {
    const segment = segments?.find(s => s.segment_id === segmentId);
    return segment?.name || `Segment ${segmentId}`;
  };

  const formatTime = (seconds: number | null) => {
    if (!seconds) return '-';
    const minutes = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${minutes}:${secs.toString().padStart(2, '0')}`;
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('de-DE', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
    });
  };

  const formatDistance = (meters: number | null) => {
    if (!meters) return '-';
    return (meters / 1000).toFixed(2) + ' km';
  };

  // Group check-ins by date
  const groupedCheckIns = checkIns?.reduce((groups, checkIn) => {
    const date = new Date(checkIn.checked_in_at).toLocaleDateString('de-DE', {
      year: 'numeric',
      month: 'long',
      day: 'numeric',
    });
    if (!groups[date]) {
      groups[date] = [];
    }
    groups[date].push(checkIn);
    return groups;
  }, {} as Record<string, CheckIn[]>) || {};

  return (
    <div className="min-h-screen flex flex-col bg-background">
      <NavBar />
      
      <main className="flex-1 container mx-auto px-4 py-8">
        <div className="max-w-2xl mx-auto">
          <div className="flex items-center gap-3 mb-2">
            <CheckCircle2 className="w-10 h-10 text-primary" />
            <h1 className="text-4xl font-bold text-foreground">
              Uetliberg Check-in
            </h1>
          </div>
          <p className="text-muted-foreground mb-8">
            Automatische Check-ins für deine Uetliberg-Segmente
          </p>

          {!user ? (
            <Card className="p-8 text-center">
              <CheckCircle2 className="w-16 h-16 text-primary mx-auto mb-4" />
              <h2 className="text-2xl font-bold mb-4">Willkommen!</h2>
              <p className="text-muted-foreground mb-6">
                Verbinde dich mit Strava, um automatische Check-ins für deine Uetliberg-Läufe zu erhalten.
              </p>
              <Button onClick={() => navigate('/auth')} size="lg">
                <MapPin className="w-4 h-4 mr-2" />
                Mit Strava verbinden
              </Button>
            </Card>
          ) : (
            <>
              {/* Scan Button */}
              <Card className="p-6 mb-6">
                <div className="flex items-center justify-between">
                  <div>
                    <h3 className="font-semibold text-lg">Aktivitäten scannen</h3>
                    <p className="text-sm text-muted-foreground">
                      Scanne deine neuesten Strava-Aktivitäten nach Uetliberg-Segmenten
                    </p>
                  </div>
                  <div className="flex gap-2">
                    <AddSegmentDialog onSegmentAdded={() => refetchSegments()} />
                    <Button 
                      onClick={scanForActivities} 
                      disabled={isScanning}
                      size="lg"
                    >
                      {isScanning ? (
                        <>
                          <RefreshCw className="w-4 h-4 mr-2 animate-spin" />
                          Scanne...
                        </>
                      ) : (
                        <>
                          <RefreshCw className="w-4 h-4 mr-2" />
                          Jetzt scannen
                        </>
                      )}
                    </Button>
                  </div>
                </div>
              </Card>

              {/* Stats */}
              {checkIns && checkIns.length > 0 && (
                <div className="grid grid-cols-2 gap-4 mb-6">
                  <Card className="p-4 text-center">
                    <p className="text-3xl font-bold text-primary">{checkIns.length}</p>
                    <p className="text-sm text-muted-foreground">Check-ins gesamt</p>
                  </Card>
                  <Card className="p-4 text-center">
                    <p className="text-3xl font-bold text-primary">
                      {new Set(checkIns.map(c => c.segment_id)).size}
                    </p>
                    <p className="text-sm text-muted-foreground">Verschiedene Segmente</p>
                  </Card>
                </div>
              )}

              {/* Check-in History */}
              <h2 className="text-xl font-bold mb-4">Check-in Historie</h2>
              
              {checkInsLoading ? (
                <div className="space-y-4">
                  {[1, 2, 3].map((i) => (
                    <Card key={i} className="p-4">
                      <Skeleton className="h-5 w-3/4 mb-2" />
                      <Skeleton className="h-4 w-1/2" />
                    </Card>
                  ))}
                </div>
              ) : checkIns && checkIns.length > 0 ? (
                <div className="space-y-6">
                  {Object.entries(groupedCheckIns).map(([date, dayCheckIns]) => (
                    <div key={date}>
                      <h3 className="text-sm font-medium text-muted-foreground mb-3 flex items-center gap-2">
                        <Clock className="w-4 h-4" />
                        {date}
                      </h3>
                      <div className="space-y-2">
                        {dayCheckIns.map((checkIn) => (
                          <Card key={checkIn.id} className="p-4 hover:shadow-md transition-shadow">
                            <div className="flex items-start gap-3">
                              <CheckCircle2 className="w-5 h-5 text-green-500 mt-0.5 flex-shrink-0" />
                              <div className="flex-1 min-w-0">
                                <p className="font-medium truncate">
                                  {getSegmentName(checkIn.segment_id)}
                                </p>
                                {checkIn.activity_name && (
                                  <p className="text-sm text-muted-foreground truncate">
                                    {checkIn.activity_name}
                                  </p>
                                )}
                                <div className="flex gap-4 mt-1 text-xs text-muted-foreground">
                                  <span>{formatDistance(checkIn.distance)}</span>
                                  <span>{formatTime(checkIn.elapsed_time)}</span>
                                </div>
                              </div>
                              <Badge variant="outline" className="flex-shrink-0">
                                {new Date(checkIn.checked_in_at).toLocaleTimeString('de-DE', {
                                  hour: '2-digit',
                                  minute: '2-digit',
                                })}
                              </Badge>
                            </div>
                          </Card>
                        ))}
                      </div>
                    </div>
                  ))}
                </div>
              ) : (
                <Card className="p-8 text-center">
                  <CheckCircle2 className="w-12 h-12 text-muted-foreground mx-auto mb-4" />
                  <p className="text-muted-foreground mb-4">
                    Noch keine Check-ins vorhanden
                  </p>
                  <p className="text-sm text-muted-foreground">
                    Klicke auf "Jetzt scannen" um deine Strava-Aktivitäten zu durchsuchen
                  </p>
                </Card>
              )}
            </>
          )}
        </div>
      </main>

      <Footer />
    </div>
  );
}