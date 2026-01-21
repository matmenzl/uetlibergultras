import { useState, useEffect } from 'react';
import { Check, ChevronsUpDown, X } from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import {
  Command,
  CommandEmpty,
  CommandGroup,
  CommandInput,
  CommandItem,
  CommandList,
} from '@/components/ui/command';
import { cn } from '@/lib/utils';

export interface Segment {
  segment_id: number;
  name: string;
  distance: number;
  avg_grade: number;
  priority: string | null;
}

interface SegmentMultiSelectProps {
  selectedSegmentIds: number[];
  onSelectionChange: (segmentIds: number[]) => void;
  disabled?: boolean;
}

export function SegmentMultiSelect({
  selectedSegmentIds,
  onSelectionChange,
  disabled = false,
}: SegmentMultiSelectProps) {
  const [open, setOpen] = useState(false);
  const [segments, setSegments] = useState<Segment[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchSegments = async () => {
      const { data, error } = await supabase
        .from('uetliberg_segments')
        .select('segment_id, name, distance, avg_grade, priority')
        .order('priority', { ascending: true })
        .order('name', { ascending: true });

      if (!error && data) {
        setSegments(data);
      }
      setLoading(false);
    };

    fetchSegments();
  }, []);

  const toggleSegment = (segmentId: number) => {
    if (selectedSegmentIds.includes(segmentId)) {
      onSelectionChange(selectedSegmentIds.filter((id) => id !== segmentId));
    } else {
      onSelectionChange([...selectedSegmentIds, segmentId]);
    }
  };

  const removeSegment = (segmentId: number) => {
    onSelectionChange(selectedSegmentIds.filter((id) => id !== segmentId));
  };

  const selectedSegments = segments.filter((s) =>
    selectedSegmentIds.includes(s.segment_id)
  );

  const formatDistance = (meters: number) => {
    return (meters / 1000).toFixed(1);
  };

  return (
    <div className="space-y-2">
      <Popover open={open} onOpenChange={setOpen}>
        <PopoverTrigger asChild>
          <Button
            variant="outline"
            role="combobox"
            aria-expanded={open}
            disabled={disabled || loading}
            className="w-full justify-between font-normal"
          >
            {loading
              ? 'Segmente werden geladen...'
              : selectedSegmentIds.length > 0
              ? `${selectedSegmentIds.length} Segment${selectedSegmentIds.length > 1 ? 'e' : ''} ausgewählt`
              : 'Segmente auswählen (optional)...'}
            <ChevronsUpDown className="ml-2 h-4 w-4 shrink-0 opacity-50" />
          </Button>
        </PopoverTrigger>
        <PopoverContent className="w-full min-w-[320px] p-0 z-50 bg-popover" align="start">
          <Command>
            <CommandInput placeholder="Segment suchen..." />
            <CommandList className="max-h-64">
              <CommandEmpty>Kein Segment gefunden.</CommandEmpty>
              <CommandGroup>
                {segments.map((segment) => {
                  const isSelected = selectedSegmentIds.includes(segment.segment_id);
                  return (
                    <CommandItem
                      key={segment.segment_id}
                      value={segment.name}
                      onSelect={() => toggleSegment(segment.segment_id)}
                      className="cursor-pointer"
                    >
                      <div
                        className={cn(
                          'mr-2 flex h-4 w-4 items-center justify-center rounded-sm border border-primary',
                          isSelected
                            ? 'bg-primary text-primary-foreground'
                            : 'opacity-50 [&_svg]:invisible'
                        )}
                      >
                        <Check className="h-3 w-3" />
                      </div>
                      <div className="flex-1 min-w-0">
                        <p className="truncate font-medium text-sm">{segment.name}</p>
                        <p className="text-xs text-muted-foreground">
                          {formatDistance(segment.distance)} km • {segment.avg_grade.toFixed(1)}% Steigung
                        </p>
                      </div>
                    </CommandItem>
                  );
                })}
              </CommandGroup>
            </CommandList>
          </Command>
        </PopoverContent>
      </Popover>

      {/* Selected segments badges */}
      {selectedSegments.length > 0 && (
        <div className="flex flex-wrap gap-1.5">
          {selectedSegments.map((segment) => (
            <Badge
              key={segment.segment_id}
              variant="secondary"
              className="text-xs pl-2 pr-1 py-0.5 gap-1"
            >
              <span className="truncate max-w-[150px]">{segment.name}</span>
              <button
                type="button"
                onClick={(e) => {
                  e.preventDefault();
                  removeSegment(segment.segment_id);
                }}
                className="ml-0.5 rounded-full hover:bg-muted-foreground/20 p-0.5"
                disabled={disabled}
              >
                <X className="h-3 w-3" />
              </button>
            </Badge>
          ))}
        </div>
      )}
    </div>
  );
}

// Export segments lookup hook for use in other components
export function useSegmentsLookup() {
  const [segmentsMap, setSegmentsMap] = useState<Map<number, Segment>>(new Map());
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchSegments = async () => {
      const { data } = await supabase
        .from('uetliberg_segments')
        .select('segment_id, name, distance, avg_grade, priority');

      if (data) {
        const map = new Map<number, Segment>();
        data.forEach((s) => map.set(s.segment_id, s));
        setSegmentsMap(map);
      }
      setLoading(false);
    };

    fetchSegments();
  }, []);

  return { segmentsMap, loading };
}
