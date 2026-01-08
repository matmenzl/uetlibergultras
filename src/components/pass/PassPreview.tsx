import { useQuery } from '@tanstack/react-query';
import { useNavigate } from 'react-router-dom';
import { supabase } from '@/integrations/supabase/client';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { ChevronRight, Mountain, Flame, Star, Sun, Snowflake, Crown } from 'lucide-react';
import logo from '@/assets/uu_logo.svg';
import { StampCard, type StampConfig } from './StampCard';
type AchievementType = 'first_run' | 'runs_5' | 'runs_10' | 'runs_25' | 'runs_50' | 'runs_100' | 'all_segments' | 'streak_2' | 'streak_4' | 'streak_8' | 'early_bird' | 'night_owl' | 'pioneer_10' | 'denzlerweg_king' | 'coiffeur' | 'snow_bunny' | 'frosty';
interface Achievement {
  id: string;
  achievement: AchievementType;
  earned_at: string;
}

// Achievement configs for preview - subset of main configs
const PREVIEW_ACHIEVEMENTS: {
  id: AchievementType;
  config: StampConfig;
}[] = [{
  id: 'first_run',
  config: {
    title: 'Erstbesteigung',
    description: 'Dein erster Uetliberg-Run',
    howToEarn: 'Absolviere deinen ersten Run',
    icon: <Star className="w-5 h-5" />,
    color: 'text-yellow-500',
    category: 'milestone'
  }
}, {
  id: 'runs_5',
  config: {
    title: 'Bergfreund',
    description: '5 Runs geschafft',
    howToEarn: 'Absolviere 5 Runs',
    icon: <Mountain className="w-5 h-5" />,
    color: 'text-green-500',
    category: 'milestone'
  }
}, {
  id: 'streak_2',
  config: {
    title: 'Dranbleiber',
    description: '2 Wochen am Stück',
    howToEarn: '2 Wochen in Folge laufen',
    icon: <Flame className="w-5 h-5" />,
    color: 'text-orange-500',
    category: 'endurance'
  }
}, {
  id: 'early_bird',
  config: {
    title: 'Frühaufsteher',
    description: 'Run vor 7 Uhr morgens',
    howToEarn: 'Starte einen Run vor 7 Uhr',
    icon: <Sun className="w-5 h-5" />,
    color: 'text-amber-400',
    category: 'special'
  }
}, {
  id: 'snow_bunny',
  config: {
    title: 'Snow Bunny',
    description: 'Run bei Schneefall',
    howToEarn: 'Laufe bei Schneefall',
    icon: <Snowflake className="w-5 h-5" />,
    color: 'text-sky-300',
    category: 'special'
  }
}, {
  id: 'denzlerweg_king',
  config: {
    title: "S'Brot isch no warm",
    description: 'Denzlerweg Segment',
    howToEarn: 'Absolviere das Denzlerweg Segment',
    icon: <Crown className="w-5 h-5" />,
    color: 'text-amber-600',
    category: 'legend'
  }
}];
const ALL_ACHIEVEMENTS: AchievementType[] = ['first_run', 'runs_5', 'runs_10', 'runs_25', 'runs_50', 'runs_100', 'all_segments', 'streak_2', 'streak_4', 'streak_8', 'early_bird', 'night_owl', 'pioneer_10', 'denzlerweg_king', 'coiffeur', 'snow_bunny', 'frosty'];
interface PassPreviewProps {
  userId?: string;
}
export function PassPreview({
  userId
}: PassPreviewProps) {
  const navigate = useNavigate();
  const {
    data: earnedAchievements
  } = useQuery({
    queryKey: ['achievements-preview', userId],
    queryFn: async () => {
      if (!userId) return [];
      const {
        data,
        error
      } = await supabase.from('user_achievements').select('id, achievement, earned_at').eq('user_id', userId);
      if (error) throw error;
      return data as Achievement[];
    },
    enabled: !!userId
  });
  const earnedMap = new Map(earnedAchievements?.map(a => [a.achievement, a.earned_at]) || []);
  const earnedCount = earnedAchievements?.length || 0;
  return <Card className="p-4 h-full bg-pass-paper dark:bg-card border-pass-border dark:border-border cursor-pointer hover:shadow-lg transition-shadow group" onClick={() => navigate('/pass')}>
      {/* Header */}
      <div className="flex items-center justify-between mb-4">
        <div className="flex items-center gap-2">
          <img src={logo} alt="" className="h-6 w-auto opacity-80" />
          <h3 className="font-bold text-sm">Uetliberg Badges</h3>
        </div>
        <div className="px-2 py-0.5 bg-primary/10 rounded-full">
          <span className="text-xs font-medium text-primary">
            {earnedCount}/{ALL_ACHIEVEMENTS.length}
          </span>
        </div>
      </div>

      {/* Stamp preview grid */}
      <div className="grid grid-cols-3 gap-4 mb-4">
        {PREVIEW_ACHIEVEMENTS.map(({
        id,
        config
      }) => {
        const earnedAt = earnedMap.get(id);
        return <StampCard key={id} config={config} isEarned={!!earnedAt} earnedAt={earnedAt} size="sm" />;
      })}
      </div>

      {/* CTA */}
      <Button variant="ghost" size="sm" className="w-full text-primary group-hover:bg-primary/10" onClick={e => {
      e.stopPropagation();
      navigate('/pass');
    }}>
        Badges öffnen
        <ChevronRight className="w-4 h-4 ml-1 group-hover:translate-x-1 transition-transform" />
      </Button>
    </Card>;
}