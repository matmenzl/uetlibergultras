import { BadgeGrid } from '@/components/badges';
import { badgeDefinitions, getBadgesByCategory, BadgeCategory } from '@/config/badge-definitions';
import NavBar from '@/components/NavBar';
import { Footer } from '@/components/Footer';

// Demo data: simulate some earned badges with different states
const demoEarnedBadges = [
  { id: 'first_run', earnedAt: '2024-01-15T10:30:00Z' },
  { id: 'runs_5', earnedAt: '2024-02-20T14:00:00Z' },
  { id: 'runs_10', earnedAt: '2024-06-10T09:15:00Z', isNewlyEarned: false },
  { id: 'runs_25', progress: { current: 18, target: 25 } },
  { id: 'runs_50', progress: { current: 18, target: 50 } },
  { id: 'runs_100', progress: { current: 18, target: 100 } },
  { id: 'streak_2', earnedAt: '2024-03-01T08:00:00Z' },
  { id: 'streak_4', progress: { current: 3, target: 4 } },
  { id: 'streak_8', progress: { current: 3, target: 8 } },
  { id: 'all_segments', progress: { current: 8, target: 12 } },
  { id: 'early_bird', earnedAt: '2024-04-05T05:45:00Z' },
  { id: 'snow_bunny', earnedAt: '2024-01-28T11:00:00Z' },
  { id: 'founding_member', earnedAt: '2023-12-01T00:00:00Z', isNewlyEarned: false },
  { id: 'pioneer_25', earnedAt: '2024-05-15T16:30:00Z' },
  { id: 'denzlerweg_king', earnedAt: '2024-07-01T07:00:00Z' },
];

const categories: { key: BadgeCategory; title: string }[] = [
  { key: 'milestone', title: 'Meilensteine' },
  { key: 'endurance', title: 'Ausdauer' },
  { key: 'weather', title: 'Wetter' },
  { key: 'community', title: 'Community' },
  { key: 'legend', title: 'Legenden' },
];

export default function BadgeDemo() {
  return (
    <div className="min-h-screen bg-background flex flex-col">
      <NavBar />
      
      <main className="flex-1 container py-8 space-y-12">
        <div className="text-center space-y-2">
          <h1 className="text-3xl font-bold">Badge System Demo</h1>
          <p className="text-muted-foreground">
            Alle Badges in verschiedenen Zuständen: verdient, nicht verdient, mit Fortschritt
          </p>
        </div>

        {/* All badges by category */}
        {categories.map(({ key, title }) => (
          <BadgeGrid
            key={key}
            title={title}
            category={key}
            badges={getBadgesByCategory(key)}
            earnedBadges={demoEarnedBadges}
            size="lg"
          />
        ))}

        {/* Size comparison */}
        <div className="space-y-4 pt-8 border-t">
          <h2 className="text-xl font-bold">Größenvergleich</h2>
          <div className="flex items-end gap-8 flex-wrap">
            <div className="space-y-2">
              <p className="text-sm text-muted-foreground">Small (sm)</p>
              <BadgeGrid
                badges={badgeDefinitions.slice(0, 3)}
                earnedBadges={demoEarnedBadges}
                size="sm"
              />
            </div>
            <div className="space-y-2">
              <p className="text-sm text-muted-foreground">Medium (md)</p>
              <BadgeGrid
                badges={badgeDefinitions.slice(0, 3)}
                earnedBadges={demoEarnedBadges}
                size="md"
              />
            </div>
            <div className="space-y-2">
              <p className="text-sm text-muted-foreground">Large (lg)</p>
              <BadgeGrid
                badges={badgeDefinitions.slice(0, 3)}
                earnedBadges={demoEarnedBadges}
                size="lg"
              />
            </div>
          </div>
        </div>
      </main>

      <Footer />
    </div>
  );
}
