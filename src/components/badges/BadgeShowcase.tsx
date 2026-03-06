import { useQuery } from '@tanstack/react-query';
import { useNavigate } from 'react-router-dom';
import { supabase } from '@/integrations/supabase/client';
import { Card } from '@/components/ui/card';
import { BadgeCard } from './BadgeCard';
import { BadgeCategory, categoryStyles, getBadgesByCategory, badgeDefinitions } from '@/config/badge-definitions';
import { ChevronRight } from 'lucide-react';

interface Achievement {
  id: string;
  achievement: string;
  earned_at: string;
}

interface CheckIn {
  id: string;
  checked_in_at: string;
  segment_id: number;
  activity_id: number;
  weather_code: number | null;
  temperature: number | null;
}

// Helper to calculate week number
function getWeekNumber(date: Date): string {
  const d = new Date(Date.UTC(date.getFullYear(), date.getMonth(), date.getDate()));
  const dayNum = d.getUTCDay() || 7;
  d.setUTCDate(d.getUTCDate() + 4 - dayNum);
  const yearStart = new Date(Date.UTC(d.getUTCFullYear(), 0, 1));
  const weekNo = Math.ceil((((d.getTime() - yearStart.getTime()) / 86400000) + 1) / 7);
  return `${d.getUTCFullYear()}-W${weekNo}`;
}

// Calculate streak from check-ins
function calculateStreak(checkIns: { checked_in_at: string }[]): number {
  if (!checkIns?.length) return 0;
  
  const weekSet = new Set(checkIns.map(c => getWeekNumber(new Date(c.checked_in_at))));
  const weeks = Array.from(weekSet).sort().reverse();
  
  if (weeks.length === 0) return 0;
  
  const currentWeek = getWeekNumber(new Date());
  const lastWeek = getWeekNumber(new Date(Date.now() - 7 * 24 * 60 * 60 * 1000));
  
  if (weeks[0] !== currentWeek && weeks[0] !== lastWeek) return 0;
  
  let streak = 1;
  for (let i = 1; i < weeks.length; i++) {
    const prevWeekNum = parseInt(weeks[i - 1].split('-W')[1]);
    const currWeekNum = parseInt(weeks[i].split('-W')[1]);
    const prevYear = parseInt(weeks[i - 1].split('-W')[0]);
    const currYear = parseInt(weeks[i].split('-W')[0]);
    
    if (prevYear === currYear && prevWeekNum - currWeekNum === 1) {
      streak++;
    } else if (prevYear - currYear === 1 && prevWeekNum === 1 && currWeekNum >= 52) {
      streak++;
    } else {
      break;
    }
  }
  
  return streak;
}

interface BadgeShowcaseProps {
  userId?: string;
}

