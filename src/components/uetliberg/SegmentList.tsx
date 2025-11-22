import { useState } from 'react';
import { SegmentCard } from './SegmentCard';
import { SegmentData } from '@/lib/mapUtils';
import { Button } from '@/components/ui/button';
import { ScrollArea } from '@/components/ui/scroll-area';

interface SegmentListProps {
  segments?: SegmentData[];
  isLoading?: boolean;
  onSegmentSelect?: (segment: SegmentData) => void;
  selectedSegmentId?: number | null;
}

export const SegmentList = ({ segments = [], isLoading, onSegmentSelect, selectedSegmentId }: SegmentListProps) => {
  const [sortBy, setSortBy] = useState<'popularity' | 'distance'>('popularity');
  const [difficultyFilter, setDifficultyFilter] = useState<'all' | 'easy' | 'medium' | 'hard'>('all');

  const sortedSegments = [...segments].sort((a, b) => {
    if (sortBy === 'popularity') {
      return b.effort_count - a.effort_count;
    }
    return b.distance - a.distance;
  });

  const filteredSegments = difficultyFilter === 'all'
    ? sortedSegments
    : sortedSegments.filter((s) => {
        const grade = Math.abs(s.avg_grade);
        if (difficultyFilter === 'easy') return grade < 3;
        if (difficultyFilter === 'medium') return grade >= 3 && grade < 6;
        return grade >= 6;
      });

  return (
    <div className="flex flex-col h-full">
      <div className="p-4 border-b bg-background">
        <h2 className="text-2xl font-bold mb-4">Segmente ({segments.length})</h2>
        
        <div className="space-y-3">
          <div className="flex gap-2">
            <Button
              variant={sortBy === 'popularity' ? 'default' : 'outline'}
              size="sm"
              onClick={() => setSortBy('popularity')}
              className="flex-1"
            >
              Beliebtheit
            </Button>
            <Button
              variant={sortBy === 'distance' ? 'default' : 'outline'}
              size="sm"
              onClick={() => setSortBy('distance')}
              className="flex-1"
            >
              Distanz
            </Button>
          </div>

          <div className="flex gap-2">
            <Button
              variant={difficultyFilter === 'all' ? 'default' : 'outline'}
              size="sm"
              onClick={() => setDifficultyFilter('all')}
              className="flex-1"
            >
              Alle
            </Button>
            <Button
              variant={difficultyFilter === 'easy' ? 'default' : 'outline'}
              size="sm"
              onClick={() => setDifficultyFilter('easy')}
              className="flex-1"
            >
              Leicht
            </Button>
            <Button
              variant={difficultyFilter === 'medium' ? 'default' : 'outline'}
              size="sm"
              onClick={() => setDifficultyFilter('medium')}
              className="flex-1"
            >
              Mittel
            </Button>
            <Button
              variant={difficultyFilter === 'hard' ? 'default' : 'outline'}
              size="sm"
              onClick={() => setDifficultyFilter('hard')}
              className="flex-1"
            >
              Schwer
            </Button>
          </div>
        </div>
      </div>

      <ScrollArea className="flex-1">
        <div className="p-4 space-y-3">
          {isLoading && (
            <div className="text-center py-8 text-muted-foreground">
              Lade Segmente...
            </div>
          )}
          
          {!isLoading && filteredSegments.length === 0 && (
            <div className="text-center py-8 text-muted-foreground">
              Keine Segmente gefunden
            </div>
          )}
          
          {filteredSegments.map((segment) => (
            <SegmentCard
              key={segment.id}
              segment={segment}
              onClick={() => onSegmentSelect?.(segment)}
              isSelected={segment.id === selectedSegmentId}
            />
          ))}
        </div>
      </ScrollArea>
    </div>
  );
};
