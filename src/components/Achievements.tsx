import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { Card } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { Award, Mountain, Flame, Sun, Moon, Star, Target, Zap, Trophy, Clock, Sparkles, Crown } from 'lucide-react';
import { format } from 'date-fns';
import { de } from 'date-fns/locale';

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
  | 'founding_member';

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
  howToEarn: string;
  color: string;
  isExclusive?: boolean;
}

const ACHIEVEMENT_CONFIG: Record<AchievementType, AchievementConfig> = {
  first_run: {
    icon: <Star className="w-5 h-5" />,
    title: 'Erstbesteigung',
    description: 'Erster Uetli Run',
    howToEarn: 'Absolviere deinen ersten Run auf einem Uetliberg-Segment.',
    color: 'text-yellow-500',
  },
  runs_5: {
    icon: <Mountain className="w-5 h-5" />,
    title: 'Bergfreund',
    description: '5 Uetli Runs',
    howToEarn: 'Absolviere insgesamt 5 Runs auf Uetliberg-Segmenten.',
    color: 'text-green-500',
  },
  runs_10: {
    icon: <Flame className="w-5 h-5" />,
    title: 'Bergläufer',
    description: '10 Uetli Runs',
    howToEarn: 'Absolviere insgesamt 10 Runs auf Uetliberg-Segmenten.',
    color: 'text-orange-500',
  },
  runs_25: {
    icon: <Zap className="w-5 h-5" />,
    title: 'Uetli-Veteran',
    description: '25 Uetli Runs',
    howToEarn: 'Absolviere insgesamt 25 Runs auf Uetliberg-Segmenten.',
    color: 'text-blue-500',
  },
  runs_50: {
    icon: <Trophy className="w-5 h-5" />,
    title: 'Gipfelstürmer',
    description: '50 Uetli Runs',
    howToEarn: 'Absolviere insgesamt 50 Runs auf Uetliberg-Segmenten.',
    color: 'text-purple-500',
  },
  runs_100: {
    icon: <Award className="w-5 h-5" />,
    title: 'Uetli-Legende',
    description: '100 Uetli Runs',
    howToEarn: 'Absolviere insgesamt 100 Runs auf Uetliberg-Segmenten. Legendär!',
    color: 'text-primary',
  },
  all_segments: {
    icon: <Target className="w-5 h-5" />,
    title: 'Segmentjäger',
    description: 'Alle Segmente gelaufen',
    howToEarn: 'Laufe mindestens einmal auf jedem verfügbaren Uetliberg-Segment.',
    color: 'text-teal-500',
  },
  streak_2: {
    icon: <Clock className="w-5 h-5" />,
    title: 'Dranbleiber',
    description: '2 Wochen Streak',
    howToEarn: 'Halte einen Streak von 2 aufeinanderfolgenden Wochen mit je einem Run.',
    color: 'text-indigo-500',
  },
  streak_4: {
    icon: <Flame className="w-5 h-5" />,
    title: 'Durchhalter',
    description: '4 Wochen Streak',
    howToEarn: 'Halte einen Streak von 4 aufeinanderfolgenden Wochen mit je einem Run.',
    color: 'text-red-500',
  },
  streak_8: {
    icon: <Flame className="w-5 h-5" />,
    title: 'Unaufhaltsam',
    description: '8 Wochen Streak',
    howToEarn: 'Halte einen Streak von 8 aufeinanderfolgenden Wochen mit je einem Run.',
    color: 'text-rose-600',
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
];

// Exclusive achievements (only show if earned)
const EXCLUSIVE_ACHIEVEMENTS: AchievementType[] = [
  'pioneer_10',
  'pioneer_25',
  'pioneer_50',
  'founding_member',
];

const ALL_ACHIEVEMENTS: AchievementType[] = [
  ...REGULAR_ACHIEVEMENTS,
  ...EXCLUSIVE_ACHIEVEMENTS,
];

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

  const earnedSet = new Set(earnedAchievements?.map(a => a.achievement) || []);
  const earnedMap = new Map(earnedAchievements?.map(a => [a.achievement, a.earned_at]) || []);
  
  // Filter exclusive achievements to only show earned ones
  const earnedExclusiveAchievements = EXCLUSIVE_ACHIEVEMENTS.filter(a => earnedSet.has(a));
  const totalAchievements = REGULAR_ACHIEVEMENTS.length + earnedExclusiveAchievements.length;
  const earnedCount = [...REGULAR_ACHIEVEMENTS, ...earnedExclusiveAchievements].filter(a => earnedSet.has(a)).length;

  const getEarnedDate = (achievementType: AchievementType) => {
    const earnedAt = earnedMap.get(achievementType);
    if (!earnedAt) return null;
    return format(new Date(earnedAt), 'd. MMMM yyyy', { locale: de });
  };

  return (
    <Card className="p-6 h-full">
      <div className="flex items-center gap-2 mb-2">
        <Award className="w-5 h-5 text-primary" />
        <h3 className="font-bold text-lg">Achievements</h3>
        <Badge variant="outline" className="text-xs">
          All-Time
        </Badge>
        <Badge variant="secondary" className="ml-auto">
          {earnedCount}/{totalAchievements}
        </Badge>
      </div>
      <p className="text-xs text-muted-foreground mb-4">
        Einmal verdient, für immer deins
      </p>
      
      {/* Exclusive Achievements (only if earned) */}
      {earnedExclusiveAchievements.length > 0 && (
        <div className="mb-4">
          <p className="text-xs text-muted-foreground mb-2 flex items-center gap-1">
            <Sparkles className="w-3 h-3 text-amber-500" />
            Exklusive Achievements
          </p>
          <div className="flex flex-wrap gap-2">
            {earnedExclusiveAchievements.map((achievementType) => {
              const config = ACHIEVEMENT_CONFIG[achievementType];
              const earnedDate = getEarnedDate(achievementType);
              return (
                <Popover key={achievementType}>
                  <PopoverTrigger asChild>
                    <button
                      className="flex items-center gap-2 px-3 py-2 rounded-lg bg-gradient-to-r from-amber-500/20 via-yellow-400/20 to-amber-500/20 border border-amber-500/30 cursor-pointer hover:scale-105 transition-transform"
                    >
                      <div className={config.color}>
                        {config.icon}
                      </div>
                      <p className="text-sm font-medium">{config.title}</p>
                    </button>
                  </PopoverTrigger>
                  <PopoverContent className="w-64">
                    <div className="flex flex-col items-center text-center gap-2">
                      <div className={`${config.color} scale-150`}>
                        {config.icon}
                      </div>
                      <h4 className="font-bold">{config.title}</h4>
                      <p className="text-sm text-muted-foreground">{config.howToEarn}</p>
                      {earnedDate && (
                        <p className="text-xs text-green-500 mt-1">
                          Verdient am {earnedDate}
                        </p>
                      )}
                    </div>
                  </PopoverContent>
                </Popover>
              );
            })}
          </div>
        </div>
      )}
      
      {/* Regular Achievements Grid */}
      <div className="grid grid-cols-3 gap-3">
        {REGULAR_ACHIEVEMENTS.map((achievementType) => {
          const config = ACHIEVEMENT_CONFIG[achievementType];
          const isEarned = earnedSet.has(achievementType);
          const earnedDate = getEarnedDate(achievementType);
          
          return (
            <Popover key={achievementType}>
              <PopoverTrigger asChild>
                <button
                  className={`flex flex-col items-center p-3 rounded-lg transition-all cursor-pointer hover:scale-105 ${
                    isEarned 
                      ? 'bg-primary/10 border border-primary/30' 
                      : 'bg-muted/30 opacity-40'
                  }`}
                >
                  <div className={isEarned ? config.color : 'text-muted-foreground'}>
                    {config.icon}
                  </div>
                  <p className="text-xs font-medium mt-1 text-center truncate w-full">
                    {config.title}
                  </p>
                </button>
              </PopoverTrigger>
              <PopoverContent className="w-64">
                <div className="flex flex-col items-center text-center gap-2">
                  <div className={`${isEarned ? config.color : 'text-muted-foreground'} scale-150`}>
                    {config.icon}
                  </div>
                  <h4 className="font-bold">{config.title}</h4>
                  <p className="text-sm text-muted-foreground">{config.howToEarn}</p>
                  {earnedDate ? (
                    <p className="text-xs text-green-500 mt-1">
                      Verdient am {earnedDate}
                    </p>
                  ) : (
                    <p className="text-xs text-muted-foreground mt-1">
                      Noch nicht verdient
                    </p>
                  )}
                </div>
              </PopoverContent>
            </Popover>
          );
        })}
      </div>
    </Card>
  );
}