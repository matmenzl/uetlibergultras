import { BadgeGrid, EarnedBadge } from '@/components/badges';
import { BadgeDefinition } from '@/config/badge-definitions';

interface PassPageProps {
  badges: BadgeDefinition[];
  earnedBadges: EarnedBadge[];
  category: 'milestone' | 'endurance' | 'weather' | 'community' | 'legend';
}

export function PassPage({ badges, earnedBadges, category }: PassPageProps) {
  return (
    <div className="py-4">
      <BadgeGrid 
        badges={badges} 
        earnedBadges={earnedBadges} 
        size="md"
      />
    </div>
  );
}
