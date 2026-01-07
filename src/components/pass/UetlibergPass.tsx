import { useQuery } from '@tanstack/react-query';
import { useState, useEffect, useRef } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { Card } from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { PassHeader } from './PassHeader';
import { PassPage } from './PassPage';
import { StampConfig } from './StampCard';
import { AchievementSuggestionForm } from '@/components/AchievementSuggestionForm';
import { Star, Mountain, Flame, Sun, Moon, Zap, Trophy, Clock, Target, Award } from 'lucide-react';

// Time window for "newly earned" animation (30 seconds)
const NEW_ACHIEVEMENT_WINDOW_MS = 30000;

type AchievementType = 
  | 'first_run' | 'runs_5' | 'runs_10' | 'runs_25' | 'runs_50' | 'runs_100'
  | 'all_segments' | 'streak_2' | 'streak_4' | 'streak_8'
  | 'early_bird' | 'night_owl' | 'pioneer_10'
  | 'denzlerweg_king' | 'coiffeur' | 'snow_bunny' | 'frosty';

interface Achievement {
  id: string;
  user_id: string;
  achievement: AchievementType;
  earned_at: string;
}

// Achievement configurations with categories
const ACHIEVEMENT_CONFIG: Record<AchievementType, StampConfig & { target?: number; progressType?: string }> = {
  first_run: {
    icon: <Star className="w-6 h-6" />,
    title: 'Erstbesteigung',
    description: 'Erster Uetli Run',
    howToEarn: 'Absolviere deinen ersten Run auf einem Uetliberg-Segment.',
    color: 'text-yellow-500',
    category: 'milestone',
    target: 1,
    progressType: 'runs',
  },
  runs_5: {
    icon: <Mountain className="w-6 h-6" />,
    title: 'Bergfreund',
    description: '5 Uetli Runs',
    howToEarn: 'Absolviere insgesamt 5 Runs.',
    color: 'text-green-500',
    category: 'milestone',
    target: 5,
    progressType: 'runs',
  },
  runs_10: {
    icon: <Flame className="w-6 h-6" />,
    title: 'Bergläufer',
    description: '10 Uetli Runs',
    howToEarn: 'Absolviere insgesamt 10 Runs.',
    color: 'text-orange-500',
    category: 'milestone',
    target: 10,
    progressType: 'runs',
  },
  runs_25: {
    icon: <Zap className="w-6 h-6" />,
    title: 'Uetli-Veteran',
    description: '25 Uetli Runs',
    howToEarn: 'Absolviere insgesamt 25 Runs.',
    color: 'text-blue-500',
    category: 'milestone',
    target: 25,
    progressType: 'runs',
  },
  runs_50: {
    icon: <Trophy className="w-6 h-6" />,
    title: 'Gipfelstürmer',
    description: '50 Uetli Runs',
    howToEarn: 'Absolviere insgesamt 50 Runs.',
    color: 'text-purple-500',
    category: 'milestone',
    target: 50,
    progressType: 'runs',
  },
  runs_100: {
    icon: <Award className="w-6 h-6" />,
    title: 'Uetli-Legende',
    description: '100 Uetli Runs',
    howToEarn: 'Absolviere insgesamt 100 Runs. Legendär!',
    color: 'text-primary',
    category: 'milestone',
    target: 100,
    progressType: 'runs',
  },
  streak_2: {
    icon: <Clock className="w-6 h-6" />,
    title: 'Dranbleiber',
    description: '2 Wochen Streak',
    howToEarn: 'Halte 2 aufeinanderfolgende Wochen mit je einem Run.',
    color: 'text-indigo-500',
    category: 'endurance',
    target: 2,
    progressType: 'streak',
  },
  streak_4: {
    icon: <Flame className="w-6 h-6" />,
    title: 'Durchhalter',
    description: '4 Wochen Streak',
    howToEarn: 'Halte 4 aufeinanderfolgende Wochen mit je einem Run.',
    color: 'text-red-500',
    category: 'endurance',
    target: 4,
    progressType: 'streak',
  },
  streak_8: {
    icon: <Flame className="w-6 h-6" />,
    title: 'Unaufhaltsam',
    description: '8 Wochen Streak',
    howToEarn: 'Halte 8 aufeinanderfolgende Wochen mit je einem Run.',
    color: 'text-rose-600',
    category: 'endurance',
    target: 8,
    progressType: 'streak',
  },
  all_segments: {
    icon: <Target className="w-6 h-6" />,
    title: 'Segmentjäger',
    description: 'Alle Segmente',
    howToEarn: 'Laufe auf jedem verfügbaren Uetliberg-Segment.',
    color: 'text-teal-500',
    category: 'endurance',
    progressType: 'segments',
  },
  early_bird: {
    icon: <Sun className="w-6 h-6" />,
    title: 'Frühaufsteher',
    description: 'Run vor 7 Uhr',
    howToEarn: 'Starte einen Run vor 7 Uhr morgens.',
    color: 'text-amber-500',
    category: 'special',
  },
  night_owl: {
    icon: <Moon className="w-6 h-6" />,
    title: 'Nachteule',
    description: 'Run nach 20 Uhr',
    howToEarn: 'Starte einen Run nach 20 Uhr abends.',
    color: 'text-slate-400',
    category: 'special',
  },
  pioneer_10: {
    icon: <Trophy className="w-6 h-6" />,
    title: 'Leaderboard Top 10',
    description: 'Platz in Top 10',
    howToEarn: 'Erreiche einen Platz in den Top 10 der Rangliste.',
    color: 'text-amber-400',
    category: 'special',
  },
  snow_bunny: {
    icon: <span className="text-2xl">🐰❄️</span>,
    title: 'Snow-Bunny',
    description: '3 Runs bei Schnee',
    howToEarn: 'Absolviere 3 Runs bei Schneefall.',
    color: 'text-sky-300',
    category: 'special',
    target: 3,
    progressType: 'runs',
  },
  frosty: {
    icon: <span className="text-2xl">🥶</span>,
    title: 'Frosty',
    description: '5 Runs unter 0°C',
    howToEarn: 'Absolviere 5 Runs bei Temperaturen unter dem Gefrierpunkt.',
    color: 'text-blue-400',
    category: 'special',
    target: 5,
    progressType: 'runs',
  },
  denzlerweg_king: {
    icon: <span className="text-2xl">🍞</span>,
    title: "S'Brot isch no warm",
    description: 'Denzlerweg König',
    howToEarn: 'Sei der Läufer mit den meisten Runs auf dem Denzlerweg-Segment.',
    color: 'text-amber-600',
    category: 'legend',
  },
  coiffeur: {
    icon: <span className="text-2xl">💇</span>,
    title: 'Zum Coiffeur',
    description: '10x Coiffeurweg/Jahr',
    howToEarn: 'Absolviere 10 Runs pro Jahr auf dem Coiffeurweg.',
    color: 'text-pink-500',
    category: 'legend',
    target: 10,
    progressType: 'runs',
  },
};

