import polyline from '@mapbox/polyline';

export interface SegmentData {
  id: number;
  name: string;
  distance: number;
  avg_grade: number;
  elevation_high: number;
  elevation_low: number;
  climb_category: number;
  polyline: string;
  start_latlng: [number, number];
  end_latlng: [number, number];
  effort_count: number;
}

export const decodePolyline = (encoded: string): [number, number][] => {
  const decoded = polyline.decode(encoded);
  return decoded.map(([lat, lng]) => [lng, lat]); // Convert to [lng, lat] for Mapbox
};

export const calculateElevationGain = (high: number, low: number): number => {
  return Math.round(high - low);
};

export const getDifficultyLevel = (avgGrade: number): 'easy' | 'medium' | 'hard' => {
  const grade = Math.abs(avgGrade);
  if (grade < 3) return 'easy';
  if (grade < 6) return 'medium';
  return 'hard';
};

export const getDifficultyColor = (difficulty: 'easy' | 'medium' | 'hard'): string => {
  switch (difficulty) {
    case 'easy': return '#22c55e'; // green
    case 'medium': return '#f59e0b'; // orange
    case 'hard': return '#ef4444'; // red
  }
};

export const formatDistance = (meters: number): string => {
  const km = meters / 1000;
  return `${km.toFixed(2)} km`;
};

export const formatGrade = (grade: number): string => {
  return `${grade > 0 ? '+' : ''}${grade.toFixed(1)}%`;
};
