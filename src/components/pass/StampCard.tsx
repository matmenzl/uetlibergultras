import { cn } from '@/lib/utils';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { Progress } from '@/components/ui/progress';
import { format } from 'date-fns';
import { de } from 'date-fns/locale';
import { useState, useEffect } from 'react';

export interface StampConfig {
  icon: React.ReactNode;
  title: string;
  description: string;
  howToEarn: React.ReactNode;
  color: string;
  category: 'milestone' | 'endurance' | 'special' | 'legend';
}

interface StampCardProps {
  config: StampConfig;
  isEarned: boolean;
  earnedAt?: string;
  progress?: { current: number; target: number } | null;
  size?: 'sm' | 'md' | 'lg';
  isNewlyEarned?: boolean;
}

const categoryStyles = {
  milestone: {
    earned: 'border-stamp-milestone bg-gradient-to-br from-stamp-milestone/20 via-stamp-milestone/10 to-transparent shadow-stamp-milestone',
    unearned: 'border-stamp-milestone/25',
    glow: 'hsl(var(--stamp-milestone-glow))',
  },
  endurance: {
    earned: 'border-stamp-endurance bg-gradient-to-br from-stamp-endurance/20 via-stamp-endurance/10 to-transparent shadow-stamp-endurance',
    unearned: 'border-stamp-endurance/25',
    glow: 'hsl(var(--stamp-endurance-glow))',
  },
  special: {
    earned: 'border-stamp-special bg-gradient-to-br from-stamp-special/20 via-stamp-special/10 to-transparent shadow-stamp-special',
    unearned: 'border-stamp-special/25',
    glow: 'hsl(var(--stamp-special-glow))',
  },
  legend: {
    earned: 'border-stamp-legend bg-gradient-to-br from-stamp-legend/25 via-stamp-legend/15 to-transparent shadow-stamp-legend animate-glow-pulse',
    unearned: 'border-stamp-legend/25',
    glow: 'hsl(var(--stamp-legend-glow))',
  },
};

