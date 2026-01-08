import { useQuery } from '@tanstack/react-query';
import { useState, useEffect, useRef } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { Card } from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { PassHeader } from './PassHeader';
import { PassPage } from './PassPage';
import { AchievementSuggestionForm } from '@/components/AchievementSuggestionForm';
import { badgeDefinitions, getBadgesByCategory, BadgeCategory } from '@/config/badge-definitions';
import { EarnedBadge } from '@/components/badges';

// Time window for "newly earned" animation (30 seconds)
const NEW_ACHIEVEMENT_WINDOW_MS = 30000;

interface Achievement {
  id: string;
  user_id: string;
  achievement: string;
  earned_at: string;
}

const SNOW_CODES = [71, 73, 75, 77, 85, 86];
const RAIN_CODES = [51, 53, 55, 56, 57, 61, 63, 65, 66, 67, 80, 81, 82, 95, 96, 99];

// Streak calculation helpers
function getWeekNumber(date: Date): string {
  const d = new Date(Date.UTC(date.getFullYear(), date.getMonth(), date.getDate()));
  d.setUTCDate(d.getUTCDate() + 4 - (d.getUTCDay() || 7));
  const yearStart = new Date(Date.UTC(d.getUTCFullYear(), 0, 1));
  const weekNo = Math.ceil((((d.getTime() - yearStart.getTime()) / 86400000) + 1) / 7);
  return `${d.getUTCFullYear()}-W${weekNo}`;
}

function calculateStreak(checkIns: { checked_in_at: string }[]): number {
  if (!checkIns || checkIns.length === 0) return 0;

  const currentYear = new Date().getFullYear();
  const currentYearCheckIns = checkIns.filter(c => 
    new Date(c.checked_in_at).getFullYear() === currentYear
  );
  
  if (currentYearCheckIns.length === 0) return 0;

  const weeksWithActivity = new Set<string>();
  currentYearCheckIns.forEach(checkIn => {
    const week = getWeekNumber(new Date(checkIn.checked_in_at));
    weeksWithActivity.add(week);
  });

  const now = new Date();
  const currentWeek = getWeekNumber(now);
  let checkWeek = currentWeek;
  
  if (!weeksWithActivity.has(currentWeek)) {
    const dayOfWeek = now.getDay();
    if (dayOfWeek <= 2) {
      const lastWeek = new Date(now);
      lastWeek.setDate(lastWeek.getDate() - 7);
      checkWeek = getWeekNumber(lastWeek);
    } else {
      return 0;
    }
  }

  let streak = 0;
  let weekDate = new Date(now);
  if (checkWeek !== currentWeek) {
    weekDate.setDate(weekDate.getDate() - 7);
  }
  
  while (true) {
    const week = getWeekNumber(weekDate);
    if (weeksWithActivity.has(week)) {
      streak++;
      weekDate.setDate(weekDate.getDate() - 7);
    } else {
      break;
    }
  }

  return streak;
}

interface UetlibergPassProps {
  userId?: string;
  displayName?: string;
  compact?: boolean;
}

