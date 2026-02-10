import { useEffect, useState } from 'react';
import { useParams, useNavigate, Link } from 'react-router-dom';
import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Skeleton } from '@/components/ui/skeleton';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Badge } from '@/components/ui/badge';
import { ArrowLeft, Mountain, Award, Route, TrendingUp, Calendar, Snowflake, CloudRain, User, Clock, ChevronDown, ChevronUp, Trophy, Medal } from 'lucide-react';
import { BadgeGrid, EarnedBadge } from '@/components/badges/BadgeGrid';
import { badgeDefinitions, getBadgeById } from '@/config/badge-definitions';
import { format } from 'date-fns';
import { de } from 'date-fns/locale';
import NavBar from '@/components/NavBar';
import { Footer } from '@/components/Footer';
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from '@/components/ui/collapsible';

interface CheckIn {
  id: string;
  checked_in_at: string;
  segment_id: number;
  activity_id: number;
  activity_name: string | null;
  activity_distance: number | null;
  activity_elapsed_time: number | null;
  distance: number | null;
  elevation_gain: number | null;
  weather_code: number | null;
  temperature: number | null;
  is_manual: boolean | null;
}

interface Activity {
  activity_id: number;
  activity_name: string | null;
  activity_distance: number | null;
  activity_elapsed_time: number | null;
  checked_in_at: string;
  segment_count: number;
  is_manual: boolean;
  segments: { segment_id: number; name: string; distance: number; elevation_gain: number }[];
}

interface Segment {
  segment_id: number;
  name: string;
  distance: number;
  elevation_high: number | null;
  elevation_low: number | null;
}

interface UserAchievement {
  achievement: string;
  earned_at: string;
}

interface PublicProfile {
  id: string;
  display_name: string | null;
  profile_picture: string | null;
  is_founding_member: boolean | null;
  user_number: number | null;
}

const getWeatherIcon = (weatherCode: number | null, temperature: number | null) => {
  if (weatherCode) {
    const snowCodes = [71, 73, 75, 77, 85, 86];
    const rainCodes = [51, 53, 55, 61, 63, 65, 80, 81, 82, 95, 96, 99];
    if (snowCodes.includes(weatherCode)) {
      return <Snowflake className="w-3 h-3 text-blue-400" />;
    }
    if (rainCodes.includes(weatherCode)) {
      return <CloudRain className="w-3 h-3 text-blue-500" />;
    }
  }
  return null;
};

