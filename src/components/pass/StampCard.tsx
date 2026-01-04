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

const categoryColors = {
  milestone: 'border-stamp-milestone bg-stamp-milestone/10',
  endurance: 'border-stamp-endurance bg-stamp-endurance/10',
  special: 'border-stamp-special bg-stamp-special/10',
  legend: 'border-stamp-legend bg-stamp-legend/10',
};

const categoryColorsFaded = {
  milestone: 'border-stamp-milestone/30',
  endurance: 'border-stamp-endurance/30',
  special: 'border-stamp-special/30',
  legend: 'border-stamp-legend/30',
};

export function StampCard({ config, isEarned, earnedAt, progress, size = 'md', isNewlyEarned = false }: StampCardProps) {
  const [showAnimation, setShowAnimation] = useState(false);
  const [hasAnimated, setHasAnimated] = useState(false);

  useEffect(() => {
    if (isNewlyEarned && !hasAnimated) {
      // Small delay to ensure the component is mounted
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
    sm: 'text-lg',
    md: 'text-xl',
    lg: 'text-2xl',
  };

  const earnedDate = earnedAt ? format(new Date(earnedAt), 'd. MMM yyyy', { locale: de }) : null;
  const progressPercent = progress ? Math.min((progress.current / progress.target) * 100, 100) : 0;

  // Random rotation for authentic stamp feel (consistent per render)
  const rotation = isEarned ? ((config.title.length % 7) - 3) : 0;

  return (
    <Popover>
      <PopoverTrigger asChild>
        <button
          className={cn(
            'relative rounded-full border-2 flex flex-col items-center justify-center transition-all duration-300 cursor-pointer group',
            sizeClasses[size],
            isEarned
              ? cn(
                  categoryColors[config.category],
                  'shadow-md hover:shadow-lg hover:scale-110'
                )
              : cn(
                  categoryColorsFaded[config.category],
                  'bg-pass-paper/50 dark:bg-pass-paper-dark/50 opacity-60 hover:opacity-80 border-dashed'
                ),
            showAnimation && 'animate-stamp-press'
          )}
          style={{
            transform: !showAnimation && isEarned ? `rotate(${rotation}deg)` : undefined,
          }}
        >
          {/* Ink splash effect during animation */}
          {showAnimation && (
            <div className="absolute inset-0 rounded-full bg-current opacity-0 animate-stamp-ink pointer-events-none" />
          )}

          {/* Stamp texture overlay for earned */}
          {isEarned && (
            <div className="absolute inset-0 rounded-full opacity-20 bg-[radial-gradient(circle_at_30%_30%,transparent_0%,transparent_50%,currentColor_50%,currentColor_51%,transparent_51%)] pointer-events-none" />
          )}
          
          {/* Icon */}
          <div className={cn(
            iconSizes[size],
            isEarned ? config.color : 'text-muted-foreground/50'
          )}>
            {config.icon}
          </div>

          {/* Progress ring for unearned */}
          {!isEarned && progress && progress.target > 0 && (
            <svg
              className="absolute inset-0 -rotate-90"
              viewBox="0 0 100 100"
            >
              <circle
                cx="50"
                cy="50"
                r="46"
                fill="none"
                stroke="currentColor"
                strokeWidth="4"
                className="text-muted/30"
              />
              <circle
                cx="50"
                cy="50"
                r="46"
                fill="none"
                stroke="currentColor"
                strokeWidth="4"
                strokeLinecap="round"
                strokeDasharray={`${progressPercent * 2.89} 289`}
                className="text-primary/50 transition-all duration-500"
              />
            </svg>
          )}
        </button>
      </PopoverTrigger>
      <PopoverContent className="w-64 bg-pass-paper dark:bg-card border-pass-border">
        <div className="flex flex-col items-center text-center gap-2">
          <div className={cn('scale-150 mb-2', isEarned ? config.color : 'text-muted-foreground')}>
            {config.icon}
          </div>
          <h4 className="font-bold text-foreground">{config.title}</h4>
          <p className="text-sm text-muted-foreground">{config.howToEarn}</p>
          {earnedDate ? (
            <p className="text-xs text-green-600 dark:text-green-400 mt-1 font-medium">
              ✓ Verdient am {earnedDate}
            </p>
          ) : (
            <>
              {progress && progress.target > 0 && (
                <div className="w-full mt-2">
                  <Progress value={progressPercent} className="h-2" />
                  <p className="text-xs text-muted-foreground mt-1">
                    {progress.current}/{progress.target}
                  </p>
                </div>
              )}
              {(!progress || progress.target === 0) && (
                <p className="text-xs text-muted-foreground mt-1">
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