// Category groupings
const MILESTONE_ACHIEVEMENTS: AchievementType[] = ['first_run', 'runs_5', 'runs_10', 'runs_25', 'runs_50', 'runs_100'];
const ENDURANCE_ACHIEVEMENTS: AchievementType[] = ['streak_2', 'streak_4', 'streak_8', 'all_segments'];
const SPECIAL_ACHIEVEMENTS: AchievementType[] = ['early_bird', 'night_owl', 'pioneer_10', 'snow_bunny', 'frosty'];
const LEGEND_ACHIEVEMENTS: AchievementType[] = ['denzlerweg_king', 'coiffeur'];

const SNOW_CODES = [71, 73, 75, 77, 85, 86];

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

  // Get progress for an achievement
  const getProgress = (type: AchievementType): { current: number; target: number } | null => {
    const config = ACHIEVEMENT_CONFIG[type];
    if (!config.progressType) return null;
    
    switch (config.progressType) {
      case 'runs':
        if (type === 'coiffeur') return { current: Math.min(coiffeurRuns, config.target || 0), target: config.target || 0 };
        if (type === 'snow_bunny') return { current: Math.min(snowRuns, config.target || 0), target: config.target || 0 };
        if (type === 'frosty') return { current: Math.min(frostRuns, config.target || 0), target: config.target || 0 };
        return { current: Math.min(totalRuns, config.target || 0), target: config.target || 0 };
      case 'streak':
        return { current: Math.min(currentStreak, config.target || 0), target: config.target || 0 };
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

  // Build achievement data for each category
  const buildAchievementData = (types: AchievementType[]) => 
    types.map(type => ({
      type,
      config: ACHIEVEMENT_CONFIG[type],
      isEarned: earnedSet.has(type),
      earnedAt: earnedMap.get(type),
      progress: getProgress(type),
      isNewlyEarned: newlyEarnedAchievements.has(type),
    }));

  const allAchievements = [...MILESTONE_ACHIEVEMENTS, ...ENDURANCE_ACHIEVEMENTS, ...SPECIAL_ACHIEVEMENTS, ...LEGEND_ACHIEVEMENTS];
  const earnedCount = allAchievements.filter(a => earnedSet.has(a)).length;

  return (
    <Card className="bg-pass-paper dark:bg-card border-0 shadow-md overflow-hidden">
      {/* Paper texture overlay */}
      <div className="absolute inset-0 opacity-[0.03] pointer-events-none bg-[url('data:image/svg+xml,%3Csvg viewBox=%220 0 200 200%22 xmlns=%22http://www.w3.org/2000/svg%22%3E%3Cfilter id=%22noise%22%3E%3CfeTurbulence type=%22fractalNoise%22 baseFrequency=%220.9%22 numOctaves=%224%22 stitchTiles=%22stitch%22/%3E%3C/filter%3E%3Crect width=%22100%25%22 height=%22100%25%22 filter=%22url(%23noise)%22/%3E%3C/svg%3E')]" />
      
      <div className="relative p-4 sm:p-6">
        <PassHeader 
          displayName={displayName}
          earnedCount={earnedCount}
          totalCount={allAchievements.length}
        />

        {compact ? (
          // Compact view: horizontal scroll of recent/next stamps
          <div className="flex gap-3 overflow-x-auto pb-2 -mx-2 px-2">
            {allAchievements.slice(0, 8).map(type => {
              const config = ACHIEVEMENT_CONFIG[type];
              const isEarned = earnedSet.has(type);
              return (
                <div key={type} className="flex-shrink-0">
                  <div 
                    className={`w-14 h-14 rounded-full border-2 flex items-center justify-center ${
                      isEarned 
                        ? 'border-primary bg-primary/10' 
                        : 'border-dashed border-muted-foreground/30 opacity-50'
                    }`}
                  >
                    <span className={isEarned ? config.color : 'text-muted-foreground/50'}>
                      {config.icon}
                    </span>
                  </div>
                </div>
              );
            })}
          </div>
        ) : (
          // Full view with tabs
          <Tabs defaultValue="milestone" className="w-full">
            <TabsList className="grid w-full grid-cols-4 bg-transparent">
              <TabsTrigger value="milestone" className="text-xs sm:text-sm data-[state=active]:bg-stamp-milestone/20 data-[state=active]:text-stamp-milestone">
                Meilensteine
              </TabsTrigger>
              <TabsTrigger value="endurance" className="text-xs sm:text-sm data-[state=active]:bg-stamp-endurance/20 data-[state=active]:text-stamp-endurance">
                Ausdauer
              </TabsTrigger>
              <TabsTrigger value="special" className="text-xs sm:text-sm data-[state=active]:bg-stamp-special/20 data-[state=active]:text-stamp-special">
                Spezial
              </TabsTrigger>
              <TabsTrigger value="legend" className="text-xs sm:text-sm data-[state=active]:bg-stamp-legend/20 data-[state=active]:text-stamp-legend">
                Legenden
              </TabsTrigger>
            </TabsList>

            <TabsContent value="milestone" className="mt-4">
              <PassPage 
                title="Meilensteine"
                icon={Mountain}
                achievements={buildAchievementData(MILESTONE_ACHIEVEMENTS)}
                category="milestone"
              />
            </TabsContent>

            <TabsContent value="endurance" className="mt-4">
              <PassPage 
                title="Ausdauer"
                icon={Flame}
                achievements={buildAchievementData(ENDURANCE_ACHIEVEMENTS)}
                category="endurance"
              />
            </TabsContent>

            <TabsContent value="special" className="mt-4">
              <PassPage 
                title="Spezial"
                icon={Star}
                achievements={buildAchievementData(SPECIAL_ACHIEVEMENTS)}
                category="special"
              />
            </TabsContent>

            <TabsContent value="legend" className="mt-4">
              <PassPage 
                title="Lokal-Legenden"
                icon={Trophy}
                achievements={buildAchievementData(LEGEND_ACHIEVEMENTS)}
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
