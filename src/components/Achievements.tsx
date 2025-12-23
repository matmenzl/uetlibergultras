import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { Card } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Award, Mountain, Flame, Sun, Moon, Star, Target, Zap, Trophy, Clock } from 'lucide-react';

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
  | 'night_owl';

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
    title: 'Üetli-Veteran',
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
    title: 'Üetli-Legende',
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
};

const ALL_ACHIEVEMENTS: AchievementType[] = [
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

  return (
    <Card className="p-6">
      <div className="flex items-center gap-2 mb-4">
        <Award className="w-5 h-5 text-primary" />
        <h3 className="font-bold text-lg">Achievements</h3>
        <Badge variant="secondary" className="ml-auto">
          {earnedSet.size}/{ALL_ACHIEVEMENTS.length}
        </Badge>
      </div>
      <div className="grid grid-cols-3 sm:grid-cols-4 gap-3">
        {ALL_ACHIEVEMENTS.map((achievementType) => {
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