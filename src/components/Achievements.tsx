import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { Card } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { Progress } from '@/components/ui/progress';
import { Award, Mountain, Flame, Sun, Moon, Star, Target, Zap, Trophy, Clock, Sparkles, Crown } from 'lucide-react';
import { format } from 'date-fns';
import { de } from 'date-fns/locale';
import { AchievementSuggestionForm } from './AchievementSuggestionForm';

type AchievementType = 
  | 'first_run'
  | 'runs_5'
  | 'runs_10'
  | 'runs_25'
  | 'runs_50'
  | 'runs_100'
  | 'all_segments'
  | 'streak_2'
  | 'streak_4'
  | 'streak_8'
  | 'early_bird'
  | 'night_owl'
  | 'pioneer_10'
  | 'pioneer_25'
  | 'pioneer_50'
  | 'founding_member'
  | 'denzlerweg_king'
  | 'coiffeur';

interface Achievement {
  id: string;
  user_id: string;
  achievement: AchievementType;
  earned_at: string;
}

interface AchievementConfig {
  icon: React.ReactNode;
  title: string;
  description: string;
  howToEarn: React.ReactNode;
  color: string;
  isExclusive?: boolean;
  target?: number;
  progressType?: 'runs' | 'streak' | 'segments';
}

const ACHIEVEMENT_CONFIG: Record<AchievementType, AchievementConfig> = {
  first_run: {
    icon: <Star className="w-5 h-5" />,
    title: 'Erstbesteigung',
    description: 'Erster Uetli Run',
    howToEarn: 'Absolviere deinen ersten Run auf einem Uetliberg-Segment.',
    color: 'text-yellow-500',
    target: 1,
    progressType: 'runs',
  },
  runs_5: {
    icon: <Mountain className="w-5 h-5" />,
    title: 'Bergfreund',
    description: '5 Uetli Runs',
    howToEarn: 'Absolviere insgesamt 5 Runs auf Uetliberg-Segmenten.',
    color: 'text-green-500',
    target: 5,
    progressType: 'runs',
  },
  runs_10: {
    icon: <Flame className="w-5 h-5" />,
    title: 'Bergläufer',
    description: '10 Uetli Runs',
    howToEarn: 'Absolviere insgesamt 10 Runs auf Uetliberg-Segmenten.',
    color: 'text-orange-500',
    target: 10,
    progressType: 'runs',
  },
  runs_25: {
    icon: <Zap className="w-5 h-5" />,
    title: 'Uetli-Veteran',
    description: '25 Uetli Runs',
    howToEarn: 'Absolviere insgesamt 25 Runs auf Uetliberg-Segmenten.',
    color: 'text-blue-500',
    target: 25,
    progressType: 'runs',
  },
  runs_50: {
    icon: <Trophy className="w-5 h-5" />,
    title: 'Gipfelstürmer',
    description: '50 Uetli Runs',
    howToEarn: 'Absolviere insgesamt 50 Runs auf Uetliberg-Segmenten.',
    color: 'text-purple-500',
    target: 50,
    progressType: 'runs',
  },
  runs_100: {
    icon: <Award className="w-5 h-5" />,
    title: 'Uetli-Legende',
    description: '100 Uetli Runs',
    howToEarn: 'Absolviere insgesamt 100 Runs auf Uetliberg-Segmenten. Legendär!',
    color: 'text-primary',
    target: 100,
    progressType: 'runs',
  },
  all_segments: {
    icon: <Target className="w-5 h-5" />,
    title: 'Segmentjäger',
    description: 'Alle Segmente gelaufen',
    howToEarn: 'Laufe mindestens einmal auf jedem verfügbaren Uetliberg-Segment.',
    color: 'text-teal-500',
    progressType: 'segments',
  },
  streak_2: {
    icon: <Clock className="w-5 h-5" />,
    title: 'Dranbleiber',
    description: '2 Wochen Streak',
    howToEarn: 'Halte einen Streak von 2 aufeinanderfolgenden Wochen mit je einem Run.',
    color: 'text-indigo-500',
    target: 2,
    progressType: 'streak',
  },
  streak_4: {
    icon: <Flame className="w-5 h-5" />,
    title: 'Durchhalter',
    description: '4 Wochen Streak',
    howToEarn: 'Halte einen Streak von 4 aufeinanderfolgenden Wochen mit je einem Run.',
    color: 'text-red-500',
    target: 4,
    progressType: 'streak',
  },
  streak_8: {
    icon: <Flame className="w-5 h-5" />,
    title: 'Unaufhaltsam',
    description: '8 Wochen Streak',
    howToEarn: 'Halte einen Streak von 8 aufeinanderfolgenden Wochen mit je einem Run.',
    color: 'text-rose-600',
    target: 8,
    progressType: 'streak',
  },
  early_bird: {
    icon: <Sun className="w-5 h-5" />,
    title: 'Frühaufsteher',
    description: 'Run vor 7 Uhr',
    howToEarn: 'Starte einen Run vor 7 Uhr morgens.',
    color: 'text-amber-500',
  },
  night_owl: {
    icon: <Moon className="w-5 h-5" />,
    title: 'Nachteule',
    description: 'Run nach 20 Uhr',
    howToEarn: 'Starte einen Run nach 20 Uhr abends.',
    color: 'text-slate-400',
  },
  denzlerweg_king: {
    icon: <span className="text-lg">🍞</span>,
    title: "S'Brot isch no warm",
    description: 'Denzlerweg König',
    howToEarn: (
      <>
        Sei der Läufer mit den meisten Runs auf dem{' '}
        <a 
          href="https://www.strava.com/segments/5762702" 
          target="_blank" 
          rel="noopener noreferrer"
          className="text-primary underline hover:text-primary/80"
          onClick={(e) => e.stopPropagation()}
        >
          Denzlerweg-Segment
        </a>.
      </>
    ),
    color: 'text-amber-600',
  },
  coiffeur: {
    icon: <span className="text-lg">💇</span>,
    title: 'Zum Coiffeur',
    description: '10x pro Jahr auf Coiffeurweg oder Technical hidden trail backwards',
    howToEarn: (
      <>
        Absolviere mindestens 10 Runs pro Jahr auf den Segmenten{' '}
        <a 
          href="https://www.strava.com/segments/4185072" 
          target="_blank" 
          rel="noopener noreferrer"
          className="text-primary underline hover:text-primary/80"
          onClick={(e) => e.stopPropagation()}
        >
          Coiffeurweg
        </a>{' '}
        oder{' '}
        <a 
          href="https://www.strava.com/segments/10683811" 
          target="_blank" 
          rel="noopener noreferrer"
          className="text-primary underline hover:text-primary/80"
          onClick={(e) => e.stopPropagation()}
        >
          Technical hidden trail backwards
        </a>.
      </>
    ),
    color: 'text-pink-500',
    target: 10,
    progressType: 'runs',
  },
  pioneer_10: {
    icon: <Crown className="w-5 h-5" />,
    title: 'Top 10 Pioneer',
    description: 'Einer der ersten 10 User',
    howToEarn: 'Dieses exklusive Achievement wurde an die ersten 10 Nutzer vergeben.',
    color: 'text-amber-400',
    isExclusive: true,
  },
  pioneer_25: {
    icon: <Sparkles className="w-5 h-5" />,
    title: 'Top 25 Pioneer',
    description: 'Einer der ersten 25 User',
    howToEarn: 'Dieses exklusive Achievement wurde an die ersten 25 Nutzer vergeben.',
    color: 'text-amber-500',
    isExclusive: true,
  },
  pioneer_50: {
    icon: <Sparkles className="w-5 h-5" />,
    title: 'Top 50 Pioneer',
    description: 'Einer der ersten 50 User',
    howToEarn: 'Dieses exklusive Achievement wurde an die ersten 50 Nutzer vergeben.',
    color: 'text-amber-600',
    isExclusive: true,
  },
  founding_member: {
    icon: <Sparkles className="w-5 h-5" />,
    title: 'Founding Member',
    description: 'Früher Unterstützer',
    howToEarn: 'Dieses exklusive Achievement wurde an frühe Unterstützer vergeben.',
    color: 'text-yellow-500',
    isExclusive: true,
  },
};

