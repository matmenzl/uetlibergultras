import { useQuery } from '@tanstack/react-query';
import { useNavigate } from 'react-router-dom';
import { supabase } from '@/integrations/supabase/client';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { ChevronRight } from 'lucide-react';
import logo from '@/assets/uu_logo.svg';
import { BadgeCard } from '@/components/badges';
import { badgeDefinitions, getBadgeById } from '@/config/badge-definitions';

interface Achievement {
  id: string;
  achievement: string;
  earned_at: string;
}

// Preview badges - a representative sample across categories
const PREVIEW_BADGE_IDS = [
  'first_run',
  'runs_5', 
  'streak_2',
  'early_bird',
  'snow_bunny',
  'denzlerweg_king'
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
        .select('id, achievement, earned_at')
        .eq('user_id', userId);
      if (error) throw error;
      return data as Achievement[];
    },
    enabled: !!userId
  });

  const earnedMap = new Map(earnedAchievements?.map(a => [a.achievement, a.earned_at]) || []);
  const earnedCount = earnedAchievements?.length || 0;
  const totalBadges = badgeDefinitions.length;

  return (
    <Card 
      className="p-4 h-full bg-pass-paper dark:bg-card border-pass-border dark:border-border cursor-pointer hover:shadow-lg transition-shadow group" 
      onClick={() => navigate('/pass')}
    >
      {/* Header */}
      <div className="flex items-center justify-between mb-4">
        <div className="flex items-center gap-2">
          <img src={logo} alt="" className="h-6 w-auto opacity-80" />
          <h3 className="font-bold text-sm">Uetliberg Badges</h3>
        </div>
        <div className="px-2 py-0.5 bg-primary/10 rounded-full">
          <span className="text-xs font-medium text-primary">
            {earnedCount}/{totalBadges}
          </span>
        </div>
      </div>

      {/* Badge preview grid */}
      <div className="grid grid-cols-3 gap-4 mb-4 py-2">
        {PREVIEW_BADGE_IDS.map((badgeId) => {
          const badge = getBadgeById(badgeId);
          if (!badge) return null;
          
          const earnedAt = earnedMap.get(badgeId);
          
          return (
            <BadgeCard
              key={badgeId}
              badge={badge}
              isEarned={!!earnedAt}
              earnedAt={earnedAt}
              size="sm"
            />
          );
        })}
      </div>

      {/* CTA */}
      <Button 
        variant="ghost" 
        size="sm" 
        className="w-full text-primary group-hover:bg-primary/10" 
        onClick={(e) => {
          e.stopPropagation();
          navigate('/pass');
        }}
      >
        Badges öffnen
        <ChevronRight className="w-4 h-4 ml-1 group-hover:translate-x-1 transition-transform" />
      </Button>
    </Card>
  );
}
