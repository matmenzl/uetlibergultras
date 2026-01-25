import { Card } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Tooltip, TooltipContent, TooltipTrigger } from '@/components/ui/tooltip';
import { Mountain, TrendingUp, Ruler, Users, MapPin, ExternalLink } from 'lucide-react';

interface Segment {
  segment_id: number;
  name: string;
  distance: number;
  avg_grade: number;
  elevation_high: number | null;
  elevation_low: number | null;
  climb_category: number;
  effort_count: number | null;
  priority: string | null;
  distance_to_center: number | null;
  ends_at_uetliberg: boolean | null;
}

interface SegmentCardProps {
  segment: Segment;
  isSelected?: boolean;
  onShowOnMap?: (segmentId: number) => void;
}

const formatDistance = (meters: number) => {
  return (meters / 1000).toFixed(2) + ' km';
};

const formatElevation = (high: number | null, low: number | null) => {
  if (high === null || low === null) return '-';
  return `${Math.round(high - low)} m`;
};

const getClimbCategoryLabel = (category: number) => {
  if (category === 0) return 'Flach';
  if (category === 5) return 'HC';
  return `Kat. ${category}`;
};

const getPriorityColor = (priority: string | null) => {
  switch (priority) {
    case 'high':
      return 'bg-green-500/20 text-green-700 dark:text-green-400';
    case 'medium':
      return 'bg-yellow-500/20 text-yellow-700 dark:text-yellow-400';
    case 'low':
      return 'bg-red-500/20 text-red-700 dark:text-red-400';
    default:
      return 'bg-muted text-muted-foreground';
  }
};

const getPriorityTooltip = (priority: string | null) => {
  switch (priority) {
    case 'high':
      return 'Endet innerhalb 2 km vom Uetliberg-Gipfel';
    case 'medium':
      return 'Endet weiter als 2 km vom Uetliberg-Gipfel';
    case 'low':
      return 'Ohne direkten Uetliberg-Bezug';
    default:
      return 'Priorität nicht klassifiziert';
  }
};

export function SegmentCard({ segment, isSelected, onShowOnMap }: SegmentCardProps) {
  return (
    <Card 
      className={`p-4 sm:p-5 hover:shadow-md transition-all cursor-pointer ${
        isSelected ? 'ring-2 ring-primary shadow-lg' : ''
      }`}
      onClick={() => onShowOnMap?.(segment.segment_id)}
    >
      <div className="flex flex-col sm:flex-row sm:items-start sm:justify-between gap-3 sm:gap-4">
        <div className="flex-1 min-w-0">
          <div className="flex flex-wrap items-center gap-2 mb-2">
            <a
              href={`https://www.strava.com/segments/${segment.segment_id}`}
              target="_blank"
              rel="noopener noreferrer"
              className="font-semibold text-base sm:text-lg hover:text-primary transition-colors inline-flex items-center gap-1.5 group"
              onClick={(e) => e.stopPropagation()}
            >
              {segment.name}
              <ExternalLink className="w-3.5 h-3.5 opacity-0 group-hover:opacity-100 transition-opacity" />
            </a>
            {segment.ends_at_uetliberg && (
              <Badge variant="secondary" className="flex-shrink-0">
                <MapPin className="w-3 h-3 mr-1" />
                Uetliberg
              </Badge>
            )}
          </div>

          <div className="flex flex-wrap gap-3 sm:gap-4 text-sm text-muted-foreground">
            <span className="flex items-center gap-1">
              <Ruler className="w-4 h-4" />
              {formatDistance(segment.distance ?? 0)}
            </span>
            <span className="flex items-center gap-1">
              <TrendingUp className="w-4 h-4" />
              {(segment.avg_grade != null ? segment.avg_grade : 0).toFixed(1)}%
            </span>
            <span className="flex items-center gap-1">
              <Mountain className="w-4 h-4" />
              {formatElevation(segment.elevation_high, segment.elevation_low)}
            </span>
            {segment.effort_count && segment.effort_count > 0 && (
              <span className="flex items-center gap-1">
                <Users className="w-4 h-4" />
                {segment.effort_count.toLocaleString()}
              </span>
            )}
          </div>
        </div>

        <div className="flex flex-row sm:flex-col items-start sm:items-end gap-2 flex-shrink-0">
          <Tooltip>
            <TooltipTrigger asChild>
              <Badge className={`${getPriorityColor(segment.priority)} cursor-help`}>
                {segment.priority === 'high' ? 'Hoch' : segment.priority === 'medium' ? 'Mittel' : 'Niedrig'}
              </Badge>
            </TooltipTrigger>
            <TooltipContent>
              <p>{getPriorityTooltip(segment.priority)}</p>
            </TooltipContent>
          </Tooltip>
          <Badge variant="outline">{getClimbCategoryLabel(segment.climb_category)}</Badge>
        </div>
      </div>

      {segment.distance_to_center != null && (
        <p className="text-xs text-muted-foreground mt-3">
          {segment.distance_to_center.toFixed(2)} km vom Uetliberg-Zentrum
        </p>
      )}
    </Card>
  );
}
