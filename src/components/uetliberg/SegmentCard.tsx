import { Card } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { ExternalLink, TrendingUp, Mountain } from 'lucide-react';
import { SegmentData, formatDistance, formatGrade, getDifficultyLevel, calculateElevationGain } from '@/lib/mapUtils';

interface SegmentCardProps {
  segment: SegmentData;
  onClick?: () => void;
  isSelected?: boolean;
}

export const SegmentCard = ({ segment, onClick, isSelected }: SegmentCardProps) => {
  const difficulty = getDifficultyLevel(segment.avg_grade);
  const elevationGain = calculateElevationGain(segment.elevation_high, segment.elevation_low);

  const difficultyColors = {
    easy: 'bg-green-500',
    medium: 'bg-orange-500',
    hard: 'bg-red-500',
  };

  const difficultyLabels = {
    easy: 'Leicht',
    medium: 'Mittel',
    hard: 'Schwer',
  };

  return (
    <Card
      className={`p-4 cursor-pointer transition-all hover:shadow-lg ${
        isSelected ? 'ring-2 ring-primary' : ''
      }`}
      onClick={onClick}
    >
      <div className="flex items-start justify-between mb-2">
        <h3 className="font-semibold text-lg leading-tight">{segment.name}</h3>
        <a
          href={`https://www.strava.com/segments/${segment.id}`}
          target="_blank"
          rel="noopener noreferrer"
          className="text-primary hover:text-primary/80 ml-2"
          onClick={(e) => e.stopPropagation()}
        >
          <ExternalLink size={16} />
        </a>
      </div>

      <div className="flex flex-wrap gap-2 mb-3">
        <Badge className={difficultyColors[difficulty]}>
          {difficultyLabels[difficulty]}
        </Badge>
        <Badge variant="secondary">
          {segment.effort_count} Versuche
        </Badge>
      </div>

      <div className="grid grid-cols-2 gap-3 text-sm">
        <div className="flex items-center gap-2">
          <TrendingUp size={16} className="text-muted-foreground" />
          <div>
            <div className="text-muted-foreground text-xs">Distanz</div>
            <div className="font-medium">{formatDistance(segment.distance)}</div>
          </div>
        </div>
        <div className="flex items-center gap-2">
          <Mountain size={16} className="text-muted-foreground" />
          <div>
            <div className="text-muted-foreground text-xs">Höhenmeter</div>
            <div className="font-medium">{elevationGain}m</div>
          </div>
        </div>
        <div className="col-span-2">
          <div className="text-muted-foreground text-xs">Durchschn. Steigung</div>
          <div className="font-medium">{formatGrade(segment.avg_grade)}</div>
        </div>
      </div>
    </Card>
  );
};
