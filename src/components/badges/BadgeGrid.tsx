import { cn } from '@/lib/utils';
import { BadgeCard } from './BadgeCard';
import { BadgeDefinition, BadgeCategory, categoryStyles } from '@/config/badge-definitions';

export interface EarnedBadge {
  id: string;
  earnedAt?: string;
  progress?: { current: number; target: number } | null;
  isNewlyEarned?: boolean;
}

interface BadgeGridProps {
  badges: BadgeDefinition[];
  earnedBadges: EarnedBadge[];
  title?: string;
  category?: BadgeCategory;
  size?: 'sm' | 'md' | 'lg';
  className?: string;
}

export function BadgeGrid({
  badges,
  earnedBadges,
  title,
  category,
  size = 'md',
  className,
}: BadgeGridProps) {
  const earnedMap = new Map(
    earnedBadges.map(b => [b.id, b])
  );

  const categoryStyle = category ? categoryStyles[category] : null;

  return (
    <div className={cn('space-y-4', className)}>
      {title && (
        <div className="flex items-center gap-2">
          {categoryStyle && (
            <div 
              className="w-3 h-3 rounded-full"
              style={{ backgroundColor: categoryStyle.glowColor }}
            />
          )}
          <h3 className="font-bold text-lg text-foreground">{title}</h3>
        </div>
      )}
      
      <div className="flex flex-wrap gap-4 justify-start">
        {badges.map((badge) => {
          const earnedData = earnedMap.get(badge.id);
          const isEarned = !!earnedData?.earnedAt; // Only earned if has earnedAt date
          return (
            <BadgeCard
              key={badge.id}
              badge={badge}
              isEarned={isEarned}
              earnedAt={earnedData?.earnedAt}
              progress={earnedData?.progress ?? null}
              size={size}
              isNewlyEarned={earnedData?.isNewlyEarned}
            />
          );
        })}
      </div>
    </div>
  );
}
