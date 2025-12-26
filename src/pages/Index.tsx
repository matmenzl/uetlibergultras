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
import { useQuery, useQueryClient } from '@tanstack/react-query';
import { MapPin, CheckCircle2, Clock, RefreshCw, ChevronDown, Activity, Mountain, Trophy, Flame, HelpCircle, X } from 'lucide-react';
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from '@/components/ui/collapsible';
import { Leaderboard } from '@/components/Leaderboard';
import { Achievements } from '@/components/Achievements';
import { StreakCounter } from '@/components/StreakCounter';
import { TodaysRunners } from '@/components/TodaysRunners';
import { WebcamBackground } from '@/components/WebcamBackground';
import { triggerFirstCheckInConfetti, triggerConfetti } from '@/lib/confetti';
import { useWeather } from '@/hooks/useWeather';
import { Dialog, DialogContent, DialogTitle } from '@/components/ui/dialog';

const MONTHS_FULL_DE = ['Januar', 'Februar', 'März', 'April', 'Mai', 'Juni', 'Juli', 'August', 'September', 'Oktober', 'November', 'Dezember'];

interface CheckIn {
  id: string;
  segment_id: number;
  activity_id: number;
  activity_name: string | null;
  elapsed_time: number | null;
  distance: number | null;
  checked_in_at: string;
  created_at: string;
  activity_distance: number | null;
  activity_elapsed_time: number | null;
}

interface SegmentInfo {
  segment_id: number;
  name: string;
  priority: string;
}

interface ActivityGroup {
  activity_id: number;
  activity_name: string;
  checked_in_at: string;
  segments: CheckIn[];
  activityDistance: number | null;
  activityElapsedTime: number | null;
}

// Get time-based greeting
const getGreeting = (): string => {
  const hour = new Date().getHours();
  if (hour >= 5 && hour < 11) return "Guten Morgen, Bergläufer! ☀️";
  if (hour >= 11 && hour < 14) return "Mittags-Power! 🌤️";
  if (hour >= 14 && hour < 18) return "Nachmittags-Energy! 🏃";
  if (hour >= 18 && hour < 22) return "Abend-Session! 🌅";
  return "Nachtläufer unterwegs! 🌙";
};

