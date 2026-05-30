import { useState, useEffect } from 'react';
import { cn } from '@/lib/utils';
import { BadgeDefinition, categoryStyles } from '@/config/badge-definitions';
import { getSymbol } from './symbols';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { Progress } from '@/components/ui/progress';
import { format } from 'date-fns';
import { de } from 'date-fns/locale';
import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { Link } from 'react-router-dom';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { X } from 'lucide-react';

const MONTHS_DE = [
  'Januar', 'Februar', 'März', 'April', 'Mai', 'Juni',
  'Juli', 'August', 'September', 'Oktober', 'November', 'Dezember'
];

function getMonthLabel(earnedAt?: string): string | null {
  if (!earnedAt) return null;
  const d = new Date(earnedAt);
  return MONTHS_DE[d.getUTCMonth()];
}

const MONTHLY_BADGE_IDS = ['monthly_gold', 'monthly_silver', 'monthly_bronze'];

interface BadgeCardProps {
  badge: BadgeDefinition;
  isEarned: boolean;
  earnedAt?: string;
  progress?: { current: number; target: number } | null;
  size?: 'sm' | 'md' | 'lg';
  isNewlyEarned?: boolean;
}

const sizeClasses = {
  sm: 'w-14 sm:w-16',
  md: 'w-18 sm:w-20 md:w-24',
  lg: 'w-20 sm:w-24 md:w-28',
};

