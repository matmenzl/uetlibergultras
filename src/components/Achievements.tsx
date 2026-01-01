import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { Card } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Award, Mountain, Flame, Sun, Moon, Star, Target, Zap, Trophy, Clock, Sparkles, Crown } from 'lucide-react';

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
  color: string;
  isExclusive?: boolean;
}

const ACHIEVEMENT_CONFIG: Record<AchievementType, AchievementConfig> = {
  first_run: {
    icon: <Star className="w-5 h-5" />,
    title: 'Erstbesteigung',
    description: 'Erster Uetli Run',
    color: 'text-yellow-500',
  },
  runs_5: {
    icon: <Mountain className="w-5 h-5" />,
    title: 'Bergfreund',
    description: '5 Uetli Runs',
    color: 'text-green-500',
  },
  runs_10: {
    icon: <Flame className="w-5 h-5" />,
    title: 'Bergläufer',
    description: '10 Uetli Runs',
    color: 'text-orange-500',
  },
  runs_25: {
    icon: <Zap className="w-5 h-5" />,
    title: 'Uetli-Veteran',
    description: '25 Uetli Runs',
    color: 'text-blue-500',
  },
  runs_50: {
    icon: <Trophy className="w-5 h-5" />,
    title: 'Gipfelstürmer',
    description: '50 Uetli Runs',
    color: 'text-purple-500',
  },
  runs_100: {
    icon: <Award className="w-5 h-5" />,
    title: 'Uetli-Legende',
    description: '100 Uetli Runs',
    color: 'text-primary',
  },
  all_segments: {
    icon: <Target className="w-5 h-5" />,
    title: 'Segmentjäger',
    description: 'Alle Segmente gelaufen',
    color: 'text-teal-500',
  },
  streak_2: {
    icon: <Clock className="w-5 h-5" />,
    title: 'Dranbleiber',
    description: '2 Wochen Streak',
    color: 'text-indigo-500',
  },
  streak_4: {
    icon: <Flame className="w-5 h-5" />,
    title: 'Durchhalter',
    description: '4 Wochen Streak',
    color: 'text-red-500',
  },
  streak_8: {
    icon: <Flame className="w-5 h-5" />,
    title: 'Unaufhaltsam',
    description: '8 Wochen Streak',
    color: 'text-rose-600',
  },
  early_bird: {
    icon: <Sun className="w-5 h-5" />,
    title: 'Frühaufsteher',
    description: 'Run vor 7 Uhr',
    color: 'text-amber-500',
  },
  night_owl: {
    icon: <Moon className="w-5 h-5" />,
    title: 'Nachteule',
    description: 'Run nach 20 Uhr',
    color: 'text-slate-400',
  },
  // Exclusive Pioneer Achievements
  pioneer_10: {
    icon: <Crown className="w-5 h-5" />,
    title: 'Top 10 Pioneer',
    description: 'Einer der ersten 10 User',
    color: 'text-amber-400',
    isExclusive: true,
  },
  pioneer_25: {
    icon: <Sparkles className="w-5 h-5" />,
    title: 'Top 25 Pioneer',
    description: 'Einer der ersten 25 User',
    color: 'text-amber-500',
    isExclusive: true,
  },
  pioneer_50: {
    icon: <Sparkles className="w-5 h-5" />,
    title: 'Top 50 Pioneer',
    description: 'Einer der ersten 50 User',
    color: 'text-amber-600',
    isExclusive: true,
  },
  founding_member: {
    icon: <Sparkles className="w-5 h-5" />,
    title: 'Founding Member',
    description: 'Früher Unterstützer',
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
  
  // Filter exclusive achievements to only show earned ones
  const earnedExclusiveAchievements = EXCLUSIVE_ACHIEVEMENTS.filter(a => earnedSet.has(a));
  const totalAchievements = REGULAR_ACHIEVEMENTS.length + earnedExclusiveAchievements.length;
  const earnedCount = [...REGULAR_ACHIEVEMENTS, ...earnedExclusiveAchievements].filter(a => earnedSet.has(a)).length;

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
              return (
                <div
                  key={achievementType}
                  className="flex items-center gap-2 px-3 py-2 rounded-lg bg-gradient-to-r from-amber-500/20 via-yellow-400/20 to-amber-500/20 border border-amber-500/30"
                  title={`${config.title}: ${config.description}`}
                >
                  <div className={config.color}>
                    {config.icon}
                  </div>
                  <p className="text-sm font-medium">{config.title}</p>
                </div>
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
          
          return (
            <div
              key={achievementType}
              className={`flex flex-col items-center p-3 rounded-lg transition-all ${
                isEarned 
                  ? 'bg-primary/10 border border-primary/30' 
                  : 'bg-muted/30 opacity-40'
              }`}
              title={`${config.title}: ${config.description}`}
            >
              <div className={isEarned ? config.color : 'text-muted-foreground'}>
                {config.icon}
              </div>
              <p className="text-xs font-medium mt-1 text-center truncate w-full">
                {config.title}
              </p>
            </div>
          );
        })}
      </div>
    </Card>
  );
}