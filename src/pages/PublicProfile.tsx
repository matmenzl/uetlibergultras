import { useEffect, useState } from 'react';
import { useParams, useNavigate, Link } from 'react-router-dom';
import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Skeleton } from '@/components/ui/skeleton';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Badge } from '@/components/ui/badge';
import { ArrowLeft, Mountain, Award, Route, TrendingUp, Calendar, Snowflake, CloudRain, User } from 'lucide-react';
import { BadgeGrid, EarnedBadge } from '@/components/badges/BadgeGrid';
import { badgeDefinitions, getBadgeById } from '@/config/badge-definitions';
import { format } from 'date-fns';
import { de } from 'date-fns/locale';
import NavBar from '@/components/NavBar';
import { Footer } from '@/components/Footer';

interface CheckIn {
  id: string;
  checked_in_at: string;
  segment_id: number;
  activity_id: number;
  distance: number | null;
  elevation_gain: number | null;
  weather_code: number | null;
  temperature: number | null;
  is_manual: boolean | null;
  segment?: {
    name: string;
    distance: number;
    elevation_high: number | null;
    elevation_low: number | null;
  };
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

  // Fetch check-ins with segment data
  const { data: checkIns, isLoading: checkInsLoading } = useQuery({
    queryKey: ['public-profile-checkins', userId],
    queryFn: async () => {
      // First get check-ins
      const { data: checkInsData, error: checkInsError } = await supabase
        .from('check_ins')
        .select('id, checked_in_at, segment_id, activity_id, distance, elevation_gain, weather_code, temperature, is_manual')
        .eq('user_id', userId!)
        .order('checked_in_at', { ascending: false });
      
      if (checkInsError) throw checkInsError;
      if (!checkInsData || checkInsData.length === 0) return [];

      // Get unique segment IDs (excluding manual check-ins with segment_id = 0)
      const segmentIds = [...new Set(checkInsData.filter(c => c.segment_id !== 0).map(c => c.segment_id))];
      
      // Fetch segment data
      const { data: segments, error: segmentsError } = await supabase
        .from('uetliberg_segments')
        .select('segment_id, name, distance, elevation_high, elevation_low')
        .in('segment_id', segmentIds);
      
      if (segmentsError) throw segmentsError;

      const segmentMap = new Map(segments?.map(s => [s.segment_id, s]) || []);

      // Combine check-ins with segment data
      return checkInsData.map(checkIn => ({
        ...checkIn,
        segment: segmentMap.get(checkIn.segment_id) || undefined,
      })) as CheckIn[];
    },
    enabled: isAuthenticated === true && !!userId,
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

  // Group check-ins by activity for display (show unique activities)
  const activityMap = new Map<string, CheckIn>();
  checkIns?.forEach(checkIn => {
    const activityKey = String(checkIn.activity_id);
    if (!activityMap.has(activityKey)) {
      activityMap.set(activityKey, checkIn);
    }
  });
  const uniqueActivities = Array.from(activityMap.values()).slice(0, 20);

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
                Letzte Runs
              </h2>
              
              {uniqueActivities.length === 0 ? (
                <p className="text-center text-muted-foreground py-4">
                  Noch keine Runs vorhanden
                </p>
              ) : (
                <div className="space-y-3">
                  {uniqueActivities.map((activity) => (
                    <div 
                      key={activity.id}
                      className="p-3 rounded-lg bg-muted/50 hover:bg-muted transition-colors"
                    >
                      <div className="flex items-center justify-between mb-1">
                        <span className="font-medium text-sm">
                          {activity.segment?.name || (activity.is_manual ? 'Manueller Check-in' : 'Unbekanntes Segment')}
                        </span>
                        <span className="text-xs text-muted-foreground flex items-center gap-1">
                          <Calendar className="w-3 h-3" />
                          {format(new Date(activity.checked_in_at), 'dd.MM.yyyy', { locale: de })}
                        </span>
                      </div>
                      <div className="flex items-center gap-3 text-xs text-muted-foreground">
                        {activity.segment && (
                          <>
                            <span className="flex items-center gap-1">
                              <Route className="w-3 h-3" />
                              {(activity.segment.distance / 1000).toFixed(1)}km
                            </span>
                            {activity.segment.elevation_high && activity.segment.elevation_low && (
                              <span className="flex items-center gap-1">
                                <TrendingUp className="w-3 h-3" />
                                {Math.round(activity.segment.elevation_high - activity.segment.elevation_low)}m
                              </span>
                            )}
                          </>
                        )}
                        {activity.is_manual && activity.distance && (
                          <span className="flex items-center gap-1">
                            <Route className="w-3 h-3" />
                            {(activity.distance / 1000).toFixed(1)}km
                          </span>
                        )}
                        {activity.is_manual && activity.elevation_gain && (
                          <span className="flex items-center gap-1">
                            <TrendingUp className="w-3 h-3" />
                            {activity.elevation_gain}m
                          </span>
                        )}
                        {getWeatherIcon(activity.weather_code, activity.temperature)}
                        {activity.temperature !== null && (
                          <span>{activity.temperature}°C</span>
                        )}
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
