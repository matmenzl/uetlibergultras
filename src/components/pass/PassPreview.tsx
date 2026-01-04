import { useQuery } from '@tanstack/react-query';
import { useNavigate } from 'react-router-dom';
import { supabase } from '@/integrations/supabase/client';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Mountain, ChevronRight, Star, Flame, Trophy, Award } from 'lucide-react';
import logo from '@/assets/uetlibergultras_logo.svg';

type AchievementType = 
  | 'first_run' | 'runs_5' | 'runs_10' | 'runs_25' | 'runs_50' | 'runs_100'
  | 'all_segments' | 'streak_2' | 'streak_4' | 'streak_8'
  | 'early_bird' | 'night_owl' | 'pioneer_10'
  | 'denzlerweg_king' | 'coiffeur' | 'snow_bunny' | 'frosty';

interface Achievement {
  id: string;
  achievement: AchievementType;
}

// Simple icon mapping for preview
const iconMap: Record<string, React.ReactNode> = {
  first_run: <Star className="w-5 h-5 text-yellow-500" />,
  runs_5: <Mountain className="w-5 h-5 text-green-500" />,
  runs_10: <Flame className="w-5 h-5 text-orange-500" />,
  runs_25: <Flame className="w-5 h-5 text-blue-500" />,
  runs_50: <Trophy className="w-5 h-5 text-purple-500" />,
  runs_100: <Award className="w-5 h-5 text-primary" />,
  streak_2: <Flame className="w-5 h-5 text-indigo-500" />,
  streak_4: <Flame className="w-5 h-5 text-red-500" />,
  streak_8: <Flame className="w-5 h-5 text-rose-600" />,
  all_segments: <Mountain className="w-5 h-5 text-teal-500" />,
  early_bird: <span className="text-lg">☀️</span>,
  night_owl: <span className="text-lg">🌙</span>,
  pioneer_10: <Trophy className="w-5 h-5 text-amber-400" />,
  snow_bunny: <span className="text-lg">🐰</span>,
  frosty: <span className="text-lg">🥶</span>,
  denzlerweg_king: <span className="text-lg">🍞</span>,
  coiffeur: <span className="text-lg">💇</span>,
};

const ALL_ACHIEVEMENTS: AchievementType[] = [
  'first_run', 'runs_5', 'runs_10', 'runs_25', 'runs_50', 'runs_100',
  'all_segments', 'streak_2', 'streak_4', 'streak_8',
  'early_bird', 'night_owl', 'pioneer_10',
  'denzlerweg_king', 'coiffeur', 'snow_bunny', 'frosty'
];

interface PassPreviewProps {
  userId?: string;
}

export function PassPreview({ userId }: PassPreviewProps) {
  const navigate = useNavigate();

  const { data: earnedAchievements } = useQuery({
    queryKey: ['achievements-preview', userId],
    queryFn: async () => {
      if (!userId) return [];
      const { data, error } = await supabase
        .from('user_achievements')
        .select('id, achievement')
        .eq('user_id', userId);
      if (error) throw error;
      return data as Achievement[];
    },
    enabled: !!userId,
  });

  const earnedSet = new Set(earnedAchievements?.map(a => a.achievement) || []);
  const earnedCount = earnedAchievements?.length || 0;

  // Get first 6 achievements to show
  const previewAchievements = ALL_ACHIEVEMENTS.slice(0, 6);

  return (
    <Card 
      className="p-4 h-full bg-pass-paper dark:bg-card border-pass-border dark:border-border cursor-pointer hover:shadow-lg transition-shadow group"
      onClick={() => navigate('/pass')}
    >
      {/* Header */}
      <div className="flex items-center justify-between mb-4">
        <div className="flex items-center gap-2">
          <img src={logo} alt="" className="h-6 w-auto opacity-80" />
          <h3 className="font-bold text-sm">Uetliberg Pass</h3>
        </div>
        <div className="px-2 py-0.5 bg-primary/10 rounded-full">
          <span className="text-xs font-medium text-primary">
            {earnedCount}/{ALL_ACHIEVEMENTS.length}
          </span>
        </div>
      </div>

      {/* Stamp preview */}
      <div className="flex flex-wrap gap-2 justify-center mb-4">
        {previewAchievements.map(type => {
          const isEarned = earnedSet.has(type);
          return (
            <div 
              key={type}
              className={`w-10 h-10 rounded-full border-2 flex items-center justify-center transition-all ${
                isEarned 
                  ? 'border-primary bg-primary/10 shadow-sm' 
                  : 'border-dashed border-muted-foreground/30 opacity-40'
              }`}
              style={{
                transform: isEarned ? `rotate(${Math.random() * 6 - 3}deg)` : undefined,
              }}
            >
              <span className={isEarned ? '' : 'opacity-50'}>
                {iconMap[type]}
              </span>
            </div>
          );
        })}
      </div>

      {/* CTA */}
      <Button 
        variant="ghost" 
        size="sm" 
        className="w-full text-primary group-hover:bg-primary/10"
      >
        Pass öffnen
        <ChevronRight className="w-4 h-4 ml-1 group-hover:translate-x-1 transition-transform" />
      </Button>
    </Card>
  );
}