export function StampCard({ config, isEarned, earnedAt, progress, size = 'md', isNewlyEarned = false }: StampCardProps) {
  const [showAnimation, setShowAnimation] = useState(false);
  const [hasAnimated, setHasAnimated] = useState(false);
  const [isHovered, setIsHovered] = useState(false);

  useEffect(() => {
    if (isNewlyEarned && !hasAnimated) {
      const timer = setTimeout(() => {
        setShowAnimation(true);
        setHasAnimated(true);
      }, 100);
      return () => clearTimeout(timer);
    }
  }, [isNewlyEarned, hasAnimated]);

  const sizeClasses = {
    sm: 'w-16 h-16',
    md: 'w-20 h-20',
    lg: 'w-24 h-24',
  };

  const iconSizes = {
    sm: 'text-xl',
    md: 'text-2xl',
    lg: 'text-3xl',
  };

  const borderWidth = {
    sm: 'border-2',
    md: 'border-[3px]',
    lg: 'border-[3px]',
  };

  const earnedDate = earnedAt ? format(new Date(earnedAt), 'd. MMM yyyy', { locale: de }) : null;
  const progressPercent = progress ? Math.min((progress.current / progress.target) * 100, 100) : 0;

  // Random rotation for authentic stamp feel
  const rotation = isEarned ? ((config.title.length % 7) - 3) : 0;

  return (
    <Popover>
      <PopoverTrigger asChild>
        <button
          className={cn(
            'relative rounded-full flex flex-col items-center justify-center cursor-pointer group overflow-hidden',
            'transition-all duration-300 ease-out',
            sizeClasses[size],
            borderWidth[size],
            isEarned
              ? cn(
                  categoryStyles[config.category].earned,
                  'hover:scale-110'
                )
              : cn(
                  categoryStyles[config.category].unearned,
                  'bg-pass-paper/30 dark:bg-pass-paper-dark/30',
                  'opacity-50 hover:opacity-70',
                  'border-dashed'
                ),
            showAnimation && 'animate-stamp-press',
            isHovered && isEarned && 'animate-wobble'
          )}
          style={{
            transform: !showAnimation && isEarned && !isHovered ? `rotate(${rotation}deg)` : undefined,
          }}
          onMouseEnter={() => setIsHovered(true)}
          onMouseLeave={() => setIsHovered(false)}
        >
          {/* Outer decorative ring for earned stamps */}
          {isEarned && (
            <div className="absolute inset-[-2px] rounded-full border border-current opacity-30 pointer-events-none" />
          )}

          {/* Shimmer effect for earned stamps */}
          {isEarned && (
            <div 
              className="absolute inset-0 rounded-full opacity-40 pointer-events-none animate-shimmer"
              style={{
                background: `linear-gradient(90deg, transparent 0%, ${categoryStyles[config.category].glow} 50%, transparent 100%)`,
                backgroundSize: '200% 100%',
              }}
            />
          )}

          {/* Ink splash effect during animation */}
          {showAnimation && (
            <div className="absolute inset-0 rounded-full bg-current opacity-0 animate-stamp-ink pointer-events-none" />
          )}

          {/* Stamp texture overlay for earned - creates worn ink look */}
          {isEarned && (
            <>
              <div 
                className="absolute inset-0 rounded-full opacity-15 pointer-events-none mix-blend-overlay"
                style={{
                  backgroundImage: `radial-gradient(circle at 30% 30%, transparent 0%, transparent 40%, currentColor 40%, currentColor 42%, transparent 42%)`,
                  backgroundSize: '8px 8px',
                }}
              />
              <div 
                className="absolute inset-0 rounded-full opacity-10 pointer-events-none"
                style={{
                  backgroundImage: `radial-gradient(circle at 70% 60%, currentColor 0%, currentColor 1px, transparent 1px)`,
                  backgroundSize: '12px 12px',
                }}
              />
            </>
          )}
          
          {/* Icon with enhanced styling */}
          <div className={cn(
            iconSizes[size],
            'relative z-10 transition-all duration-300',
            isEarned 
              ? cn(config.color, 'drop-shadow-sm group-hover:scale-110 group-hover:drop-shadow-md') 
              : 'text-muted-foreground/40'
          )}>
            {config.icon}
          </div>

          {/* Inner glow for earned stamps */}
          {isEarned && (
            <div 
              className="absolute inset-2 rounded-full opacity-20 blur-sm pointer-events-none"
              style={{ backgroundColor: categoryStyles[config.category].glow }}
            />
          )}

          {/* Progress ring for unearned */}
          {!isEarned && progress && progress.target > 0 && (
            <svg
              className="absolute inset-0 -rotate-90"
              viewBox="0 0 100 100"
            >
              <circle
                cx="50"
                cy="50"
                r="44"
                fill="none"
                stroke="currentColor"
                strokeWidth="3"
                strokeDasharray="4 4"
                className="text-muted/20"
              />
              <circle
                cx="50"
                cy="50"
                r="44"
                fill="none"
                stroke="currentColor"
                strokeWidth="4"
                strokeLinecap="round"
                strokeDasharray={`${progressPercent * 2.76} 276`}
                className="text-primary/60 transition-all duration-500"
              />
            </svg>
          )}

          {/* Dotted placeholder ring for unearned without progress */}
          {!isEarned && (!progress || progress.target === 0) && (
            <svg
              className="absolute inset-0"
              viewBox="0 0 100 100"
            >
              <circle
                cx="50"
                cy="50"
                r="44"
                fill="none"
                stroke="currentColor"
                strokeWidth="2"
                strokeDasharray="3 6"
                className="text-muted-foreground/20"
              />
            </svg>
          )}
        </button>
      </PopoverTrigger>
      <PopoverContent className="w-64 bg-pass-paper dark:bg-card border-pass-border shadow-lg">
        <div className="flex flex-col items-center text-center gap-2">
          <div className={cn(
            'text-3xl mb-1 transition-transform duration-300',
            isEarned ? cn(config.color, 'drop-shadow-md') : 'text-muted-foreground/60'
          )}>
            {config.icon}
          </div>
          <h4 className="font-bold text-foreground">{config.title}</h4>
          <p className="text-sm text-muted-foreground leading-relaxed">{config.howToEarn}</p>
          {earnedDate ? (
            <p className="text-xs text-green-600 dark:text-green-400 mt-1 font-semibold flex items-center gap-1">
              <span className="text-base">✓</span> Verdient am {earnedDate}
            </p>
          ) : (
            <>
              {progress && progress.target > 0 && (
                <div className="w-full mt-2">
                  <Progress value={progressPercent} className="h-2" />
                  <p className="text-xs text-muted-foreground mt-1 font-medium">
                    {progress.current}/{progress.target}
                  </p>
                </div>
              )}
              {(!progress || progress.target === 0) && (
                <p className="text-xs text-muted-foreground/70 mt-1 italic">
                  Noch nicht verdient
                </p>
              )}
            </>
          )}
        </div>
      </PopoverContent>
    </Popover>
  );
}
