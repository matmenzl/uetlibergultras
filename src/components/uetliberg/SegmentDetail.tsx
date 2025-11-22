import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Badge } from "@/components/ui/badge";
import { Card } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import { ExternalLink, Trophy, TrendingUp, Mountain, Clock, Award } from "lucide-react";
import { SegmentData, formatDistance, formatGrade, getDifficultyLevel, calculateElevationGain } from "@/lib/mapUtils";

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

const formatTime = (seconds: number): string => {
  const mins = Math.floor(seconds / 60);
  const secs = seconds % 60;
  return `${mins}:${secs.toString().padStart(2, '0')}`;
};

export const SegmentDetail = ({ segment, open, onOpenChange }: SegmentDetailProps) => {
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

  if (!segment) return null;

  const difficulty = getDifficultyLevel(segment.avg_grade);
  const elevationGain = calculateElevationGain(segment.elevation_high, segment.elevation_low);

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
              <div className="text-lg font-bold">{elevationGain}m</div>
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
            ) : detailData?.elevation_profile ? (
              <Card className="p-4">
                <svg viewBox="0 0 400 150" className="w-full h-48">
                  <polyline
                    points={detailData.elevation_profile
                      .map((point, idx) => {
                        const x = (idx / (detailData.elevation_profile.length - 1)) * 380 + 10;
                        const y = 140 - ((point[1] - segment.elevation_low) / (segment.elevation_high - segment.elevation_low)) * 120;
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
                        const y = 140 - ((point[1] - segment.elevation_low) / (segment.elevation_high - segment.elevation_low)) * 120;
                        return `${x},${y}`;
                      })
                      .join(' ')} 390,140`}
                    fill="hsl(var(--primary) / 0.1)"
                  />
                </svg>
                <div className="flex justify-between text-xs text-muted-foreground mt-2">
                  <span>{segment.elevation_low}m</span>
                  <span>{segment.elevation_high}m</span>
                </div>
              </Card>
            ) : (
              <Card className="p-8 text-center text-muted-foreground">
                Höhenprofil nicht verfügbar
              </Card>
            )}
          </div>

          {/* Leaderboard */}
          <div>
            <h3 className="text-lg font-semibold mb-3 flex items-center gap-2">
              <Trophy size={20} />
              Top 10 Leaderboard
            </h3>
            {isLoading ? (
              <div className="space-y-2">
                {[...Array(5)].map((_, i) => (
                  <Skeleton key={i} className="h-16 w-full" />
                ))}
              </div>
            ) : detailData?.leaderboard && detailData.leaderboard.length > 0 ? (
              <div className="space-y-2">
                {detailData.leaderboard.map((entry) => (
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
            ) : (
              <Card className="p-8 text-center text-muted-foreground">
                Keine Leaderboard-Daten verfügbar
              </Card>
            )}
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
};
