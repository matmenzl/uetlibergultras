import { List, Map } from 'lucide-react';
import { ToggleGroup, ToggleGroupItem } from '@/components/ui/toggle-group';

export type ViewMode = 'list' | 'map';

interface ViewToggleProps {
  value: ViewMode;
  onChange: (value: ViewMode) => void;
}

export function ViewToggle({ value, onChange }: ViewToggleProps) {
  return (
    <ToggleGroup
      type="single"
      value={value}
      onValueChange={(v) => v && onChange(v as ViewMode)}
      className="border rounded-lg p-1"
    >
      <ToggleGroupItem value="list" aria-label="Listenansicht" className="px-3">
        <List className="h-4 w-4 mr-2" />
        Liste
      </ToggleGroupItem>
      <ToggleGroupItem value="map" aria-label="Kartenansicht" className="px-3">
        <Map className="h-4 w-4 mr-2" />
        Karte
      </ToggleGroupItem>
    </ToggleGroup>
  );
}
