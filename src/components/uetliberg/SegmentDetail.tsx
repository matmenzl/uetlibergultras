import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/tabs";
import { Badge } from "@/components/ui/badge";
import { Card } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { ExternalLink, Trophy, TrendingUp, Mountain, Clock, Award, Users } from "lucide-react";
import { SegmentData, formatDistance, formatGrade, getDifficultyLevel, calculateElevationGain } from "@/lib/mapUtils";
import { useState } from "react";

interface SegmentDetailProps {
  segment: SegmentData | null;
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

interface LeaderboardEntry {
  athlete_name: string;
  elapsed_time: number;
  rank: number;
}

interface SegmentDetailData {
  segment?: {
    elevation_high: number;
    elevation_low: number;
  };
  leaderboard: LeaderboardEntry[];
  elevation_profile: number[][];
}

interface PersonalRecord {
  elapsed_time: number;
  moving_time: number;
  start_date: string;
  pr_rank: number | null;
  kom_rank: number | null;
}

interface Achievement {
  achievement_type: string;
  earned_at: string;
  metadata: any;
}

interface MostActiveEntry {
  id: string;
  rank: number;
  firstName: string;
  lastName: string;
  profilePicture?: string;
  totalEfforts: number;
  lastActivity: string | null;
}

const formatTime = (seconds: number): string => {
  const mins = Math.floor(seconds / 60);
  const secs = seconds % 60;
  return `${mins}:${secs.toString().padStart(2, '0')}`;
};

export const SegmentDetail = ({ segment, open, onOpenChange }: SegmentDetailProps) => {
  const [activeTab, setActiveTab] = useState<'fastest' | 'most-active'>('fastest');
  const { data: detailData, isLoading } = useQuery({
    queryKey: ['segment-detail', segment?.id],
    queryFn: async () => {
      if (!segment) return null;
      
      const { data, error } = await supabase.functions.invoke('strava-segment-detail', {
        body: { segmentId: segment.id }
      });
      
      if (error) throw error;
      return data as SegmentDetailData;
    },
    enabled: open && !!segment,
  });

  // Fetch user's personal record for this segment
  const { data: personalRecord, isLoading: prLoading } = useQuery({
    queryKey: ['personal-record', segment?.id],
    queryFn: async () => {
      if (!segment) return null;
      
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return null;

      const { data, error } = await supabase
        .from('segment_efforts')
        .select('*')
        .eq('user_id', user.id)
        .eq('segment_id', segment.id)
        .order('elapsed_time', { ascending: true })
        .limit(1)
        .maybeSingle();

      return data as PersonalRecord | null;
    },
    enabled: open && !!segment,
  });

  // Fetch local leaderboard from database (fallback when Strava API fails)
  const { data: localLeaderboard } = useQuery({
    queryKey: ['local-leaderboard', segment?.id],
    queryFn: async () => {
      if (!segment) return [];
      
      const { data, error } = await supabase
        .from('segment_efforts')
        .select(`
          elapsed_time,
          user_id,
          profiles:user_id (
            first_name,
            last_name
          )
        `)
        .eq('segment_id', segment.id)
        .order('elapsed_time', { ascending: true })
        .limit(10);

      if (error) {
        console.error('Error fetching local leaderboard:', error);
        return [];
      }

      return (data || []).map((effort: any, index: number) => ({
        rank: index + 1,
        athlete_name: effort.profiles 
          ? `${effort.profiles.first_name || ''} ${effort.profiles.last_name || ''}`.trim() || 'Unbekannt'
          : 'Unbekannt',
        elapsed_time: effort.elapsed_time,
      }));
    },
    enabled: open && !!segment,
  });

  // Fetch achievements for this segment
  const { data: achievements } = useQuery({
    queryKey: ['achievements', segment?.id],
    queryFn: async () => {
      if (!segment) return [];
      
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return [];

      const { data, error } = await supabase
        .from('achievements')
        .select('*')
        .eq('user_id', user.id)
        .eq('segment_id', segment.id)
        .order('earned_at', { ascending: false });

      return (data || []) as Achievement[];
    },
    enabled: open && !!segment,
  });

  // Fetch "Most Active Athletes" for this segment
  const { data: mostActiveData, isLoading: mostActiveLoading } = useQuery({
    queryKey: ['most-active-segment', segment?.id],
    queryFn: async () => {
      if (!segment) return [];

      const { data, error } = await supabase.functions.invoke('get-activity-leaderboards', {
        body: { 
          type: 'most-efforts-segment',
          segment_id: segment.id 
        },
      });

      if (error) {
        console.error('Error fetching most active athletes:', error);
        throw error;
      }

      return (data?.entries || []) as MostActiveEntry[];
    },
    enabled: open && !!segment && activeTab === 'most-active',
  });

  if (!segment) return null;

  const difficulty = getDifficultyLevel(segment.avg_grade);
  // Use elevation data from detail API if available, fallback to segment data
  const elevationHigh = detailData?.segment?.elevation_high ?? segment.elevation_high;
  const elevationLow = detailData?.segment?.elevation_low ?? segment.elevation_low;
  const elevationGain = calculateElevationGain(elevationHigh, elevationLow);

  const difficultyColors = {
    easy: 'bg-green-500',
    medium: 'bg-orange-500',
    hard: 'bg-red-500',
  };

  const difficultyLabels = {
    easy: 'Leicht',
    medium: 'Mittel',
    hard: 'Schwer',
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-2xl max-h-[80vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="flex items-center justify-between">
            <span className="pr-8">{segment.name}</span>
            <a
              href={`https://www.strava.com/segments/${segment.id}`}
              target="_blank"
              rel="noopener noreferrer"
              className="text-primary hover:text-primary/80"
            >
              <ExternalLink size={20} />
            </a>
          </DialogTitle>
        </DialogHeader>

        <div className="space-y-6">
          {/* Personal Record Section */}
          {personalRecord && (
            <Card className="p-6 bg-gradient-to-br from-primary/5 to-primary/10 border-primary/20">
              <h3 className="text-lg font-semibold mb-4 flex items-center gap-2">
                <Award className="text-primary" size={24} />
                Dein Persönlicher Rekord
              </h3>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <p className="text-sm text-muted-foreground">Beste Zeit</p>
                  <p className="text-2xl font-bold text-primary">
                    {formatTime(personalRecord.elapsed_time)}
                  </p>
                </div>
                {personalRecord.pr_rank && (
                  <div>
                    <p className="text-sm text-muted-foreground">PR Rang</p>
                    <p className="text-2xl font-bold">#{personalRecord.pr_rank}</p>
                  </div>
                )}
                <div className="col-span-2">
                  <p className="text-sm text-muted-foreground">Erreicht am</p>
                  <p className="font-medium">
                    {new Date(personalRecord.start_date).toLocaleDateString('de-DE', {
                      year: 'numeric',
                      month: 'long',
                      day: 'numeric'
                    })}
                  </p>
                </div>
              </div>
            </Card>
          )}

          {/* Achievements */}
          {achievements && achievements.length > 0 && (
            <div>
              <h3 className="text-lg font-semibold mb-3 flex items-center gap-2">
                <Trophy size={20} className="text-yellow-500" />
                Erfolge
              </h3>
              <div className="space-y-2">
                {achievements.map((achievement, idx) => (
                  <Card key={idx} className="p-4 bg-yellow-500/5 border-yellow-500/20">
                    <div className="flex items-center gap-3">
                      <div className="w-10 h-10 rounded-full bg-yellow-500/20 flex items-center justify-center">
                        <Trophy className="text-yellow-500" size={20} />
                      </div>
                      <div>
                        <p className="font-medium">
                          {achievement.achievement_type === 'personal_record' && 'Persönlicher Rekord!'}
                          {achievement.achievement_type === 'first_segment' && 'Erstes Segment!'}
                          {achievement.achievement_type === '10_segments' && '10 Segmente!'}
                        </p>
                        {achievement.metadata?.message && (
                          <p className="text-sm text-muted-foreground">
                            {achievement.metadata.message}
                          </p>
                        )}
                      </div>
                    </div>
                  </Card>
                ))}
              </div>
            </div>
          )}

          {/* Stats Overview */}
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            <Card className="p-4">
              <div className="flex items-center gap-2 mb-1">
                <TrendingUp size={16} className="text-muted-foreground" />
                <span className="text-xs text-muted-foreground">Distanz</span>
              </div>
              <div className="text-lg font-bold">{formatDistance(segment.distance)}</div>
            </Card>
            <Card className="p-4">
              <div className="flex items-center gap-2 mb-1">
                <Mountain size={16} className="text-muted-foreground" />
                <span className="text-xs text-muted-foreground">Höhenmeter</span>
              </div>
              <div className="text-lg font-bold">
                {!isNaN(elevationGain) && elevationGain > 0 ? `${elevationGain}m` : 'N/A'}
              </div>
            </Card>
            <Card className="p-4">
              <div className="flex items-center gap-2 mb-1">
                <TrendingUp size={16} className="text-muted-foreground" />
                <span className="text-xs text-muted-foreground">Steigung</span>
              </div>
              <div className="text-lg font-bold">{formatGrade(segment.avg_grade)}</div>
            </Card>
            <Card className="p-4">
              <div className="flex items-center gap-2 mb-1">
                <Trophy size={16} className="text-muted-foreground" />
                <span className="text-xs text-muted-foreground">Versuche</span>
              </div>
              <div className="text-lg font-bold">{segment.effort_count}</div>
            </Card>
          </div>

          {/* Difficulty Badge */}
          <div>
            <Badge className={difficultyColors[difficulty]}>
              {difficultyLabels[difficulty]}
            </Badge>
          </div>

          {/* Elevation Profile */}
          <div>
            <h3 className="text-lg font-semibold mb-3 flex items-center gap-2">
              <Mountain size={20} />
              Höhenprofil
            </h3>
            {isLoading ? (
              <Skeleton className="h-48 w-full" />
            ) : detailData?.elevation_profile && detailData.elevation_profile.length > 0 ? (
              <Card className="p-4">
                <svg viewBox="0 0 400 150" className="w-full h-48">
                  {(() => {
                    const elevations = detailData.elevation_profile.map(p => p[1]);
                    const minElev = Math.min(...elevations);
                    const maxElev = Math.max(...elevations);
                    const elevRange = maxElev - minElev;
                    
                    if (elevRange === 0) {
                      return <text x="200" y="75" textAnchor="middle" className="fill-muted-foreground">Höhenprofil nicht verfügbar</text>;
                    }
                    
                    return (
                      <>
                        <polyline
                          points={detailData.elevation_profile
                            .map((point, idx) => {
                              const x = (idx / (detailData.elevation_profile.length - 1)) * 380 + 10;
                              const y = 140 - ((point[1] - minElev) / elevRange) * 120;
                              return `${x},${y}`;
                            })
                            .join(' ')}
                          fill="none"
                          stroke="hsl(var(--primary))"
                          strokeWidth="2"
                        />
                        <polyline
                          points={`10,140 ${detailData.elevation_profile
                            .map((point, idx) => {
                              const x = (idx / (detailData.elevation_profile.length - 1)) * 380 + 10;
                              const y = 140 - ((point[1] - minElev) / elevRange) * 120;
                              return `${x},${y}`;
                            })
                            .join(' ')} 390,140`}
                          fill="hsl(var(--primary) / 0.1)"
                        />
                      </>
                    );
                  })()}
                </svg>
                {detailData.elevation_profile.length > 0 && (() => {
                  const elevations = detailData.elevation_profile.map(p => p[1]);
                  const minElev = Math.min(...elevations);
                  const maxElev = Math.max(...elevations);
                  return (
                    <div className="flex justify-between text-xs text-muted-foreground mt-2">
                      <span>{Math.round(minElev)}m</span>
                      <span>{Math.round(maxElev)}m</span>
                    </div>
                  );
                })()}
              </Card>
            ) : (
              <Card className="p-8 text-center text-muted-foreground">
                Höhenprofil nicht verfügbar
              </Card>
            )}
          </div>

          {/* Leaderboard with Tabs */}
          <div>
            <h3 className="text-lg font-semibold mb-3 flex items-center gap-2">
              <Trophy size={20} />
              Leaderboard
            </h3>
            <Tabs value={activeTab} onValueChange={(v) => setActiveTab(v as 'fastest' | 'most-active')}>
              <TabsList className="grid w-full grid-cols-2 mb-4">
                <TabsTrigger value="fastest">
                  <Clock className="mr-2 h-4 w-4" />
                  Schnellste
                </TabsTrigger>
                <TabsTrigger value="most-active">
                  <Users className="mr-2 h-4 w-4" />
                  Most Active
                </TabsTrigger>
              </TabsList>

              {/* Fastest Times Tab */}
              <TabsContent value="fastest" className="mt-0">
                {isLoading ? (
                  <div className="space-y-2">
                    {[...Array(5)].map((_, i) => (
                      <Skeleton key={i} className="h-16 w-full" />
                    ))}
                  </div>
                ) : (() => {
                  // Use Strava leaderboard if available, otherwise use local leaderboard
                  const leaderboardData = detailData?.leaderboard && detailData.leaderboard.length > 0 
                    ? detailData.leaderboard 
                    : localLeaderboard || [];
                  
                  return leaderboardData.length > 0 ? (
                    <>
                      {!detailData?.leaderboard || detailData.leaderboard.length === 0 ? (
                        <p className="text-sm text-muted-foreground mb-3">
                          Zeigt Zeiten von App-Nutzern (Strava-Leaderboard nicht verfügbar)
                        </p>
                      ) : null}
                      <div className="space-y-2">
                        {leaderboardData.map((entry) => (
                          <Card key={entry.rank} className="p-4">
                            <div className="flex items-center justify-between">
                              <div className="flex items-center gap-3">
                                <div className={`w-8 h-8 rounded-full flex items-center justify-center font-bold ${
                                  entry.rank === 1 ? 'bg-yellow-500 text-yellow-950' :
                                  entry.rank === 2 ? 'bg-gray-400 text-gray-950' :
                                  entry.rank === 3 ? 'bg-amber-700 text-amber-50' :
                                  'bg-muted text-muted-foreground'
                                }`}>
                                  {entry.rank}
                                </div>
                                <span className="font-medium">{entry.athlete_name}</span>
                              </div>
                              <div className="flex items-center gap-2">
                                <Clock size={16} className="text-muted-foreground" />
                                <span className="font-mono font-bold">{formatTime(entry.elapsed_time)}</span>
                              </div>
                            </div>
                          </Card>
                        ))}
                      </div>
                    </>
                  ) : (
                    <Card className="p-8 text-center text-muted-foreground">
                      Keine Leaderboard-Daten verfügbar
                    </Card>
                  );
                })()}
              </TabsContent>

              {/* Most Active Tab */}
              <TabsContent value="most-active" className="mt-0">
                {mostActiveLoading ? (
                  <div className="space-y-2">
                    {[...Array(5)].map((_, i) => (
                      <Skeleton key={i} className="h-16 w-full" />
                    ))}
                  </div>
                ) : mostActiveData && mostActiveData.length > 0 ? (
                  <>
                    <p className="text-sm text-muted-foreground mb-3">
                      Wer hat dieses Segment am häufigsten absolviert?
                    </p>
                    <div className="space-y-2">
                      {mostActiveData.map((entry) => (
                        <Card key={entry.id} className="p-4">
                          <div className="flex items-center justify-between">
                            <div className="flex items-center gap-3">
                              <div className={`w-8 h-8 rounded-full flex items-center justify-center font-bold ${
                                entry.rank === 1 ? 'bg-yellow-500 text-yellow-950' :
                                entry.rank === 2 ? 'bg-gray-400 text-gray-950' :
                                entry.rank === 3 ? 'bg-amber-700 text-amber-50' :
                                'bg-muted text-muted-foreground'
                              }`}>
                                {entry.rank}
                              </div>
                              <Avatar className="h-10 w-10">
                                <AvatarImage src={entry.profilePicture} alt={`${entry.firstName} ${entry.lastName}`} />
                                <AvatarFallback className="bg-primary/10 text-primary">
                                  {entry.firstName[0]}{entry.lastName[0]}
                                </AvatarFallback>
                              </Avatar>
                              <div>
                                <p className="font-medium">{entry.firstName} {entry.lastName}</p>
                                {entry.lastActivity && (
                                  <p className="text-xs text-muted-foreground">
                                    Zuletzt: {new Date(entry.lastActivity).toLocaleDateString('de-DE')}
                                  </p>
                                )}
                              </div>
                            </div>
                            <div className="text-right">
                              <p className="text-2xl font-bold text-primary">{entry.totalEfforts}</p>
                              <p className="text-xs text-muted-foreground">Versuche</p>
                            </div>
                          </div>
                        </Card>
                      ))}
                    </div>
                  </>
                ) : (
                  <Card className="p-8 text-center text-muted-foreground">
                    <Users className="mx-auto mb-2 h-8 w-8 opacity-50" />
                    <p>Noch keine Daten verfügbar</p>
                    <p className="text-sm mt-1">Sei der Erste, der seine Strava-Daten synchronisiert!</p>
                  </Card>
                )}
              </TabsContent>
            </Tabs>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
};