export default function Index() {
  const navigate = useNavigate();
  const [user, setUser] = useState<User | null>(null);
  const [isScanning, setIsScanning] = useState(false);
  const [scanningMonth, setScanningMonth] = useState<{
    year: number;
    month: number;
  } | null>(null);
  const [isRefreshingSegments, setIsRefreshingSegments] = useState(false);
  const [showVideoModal, setShowVideoModal] = useState(false);
  const currentYear = new Date().getFullYear();
  const currentMonth = new Date().getMonth() + 1; // 1-12
  const { toast } = useToast();
  const { data: weatherData } = useWeather();

  useEffect(() => {
    supabase.auth.getSession().then(({
      data: { session }
    }) => {
      setUser(session?.user ?? null);
    });
    const {
      data: { subscription }
    } = supabase.auth.onAuthStateChange((_event, session) => {
      setUser(session?.user ?? null);
    });
    return () => subscription.unsubscribe();
  }, []);

  // Fetch check-in history
  const {
    data: checkIns,
    isLoading: checkInsLoading,
    refetch: refetchCheckIns
  } = useQuery({
    queryKey: ['check-ins', user?.id],
    queryFn: async () => {
      const { data, error } = await supabase.from('check_ins').select('*').order('checked_in_at', {
        ascending: false
      });
      if (error) throw error;
      return data as CheckIn[];
    },
    enabled: !!user
  });

  // Fetch segment info for names
  const {
    data: segments,
    refetch: refetchSegments
  } = useQuery({
    queryKey: ['segments'],
    queryFn: async () => {
      const { data, error } = await supabase.from('uetliberg_segments').select('segment_id, name, priority');
      if (error) throw error;
      return data as SegmentInfo[];
    }
  });

  // Helper to check if a segment has a valid (non-placeholder) name
  const isValidSegment = (segmentId: number) => {
    const segment = segments?.find(s => s.segment_id === segmentId);
    if (!segment) return false;
    // Placeholder names are like "Segment 12345"
    const isPlaceholder = segment.name.startsWith('Segment ') && /^\d+$/.test(segment.name.replace('Segment ', ''));
    return !isPlaceholder;
  };

  // Check if any segments need refreshing (have placeholder names)
  const hasPlaceholderSegments = segments?.some(s => s.name.startsWith('Segment ') && /^\d+$/.test(s.name.replace('Segment ', '')));

  // Refresh segment details from Strava
  const refreshSegmentDetails = async () => {
    if (!user) return;
    setIsRefreshingSegments(true);
    try {
      const { data: { session } } = await supabase.auth.getSession();
      if (!session?.access_token) {
        throw new Error('Keine aktive Sitzung gefunden');
      }
      const { data, error } = await supabase.functions.invoke('refresh-segment-details', {
        headers: {
          Authorization: `Bearer ${session.access_token}`
        }
      });
      if (error) throw error;
      await refetchSegments();
      // Silent refresh - no toast needed
    } catch (error) {
      console.error('Refresh error:', error);
      // Silent fail - no toast for background refresh
    } finally {
      setIsRefreshingSegments(false);
    }
  };

  // Automatically refresh segment details in background when placeholders exist
  useEffect(() => {
    if (hasPlaceholderSegments && user && !isRefreshingSegments) {
      refreshSegmentDetails();
    }
  }, [hasPlaceholderSegments, user]);

  // Scan for activities of a specific month
  const scanMonth = async (year: number, month: number) => {
    if (!user) return;
    setIsScanning(true);
    setScanningMonth({ year, month });
    try {
      const { data: { session } } = await supabase.auth.getSession();
      if (!session?.access_token) {
        throw new Error('Keine aktive Sitzung gefunden');
      }
      const { error } = await supabase.functions.invoke('get-uetliberg-runs', {
        headers: {
          Authorization: `Bearer ${session.access_token}`
        },
        body: {
          year,
          month,
          per_page: 30,
          max_pages: 3
        }
      });
      if (error) throw error;
      await refetchCheckIns();

      // Check for new achievements after scan
      const achievementResult = await supabase.functions.invoke('check-achievements', {
        headers: {
          Authorization: `Bearer ${session.access_token}`
        }
      });
      if (achievementResult.data?.newAchievements?.length > 0) {
        const achievementNames = achievementResult.data.newAchievements as string[];

        // Check if this is the first check-in (first_run achievement just earned)
        if (achievementNames.includes('first_run')) {
          // Trigger epic confetti for first check-in!
          triggerFirstCheckInConfetti();
          toast({
            title: '🎉 Willkommen bei den Uetliberg Ultras!',
            description: 'Dein erster Check-in! Du bist jetzt offiziell Teil der Community!'
          });
        } else {
          // Regular confetti for other achievements
          triggerConfetti();
          toast({
            title: '🏆 Neues Achievement!',
            description: `Du hast ${achievementNames.length} neue${achievementNames.length > 1 ? ' Achievements' : 's Achievement'} freigeschaltet!`
          });
        }
      } else {
        toast({
          title: 'Boom! 💥 Gecheckt!',
          description: `${MONTHS_FULL_DE[month - 1]} ${year} erfolgreich synchronisiert.`
        });
      }
    } catch (error) {
      console.error('Scan error:', error);
      toast({
        title: 'Oops! 😅',
        description: error instanceof Error ? error.message : 'Da lief etwas schief...',
        variant: 'destructive'
      });
    } finally {
      setIsScanning(false);
      setScanningMonth(null);
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
      minute: '2-digit'
    });
  };

  const formatDistance = (meters: number | null) => {
    if (!meters) return '-';
    return (meters / 1000).toFixed(2) + ' km';
  };

  // Filter check-ins to only show those with valid segment names
  const validCheckIns = checkIns?.filter(c => isValidSegment(c.segment_id)) || [];

  // Group check-ins by activity first
  const activitiesMap = validCheckIns.reduce((groups, checkIn) => {
    if (!groups[checkIn.activity_id]) {
      groups[checkIn.activity_id] = {
        activity_id: checkIn.activity_id,
        activity_name: checkIn.activity_name || `Aktivität ${checkIn.activity_id}`,
        checked_in_at: checkIn.checked_in_at,
        segments: [],
        activityDistance: checkIn.activity_distance,
        activityElapsedTime: checkIn.activity_elapsed_time
      };
    }
    groups[checkIn.activity_id].segments.push(checkIn);
    // Use earliest segment time as activity time
    if (checkIn.checked_in_at < groups[checkIn.activity_id].checked_in_at) {
      groups[checkIn.activity_id].checked_in_at = checkIn.checked_in_at;
    }
    return groups;
  }, {} as Record<number, ActivityGroup>);

  // Group activities by date, sorted newest first
  const activitiesByDate = Object.values(activitiesMap).sort((a, b) => new Date(b.checked_in_at).getTime() - new Date(a.checked_in_at).getTime()).reduce((groups, activity) => {
    const date = new Date(activity.checked_in_at).toLocaleDateString('de-DE', {
      year: 'numeric',
      month: 'long',
      day: 'numeric'
    });
    if (!groups[date]) {
      groups[date] = [];
    }
    groups[date].push(activity);
    return groups;
  }, {} as Record<string, ActivityGroup[]>);

  // Get sorted date entries (newest first)
  const sortedDateEntries = Object.entries(activitiesByDate).sort((a, b) => {
    const dateA = new Date(Object.values(activitiesMap).find(act => new Date(act.checked_in_at).toLocaleDateString('de-DE', {
      year: 'numeric',
      month: 'long',
      day: 'numeric'
    }) === a[0])?.checked_in_at || 0);
    const dateB = new Date(Object.values(activitiesMap).find(act => new Date(act.checked_in_at).toLocaleDateString('de-DE', {
      year: 'numeric',
      month: 'long',
      day: 'numeric'
    }) === b[0])?.checked_in_at || 0);
    return dateB.getTime() - dateA.getTime();
  });

  return (
    <div className="min-h-screen flex flex-col bg-background">
      <NavBar />
      
      <main className="flex-1 container mx-auto px-4 py-8">
        <div className="max-w-5xl mx-auto">
          <div className="flex items-center gap-3 mb-2">
            <Mountain className="w-8 h-8 sm:w-10 sm:h-10 text-primary" />
            <h1 
              className="text-2xl sm:text-4xl font-bold text-foreground cursor-pointer group relative"
              onClick={() => setShowVideoModal(true)}
              title="🎵"
            >
              <span className="relative z-10 group-hover:text-primary transition-colors duration-300">
                We're Running Up That Hill
              </span>
              {/* 80s Synthwave glow effect on hover */}
              <span className="absolute inset-0 opacity-0 group-hover:opacity-100 blur-xl bg-gradient-to-r from-pink-500 via-purple-500 to-cyan-500 transition-opacity duration-500 -z-10" />
            </h1>
          </div>

          {/* Kate Bush Video Modal */}
          <Dialog open={showVideoModal} onOpenChange={setShowVideoModal}>
            <DialogContent className="sm:max-w-[640px] p-0 bg-black border-none overflow-hidden">
              <DialogTitle className="sr-only">Running Up That Hill - Kate Bush</DialogTitle>
              <div className="relative pt-[56.25%]">
                <iframe 
                  className="absolute inset-0 w-full h-full"
                  src={showVideoModal ? "https://www.youtube.com/embed/wp43OdtAAkM?si=bw5XnU0Qw20AHvl_&start=59&autoplay=1" : ""}
                  title="Kate Bush - Running Up That Hill"
                  frameBorder="0"
                  allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture; web-share"
                  referrerPolicy="strict-origin-when-cross-origin"
                  allowFullScreen
                />
              </div>
            </DialogContent>
          </Dialog>

          {/* Hero Section - unterschiedlich für eingeloggt/nicht eingeloggt */}
          <Card className="p-12 sm:p-16 mb-8 text-center border-border/30 animate-fade-in relative overflow-hidden min-h-[480px]">
            {/* Webcam Screenshot als Hintergrund */}
            <WebcamBackground />
            {/* Content */}
            <div className="relative z-20">
              <Mountain className="w-12 h-12 text-primary mx-auto mb-6 opacity-80" />
              <h2 className="text-3xl sm:text-4xl md:text-5xl font-bold mb-3 tracking-tight">{getGreeting()}</h2>
              {!user ? (
                <>
                  <p className="text-muted-foreground mb-8 text-lg max-w-md mx-auto">
                    Der Uetliberg wartet auf dich! Verbinde dich mit Strava und sammle deine Uetliberg Runs.
                  </p>
                  <Button 
                    onClick={() => navigate('/auth')} 
                    size="lg" 
                    className="text-base px-8 py-6 shadow-lg shadow-primary/25 hover:shadow-xl hover:shadow-primary/30 transition-all duration-300 hover:scale-105"
                  >
                    <MapPin className="w-4 h-4 mr-2" />
                    Los geht's mit Strava
                  </Button>
                </>
              ) : (
                <>
                  <p className="text-muted-foreground mb-8 text-lg">
                    Bereit für deinen nächsten Uetli Run?
                  </p>
                  <Button 
                    onClick={() => scanMonth(currentYear, currentMonth)} 
                    disabled={isScanning} 
                    size="lg" 
                    className="text-base sm:text-lg px-8 sm:px-10 py-6 shadow-lg shadow-primary/25 hover:shadow-xl hover:shadow-primary/30 transition-all duration-300 hover:scale-105"
                  >
                    {isScanning ? (
                      <>
                        <RefreshCw className="w-5 h-5 mr-2 animate-spin" />
                        Checke ein...
                      </>
                    ) : (
                      <>
                        <Flame className="w-5 h-5 mr-2" />
                        Run einchecken
                      </>
                    )}
                  </Button>
                </>
              )}
            </div>
          </Card>

          {/* ===== BENTO GRID LAYOUT ===== */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-8">
            {/* Today's Runners - Span 2 */}
            <div className="md:col-span-2">
              <TodaysRunners />
            </div>

            {/* Stats Sidebar - Span 1 */}
            {user ? (
              <div className="space-y-4">
                <Card className="p-5 text-center">
                  <Trophy className="w-6 h-6 text-primary mx-auto mb-2" />
                  <p className="text-3xl font-bold text-primary">{Object.keys(activitiesMap).length}</p>
                  <p className="text-sm text-muted-foreground">Uetli Runs</p>
                </Card>
                <Card className="p-5 text-center">
                  <Mountain className="w-6 h-6 text-primary mx-auto mb-2" />
                  <p className="text-3xl font-bold text-primary">
                    {new Set(validCheckIns.map(c => c.segment_id)).size}
                  </p>
                  <p className="text-sm text-muted-foreground">Uetli Segmente</p>
                </Card>
                <StreakCounter userId={user?.id} />
              </div>
            ) : (
              <div className="hidden md:block" />
            )}

            {/* Leaderboard - Span 2 */}
            <div className="md:col-span-2">
              <Leaderboard />
            </div>

            {/* Achievements - Span 1 */}
            {user && (
              <div>
                <Achievements userId={user?.id} />
              </div>
            )}
          </div>

          {/* ===== PRIVATE KOMPONENTEN (nur für eingeloggte User) ===== */}
          {user && (
            <>

              {/* Check-in History */}
              <h2 className="text-xl font-bold mb-4 flex items-center gap-2">
                <Activity className="w-5 h-5 text-primary" />
                Deine Runs
              </h2>
              
              {checkInsLoading ? (
                <div className="space-y-4">
                  {[1, 2, 3].map(i => (
                    <Card key={i} className="p-4">
                      <Skeleton className="h-5 w-3/4 mb-2" />
                      <Skeleton className="h-4 w-1/2" />
                    </Card>
                  ))}
                </div>
              ) : validCheckIns.length > 0 ? (
                <div className="space-y-6">
                  {sortedDateEntries.map(([date, activities]) => (
                    <div key={date} className="animate-fade-in">
                      <h3 className="text-sm font-medium text-muted-foreground mb-3 flex items-center gap-2">
                        <Clock className="w-4 h-4" />
                        {date}
                      </h3>
                      <div className="space-y-3">
                        {activities.map(activity => (
                          <Collapsible key={activity.activity_id}>
                            <Card className="overflow-hidden hover:shadow-md transition-shadow">
                              <CollapsibleTrigger className="w-full">
                                <div className="p-4 flex items-center gap-3 hover:bg-muted/50 transition-colors">
                                  <Activity className="w-5 h-5 text-primary flex-shrink-0" />
                                  <div className="flex-1 min-w-0 text-left">
                                    <p className="font-medium truncate">
                                      {activity.activity_name}
                                    </p>
                                    <div className="flex gap-4 mt-1 text-xs text-muted-foreground">
                                      <span>{formatDistance(activity.activityDistance)}</span>
                                      <span>{formatTime(activity.activityElapsedTime)}</span>
                                    </div>
                                  </div>
                                  <Badge variant="secondary" className="flex-shrink-0">
                                    {activity.segments.length} {activity.segments.length === 1 ? 'Segment' : 'Segmente'}
                                  </Badge>
                                  <ChevronDown className="w-4 h-4 text-muted-foreground transition-transform [[data-state=open]>&]:rotate-180" />
                                </div>
                              </CollapsibleTrigger>
                              <CollapsibleContent>
                                <div className="border-t bg-muted/30 px-4 py-2 space-y-2">
                                  {activity.segments.map(checkIn => (
                                    <div key={checkIn.id} className="flex items-center gap-3 py-2">
                                      <CheckCircle2 className="w-4 h-4 text-green-500 flex-shrink-0" />
                                      <div className="flex-1 min-w-0">
                                        <p className="text-sm font-medium truncate">
                                          {getSegmentName(checkIn.segment_id)}
                                        </p>
                                      </div>
                                      <div className="flex gap-3 text-xs text-muted-foreground">
                                        <span>{formatDistance(checkIn.distance)}</span>
                                        <span>{formatTime(checkIn.elapsed_time)}</span>
                                      </div>
                                    </div>
                                  ))}
                                </div>
                              </CollapsibleContent>
                            </Card>
                          </Collapsible>
                        ))}
                      </div>
                    </div>
                  ))}
                  
                  {/* CTA for missing runs */}
                  <Card className="p-4 mt-6 bg-muted/30 border-dashed">
                    <div className="flex items-start gap-3">
                      <HelpCircle className="w-5 h-5 text-muted-foreground flex-shrink-0 mt-0.5" />
                      <div className="flex-1">
                        <p className="text-sm text-muted-foreground">
                          <span className="font-medium text-foreground">Run fehlt?</span>{' '}
                          Falls ein Uetli-Run nicht auftaucht, können wir ihn manuell für dich holen.
                        </p>
                        <Button 
                          variant="link" 
                          className="h-auto p-0 text-primary mt-1"
                          onClick={() => navigate('/support')}
                        >
                          Support kontaktieren →
                        </Button>
                      </div>
                    </div>
                  </Card>
                </div>
              ) : (
                <Card className="p-8 text-center animate-fade-in">
                  <Mountain className="w-12 h-12 text-muted-foreground mx-auto mb-4" />
                  <h3 className="text-lg font-bold mb-2">Der Uetli wartet auf dich! 🏔️</h3>
                  <p className="text-muted-foreground mb-4">
                    Mach deinen ersten Run und check ihn ein.
                  </p>
                  <p className="text-sm text-muted-foreground">
                    Klick auf "Run einchecken" um loszulegen!
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
