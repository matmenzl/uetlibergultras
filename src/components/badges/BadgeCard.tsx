import { useState, useEffect } from 'react';
import { cn } from '@/lib/utils';
import { BadgeDefinition, categoryStyles } from '@/config/badge-definitions';
import { getSymbol } from './symbols';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { Progress } from '@/components/ui/progress';
import { format } from 'date-fns';
import { de } from 'date-fns/locale';

const MONTHS_DE = [
  'Januar', 'Februar', 'März', 'April', 'Mai', 'Juni',
  'Juli', 'August', 'September', 'Oktober', 'November', 'Dezember'
];

function getMonthLabel(earnedAt?: string): string | null {
  if (!earnedAt) return null;
  const d = new Date(earnedAt);
  return MONTHS_DE[d.getMonth()];
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

  return (
    <Popover>
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
            {Symbol && (
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

          {/* Progress bar for unearned badges */}
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
        className="w-64 p-4" 
        side="top"
        sideOffset={8}
      >
        <div className="space-y-3">
          {/* Header */}
          <div className="flex items-start gap-3">
            <div 
              className="w-10 h-14 flex-shrink-0 rounded"
              style={{ backgroundColor: `hsl(${badge.colors.background})` }}
            >
              {Symbol && (
                <Symbol
                  className="w-full h-full p-1"
                  primaryColor={`hsl(${badge.colors.primary})`}
                  secondaryColor={badge.colors.secondary ? `hsl(${badge.colors.secondary})` : undefined}
                />
              )}
            </div>
            <div className="flex-1 min-w-0">
              <h4 className="font-bold text-foreground leading-tight">{badge.title}</h4>
              <p className="text-xs text-muted-foreground mt-0.5">{badge.description}</p>
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
            <p className="text-muted-foreground">{badge.howToEarn}</p>
          </div>

          {/* Progress or earned date */}
          {isEarned && earnedAt ? (
            <div className="pt-2 border-t border-border">
              <p className="text-xs text-muted-foreground">
                Verdient am {format(new Date(earnedAt), 'd. MMMM yyyy', { locale: de })}
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
        </div>
      </PopoverContent>
    </Popover>
  );
}