export function UetlibergPass({ userId, displayName, compact = false }: UetlibergPassProps) {
  // Fetch earned achievements
  const { data: earnedAchievements } = useQuery({
    queryKey: ['achievements', userId],
    queryFn: async () => {
      if (!userId) return [];
      const { data, error } = await supabase
        .from('user_achievements')
        .select('*')
        .eq('user_id', userId);
      if (error) throw error;
      return data as Achievement[];
    },
    enabled: !!userId,
  });

  // Fetch check-ins for progress calculation
  const { data: checkIns } = useQuery({
    queryKey: ['pass-checkins', userId],
    queryFn: async () => {
      if (!userId) return [];
      const { data, error } = await supabase
        .from('check_ins')
        .select('checked_in_at, segment_id, activity_id, weather_code, temperature')
        .eq('user_id', userId);
      if (error) throw error;
      return data;
    },
    enabled: !!userId,
  });

  // Fetch total segments
  const { data: totalSegments } = useQuery({
    queryKey: ['total-segments'],
    queryFn: async () => {
      const { count, error } = await supabase
        .from('uetliberg_segments')
        .select('*', { count: 'exact', head: true });
      if (error) throw error;
      return count || 0;
    },
  });

  const earnedSet = new Set(earnedAchievements?.map(a => a.achievement) || []);
  const earnedMap = new Map(earnedAchievements?.map(a => [a.achievement, a.earned_at]) || []);

  // Calculate stats - count UNIQUE activities (runs), not segments
  const uniqueActivities = new Set(checkIns?.map(c => c.activity_id) || []);
  const totalRuns = uniqueActivities.size;
  const uniqueSegments = new Set(checkIns?.map(c => c.segment_id) || []).size;
  const currentStreak = calculateStreak(checkIns || []);
  
  // Coiffeur runs (unique activities on Coiffeur segments in current year)
  const COIFFEUR_SEGMENT_IDS = [4185072, 10683811];
  const currentYear = new Date().getFullYear();
  const coiffeurRuns = new Set(
    checkIns?.filter(c => {
      const checkInYear = new Date(c.checked_in_at).getFullYear();
      return checkInYear === currentYear && COIFFEUR_SEGMENT_IDS.includes(c.segment_id);
    }).map(c => c.activity_id) || []
  ).size;
  
  // Weather runs
  const snowRuns = new Set(
    checkIns?.filter(c => c.weather_code !== null && SNOW_CODES.includes(c.weather_code))
      .map(c => c.activity_id) || []
  ).size;
  
  const frostRuns = new Set(
    checkIns?.filter(c => c.temperature !== null && c.temperature < 0)
      .map(c => c.activity_id) || []
  ).size;
  
  const rainRuns = new Set(
    checkIns?.filter(c => c.weather_code !== null && RAIN_CODES.includes(c.weather_code))
      .map(c => c.activity_id) || []
  ).size;

  // Get progress for an achievement
  const getProgress = (badgeId: string, target?: number, progressType?: string): { current: number; target: number } | null => {
    if (!progressType || !target) return null;
    
    switch (progressType) {
      case 'runs':
        if (badgeId === 'coiffeur') return { current: Math.min(coiffeurRuns, target), target };
        if (badgeId === 'snow_bunny') return { current: Math.min(snowRuns, target), target };
        if (badgeId === 'frosty') return { current: Math.min(frostRuns, target), target };
        if (badgeId === 'wasserratte') return { current: Math.min(rainRuns, target), target };
        return { current: Math.min(totalRuns, target), target };
      case 'streak':
        return { current: Math.min(currentStreak, target), target };
      case 'segments':
        return { current: uniqueSegments, target: totalSegments || 0 };
      default:
        return null;
    }
  };

  // Track which achievements were already seen (for animation)
  const seenAchievementsRef = useRef<Set<string>>(new Set());
  const [newlyEarnedAchievements, setNewlyEarnedAchievements] = useState<Set<string>>(new Set());

  // Check for newly earned achievements
  useEffect(() => {
    if (!earnedAchievements) return;

    const newlyEarned = new Set<string>();
    const now = Date.now();

    earnedAchievements.forEach(a => {
      const earnedTime = new Date(a.earned_at).getTime();
      const isRecent = now - earnedTime < NEW_ACHIEVEMENT_WINDOW_MS;
      const notSeenBefore = !seenAchievementsRef.current.has(a.achievement);

      if (isRecent && notSeenBefore) {
        newlyEarned.add(a.achievement);
      }
      seenAchievementsRef.current.add(a.achievement);
    });

    if (newlyEarned.size > 0) {
      setNewlyEarnedAchievements(newlyEarned);
      // Clear the "newly earned" state after animation completes
      const timer = setTimeout(() => {
        setNewlyEarnedAchievements(new Set());
      }, 2000);
      return () => clearTimeout(timer);
    }
  }, [earnedAchievements]);

  // Build earned badges data for a category
  const buildEarnedBadges = (category: BadgeCategory): EarnedBadge[] => {
    const badges = getBadgesByCategory(category);
    return badges.map(badge => ({
      id: badge.id,
      earnedAt: earnedMap.get(badge.id),
      progress: getProgress(badge.id, badge.target, badge.progressType),
      isNewlyEarned: newlyEarnedAchievements.has(badge.id),
    }));
  };

  const earnedCount = badgeDefinitions.filter(b => earnedSet.has(b.id)).length;

  return (
    <Card className="bg-pass-paper dark:bg-card border-0 shadow-md overflow-hidden">
      {/* Paper texture overlay */}
      <div className="absolute inset-0 opacity-[0.03] pointer-events-none bg-[url('data:image/svg+xml,%3Csvg viewBox=%220 0 200 200%22 xmlns=%22http://www.w3.org/2000/svg%22%3E%3Cfilter id=%22noise%22%3E%3CfeTurbulence type=%22fractalNoise%22 baseFrequency=%220.9%22 numOctaves=%224%22 stitchTiles=%22stitch%22/%3E%3C/filter%3E%3Crect width=%22100%25%22 height=%22100%25%22 filter=%22url(%23noise)%22/%3E%3C/svg%3E')]" />
      
      <div className="relative p-4 sm:p-6">
        <PassHeader 
          displayName={displayName}
          earnedCount={earnedCount}
          totalCount={badgeDefinitions.length}
        />

        {compact ? (
          // Compact view: horizontal scroll of recent/next badges
          <div className="flex gap-3 overflow-x-auto pb-2 -mx-2 px-2">
            {badgeDefinitions.slice(0, 8).map(badge => {
              const isEarned = earnedSet.has(badge.id);
              return (
                <div key={badge.id} className="flex-shrink-0">
                  <div 
                    className={`w-14 h-14 rounded-full border-2 flex items-center justify-center ${
                      isEarned 
                        ? 'border-primary bg-primary/10' 
                        : 'border-dashed border-muted-foreground/30 opacity-50'
                    }`}
                  >
                    <span className={isEarned ? 'text-primary' : 'text-muted-foreground/50'}>
                      {badge.title.charAt(0)}
                    </span>
                  </div>
                </div>
              );
            })}
          </div>
        ) : (
          // Full view with tabs
          <Tabs defaultValue="milestone" className="w-full">
            <TabsList className="grid w-full grid-cols-5 bg-transparent">
              <TabsTrigger value="milestone" className="text-xs sm:text-sm data-[state=active]:bg-stamp-milestone/20 data-[state=active]:text-stamp-milestone">
                Meilensteine
              </TabsTrigger>
              <TabsTrigger value="endurance" className="text-xs sm:text-sm data-[state=active]:bg-stamp-endurance/20 data-[state=active]:text-stamp-endurance">
                Ausdauer
              </TabsTrigger>
              <TabsTrigger value="weather" className="text-xs sm:text-sm data-[state=active]:bg-stamp-special/20 data-[state=active]:text-stamp-special">
                Wetter
              </TabsTrigger>
              <TabsTrigger value="community" className="text-xs sm:text-sm data-[state=active]:bg-green-500/20 data-[state=active]:text-green-500">
                Community
              </TabsTrigger>
              <TabsTrigger value="legend" className="text-xs sm:text-sm data-[state=active]:bg-stamp-legend/20 data-[state=active]:text-stamp-legend">
                Legenden
              </TabsTrigger>
            </TabsList>

            <TabsContent value="milestone" className="mt-4">
              <PassPage 
                badges={getBadgesByCategory('milestone')}
                earnedBadges={buildEarnedBadges('milestone')}
                category="milestone"
              />
            </TabsContent>

            <TabsContent value="endurance" className="mt-4">
              <PassPage 
                badges={getBadgesByCategory('endurance')}
                earnedBadges={buildEarnedBadges('endurance')}
                category="endurance"
              />
            </TabsContent>

            <TabsContent value="weather" className="mt-4">
              <PassPage 
                badges={getBadgesByCategory('weather')}
                earnedBadges={buildEarnedBadges('weather')}
                category="weather"
              />
            </TabsContent>

            <TabsContent value="community" className="mt-4">
              <PassPage 
                badges={getBadgesByCategory('community')}
                earnedBadges={buildEarnedBadges('community')}
                category="community"
              />
            </TabsContent>

            <TabsContent value="legend" className="mt-4">
              <PassPage 
                badges={getBadgesByCategory('legend')}
                earnedBadges={buildEarnedBadges('legend')}
                category="legend"
              />
            </TabsContent>
          </Tabs>
        )}

        {/* Suggestion form for logged-in users */}
        {userId && (
          <div className="mt-6 pt-4 border-t border-border/50 flex justify-center">
            <AchievementSuggestionForm userId={userId} />
          </div>
        )}
      </div>
    </Card>
  );
}
