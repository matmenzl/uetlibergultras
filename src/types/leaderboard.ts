export interface LeaderboardEntry {
  id: string;
  rank: number;
  firstName: string;
  lastName: string;
  profilePicture?: string;
  totalActivities: number;
  uniqueSegments: number;
  lastActivity: string;
}

export type LeaderboardType = 
  | "most-efforts-overall"
  | "most-efforts-monthly"
  | "most-unique-segments";

export interface LeaderboardData {
  type: LeaderboardType;
  entries: LeaderboardEntry[];
  currentUserId?: string;
}
