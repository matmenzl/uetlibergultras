import { useEffect, useState } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { User } from '@supabase/supabase-js';
import { Card } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Skeleton } from '@/components/ui/skeleton';
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from '@/components/ui/tooltip';
import NavBar from '@/components/NavBar';
import { Footer } from '@/components/Footer';
import { SegmentSuggestionForm } from '@/components/SegmentSuggestionForm';
import { useQuery } from '@tanstack/react-query';
import { Mountain, TrendingUp, Ruler, Users, MapPin, Clock, CheckCircle, XCircle, ExternalLink } from 'lucide-react';
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
export default function Segments() {
  const [user, setUser] = useState<User | null>(null);
  useEffect(() => {
    supabase.auth.getSession().then(({
      data: {
        session
      }
    }) => {
      setUser(session?.user ?? null);
    });
    const {
      data: {
        subscription
      }
    } = supabase.auth.onAuthStateChange((_event, session) => {
      setUser(session?.user ?? null);
    });
    return () => subscription.unsubscribe();
  }, []);
  const {
    data: segments,
    isLoading
  } = useQuery({
    queryKey: ['all-segments'],
    queryFn: async () => {
      const {
        data,
        error
      } = await supabase.from('uetliberg_segments').select('segment_id, name, distance, avg_grade, elevation_high, elevation_low, climb_category, effort_count, priority, distance_to_center, ends_at_uetliberg').order('name', {
        ascending: true
      });
      if (error) throw error;
      return data as Segment[];
    }
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

  // Helper to check if segment has valid name
  const isValidSegment = (segment: Segment) => {
    const isPlaceholder = segment.name.startsWith('Segment ') && /^\d+$/.test(segment.name.replace('Segment ', ''));
    return !isPlaceholder;
  };
  const validSegments = segments?.filter(isValidSegment) || [];
  const placeholderSegments = segments?.filter(s => !isValidSegment(s)) || [];
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
  return <div className="min-h-screen flex flex-col bg-background">
      <NavBar />
      
      <main className="flex-1 container mx-auto px-4 py-8">
        <div className="max-w-4xl mx-auto">
          <div className="flex items-center gap-3 mb-2">
            <Mountain className="w-8 h-8 sm:w-10 sm:h-10 text-primary" />
            <h1 className="text-2xl sm:text-4xl font-bold text-foreground">
              Uetliberg Segmente
            </h1>
          </div>
          <p className="text-muted-foreground mb-8">
            Alle getrackten Segmente rund um den Uetliberg
          </p>

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

          {/* Segment Suggestion Form - shown to all users */}
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
                        <span className="truncate">{suggestion.strava_segment_url.replace('https://www.strava.com/segments/', 'Segment ')}</span>
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
          {placeholderSegments.length > 0 && <Card className="p-4 mb-6 border-muted bg-muted/30">
              <p className="text-sm text-muted-foreground">
                {placeholderSegments.length} Segment(e) werden noch von Strava geladen...
              </p>
            </Card>}

          {/* Segment List */}
          <TooltipProvider>
          {isLoading ? <div className="space-y-4">
              {[1, 2, 3, 4, 5].map(i => <Card key={i} className="p-4">
                  <Skeleton className="h-6 w-3/4 mb-2" />
                  <Skeleton className="h-4 w-1/2" />
                </Card>)}
            </div> : validSegments.length > 0 ? <div className="space-y-4">
              {validSegments.map(segment => <Card key={segment.segment_id} className="p-4 sm:p-5 hover:shadow-md transition-shadow">
                  <div className="flex flex-col sm:flex-row sm:items-start sm:justify-between gap-3 sm:gap-4">
                    <div className="flex-1 min-w-0">
                      <div className="flex flex-wrap items-center gap-2 mb-2">
                        <h3 className="font-semibold text-base sm:text-lg">{segment.name}</h3>
                        {segment.ends_at_uetliberg && <Badge variant="secondary" className="flex-shrink-0">
                            <MapPin className="w-3 h-3 mr-1" />
                            Uetliberg
                          </Badge>}
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
                        {segment.effort_count && segment.effort_count > 0 && <span className="flex items-center gap-1">
                            <Users className="w-4 h-4" />
                            {segment.effort_count.toLocaleString()}
                          </span>}
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
                      <Badge variant="outline">
                        {getClimbCategoryLabel(segment.climb_category)}
                      </Badge>
                    </div>
                  </div>
                  
                  {segment.distance_to_center != null && <p className="text-xs text-muted-foreground mt-3">
                      {segment.distance_to_center.toFixed(2)} km vom Uetliberg-Zentrum
                    </p>}
                </Card>)}
            </div> : <Card className="p-8 text-center">
              <Mountain className="w-12 h-12 text-muted-foreground mx-auto mb-4" />
              <p className="text-muted-foreground">
                Noch keine Segmente vorhanden
              </p>
            </Card>}
          </TooltipProvider>
        </div>
      </main>

      <Footer />
    </div>;
}