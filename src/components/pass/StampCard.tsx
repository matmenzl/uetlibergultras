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
    earned: 'border-stamp-milestone bg-gradient-to-br from-stamp-milestone/15 via-stamp-milestone/5 to-transparent',
    unearned: 'border-stamp-milestone/25',
    glow: 'hsl(var(--stamp-milestone-glow))',
  },
  endurance: {
    earned: 'border-stamp-endurance bg-gradient-to-br from-stamp-endurance/15 via-stamp-endurance/5 to-transparent',
    unearned: 'border-stamp-endurance/25',
    glow: 'hsl(var(--stamp-endurance-glow))',
  },
  special: {
    earned: 'border-stamp-special bg-gradient-to-br from-stamp-special/15 via-stamp-special/5 to-transparent',
    unearned: 'border-stamp-special/25',
    glow: 'hsl(var(--stamp-special-glow))',
  },
  legend: {
    earned: 'border-stamp-legend bg-gradient-to-br from-stamp-legend/20 via-stamp-legend/10 to-transparent',
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

  // Responsive size classes - smaller on mobile, larger on desktop
  const sizeClasses = {
    sm: 'w-10 h-12 sm:w-12 sm:h-14 md:w-14 md:h-16',
    md: 'w-12 h-14 sm:w-14 sm:h-16 md:w-16 md:h-[4.5rem] lg:w-18 lg:h-20',
    lg: 'w-14 h-16 sm:w-16 sm:h-[4.5rem] md:w-18 md:h-20 lg:w-22 lg:h-24',
  };

  const iconSizes = {
    sm: 'text-base sm:text-lg md:text-xl',
    md: 'text-lg sm:text-xl md:text-2xl',
    lg: 'text-xl sm:text-2xl md:text-3xl',
  };

  const earnedDate = earnedAt ? format(new Date(earnedAt), 'd. MMM yyyy', { locale: de }) : null;
  const progressPercent = progress ? Math.min((progress.current / progress.target) * 100, 100) : 0;

  // Random rotation for authentic stamp feel
  const rotation = isEarned ? ((config.title.length % 7) - 3) : 0;

  // Shield clip path
  const shieldClipPath = 'polygon(50% 0%, 100% 0%, 100% 65%, 50% 100%, 0% 65%, 0% 0%)';

  return (
    <Popover>
      <PopoverTrigger asChild>
        <button
          className={cn(
            'relative flex flex-col items-center justify-center cursor-pointer group overflow-visible',
            'transition-all duration-300 ease-out',
            sizeClasses[size],
            isEarned
              ? 'hover:scale-110'
              : 'opacity-50 hover:opacity-70',
            showAnimation && 'animate-stamp-press',
            isHovered && isEarned && 'animate-wobble'
          )}
          style={{
            transform: !showAnimation && isEarned && !isHovered ? `rotate(${rotation}deg)` : undefined,
          }}
          onMouseEnter={() => setIsHovered(true)}
          onMouseLeave={() => setIsHovered(false)}
        >
          {/* Shield shape background */}
          <div 
            className={cn(
              'absolute inset-0 border-2 transition-all duration-300',
              isEarned
                ? categoryStyles[config.category].earned
                : cn(
                    categoryStyles[config.category].unearned,
                    'bg-pass-paper/30 dark:bg-pass-paper-dark/30',
                    'border-dashed'
                  )
            )}
            style={{ clipPath: shieldClipPath }}
          />

          {/* Subtle shimmer effect for earned stamps */}
          {isEarned && (
            <div 
              className="absolute inset-0 opacity-20 pointer-events-none animate-shimmer"
              style={{
                clipPath: shieldClipPath,
                background: `linear-gradient(90deg, transparent 0%, ${categoryStyles[config.category].glow} 50%, transparent 100%)`,
                backgroundSize: '200% 100%',
              }}
            />
          )}

          {/* Ink splash effect during animation */}
          {showAnimation && (
            <div 
              className="absolute inset-0 bg-current opacity-0 animate-stamp-ink pointer-events-none" 
              style={{ clipPath: shieldClipPath }}
            />
          )}

          {/* Stamp texture overlay for earned - creates worn ink look */}
          {isEarned && (
            <>
              <div 
                className="absolute inset-0 opacity-15 pointer-events-none mix-blend-overlay"
                style={{
                  clipPath: shieldClipPath,
                  backgroundImage: `radial-gradient(circle at 30% 30%, transparent 0%, transparent 40%, currentColor 40%, currentColor 42%, transparent 42%)`,
                  backgroundSize: '8px 8px',
                }}
              />
              <div 
                className="absolute inset-0 opacity-10 pointer-events-none"
                style={{
                  clipPath: shieldClipPath,
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

          {/* Subtle inner glow for earned stamps */}
          {isEarned && (
            <div 
              className="absolute inset-3 opacity-10 blur-sm pointer-events-none"
              style={{ 
                clipPath: shieldClipPath,
                backgroundColor: categoryStyles[config.category].glow 
              }}
            />
          )}

          {/* Progress bar for unearned */}
          {!isEarned && progress && progress.target > 0 && (
            <div 
              className="absolute bottom-1 left-1 right-1 h-1 bg-muted/30 rounded-full overflow-hidden"
            >
              <div 
                className="h-full bg-primary/60 transition-all duration-500 rounded-full"
                style={{ width: `${progressPercent}%` }}
              />
            </div>
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
