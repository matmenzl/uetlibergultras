import { Search, X, Filter } from 'lucide-react';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Checkbox } from '@/components/ui/checkbox';
import { Label } from '@/components/ui/label';

export type SortOption = 'name-asc' | 'name-desc' | 'distance-asc' | 'distance-desc' | 'grade-asc' | 'grade-desc' | 'popularity';
export type PriorityFilter = 'all' | 'high' | 'medium' | 'low';
export type CategoryFilter = 'all' | '0' | '1' | '2' | '3' | '4' | '5';

interface SegmentFiltersProps {
  searchQuery: string;
  onSearchChange: (query: string) => void;
  sortBy: SortOption;
  onSortChange: (sort: SortOption) => void;
  priorityFilter: PriorityFilter;
  onPriorityChange: (priority: PriorityFilter) => void;
  categoryFilter: CategoryFilter;
  onCategoryChange: (category: CategoryFilter) => void;
  onlyUetliberg: boolean;
  onOnlyUetlibergChange: (checked: boolean) => void;
  resultCount: number;
  totalCount: number;
}

export function SegmentFilters({
  searchQuery,
  onSearchChange,
  sortBy,
  onSortChange,
  priorityFilter,
  onPriorityChange,
  categoryFilter,
  onCategoryChange,
  onlyUetliberg,
  onOnlyUetlibergChange,
  resultCount,
  totalCount,
}: SegmentFiltersProps) {
  const hasActiveFilters = searchQuery || priorityFilter !== 'all' || categoryFilter !== 'all' || onlyUetliberg;

  const clearAllFilters = () => {
    onSearchChange('');
    onPriorityChange('all');
    onCategoryChange('all');
    onOnlyUetlibergChange(false);
  };

  return (
    <div className="space-y-4">
      {/* Search Bar */}
      <div className="relative">
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
        <Input
          placeholder="Segment suchen..."
          value={searchQuery}
          onChange={(e) => onSearchChange(e.target.value)}
          className="pl-10 pr-10"
        />
        {searchQuery && (
          <Button
            variant="ghost"
            size="sm"
            className="absolute right-1 top-1/2 -translate-y-1/2 h-7 w-7 p-0"
            onClick={() => onSearchChange('')}
          >
            <X className="h-4 w-4" />
          </Button>
        )}
      </div>

      {/* Filters Row */}
      <div className="flex flex-wrap gap-3 items-center">
        {/* Priority Filter */}
        <Select value={priorityFilter} onValueChange={(v) => onPriorityChange(v as PriorityFilter)}>
          <SelectTrigger className="w-[140px]">
            <SelectValue placeholder="Priorität" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">Alle Prioritäten</SelectItem>
            <SelectItem value="high">Hoch</SelectItem>
            <SelectItem value="medium">Mittel</SelectItem>
            <SelectItem value="low">Niedrig</SelectItem>
          </SelectContent>
        </Select>

        {/* Category Filter */}
        <Select value={categoryFilter} onValueChange={(v) => onCategoryChange(v as CategoryFilter)}>
          <SelectTrigger className="w-[140px]">
            <SelectValue placeholder="Kategorie" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">Alle Kategorien</SelectItem>
            <SelectItem value="0">Flach</SelectItem>
            <SelectItem value="1">Kat. 1</SelectItem>
            <SelectItem value="2">Kat. 2</SelectItem>
            <SelectItem value="3">Kat. 3</SelectItem>
            <SelectItem value="4">Kat. 4</SelectItem>
            <SelectItem value="5">HC</SelectItem>
          </SelectContent>
        </Select>

        {/* Sort */}
        <Select value={sortBy} onValueChange={(v) => onSortChange(v as SortOption)}>
          <SelectTrigger className="w-[160px]">
            <SelectValue placeholder="Sortierung" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="name-asc">Name (A-Z)</SelectItem>
            <SelectItem value="name-desc">Name (Z-A)</SelectItem>
            <SelectItem value="distance-asc">Distanz (kurz-lang)</SelectItem>
            <SelectItem value="distance-desc">Distanz (lang-kurz)</SelectItem>
            <SelectItem value="grade-asc">Steigung (flach-steil)</SelectItem>
            <SelectItem value="grade-desc">Steigung (steil-flach)</SelectItem>
            <SelectItem value="popularity">Beliebtheit</SelectItem>
          </SelectContent>
        </Select>

        {/* Uetliberg Checkbox */}
        <div className="flex items-center space-x-2">
          <Checkbox
            id="only-uetliberg"
            checked={onlyUetliberg}
            onCheckedChange={(checked) => onOnlyUetlibergChange(checked === true)}
          />
          <Label htmlFor="only-uetliberg" className="text-sm cursor-pointer">
            Nur Uetliberg-Ende
          </Label>
        </div>

        {/* Clear Filters */}
        {hasActiveFilters && (
          <Button variant="ghost" size="sm" onClick={clearAllFilters} className="text-muted-foreground">
            <X className="h-4 w-4 mr-1" />
            Filter zurücksetzen
          </Button>
        )}
      </div>

      {/* Result Count */}
      <div className="flex items-center gap-2 text-sm text-muted-foreground">
        <Filter className="h-4 w-4" />
        <span>
          {resultCount === totalCount
            ? `${totalCount} Segmente`
            : `${resultCount} von ${totalCount} Segmenten`}
        </span>
        {hasActiveFilters && (
          <Badge variant="secondary" className="text-xs">
            Gefiltert
          </Badge>
        )}
      </div>
    </div>
  );
}
