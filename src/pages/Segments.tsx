import { useEffect, useState, useMemo } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { User } from '@supabase/supabase-js';
import { Card } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Skeleton } from '@/components/ui/skeleton';
import { TooltipProvider } from '@/components/ui/tooltip';
import NavBar from '@/components/NavBar';
import { Footer } from '@/components/Footer';
import { SegmentSuggestionForm } from '@/components/SegmentSuggestionForm';
import { useQuery } from '@tanstack/react-query';
import { Mountain, Clock, CheckCircle, XCircle, ExternalLink } from 'lucide-react';
import {
  SegmentFilters,
  SegmentCard,
  ViewToggle,
  SegmentsMap,
  type SortOption,
  type PriorityFilter,
  type CategoryFilter,
  type ViewMode,
} from '@/components/segments';

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
  polyline?: string | null;
  start_latlng?: number[] | null;
  end_latlng?: number[] | null;
}

// Mapbox public token from environment
const MAPBOX_TOKEN = import.meta.env.VITE_MAPBOX_TOKEN || '';

export default function Segments() {
  const [user, setUser] = useState<User | null>(null);
  
  // Filter states
  const [searchQuery, setSearchQuery] = useState('');
  const [sortBy, setSortBy] = useState<SortOption>('name-asc');
  const [priorityFilter, setPriorityFilter] = useState<PriorityFilter>('all');
  const [categoryFilter, setCategoryFilter] = useState<CategoryFilter>('all');
  const [onlyUetliberg, setOnlyUetliberg] = useState(false);
  const [viewMode, setViewMode] = useState<ViewMode>('list');
  const [selectedSegmentId, setSelectedSegmentId] = useState<number | null>(null);

  useEffect(() => {
    supabase.auth.getSession().then(({ data: { session } }) => {
      setUser(session?.user ?? null);
    });
    const { data: { subscription } } = supabase.auth.onAuthStateChange((_event, session) => {
      setUser(session?.user ?? null);
    });
    return () => subscription.unsubscribe();
  }, []);

  const { data: segments, isLoading } = useQuery({
    queryKey: ['all-segments-with-polylines'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('uetliberg_segments')
        .select('segment_id, name, distance, avg_grade, elevation_high, elevation_low, climb_category, effort_count, priority, distance_to_center, ends_at_uetliberg, polyline, start_latlng, end_latlng')
        .order('name', { ascending: true });
      if (error) throw error;
      return data as Segment[];
    },
  });

  // Fetch user's own suggestions
  const { data: mySuggestions } = useQuery({
    queryKey: ['my-suggestions', user?.id],
    queryFn: async () => {
      if (!user) return [];
      const { data, error } = await supabase
        .from('segment_suggestions')
        .select('*')
        .eq('user_id', user.id)
        .order('created_at', { ascending: false });
      if (error) throw error;
      return data;
    },
    enabled: !!user,
  });

  // Helper to check if segment has valid name
  const isValidSegment = (segment: Segment) => {
    const isPlaceholder = segment.name.startsWith('Segment ') && /^\d+$/.test(segment.name.replace('Segment ', ''));
    return !isPlaceholder;
  };

  const validSegments = useMemo(() => segments?.filter(isValidSegment) || [], [segments]);
  const placeholderSegments = useMemo(() => segments?.filter(s => !isValidSegment(s)) || [], [segments]);

  // Filter and sort segments
  const filteredSegments = useMemo(() => {
    let result = [...validSegments];

    // Search filter
    if (searchQuery.trim()) {
      const query = searchQuery.toLowerCase();
      result = result.filter(s => s.name.toLowerCase().includes(query));
    }

    // Priority filter
    if (priorityFilter !== 'all') {
      result = result.filter(s => s.priority === priorityFilter);
    }

    // Category filter
    if (categoryFilter !== 'all') {
      result = result.filter(s => s.climb_category === parseInt(categoryFilter));
    }

    // Uetliberg filter
    if (onlyUetliberg) {
      result = result.filter(s => s.ends_at_uetliberg === true);
    }

    // Sorting
    result.sort((a, b) => {
      switch (sortBy) {
        case 'name-asc':
          return a.name.localeCompare(b.name);
        case 'name-desc':
          return b.name.localeCompare(a.name);
        case 'distance-asc':
          return (a.distance ?? 0) - (b.distance ?? 0);
        case 'distance-desc':
          return (b.distance ?? 0) - (a.distance ?? 0);
        case 'grade-asc':
          return Math.abs(a.avg_grade ?? 0) - Math.abs(b.avg_grade ?? 0);
        case 'grade-desc':
          return Math.abs(b.avg_grade ?? 0) - Math.abs(a.avg_grade ?? 0);
        case 'popularity':
          return (b.effort_count ?? 0) - (a.effort_count ?? 0);
        default:
          return 0;
      }
    });

    return result;
  }, [validSegments, searchQuery, priorityFilter, categoryFilter, onlyUetliberg, sortBy]);

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'pending':
        return <Clock className="w-4 h-4 text-yellow-500" />;
      case 'approved':
        return <CheckCircle className="w-4 h-4 text-green-500" />;
      case 'rejected':
        return <XCircle className="w-4 h-4 text-red-500" />;
      default:
        return null;
    }
  };

  const getStatusLabel = (status: string) => {
    switch (status) {
      case 'pending':
        return 'Wird geprüft';
      case 'approved':
        return 'Genehmigt';
      case 'rejected':
        return 'Abgelehnt';
      default:
        return status;
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'pending':
        return 'bg-yellow-500/20 text-yellow-700 dark:text-yellow-400';
      case 'approved':
        return 'bg-green-500/20 text-green-700 dark:text-green-400';
      case 'rejected':
        return 'bg-red-500/20 text-red-700 dark:text-red-400';
      default:
        return 'bg-muted text-muted-foreground';
    }
  };

  return (
    <div className="min-h-screen flex flex-col bg-background">
      <NavBar />

      <main className="flex-1 container mx-auto px-4 py-8">
        <div className="max-w-4xl mx-auto">
          <div className="flex items-center gap-3 mb-2">
            <Mountain className="w-8 h-8 sm:w-10 sm:h-10 text-primary" />
            <h1 className="text-2xl sm:text-4xl font-bold text-foreground">Uetliberg Segmente</h1>
          </div>
          <p className="text-muted-foreground mb-8">Alle getrackten Segmente rund um den Uetliberg</p>

          {/* Stats */}
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 mb-8">
            <Card className="p-4 text-center">
              <p className="text-2xl sm:text-3xl font-bold text-primary">{validSegments.length}</p>
              <p className="text-sm text-muted-foreground">Segmente</p>
            </Card>
            <Card className="p-4 text-center">
              <p className="text-2xl sm:text-3xl font-bold text-primary">
                {validSegments.filter(s => s.priority === 'high').length}
              </p>
              <p className="text-sm text-muted-foreground">Hohe Priorität</p>
            </Card>
            <Card className="p-4 text-center">
              <p className="text-2xl sm:text-3xl font-bold text-primary">
                {validSegments.filter(s => s.ends_at_uetliberg).length}
              </p>
              <p className="text-sm text-muted-foreground">Enden am Uetliberg</p>
            </Card>
          </div>

          {/* Segment Suggestion Form */}
          <div className="mb-6">
            <SegmentSuggestionForm />
          </div>

          {/* User's own suggestions */}
          {user && mySuggestions && mySuggestions.length > 0 && (
            <Card className="p-4 mb-6">
              <h3 className="text-sm font-semibold mb-3">Deine Vorschläge</h3>
              <div className="space-y-2">
                {mySuggestions.map((suggestion) => (
                  <div
                    key={suggestion.id}
                    className={`flex items-center justify-between gap-3 p-2 rounded-lg ${
                      suggestion.status === 'pending'
                        ? 'bg-muted/50'
                        : suggestion.status === 'approved'
                        ? 'bg-green-500/10'
                        : 'bg-red-500/10'
                    }`}
                  >
                    <div className="flex items-center gap-2 min-w-0 flex-1">
                      {getStatusIcon(suggestion.status)}
                      <a
                        href={suggestion.strava_segment_url}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="text-sm text-primary hover:underline truncate flex items-center gap-1"
                      >
                        <span className="truncate">
                          {suggestion.strava_segment_url.replace('https://www.strava.com/segments/', 'Segment ')}
                        </span>
                        <ExternalLink className="w-3 h-3 flex-shrink-0" />
                      </a>
                    </div>
                    <Badge className={`${getStatusColor(suggestion.status)} flex-shrink-0`}>
                      {getStatusLabel(suggestion.status)}
                    </Badge>
                  </div>
                ))}
              </div>
            </Card>
          )}

          {/* Placeholder segments info */}
          {placeholderSegments.length > 0 && (
            <Card className="p-4 mb-6 border-muted bg-muted/30">
              <p className="text-sm text-muted-foreground">
                {placeholderSegments.length} Segment(e) werden noch von Strava geladen...
              </p>
            </Card>
          )}

          {/* Filters and View Toggle */}
          <div className="mb-6 space-y-4">
            <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
              <ViewToggle value={viewMode} onChange={setViewMode} />
            </div>
            <SegmentFilters
              searchQuery={searchQuery}
              onSearchChange={setSearchQuery}
              sortBy={sortBy}
              onSortChange={setSortBy}
              priorityFilter={priorityFilter}
              onPriorityChange={setPriorityFilter}
              categoryFilter={categoryFilter}
              onCategoryChange={setCategoryFilter}
              onlyUetliberg={onlyUetliberg}
              onOnlyUetlibergChange={setOnlyUetliberg}
              resultCount={filteredSegments.length}
              totalCount={validSegments.length}
            />
          </div>

          {/* Segment List or Map */}
          <TooltipProvider>
            {viewMode === 'list' ? (
              isLoading ? (
                <div className="space-y-4">
                  {[1, 2, 3, 4, 5].map(i => (
                    <Card key={i} className="p-4">
                      <Skeleton className="h-6 w-3/4 mb-2" />
                      <Skeleton className="h-4 w-1/2" />
                    </Card>
                  ))}
                </div>
              ) : filteredSegments.length > 0 ? (
                <div className="space-y-4">
                  {filteredSegments.map(segment => (
                    <SegmentCard 
                      key={segment.segment_id} 
                      segment={segment}
                      isSelected={selectedSegmentId === segment.segment_id}
                      onShowOnMap={(id) => {
                        setSelectedSegmentId(id);
                        setViewMode('map');
                      }}
                    />
                  ))}
                </div>
              ) : (
                <Card className="p-8 text-center">
                  <Mountain className="w-12 h-12 text-muted-foreground mx-auto mb-4" />
                  <p className="text-muted-foreground">
                    {validSegments.length === 0
                      ? 'Noch keine Segmente vorhanden'
                      : 'Keine Segmente gefunden'}
                  </p>
                </Card>
              )
            ) : (
              isLoading ? (
                <Skeleton className="w-full h-[500px] sm:h-[600px] rounded-lg" />
              ) : (
                <SegmentsMap 
                  segments={filteredSegments} 
                  mapboxToken={MAPBOX_TOKEN}
                  selectedSegmentId={selectedSegmentId}
                />
              )
            )}
          </TooltipProvider>
        </div>
      </main>

      <Footer />
    </div>
  );
}
