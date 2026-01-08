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
    isNewlyEarned?: boolean;
  }[];
  category: 'milestone' | 'endurance' | 'special' | 'legend';
}

export function PassPage({ title, icon: Icon, achievements, category }: PassPageProps) {
  return (
    <div className="flex flex-wrap gap-6 justify-center py-4">
      {achievements.map((achievement) => (
        <StampCard
          key={achievement.type}
          config={achievement.config}
          isEarned={achievement.isEarned}
          earnedAt={achievement.earnedAt}
          progress={achievement.progress}
          size="md"
          isNewlyEarned={achievement.isNewlyEarned}
        />
      ))}
    </div>
  );
}