export default function PublicProfile() {
  const { userId } = useParams<{ userId: string }>();
  const navigate = useNavigate();
  const [isAuthenticated, setIsAuthenticated] = useState<boolean | null>(null);

  useEffect(() => {
    supabase.auth.getSession().then(({ data: { session } }) => {
      if (!session) {
        navigate(`/auth?returnTo=/runner/${userId}`);
      } else {
        setIsAuthenticated(true);
      }
    });
  }, [userId, navigate]);

  // Fetch profile data
  const { data: profile, isLoading: profileLoading } = useQuery({
    queryKey: ['public-profile', userId],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('public_profiles')
        .select('*')
        .eq('id', userId)
        .maybeSingle();
      if (error) throw error;
      return data as PublicProfile | null;
    },
    enabled: isAuthenticated === true && !!userId,
  });

  // Fetch check-ins with activity data
  const { data: checkIns, isLoading: checkInsLoading } = useQuery({
    queryKey: ['public-profile-checkins', userId],
    queryFn: async () => {
      const { data: checkInsData, error: checkInsError } = await supabase
        .from('check_ins')
        .select('id, checked_in_at, segment_id, activity_id, activity_name, activity_distance, activity_elapsed_time, distance, elevation_gain, weather_code, temperature, is_manual')
        .eq('user_id', userId!)
        .order('checked_in_at', { ascending: false });
      
      if (checkInsError) throw checkInsError;
      return checkInsData as CheckIn[] || [];
    },
    enabled: isAuthenticated === true && !!userId,
  });

  // Fetch all segments for names
  const { data: segments } = useQuery({
    queryKey: ['public-profile-segments', checkIns?.map(c => c.segment_id)],
    queryFn: async () => {
      const segmentIds = [...new Set(checkIns?.filter(c => c.segment_id !== 0).map(c => c.segment_id) || [])];
      if (segmentIds.length === 0) return [];
      
      const { data, error } = await supabase
        .from('uetliberg_segments')
        .select('segment_id, name, distance, elevation_high, elevation_low')
        .in('segment_id', segmentIds);
      
      if (error) throw error;
      return data as Segment[];
    },
    enabled: !!checkIns && checkIns.length > 0,
  });

  // Fetch achievements
  const { data: achievements, isLoading: achievementsLoading } = useQuery({
    queryKey: ['public-profile-achievements', userId],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('user_achievements')
        .select('achievement, earned_at')
        .eq('user_id', userId!)
        .order('earned_at', { ascending: false });
      if (error) throw error;
      return data as UserAchievement[];
    },
    enabled: isAuthenticated === true && !!userId,
  });

  // Fetch monthly challenge medals
  const { data: monthlyMedals } = useQuery({
    queryKey: ['public-profile-monthly-medals', userId],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('monthly_challenge_winners')
        .select('year, month, rank, total_runs')
        .eq('user_id', userId!)
        .order('year', { ascending: false })
        .order('month', { ascending: false });
      if (error) throw error;
      return data as { year: number; month: number; rank: number; total_runs: number }[];
    },
    enabled: isAuthenticated === true && !!userId,
  });

  if (isAuthenticated === null) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
      </div>
    );
  }

  const isLoading = profileLoading || checkInsLoading || achievementsLoading;

  // Calculate stats
  const totalRuns = checkIns ? new Set(checkIns.map(c => String(c.activity_id))).size : 0;
  const uniqueSegments = checkIns ? new Set(checkIns.filter(c => c.segment_id !== 0).map(c => c.segment_id)).size : 0;
  const totalBadges = achievements?.length || 0;

  // Convert achievements to earned badges format
  const earnedBadges: EarnedBadge[] = achievements?.map(a => ({
    id: a.achievement,
    earnedAt: a.earned_at,
  })) || [];

  // Get only earned badge definitions
  const earnedBadgeDefinitions = badgeDefinitions.filter(b => 
    earnedBadges.some(eb => eb.id === b.id)
  );

  // Create segment lookup map
  const segmentMap = new Map(segments?.map(s => [s.segment_id, s]) || []);

  // Group check-ins by activity for display
  const activityMap = new Map<number, Activity>();
  checkIns?.forEach(checkIn => {
    const existing = activityMap.get(checkIn.activity_id);
    const segment = segmentMap.get(checkIn.segment_id);
    
    if (existing) {
      // Add segment to existing activity
      if (segment && !existing.segments.some(s => s.segment_id === segment.segment_id)) {
        existing.segments.push({
          segment_id: segment.segment_id,
          name: segment.name,
          distance: segment.distance,
          elevation_gain: (segment.elevation_high || 0) - (segment.elevation_low || 0),
        });
        existing.segment_count = existing.segments.length;
      }
    } else {
      // Create new activity entry
      const segmentEntry = segment ? [{
        segment_id: segment.segment_id,
        name: segment.name,
        distance: segment.distance,
        elevation_gain: (segment.elevation_high || 0) - (segment.elevation_low || 0),
      }] : [];
      
      activityMap.set(checkIn.activity_id, {
        activity_id: checkIn.activity_id,
        activity_name: checkIn.activity_name,
        activity_distance: checkIn.activity_distance,
        activity_elapsed_time: checkIn.activity_elapsed_time,
        checked_in_at: checkIn.checked_in_at,
        segment_count: segmentEntry.length,
        is_manual: !!checkIn.is_manual,
        segments: segmentEntry,
      });
    }
  });
  
  // Sort by date and take first 20
  const activities = Array.from(activityMap.values())
    .sort((a, b) => new Date(b.checked_in_at).getTime() - new Date(a.checked_in_at).getTime())
    .slice(0, 20);

  // Group activities by date for display
  const activitiesByDate = new Map<string, Activity[]>();
  activities.forEach(activity => {
    const dateKey = format(new Date(activity.checked_in_at), 'd. MMMM yyyy', { locale: de });
    const existing = activitiesByDate.get(dateKey) || [];
    existing.push(activity);
    activitiesByDate.set(dateKey, existing);
  });

  // Helper to format elapsed time
  const formatTime = (seconds: number) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins}:${secs.toString().padStart(2, '0')}`;
  };

  return (
    <div className="min-h-screen bg-background">
      <NavBar />
      
      <main className="container mx-auto px-4 py-8 max-w-2xl">
        {/* Back Button */}
        <Button 
          variant="ghost" 
          size="sm" 
          onClick={() => navigate(-1)}
          className="mb-6"
        >
          <ArrowLeft className="w-4 h-4 mr-2" />
          Zurück
        </Button>

        {isLoading ? (
          <div className="space-y-6">
            <Card className="p-6">
              <div className="flex flex-col items-center gap-4">
                <Skeleton className="w-24 h-24 rounded-full" />
                <Skeleton className="h-6 w-48" />
                <Skeleton className="h-4 w-32" />
              </div>
            </Card>
            <Card className="p-6">
              <Skeleton className="h-20 w-full" />
            </Card>
          </div>
        ) : !profile ? (
          <Card className="p-6 text-center">
            <User className="w-12 h-12 mx-auto mb-4 text-muted-foreground" />
            <p className="text-muted-foreground">Profil nicht gefunden</p>
          </Card>
        ) : (
          <div className="space-y-6">
            {/* Profile Header */}
            <Card className="p-6">
              <div className="flex flex-col items-center gap-4">
                <Avatar className="w-24 h-24 border-4 border-primary/20">
                  <AvatarImage src={profile.profile_picture || undefined} />
                  <AvatarFallback className="text-2xl bg-primary/10 text-primary">
                    {profile.display_name?.split(' ').map(n => n[0]).join('').slice(0, 2) || '??'}
                  </AvatarFallback>
                </Avatar>
                
                <div className="text-center">
                  <h1 className="text-2xl font-bold">{profile.display_name || 'Unbekannt'}</h1>
                  <div className="flex items-center justify-center gap-2 mt-2">
                    {profile.is_founding_member && (
                      <Badge variant="secondary" className="gap-1">
                        <Mountain className="w-3 h-3" />
                        Founding Member
                      </Badge>
                    )}
                    {profile.user_number && (
                      <Badge variant="outline">#{profile.user_number}</Badge>
                    )}
                  </div>
                </div>
              </div>
            </Card>

            {/* Stats */}
            <Card className="p-6">
              <div className="grid grid-cols-3 gap-4 text-center">
                <div>
                  <div className="text-3xl font-bold text-primary">{totalRuns}</div>
                  <div className="text-xs text-muted-foreground flex items-center justify-center gap-1">
                    <Mountain className="w-3 h-3" />
                    Runs
                  </div>
                </div>
                <div>
                  <div className="text-3xl font-bold text-primary">{uniqueSegments}</div>
                  <div className="text-xs text-muted-foreground flex items-center justify-center gap-1">
                    <Route className="w-3 h-3" />
                    Segmente
                  </div>
                </div>
                <div>
                  <div className="text-3xl font-bold text-primary">{totalBadges}</div>
                  <div className="text-xs text-muted-foreground flex items-center justify-center gap-1">
                    <Award className="w-3 h-3" />
                    Badges
                  </div>
                </div>
              </div>
            </Card>

            {/* Achievements */}
            {earnedBadgeDefinitions.length > 0 && (
              <Card className="p-6">
                <h2 className="font-bold text-lg mb-4 flex items-center gap-2">
                  <Award className="w-5 h-5 text-primary" />
                  Achievements
                </h2>
                <BadgeGrid
                  badges={earnedBadgeDefinitions}
                  earnedBadges={earnedBadges}
                  size="sm"
                />
              </Card>
            )}

            {/* Recent Runs */}
            <Card className="p-6">
              <h2 className="font-bold text-lg mb-4 flex items-center gap-2">
                <Mountain className="w-5 h-5 text-primary" />
                Runs von {profile.display_name} {new Date().getFullYear()}
              </h2>
              
              {activities.length === 0 ? (
                <p className="text-center text-muted-foreground py-4">
                  Noch keine Runs vorhanden
                </p>
              ) : (
                <div className="space-y-4">
                  {Array.from(activitiesByDate.entries()).map(([dateLabel, dateActivities]) => (
                    <div key={dateLabel}>
                      {/* Date Header */}
                      <div className="flex items-center gap-2 text-sm text-muted-foreground mb-2">
                        <Clock className="w-4 h-4" />
                        {dateLabel}
                      </div>
                      
                      {/* Activities for this date */}
                      <div className="space-y-2">
                        {dateActivities.map((activity) => (
                          <Collapsible key={activity.activity_id}>
                            <div className="rounded-lg border bg-card overflow-hidden">
                              <CollapsibleTrigger className="w-full p-4 hover:bg-muted/30 transition-colors">
                                <div className="flex items-center justify-between">
                                  <div className="flex items-center gap-3">
                                    <Mountain className="w-5 h-5 text-primary" />
                                    <div className="text-left">
                                      <p className="font-medium">
                                        {activity.activity_name || (activity.is_manual ? 'Manueller Check-in' : 'Unbenannte Aktivität')}
                                      </p>
                                      <div className="flex items-center gap-3 text-sm text-muted-foreground">
                                        {activity.activity_distance && (
                                          <span>{(activity.activity_distance / 1000).toFixed(2)} km</span>
                                        )}
                                        {activity.activity_elapsed_time && (
                                          <span>{formatTime(activity.activity_elapsed_time)}</span>
                                        )}
                                      </div>
                                    </div>
                                  </div>
                                  <div className="flex items-center gap-2">
                                    <Badge variant="secondary" className="bg-primary/20 text-primary border-0">
                                      {activity.segment_count} {activity.segment_count === 1 ? 'Segment' : 'Segmente'}
                                    </Badge>
                                    <ChevronDown className="w-4 h-4 text-muted-foreground transition-transform [[data-state=open]>&]:rotate-180" />
                                  </div>
                                </div>
                              </CollapsibleTrigger>
                              
                              <CollapsibleContent>
                                <div className="border-t bg-muted/20 p-4 space-y-2">
                                  {activity.segments.length > 0 ? (
                                    activity.segments.map((segment) => (
                                      <div 
                                        key={segment.segment_id}
                                        className="flex items-center justify-between p-2 rounded bg-background/50"
                                      >
                                        <span className="text-sm font-medium">{segment.name}</span>
                                        <div className="flex items-center gap-3 text-xs text-muted-foreground">
                                          <span className="flex items-center gap-1">
                                            <Route className="w-3 h-3" />
                                            {(segment.distance / 1000).toFixed(2)} km
                                          </span>
                                          <span className="flex items-center gap-1">
                                            <TrendingUp className="w-3 h-3" />
                                            {Math.round(segment.elevation_gain)}m
                                          </span>
                                        </div>
                                      </div>
                                    ))
                                  ) : (
                                    <p className="text-sm text-muted-foreground text-center py-2">
                                      Keine Segment-Details verfügbar
                                    </p>
                                  )}
                                </div>
                              </CollapsibleContent>
                            </div>
                          </Collapsible>
                        ))}
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </Card>
          </div>
        )}
      </main>
      
      <Footer />
    </div>
  );
}
