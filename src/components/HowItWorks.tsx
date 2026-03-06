import { Card } from '@/components/ui/card';
import { Link2, Mountain, Trophy } from 'lucide-react';

export function HowItWorks() {
  const steps = [
    {
      icon: <Link2 className="w-7 h-7" />,
      title: 'Verbinden',
      description: 'Strava oder E-Mail verbinden – dauert 30 Sekunden',
    },
    {
      icon: <Mountain className="w-7 h-7" />,
      title: 'Laufen',
      description: 'Lauf am Uetliberg – deine Segmente werden automatisch erkannt',
    },
    {
      icon: <Trophy className="w-7 h-7" />,
      title: 'Sammeln',
      description: 'Badges, Streaks & Leaderboard-Plätze freischalten',
    },
  ];

  return (
    <div className="mb-8">
      <h2 className="text-lg font-bold text-center mb-6 text-foreground">So funktioniert's</h2>
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        {steps.map((step, i) => (
          <Card key={i} className="p-5 text-center relative overflow-hidden group">
            {/* Step number */}
            <div className="absolute top-3 left-3 w-6 h-6 rounded-full bg-primary/10 flex items-center justify-center">
              <span className="text-xs font-bold text-primary">{i + 1}</span>
            </div>
            <div className="text-primary mb-3 flex justify-center">
              {step.icon}
            </div>
            <h3 className="font-bold text-sm mb-1">{step.title}</h3>
            <p className="text-xs text-muted-foreground">{step.description}</p>
          </Card>
        ))}
      </div>
    </div>
  );
}