export function BadgeCard({
  badge,
  isEarned,
  earnedAt,
  progress,
  size = 'md',
  isNewlyEarned = false,
}: BadgeCardProps) {
  const [showAnimation, setShowAnimation] = useState(false);
  const [popoverOpen, setPopoverOpen] = useState(false);
  const Symbol = getSymbol(badge.symbolId);
  const categoryStyle = categoryStyles[badge.category];

  const isMonthly = MONTHLY_BADGE_IDS.includes(badge.id);
  const monthLabel = isMonthly ? getMonthLabel(earnedAt) : null;

  useEffect(() => {
    if (isNewlyEarned) {
      setShowAnimation(true);
      const timer = setTimeout(() => setShowAnimation(false), 1000);
      return () => clearTimeout(timer);
    }
  }, [isNewlyEarned]);

  const progressPercent = progress 
    ? Math.min(100, Math.round((progress.current / progress.target) * 100)) 
    : 0;

  const { data: earners, isLoading: earnersLoading } = useQuery({
    queryKey: ['badge-earners', badge.id],
    enabled: popoverOpen,
    staleTime: 60_000,
    queryFn: async () => {
      const { data: achievementRows, error: aErr } = await supabase
        .from('user_achievements')
        .select('user_id, earned_at')
        .eq('achievement', badge.id as any)
        .order('earned_at', { ascending: true });
      if (aErr) throw aErr;
      if (!achievementRows || achievementRows.length === 0) return [];
      const userIds = achievementRows.map((r) => r.user_id);
      const { data: profiles, error: pErr } = await supabase
        .from('public_profiles')
        .select('id, display_name, profile_picture')
        .in('id', userIds);
      if (pErr) throw pErr;
      const profileMap = new Map((profiles ?? []).map((p) => [p.id, p]));
      return achievementRows
        .map((r) => {
          const p = profileMap.get(r.user_id);
          if (!p) return null;
          return {
            id: p.id,
            display_name: p.display_name ?? 'Läufer:in',
            profile_picture: p.profile_picture,
            earned_at: r.earned_at,
          };
        })
        .filter(Boolean) as Array<{ id: string; display_name: string; profile_picture: string | null; earned_at: string }>;
    },
  });

  return (
    <div className="flex flex-col items-center">
    <Popover open={popoverOpen} onOpenChange={setPopoverOpen}>
      <PopoverTrigger asChild>
        <button
          className={cn(
            'relative aspect-[5/7] transition-all duration-300 focus:outline-none focus-visible:ring-2 focus-visible:ring-primary',
            sizeClasses[size],
            isEarned ? 'hover:scale-105' : 'hover:scale-102 opacity-60',
            showAnimation && 'animate-stamp-press'
          )}
        >
          {/* Shield SVG Background */}
          <svg
            viewBox="0 0 100 140"
            className="absolute inset-0 w-full h-full"
            preserveAspectRatio="xMidYMid meet"
          >
            {/* Glow effect for earned badges */}
            {isEarned && (
              <defs>
                <filter id={`glow-${badge.id}`} x="-50%" y="-50%" width="200%" height="200%">
                  <feGaussianBlur stdDeviation="3" result="coloredBlur"/>
                  <feMerge>
                    <feMergeNode in="coloredBlur"/>
                    <feMergeNode in="SourceGraphic"/>
                  </feMerge>
                </filter>
              </defs>
            )}
            
            {/* Shield shape */}
            <path
              d="M8 8 L8 80 Q8 95 50 132 Q92 95 92 80 L92 8 Q92 4 88 4 L12 4 Q8 4 8 8 Z"
              fill={isEarned ? `hsl(${badge.colors.background})` : 'hsl(0 0% 90%)'}
              stroke={isEarned ? `hsl(${badge.colors.primary})` : 'hsl(0 0% 60%)'}
              strokeWidth="3"
              strokeLinejoin="round"
              strokeDasharray={isEarned ? 'none' : '6,4'}
              filter={isEarned ? `url(#glow-${badge.id})` : undefined}
              className="transition-all duration-300"
            />

            {/* Category accent line at top */}
            {isEarned && (
              <path
                d="M12 4 L88 4"
                stroke={`hsl(${badge.colors.primary})`}
                strokeWidth="4"
                strokeLinecap="round"
              />
            )}
          </svg>

          {/* Symbol container */}
          <div className="absolute inset-0 flex items-center justify-center p-3 pb-8">
            {badge.imageUrl ? (
              <img
                src={badge.imageUrl}
                alt={badge.title}
                className={cn(
                  'w-full h-auto max-h-[70%] object-contain transition-all duration-300 drop-shadow-md',
                  !isEarned && 'grayscale-[90%] opacity-50 contrast-75'
                )}
              />
            ) : Symbol && (
              <Symbol
                className={cn(
                  'w-full h-auto max-h-[60%] transition-all duration-300',
                  !isEarned && 'grayscale opacity-40'
                )}
                primaryColor={isEarned ? `hsl(${badge.colors.primary})` : 'hsl(0 0% 50%)'}
                secondaryColor={badge.colors.secondary ? `hsl(${badge.colors.secondary})` : undefined}
              />
            )}
          </div>

          {/* Month label rendered outside badge below */}
          {!isEarned && progress && progress.target > 0 && (
            <div className="absolute bottom-[15%] left-[15%] right-[15%]">
              <div className="h-1.5 bg-muted rounded-full overflow-hidden">
                <div 
                  className="h-full rounded-full transition-all duration-500"
                  style={{ 
                    width: `${progressPercent}%`,
                    backgroundColor: `hsl(${badge.colors.primary})`
                  }}
                />
              </div>
              <p className="text-[8px] text-muted-foreground text-center mt-0.5">
                {progress.current}/{progress.target}
              </p>
            </div>
          )}

          {/* Stamp animation overlay */}
          {showAnimation && (
            <div 
              className="absolute inset-0 rounded-lg animate-stamp-ink pointer-events-none"
              style={{ 
                backgroundColor: `hsl(${badge.colors.primary})`,
                opacity: 0 
              }}
            />
          )}
        </button>
      </PopoverTrigger>

      <PopoverContent
        className="w-80 sm:w-96 p-5 relative"
        side="top"
        sideOffset={8}
      >
        <button
          onClick={() => setPopoverOpen(false)}
          className="absolute top-2 right-2 p-1.5 rounded-full hover:bg-muted transition-colors text-muted-foreground hover:text-foreground"
          aria-label="Schliessen"
        >
          <X className="w-4 h-4" />
        </button>
        <div className="space-y-4">
          {/* Large centered badge image */}
          <div className="flex flex-col items-center gap-3">
            <div
              className="w-24 h-32 sm:w-28 sm:h-36 rounded-lg overflow-hidden flex items-center justify-center shadow-lg"
              style={{ backgroundColor: `hsl(${badge.colors.background})` }}
            >
              {badge.imageUrl ? (
                <img src={badge.imageUrl} alt={badge.title} className="w-full h-full object-contain p-2" />
              ) : Symbol && (
                <Symbol
                  className="w-full h-full p-3"
                  primaryColor={`hsl(${badge.colors.primary})`}
                  secondaryColor={badge.colors.secondary ? `hsl(${badge.colors.secondary})` : undefined}
                />
              )}
            </div>
            <div className="text-center">
              <h4 className="font-bold text-foreground text-base sm:text-lg leading-tight">
                {badge.title}{isMonthly && monthLabel ? ` – ${monthLabel}` : ''}
              </h4>
              <p className="text-sm text-muted-foreground mt-1">{badge.description}</p>
            </div>
          </div>

          {/* Category badge */}
          <div 
            className="inline-flex px-2 py-0.5 rounded-full text-xs font-medium"
            style={{ 
              backgroundColor: `hsl(${categoryStyle.primaryHsl} / 0.15)`,
              color: `hsl(${categoryStyle.primaryHsl})`
            }}
          >
            {categoryStyle.label}
          </div>

          {/* How to earn */}
          <div className="text-sm">
            <p className="text-muted-foreground">
              {isMonthly && isEarned
                ? badge.howToEarn
                    .replace(/^Erreiche\b/, 'Erreichte')
                    .replace(/^Werde\b/, 'Wurde')
                    .replace(/in einer Monats-Challenge|einer Monats-Challenge/i, monthLabel ? `in der Monats-Challenge ${monthLabel}` : 'in einer Monats-Challenge')
                : badge.howToEarn}
            </p>
          </div>

          {/* Progress or earned date */}
          {isEarned && earnedAt ? (
            <div className="pt-2 border-t border-border">
              <p className="text-xs text-muted-foreground">
                Verdient am {(() => {
                  const d = new Date(earnedAt);
                  return `${d.getUTCDate()}. ${MONTHS_DE[d.getUTCMonth()]} ${d.getUTCFullYear()}`;
                })()}
              </p>
            </div>
          ) : progress && progress.target > 0 ? (
            <div className="pt-2 border-t border-border space-y-1">
              <div className="flex justify-between text-xs">
                <span className="text-muted-foreground">Fortschritt</span>
                <span className="font-medium">{progress.current} / {progress.target}</span>
              </div>
              <Progress value={progressPercent} className="h-2" />
            </div>
          ) : null}

          {/* Earners list */}
          <div className="pt-2 border-t border-border space-y-2">
            <p className="text-xs font-semibold text-foreground">
              {earnersLoading
                ? 'Lade Läufer:innen...'
                : `Bereits erreicht von ${earners?.length ?? 0} Läufer:in${(earners?.length ?? 0) === 1 ? '' : 'nen'}`}
            </p>
            {!earnersLoading && earners && earners.length > 0 && (
              <div className="max-h-40 overflow-y-auto -mr-2 pr-2 space-y-1.5">
                {earners.map((e) => (
                  <Link
                    key={e.id}
                    to={`/runner/${e.id}`}
                    onClick={() => setPopoverOpen(false)}
                    className="flex items-center gap-2 rounded-md px-1.5 py-1 hover:bg-muted transition-colors"
                  >
                    <Avatar className="h-6 w-6">
                      <AvatarImage src={e.profile_picture ?? undefined} alt={e.display_name} />
                      <AvatarFallback className="text-[10px]">
                        {e.display_name.charAt(0).toUpperCase()}
                      </AvatarFallback>
                    </Avatar>
                    <span className="text-xs text-foreground truncate">{e.display_name}</span>
                  </Link>
                ))}
              </div>
            )}
            {!earnersLoading && (!earners || earners.length === 0) && (
              <p className="text-xs text-muted-foreground italic">
                Noch niemand hat diesen Badge erreicht.
              </p>
            )}
          </div>
        </div>
      </PopoverContent>
    </Popover>
      {isMonthly && isEarned && monthLabel && (
        <span 
          className="mt-0.5 text-[9px] sm:text-[10px] font-semibold uppercase tracking-wider text-muted-foreground"
        >
          {monthLabel}
        </span>
      )}
    </div>
  );
}
