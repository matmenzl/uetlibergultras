import { cn } from '@/lib/utils';
import { StampCard, StampConfig } from './StampCard';
import { LucideIcon } from 'lucide-react';

interface PassPageProps {
  title: string;
  icon: LucideIcon;
  achievements: {
    type: string;
    config: StampConfig;
    isEarned: boolean;
    earnedAt?: string;
    progress?: { current: number; target: number } | null;
  }[];
  category: 'milestone' | 'endurance' | 'special' | 'legend';
}

const categoryStyles = {
  milestone: 'border-stamp-milestone/20',
  endurance: 'border-stamp-endurance/20',
  special: 'border-stamp-special/20',
  legend: 'border-stamp-legend/20',
};

const categoryTextStyles = {
  milestone: 'text-stamp-milestone',
  endurance: 'text-stamp-endurance',
  special: 'text-stamp-special',
  legend: 'text-stamp-legend',
};

export function PassPage({ title, icon: Icon, achievements, category }: PassPageProps) {
  return (
    <div className={cn(
      'rounded-lg border-2 p-4 bg-pass-paper/30 dark:bg-card/50',
      categoryStyles[category]
    )}>
      {/* Page header */}
      <div className="flex items-center gap-2 mb-4 pb-2 border-b border-pass-border/50 dark:border-border/50">
        <Icon className={cn('w-4 h-4', categoryTextStyles[category])} />
        <h3 className={cn('text-sm font-semibold', categoryTextStyles[category])}>
          {title}
        </h3>
        <span className="text-xs text-muted-foreground ml-auto">
          {achievements.filter(a => a.isEarned).length}/{achievements.length}
        </span>
      </div>

      {/* Stamps grid */}
      <div className="flex flex-wrap gap-3 justify-center">
        {achievements.map((achievement) => (
          <StampCard
            key={achievement.type}
            config={achievement.config}
            isEarned={achievement.isEarned}
            earnedAt={achievement.earnedAt}
            progress={achievement.progress}
            size="md"
          />
        ))}
      </div>
    </div>
  );
}
