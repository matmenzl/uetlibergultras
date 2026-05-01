import { useQuery } from '@tanstack/react-query';
import { useNavigate } from 'react-router-dom';
import { supabase } from '@/integrations/supabase/client';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Trophy, Medal, Calendar, User, ArrowRight } from 'lucide-react';
import { differenceInCalendarDays, lastDayOfMonth } from 'date-fns';
import monthlyGoldHybrid from '@/assets/badges/monthly-gold-hybrid.png';
import monthlySilverHybrid from '@/assets/badges/monthly-silver-hybrid.png';
import monthlyBronzeHybrid from '@/assets/badges/monthly-bronze-hybrid.png';

const MONTHS_DE = [
  'Januar', 'Februar', 'März', 'April', 'Mai', 'Juni',
  'Juli', 'August', 'September', 'Oktober', 'November', 'Dezember'
];

const MEDAL_IMAGES = [monthlyGoldHybrid, monthlySilverHybrid, monthlyBronzeHybrid];
const MEDAL_LABELS = ['Gold', 'Silber', 'Bronze'];

interface WinnerWithProfile {
  user_id: string;
  rank: number;
  total_runs: number;
  display_name: string;
  profile_picture: string | null;
}

export function CurrentMonthChallengeBox() {
  const navigate = useNavigate();
  const now = new Date();
  const currentMonthName = MONTHS_DE[now.getMonth()];
  const daysRemaining = Math.max(differenceInCalendarDays(lastDayOfMonth(now), now), 0);

  // Previous month for showing winners
  const prevDate = new Date(now.getFullYear(), now.getMonth() - 1, 1);
  const prevYear = prevDate.getFullYear();
  const prevMonth = prevDate.getMonth() + 1;
  const prevMonthName = MONTHS_DE[prevDate.getMonth()];

  const { data: winners } = useQuery({
    queryKey: ['current-month-box-winners', prevYear, prevMonth],
    queryFn: async (): Promise<WinnerWithProfile[]> => {
      const { data: w } = await supabase
        .from('monthly_challenge_winners')
        .select('user_id, rank, total_runs')
        .eq('year', prevYear)
        .eq('month', prevMonth)
        .order('rank', { ascending: true });

      if (!w || w.length === 0) return [];

      const { data: profiles } = await supabase
        .from('public_profiles')
        .select('id, display_name, profile_picture')
        .in('id', w.map(x => x.user_id));

      const pMap = new Map(profiles?.map(p => [p.id, p]) || []);

      return w.map(x => ({
        user_id: x.user_id,
        rank: x.rank,
        total_runs: x.total_runs,
        display_name: pMap.get(x.user_id)?.display_name || 'Unbekannt',
        profile_picture: pMap.get(x.user_id)?.profile_picture || null,
      }));
    },
  });

  return (
    <Card className="p-6 mb-8 bg-gradient-to-br from-primary/10 via-primary/5 to-background border-primary/30 overflow-hidden relative animate-fade-in">
      {/* Decorative trophy */}
      <Trophy className="absolute -right-4 -top-4 w-32 h-32 text-primary/5 rotate-12" />

      <div className="relative z-10 flex flex-col md:flex-row gap-6 items-start md:items-center justify-between">
        {/* Left: current challenge */}
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2 mb-2">
            <Trophy className="w-5 h-5 text-primary shrink-0" />
            <h3 className="font-bold text-lg sm:text-xl">
              {currentMonthName}-Challenge läuft!
            </h3>
          </div>

          <div className="flex items-center gap-2 mb-3 text-sm text-muted-foreground">
            <Calendar className="w-4 h-4 shrink-0" />
            <span>
              Noch <strong className="text-foreground">{daysRemaining} {daysRemaining === 1 ? 'Tag' : 'Tage'}</strong> Zeit, um Gold, Silber oder Bronze zu holen.
            </span>
          </div>

          {/* Medal preview */}
          <div className="flex items-center gap-3 mb-4">
            {MEDAL_IMAGES.map((src, i) => (
              <div key={i} className="flex flex-col items-center">
                <img
                  src={src}
                  alt={`${MEDAL_LABELS[i]}-Medaille`}
                  className="w-12 h-12 sm:w-14 sm:h-14 drop-shadow-md"
                />
                <span className="text-[10px] font-medium text-muted-foreground mt-0.5">
                  {MEDAL_LABELS[i]}
                </span>
              </div>
            ))}
          </div>

          <Button
            onClick={() => navigate('/auth')}
            size="lg"
            className="shadow-md shadow-primary/20 hover:shadow-lg hover:shadow-primary/30 transition-all hover:scale-[1.02]"
          >
            Jetzt mitmachen
            <ArrowRight className="w-4 h-4 ml-2" />
          </Button>
        </div>

        {/* Right: previous month winners */}
        {winners && winners.length > 0 && (
          <div className="w-full md:w-auto md:min-w-[260px] md:border-l md:border-primary/20 md:pl-6">
            <p className="text-xs uppercase tracking-wide text-muted-foreground mb-3 font-semibold">
              {prevMonthName}-Sieger
            </p>
            <div className="space-y-2">
              {winners.map((w) => {
                const RankIcon = w.rank === 1
                  ? <Trophy className="w-4 h-4 text-yellow-500" />
                  : w.rank === 2
                  ? <Medal className="w-4 h-4 text-gray-400" />
                  : <Medal className="w-4 h-4 text-amber-600" />;

                return (
                  <div key={w.user_id} className="flex items-center gap-3">
                    <div className="w-5 flex justify-center">{RankIcon}</div>
                    <Avatar className="w-7 h-7">
                      <AvatarImage src={w.profile_picture || undefined} />
                      <AvatarFallback>
                        <User className="w-3 h-3" />
                      </AvatarFallback>
                    </Avatar>
                    <span className="text-sm font-medium truncate flex-1">
                      {w.display_name}
                    </span>
                    <span className="text-xs text-muted-foreground shrink-0">
                      {w.total_runs} Runs
                    </span>
                  </div>
                );
              })}
            </div>
          </div>
        )}
      </div>
    </Card>
  );
}