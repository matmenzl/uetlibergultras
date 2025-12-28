import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { Card } from '@/components/ui/card';
import { Flame } from 'lucide-react';

interface CheckIn {
  checked_in_at: string;
  activity_id: number;
}

function getWeekNumber(date: Date): string {
  const d = new Date(Date.UTC(date.getFullYear(), date.getMonth(), date.getDate()));
  d.setUTCDate(d.getUTCDate() + 4 - (d.getUTCDay() || 7));
  const yearStart = new Date(Date.UTC(d.getUTCFullYear(), 0, 1));
  const weekNo = Math.ceil((((d.getTime() - yearStart.getTime()) / 86400000) + 1) / 7);
  return `${d.getUTCFullYear()}-W${weekNo}`;
}

function calculateStreak(checkIns: CheckIn[]): number {
  if (!checkIns || checkIns.length === 0) return 0;

  // Get unique weeks with activities
  const weeksWithActivity = new Set<string>();
  checkIns.forEach(checkIn => {
    const week = getWeekNumber(new Date(checkIn.checked_in_at));
    weeksWithActivity.add(week);
  });

  // Get current week
  const now = new Date();
  const currentWeek = getWeekNumber(now);
  
  // Check if current week has activity
  let streak = 0;
  let checkWeek = currentWeek;
  
  // Start from current week or last week if no activity this week
  if (!weeksWithActivity.has(currentWeek)) {
    // Check if we're early in the week - still count previous week's streak
    const dayOfWeek = now.getDay();
    if (dayOfWeek <= 2) { // Sunday, Monday, Tuesday
      const lastWeek = new Date(now);
      lastWeek.setDate(lastWeek.getDate() - 7);
      checkWeek = getWeekNumber(lastWeek);
    } else {
      return 0; // Streak broken
    }
  }

  // Count consecutive weeks backwards
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

interface StreakCounterProps {
  userId?: string;
}

export function StreakCounter({ userId }: StreakCounterProps) {
  const { data: checkIns } = useQuery({
    queryKey: ['streak-checkins', userId],
    queryFn: async () => {
      if (!userId) return [];
      const { data, error } = await supabase
        .from('check_ins')
        .select('checked_in_at, activity_id')
        .eq('user_id', userId)
        .order('checked_in_at', { ascending: false });
      
      if (error) throw error;
      return data as CheckIn[];
    },
    enabled: !!userId,
  });

  const streak = calculateStreak(checkIns || []);
  
  const getStreakMessage = (weeks: number) => {
    if (weeks === 0) return "Starte deinen Streak!";
    if (weeks === 1) return "Guter Start!";
    if (weeks < 4) return "Weiter so!";
    if (weeks < 8) return "Du bist on fire! 🔥";
    return "Unaufhaltsam! 💪";
  };

  const getFlameColor = (weeks: number) => {
    if (weeks === 0) return "text-muted-foreground";
    if (weeks < 2) return "text-orange-400";
    if (weeks < 4) return "text-orange-500";
    if (weeks < 8) return "text-red-500";
    return "text-red-600";
  };

  return (
    <Card className="p-5 text-center">
      <div className={`flex justify-center mb-2 ${streak > 0 ? 'animate-pulse' : ''}`}>
        <Flame className={`w-6 h-6 sm:w-8 sm:h-8 ${getFlameColor(streak)}`} />
      </div>
      <p className="text-2xl sm:text-3xl font-bold text-primary">{streak}</p>
      <p className="text-sm text-muted-foreground">Wochen Streak</p>
      <p className="text-xs text-muted-foreground mt-1">{getStreakMessage(streak)}</p>
    </Card>
  );
}