// Regular achievements (always visible)
const REGULAR_ACHIEVEMENTS: AchievementType[] = [
  'first_run',
  'runs_5',
  'runs_10',
  'runs_25',
  'runs_50',
  'runs_100',
  'all_segments',
  'streak_2',
  'streak_4',
  'streak_8',
  'early_bird',
  'night_owl',
  'denzlerweg_king',
  'coiffeur',
];

// Exclusive achievements (only show if earned)
const EXCLUSIVE_ACHIEVEMENTS: AchievementType[] = [
  'pioneer_10',
  'pioneer_25',
  'pioneer_50',
  'founding_member',
];

// Helper to calculate streak from check-ins
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

interface AchievementsProps {
  userId?: string;
}

export function Achievements({ userId }: AchievementsProps) {
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

  // Fetch user stats for progress
  const { data: checkIns } = useQuery({
    queryKey: ['achievement-checkins', userId],
    queryFn: async () => {
      if (!userId) return [];
      const { data, error } = await supabase
        .from('check_ins')
        .select('checked_in_at, segment_id')
        .eq('user_id', userId);
      
      if (error) throw error;
      return data;
    },
    enabled: !!userId,
  });

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
  
  // Calculate stats
  const totalRuns = checkIns?.length || 0;
  const uniqueSegments = new Set(checkIns?.map(c => c.segment_id) || []).size;
  const currentStreak = calculateStreak(checkIns || []);
  
  // Calculate coiffeur runs (segments 4185072 or 10683811 in current year)
  const COIFFEUR_SEGMENT_IDS = [4185072, 10683811];
  const currentYear = new Date().getFullYear();
  const coiffeurRuns = checkIns?.filter(c => {
    const checkInYear = new Date(c.checked_in_at).getFullYear();
    return checkInYear === currentYear && COIFFEUR_SEGMENT_IDS.includes(c.segment_id);
  })?.length || 0;
  
  // Filter exclusive achievements to only show earned ones
  const earnedExclusiveAchievements = EXCLUSIVE_ACHIEVEMENTS.filter(a => earnedSet.has(a));
  const totalAchievementsCount = REGULAR_ACHIEVEMENTS.length + earnedExclusiveAchievements.length;
  const earnedCount = [...REGULAR_ACHIEVEMENTS, ...earnedExclusiveAchievements].filter(a => earnedSet.has(a)).length;

  const getEarnedDate = (achievementType: AchievementType) => {
    const earnedAt = earnedMap.get(achievementType);
    if (!earnedAt) return null;
    return format(new Date(earnedAt), 'd. MMMM yyyy', { locale: de });
  };

  const getProgress = (achievementType: AchievementType): { current: number; target: number } | null => {
    const config = ACHIEVEMENT_CONFIG[achievementType];
    if (!config.progressType) return null;
    
    switch (config.progressType) {
      case 'runs':
        // Special case for coiffeur achievement
        if (achievementType === 'coiffeur') {
          return { current: Math.min(coiffeurRuns, config.target || 0), target: config.target || 0 };
        }
        return { current: Math.min(totalRuns, config.target || 0), target: config.target || 0 };
      case 'streak':
        return { current: Math.min(currentStreak, config.target || 0), target: config.target || 0 };
      case 'segments':
        return { current: uniqueSegments, target: totalSegments || 0 };
      default:
        return null;
    }
  };

  const renderProgressBar = (achievementType: AchievementType, isEarned: boolean) => {
    if (isEarned) return null;
    
    const progress = getProgress(achievementType);
    if (!progress || progress.target === 0) return null;
    
    const percentage = Math.min((progress.current / progress.target) * 100, 100);
    
    return (
      <div className="w-full mt-2">
        <Progress value={percentage} className="h-2" />
        <p className="text-xs text-muted-foreground mt-1">
          {progress.current}/{progress.target}
        </p>
      </div>
    );
  };

  // Helper to render a single achievement tile
  const renderAchievementTile = (achievementType: AchievementType, isExclusive: boolean = false) => {
    const config = ACHIEVEMENT_CONFIG[achievementType];
    const isEarned = earnedSet.has(achievementType);
    const earnedDate = getEarnedDate(achievementType);
    const progress = getProgress(achievementType);

    return (
      <Popover key={achievementType}>
        <PopoverTrigger asChild>
          <button
            className={`flex flex-col items-center justify-center p-3 rounded-lg transition-all cursor-pointer hover:scale-105 aspect-square ${
              isExclusive
                ? 'bg-gradient-to-br from-amber-500/20 via-yellow-400/10 to-amber-500/20 border border-amber-500/40'
                : isEarned 
                  ? 'bg-primary/10 border border-primary/30' 
                  : 'bg-muted/30 opacity-50'
            }`}
          >
            <div className={`${isEarned || isExclusive ? config.color : 'text-muted-foreground'} mb-1`}>
              {config.icon}
            </div>
            <p className="text-[10px] font-medium text-center leading-tight line-clamp-2 px-1">
              {config.title}
            </p>
          </button>
        </PopoverTrigger>
        <PopoverContent className="w-64">
          <div className="flex flex-col items-center text-center gap-2">
            <div className={`${isEarned || isExclusive ? config.color : 'text-muted-foreground'} scale-150`}>
              {config.icon}
            </div>
            <h4 className="font-bold">{config.title}</h4>
            <p className="text-sm text-muted-foreground">{config.howToEarn}</p>
            {earnedDate ? (
              <p className="text-xs text-green-500 mt-1">
                Verdient am {earnedDate}
              </p>
            ) : (
              <>
                {renderProgressBar(achievementType, isEarned)}
                {!progress && (
                  <p className="text-xs text-muted-foreground mt-1">
                    Noch nicht verdient
                  </p>
                )}
              </>
            )}
          </div>
        </PopoverContent>
      </Popover>
    );
  };

  return (
    <Card className="p-4 h-full">
      {/* Header */}
      <div className="flex items-center gap-2 mb-4">
        <Award className="w-5 h-5 text-primary" />
        <h3 className="font-bold text-lg">Achievements</h3>
        <Badge variant="secondary" className="ml-auto text-xs">
          {earnedCount}/{totalAchievementsCount}
        </Badge>
        <AchievementSuggestionForm userId={userId || null} />
      </div>
      
      {/* Exclusive Achievements (only if earned) */}
      {earnedExclusiveAchievements.length > 0 && (
        <div className="mb-3">
          <p className="text-[10px] uppercase tracking-wider text-amber-500 font-medium mb-2 flex items-center gap-1">
            <Sparkles className="w-3 h-3" />
            Exklusiv
          </p>
          <div className="grid grid-cols-4 gap-2">
            {earnedExclusiveAchievements.map((achievementType) => 
              renderAchievementTile(achievementType, true)
            )}
          </div>
        </div>
      )}
      
      {/* Regular Achievements Grid */}
      <div className="grid grid-cols-4 gap-2">
        {REGULAR_ACHIEVEMENTS.map((achievementType) => 
          renderAchievementTile(achievementType)
        )}
      </div>
    </Card>
  );
}