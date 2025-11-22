import { useState } from "react";
import { LeaderboardCard } from "./LeaderboardCard";
import { LeaderboardTabs } from "./LeaderboardTabs";
import { LeaderboardType, LeaderboardEntry } from "@/types/leaderboard";
import { Trophy } from "lucide-react";

// Mock-Daten für verschiedene Leaderboard-Typen
const mockLeaderboards: Record<LeaderboardType, LeaderboardEntry[]> = {
  "most-efforts-overall": [
    {
      id: "1",
      rank: 1,
      firstName: "Marco",
      lastName: "Müller",
      totalEfforts: 156,
      uniqueSegments: 23,
      lastActivity: "2025-01-20",
    },
    {
      id: "2",
      rank: 2,
      firstName: "Sarah",
      lastName: "Schmidt",
      totalEfforts: 142,
      uniqueSegments: 19,
      lastActivity: "2025-01-19",
    },
    {
      id: "3",
      rank: 3,
      firstName: "Thomas",
      lastName: "Weber",
      totalEfforts: 128,
      uniqueSegments: 21,
      lastActivity: "2025-01-18",
    },
    {
      id: "4",
      rank: 4,
      firstName: "Anna",
      lastName: "Fischer",
      totalEfforts: 115,
      uniqueSegments: 18,
      lastActivity: "2025-01-17",
    },
    {
      id: "5",
      rank: 5,
      firstName: "Michael",
      lastName: "Bauer",
      totalEfforts: 98,
      uniqueSegments: 16,
      lastActivity: "2025-01-16",
    },
  ],
  "most-efforts-monthly": [
    {
      id: "1",
      rank: 1,
      firstName: "Sarah",
      lastName: "Schmidt",
      totalEfforts: 45,
      uniqueSegments: 12,
      lastActivity: "2025-01-20",
    },
    {
      id: "2",
      rank: 2,
      firstName: "Marco",
      lastName: "Müller",
      totalEfforts: 38,
      uniqueSegments: 10,
      lastActivity: "2025-01-19",
    },
    {
      id: "3",
      rank: 3,
      firstName: "Anna",
      lastName: "Fischer",
      totalEfforts: 32,
      uniqueSegments: 9,
      lastActivity: "2025-01-18",
    },
    {
      id: "4",
      rank: 4,
      firstName: "Thomas",
      lastName: "Weber",
      totalEfforts: 28,
      uniqueSegments: 8,
      lastActivity: "2025-01-17",
    },
    {
      id: "5",
      rank: 5,
      firstName: "Julia",
      lastName: "Koch",
      totalEfforts: 24,
      uniqueSegments: 7,
      lastActivity: "2025-01-16",
    },
  ],
  "most-unique-segments": [
    {
      id: "1",
      rank: 1,
      firstName: "Thomas",
      lastName: "Weber",
      totalEfforts: 128,
      uniqueSegments: 25,
      lastActivity: "2025-01-20",
    },
    {
      id: "2",
      rank: 2,
      firstName: "Marco",
      lastName: "Müller",
      totalEfforts: 156,
      uniqueSegments: 23,
      lastActivity: "2025-01-19",
    },
    {
      id: "3",
      rank: 3,
      firstName: "Julia",
      lastName: "Koch",
      totalEfforts: 89,
      uniqueSegments: 22,
      lastActivity: "2025-01-18",
    },
    {
      id: "4",
      rank: 4,
      firstName: "Sarah",
      lastName: "Schmidt",
      totalEfforts: 142,
      uniqueSegments: 19,
      lastActivity: "2025-01-17",
    },
    {
      id: "5",
      rank: 5,
      firstName: "Anna",
      lastName: "Fischer",
      totalEfforts: 115,
      uniqueSegments: 18,
      lastActivity: "2025-01-16",
    },
  ],
};

export const ActivityLeaderboard = () => {
  const [activeTab, setActiveTab] = useState<LeaderboardType>("most-efforts-overall");
  const currentEntries = mockLeaderboards[activeTab];
  const showUniqueSegments = activeTab === "most-unique-segments";

  return (
    <section className="container mx-auto px-4 py-12 bg-card/50">
      <div className="max-w-4xl mx-auto">
        {/* Header */}
        <div className="text-center mb-8">
          <div className="flex items-center justify-center gap-2 mb-3">
            <Trophy className="w-8 h-8 text-primary" />
            <h2 className="text-3xl font-bold text-foreground">Community Leaderboards</h2>
          </div>
          <p className="text-muted-foreground text-lg">
            Die aktivsten Athletes auf dem Uetliberg
          </p>
        </div>

        {/* Tabs */}
        <LeaderboardTabs activeTab={activeTab} onTabChange={setActiveTab}>
          <div className="space-y-3">
            {currentEntries.map((entry) => (
              <LeaderboardCard
                key={entry.id}
                entry={entry}
                showUniqueSegments={showUniqueSegments}
              />
            ))}
          </div>
        </LeaderboardTabs>

        {/* Footer Note */}
        <p className="text-center text-sm text-muted-foreground mt-6">
          Logge dich ein und synchronisiere deine Strava-Daten, um im Leaderboard zu erscheinen
        </p>
      </div>
    </section>
  );
};