export function BadgeShowcase({ userId }: BadgeShowcaseProps) {
  const navigate = useNavigate();
  const isGuest = !userId;
  
  // Fetch earned achievements
  const { data: earnedAchievements } = useQuery({
    queryKey: ['achievements-showcase', userId],
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

  // Fetch check-ins for progress calculation
  const { data: checkIns } = useQuery({
    queryKey: ['check-ins-showcase', userId],
    queryFn: async () => {
      if (!userId) return [];
      const { data, error } = await supabase
        .from('check_ins')
        .select('id, checked_in_at, segment_id, activity_id, weather_code, temperature')
        .eq('user_id', userId);
      if (error) throw error;
      return data as CheckIn[];
    },
    enabled: !!userId
  });

  // Fetch total segments count
  const { data: totalSegments } = useQuery({
    queryKey: ['total-segments-showcase'],
    queryFn: async () => {
      const { count, error } = await supabase
        .from('uetliberg_segments')
        .select('*', { count: 'exact', head: true });
      if (error) throw error;
      return count || 0;
    }
  });

  const earnedMap = new Map(earnedAchievements?.map(a => [a.achievement, a.earned_at]) || []);
  
  // Calculate stats for progress - use String(activity_id) to properly deduplicate
  const totalRuns = checkIns ? new Set(checkIns.map(c => String(c.activity_id))).size : 0;
  
  const uniqueSegments = checkIns ? new Set(checkIns.map(c => c.segment_id)).size : 0;
  const currentStreak = calculateStreak(checkIns || []);
  
  // Weather-based runs - count UNIQUE activities, not check-ins
  const snowCodes = [71, 73, 75, 77, 85, 86];
  const rainCodes = [51, 53, 55, 61, 63, 65, 80, 81, 82, 95, 96, 99];
  
  const snowRuns = new Set(
    checkIns?.filter(c => c.weather_code && snowCodes.includes(c.weather_code))
      .map(c => String(c.activity_id)) || []
  ).size;
  
  const frostRuns = new Set(
    checkIns?.filter(c => c.temperature !== null && c.temperature < 0)
      .map(c => String(c.activity_id)) || []
  ).size;
  
  const rainRuns = new Set(
    checkIns?.filter(c => c.weather_code && rainCodes.includes(c.weather_code))
      .map(c => String(c.activity_id)) || []
  ).size;
  
  // Coiffeur runs (current year only)
  const COIFFEUR_SEGMENT_IDS = [4185072, 10683811];
  const currentYear = new Date().getFullYear();
  const coiffeurRuns = new Set(
    checkIns?.filter(c => {
      const checkInYear = new Date(c.checked_in_at).getFullYear();
      return checkInYear === currentYear && COIFFEUR_SEGMENT_IDS.includes(c.segment_id);
    }).map(c => String(c.activity_id)) || []
  ).size;

  const getProgress = (badgeId: string, target?: number, progressType?: string): { current: number; target: number } | null => {
    if (!target || !progressType) return null;
    // Don't show progress for guests
    if (isGuest) return null;
    
    let current = 0;
    switch (progressType) {
      case 'runs':
        current = totalRuns;
        break;
      case 'streak':
        current = currentStreak;
        break;
      case 'segments':
        current = uniqueSegments;
        return { current, target: totalSegments || target };
      case 'snow_runs':
        current = snowRuns;
        break;
      case 'frost_runs':
        current = frostRuns;
        break;
      case 'rain_runs':
        current = rainRuns;
        break;
      case 'coiffeur_runs':
        current = coiffeurRuns;
        break;
    }
    
    return { current, target };
  };

  const categories: BadgeCategory[] = ['milestone', 'endurance', 'weather', 'community', 'legend'];
  const earnedCount = earnedAchievements?.length || 0;
  const totalBadges = badgeDefinitions.length;

  return (
    <Card 
      className="p-4 mb-8 bg-pass-paper dark:bg-card border-pass-border dark:border-border overflow-hidden cursor-pointer group"
      onClick={() => isGuest ? navigate('/auth') : navigate('/pass')}
    >
      {/* Header */}
      <div className="flex items-center justify-between mb-4">
        <h3 className="font-bold text-sm flex items-center gap-2">
          {isGuest ? 'Diese Badges warten auf dich' : 'Uetliberg Badges'}
          <ChevronRight className="w-4 h-4 text-muted-foreground group-hover:translate-x-1 transition-transform" />
        </h3>
        {!isGuest && (
          <div className="px-2 py-0.5 bg-primary/10 rounded-full">
            <span className="text-xs font-medium text-primary">
              {earnedCount}/{totalBadges}
            </span>
          </div>
        )}
        {isGuest && (
          <div className="px-2 py-0.5 bg-primary/10 rounded-full">
            <span className="text-xs font-medium text-primary">
              {totalBadges} Badges
            </span>
          </div>
        )}
      </div>

      {/* Scrollable badge categories */}
      <div className="relative">
        {/* Left shadow */}
        <div className="absolute left-0 top-0 bottom-0 w-8 bg-gradient-to-r from-pass-paper dark:from-card to-transparent z-10 pointer-events-none opacity-0 group-hover:opacity-100 transition-opacity" />
        
        {/* Right shadow */}
        <div className="absolute right-0 top-0 bottom-0 w-8 bg-gradient-to-l from-pass-paper dark:from-card to-transparent z-10 pointer-events-none" />
        
        <div 
          className="flex gap-8 overflow-x-auto pb-3 scrollbar-hide"
          onClick={(e) => e.stopPropagation()}
        >
          {categories.map(category => {
            const badges = getBadgesByCategory(category);
            const style = categoryStyles[category];
            
            return (
              <div key={category} className="flex-shrink-0">
                {/* Category label */}
                <div className="flex items-center gap-1 mb-2">
                  <span 
                    className="text-xs font-medium px-2 py-0.5 rounded-full"
                    style={{ 
                      backgroundColor: `hsl(${style.primaryHsl} / 0.15)`,
                      color: `hsl(${style.primaryHsl})`
                    }}
                  >
                    {style.label}
                  </span>
                </div>
                
                {/* Badges for this category */}
                <div className="flex gap-3">
                  {badges.map(badge => {
                    const earnedAt = earnedMap.get(badge.id);
                    const progress = getProgress(badge.id, badge.target, badge.progressType);
                    
                    return (
                      <BadgeCard
                        key={badge.id}
                        badge={badge}
                        isEarned={!!earnedAt}
                        earnedAt={earnedAt}
                        progress={progress}
                        size="md"
                      />
                    );
                  })}
                </div>
              </div>
            );
          })}
        </div>
      </div>
    </Card>
  );
}
