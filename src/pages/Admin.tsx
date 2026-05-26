import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { supabase } from '@/integrations/supabase/client';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Badge } from '@/components/ui/badge';
import { useToast } from '@/hooks/use-toast';
import { useUserRole } from '@/hooks/useUserRole';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import NavBar from '@/components/NavBar';
import { Footer } from '@/components/Footer';
import { AdminEmailContacts } from '@/components/AdminEmailContacts';
import { Shield, Plus, RefreshCw, AlertTriangle, Calendar, Lightbulb, Check, X, ExternalLink, Camera, Power, PowerOff, Award, RotateCcw, Bell, BellOff, Send } from 'lucide-react';
import { z } from 'zod';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Seo } from '@/components/Seo';
import { Progress } from '@/components/ui/progress';

function formatDuration(seconds: number): string {
  if (!isFinite(seconds) || seconds < 0) return '–';
  if (seconds < 60) return `${Math.round(seconds)}s`;
  const mins = Math.round(seconds / 60);
  if (mins < 60) return `~${mins} Min`;
  const hours = Math.floor(mins / 60);
  const rem = mins % 60;
  return rem === 0 ? `~${hours} Std` : `~${hours} Std ${rem} Min`;
}

const segmentIdSchema = z.string()
  .trim()
  .regex(/^\d+$/, 'Bitte gib eine gültige Segment-ID ein (nur Zahlen)')
  .transform(val => parseInt(val, 10));

export default function Admin() {
  const navigate = useNavigate();
  const { user, isAdmin, isLoading } = useUserRole();
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const [segmentId, setSegmentId] = useState('');
  const [isAdding, setIsAdding] = useState(false);
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [isScanning, setIsScanning] = useState(false);
  const [scanningMonth, setScanningMonth] = useState<number | null>(null);
  const [processingId, setProcessingId] = useState<string | null>(null);
  const [isTogglingCron, setIsTogglingCron] = useState(false);
  const [isResyncing, setIsResyncing] = useState(false);
  const [resyncSegmentId, setResyncSegmentId] = useState<string>('all');
  const [isSubmittingSitemap, setIsSubmittingSitemap] = useState(false);

  // Poll active resync job (only when admin)
  const { data: activeResyncJob, refetch: refetchResyncJob } = useQuery({
    queryKey: ['active-resync-job'],
    enabled: !!user && !!isAdmin,
    refetchInterval: 5000,
    queryFn: async () => {
      const { data, error } = await supabase
        .from('resync_jobs')
        .select('*')
        .in('status', ['queued', 'running', 'paused'])
        .order('created_at', { ascending: false })
        .limit(1)
        .maybeSingle();
      if (error) {
        console.error('Resync job query error:', error);
        return null;
      }
      return data;
    },
  });

  // Fetch webcam cron status
  const { data: cronStatus, refetch: refetchCronStatus } = useQuery({
    queryKey: ['webcam-cron-status'],
    queryFn: async () => {
      const { data: { session } } = await supabase.auth.getSession();
      if (!session?.access_token) return { status: 'unknown' };
      
      const { data, error } = await supabase.functions.invoke('manage-webcam-cron', {
        headers: { Authorization: `Bearer ${session.access_token}` },
        body: { action: 'status' },
      });
      
      if (error) throw error;
      return data as { status: 'active' | 'inactive' | 'unknown' };
    },
    enabled: isAdmin,
    refetchInterval: 30000,
  });

  // Fetch sitemap submission state
  const { data: sitemapState, refetch: refetchSitemapState } = useQuery({
    queryKey: ['sitemap-submission-state'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('sitemap_submission_state')
        .select('*')
        .eq('id', 'default')
        .maybeSingle();
      if (error) throw error;
      return data as {
        last_hash: string | null;
        last_submitted_at: string | null;
        last_status: string | null;
        last_error: string | null;
        last_trigger: string | null;
      } | null;
    },
    enabled: isAdmin,
  });

  const handleResubmitSitemap = async (force = false) => {
    setIsSubmittingSitemap(true);
    try {
      const { data: { session } } = await supabase.auth.getSession();
      const { data, error } = await supabase.functions.invoke('resubmit-sitemap', {
        headers: session?.access_token ? { Authorization: `Bearer ${session.access_token}` } : {},
        body: { force, trigger: force ? 'admin-force' : 'admin' },
      });
      if (error) throw error;
      if ((data as any)?.submitted) {
        toast({ title: 'Sitemap eingereicht', description: 'Google Search Console wurde aktualisiert.' });
      } else {
        toast({ title: 'Keine Änderung', description: 'Sitemap-Hash unverändert – nichts gesendet.' });
      }
      await refetchSitemapState();
    } catch (e) {
      toast({
        title: 'Fehler',
        description: e instanceof Error ? e.message : 'Unbekannter Fehler',
        variant: 'destructive',
      });
    } finally {
      setIsSubmittingSitemap(false);
    }
  };
  
  const currentYear = new Date().getFullYear();
  const currentMonth = new Date().getMonth() + 1;
  const MONTHS_DE = ['Jan', 'Feb', 'Mär', 'Apr', 'Mai', 'Jun', 'Jul', 'Aug', 'Sep', 'Okt', 'Nov', 'Dez'];

  // Fetch pending segment suggestions
  const { data: suggestions, isLoading: suggestionsLoading } = useQuery({
    queryKey: ['segment-suggestions'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('segment_suggestions')
        .select('*')
        .order('created_at', { ascending: false });
      
      if (error) throw error;
      return data;
    },
    enabled: isAdmin,
  });

  // Fetch achievement suggestions
  const { data: achievementSuggestions, isLoading: achievementSuggestionsLoading } = useQuery({
    queryKey: ['achievement-suggestions'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('achievement_suggestions')
        .select('*')
        .order('created_at', { ascending: false });
      
      if (error) throw error;
      return data;
    },
    enabled: isAdmin,
  });

  // Fetch all segments for re-sync dropdown
  const { data: allSegments } = useQuery({
    queryKey: ['all-segments'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('uetliberg_segments')
        .select('segment_id, name')
        .order('name');
      
      if (error) throw error;
      return data;
    },
    enabled: isAdmin,
  });

  const extractSegmentId = (url: string): string | null => {
    const match = url.match(/strava\.com\/segments\/(\d+)/);
    return match ? match[1] : null;
  };

  const handleApprove = async (suggestion: { id: string; strava_segment_url: string }) => {
    setProcessingId(suggestion.id);
    try {
      const { data: { session } } = await supabase.auth.getSession();
      
      if (!session?.access_token) {
        throw new Error('Keine aktive Sitzung gefunden');
      }

      const { data, error } = await supabase.functions.invoke('approve-segment-suggestion', {
        headers: {
          Authorization: `Bearer ${session.access_token}`,
        },
        body: { suggestion_id: suggestion.id },
      });

      if (error) throw error;

      toast({
        title: 'Segment hinzugefügt',
        description: data.segment 
          ? `"${data.segment.name}" wurde hinzugefügt (${data.segment.priority === 'high' ? 'Hohe' : 'Mittlere'} Priorität)`
          : data.message || 'Vorschlag genehmigt',
      });

      queryClient.invalidateQueries({ queryKey: ['segment-suggestions'] });
      queryClient.invalidateQueries({ queryKey: ['all-segments'] });
    } catch (error) {
      console.error('Error approving suggestion:', error);
      toast({
        title: 'Fehler',
        description: error instanceof Error ? error.message : 'Unbekannter Fehler',
        variant: 'destructive',
      });
    } finally {
      setProcessingId(null);
    }
  };

  const handleReject = async (suggestionId: string) => {
    setProcessingId(suggestionId);
    try {
      await supabase
        .from('segment_suggestions')
        .update({ 
          status: 'rejected', 
          reviewed_at: new Date().toISOString(),
          reviewed_by: user?.id 
        })
        .eq('id', suggestionId);

      toast({
        title: 'Vorschlag abgelehnt',
        description: 'Der Vorschlag wurde abgelehnt.',
      });

      queryClient.invalidateQueries({ queryKey: ['segment-suggestions'] });
    } catch (error) {
      console.error('Error rejecting suggestion:', error);
      toast({
        title: 'Fehler',
        description: error instanceof Error ? error.message : 'Unbekannter Fehler',
        variant: 'destructive',
      });
    } finally {
      setProcessingId(null);
    }
  };

  const handleApproveAchievement = async (suggestionId: string) => {
    setProcessingId(suggestionId);
    try {
      await supabase
        .from('achievement_suggestions')
        .update({ 
          status: 'approved', 
          reviewed_at: new Date().toISOString(),
          reviewed_by: user?.id 
        })
        .eq('id', suggestionId);

      toast({
        title: 'Vorschlag genehmigt',
        description: 'Der Achievement-Vorschlag wurde genehmigt. Er kann jetzt implementiert werden.',
      });

      queryClient.invalidateQueries({ queryKey: ['achievement-suggestions'] });
    } catch (error) {
      console.error('Error approving achievement suggestion:', error);
      toast({
        title: 'Fehler',
        description: error instanceof Error ? error.message : 'Unbekannter Fehler',
        variant: 'destructive',
      });
    } finally {
      setProcessingId(null);
    }
  };

  const handleRejectAchievement = async (suggestionId: string) => {
    setProcessingId(suggestionId);
    try {
      await supabase
        .from('achievement_suggestions')
        .update({ 
          status: 'rejected', 
          reviewed_at: new Date().toISOString(),
          reviewed_by: user?.id 
        })
        .eq('id', suggestionId);

      toast({
        title: 'Vorschlag abgelehnt',
        description: 'Der Achievement-Vorschlag wurde abgelehnt.',
      });

      queryClient.invalidateQueries({ queryKey: ['achievement-suggestions'] });
    } catch (error) {
      console.error('Error rejecting achievement suggestion:', error);
      toast({
        title: 'Fehler',
        description: error instanceof Error ? error.message : 'Unbekannter Fehler',
        variant: 'destructive',
      });
    } finally {
      setProcessingId(null);
    }
  };

  const scanMonth = async (year: number, month: number) => {
    if (!user) return;
    
    setIsScanning(true);
    setScanningMonth(month);
    try {
      const { data: { session } } = await supabase.auth.getSession();
      
      if (!session?.access_token) {
        throw new Error('Keine aktive Sitzung gefunden');
      }

      const { error } = await supabase.functions.invoke('get-uetliberg-runs', {
        headers: {
          Authorization: `Bearer ${session.access_token}`,
        },
        body: { year, month, per_page: 30, max_pages: 3 },
      });
      
      if (error) throw error;
      
      toast({
        title: 'Scan abgeschlossen',
        description: `${MONTHS_DE[month - 1]} ${year} wurde gescannt.`,
      });
    } catch (error) {
      console.error('Scan error:', error);
      toast({
        title: 'Fehler beim Scannen',
        description: error instanceof Error ? error.message : 'Unbekannter Fehler',
        variant: 'destructive',
      });
    } finally {
      setIsScanning(false);
      setScanningMonth(null);
    }
  };

  const handleAddSegment = async (e: React.FormEvent) => {
    e.preventDefault();
    
    // Validate input
    const result = segmentIdSchema.safeParse(segmentId);
    if (!result.success) {
      toast({
        title: 'Ungültige Eingabe',
        description: result.error.errors[0].message,
        variant: 'destructive',
      });
      return;
    }

    const parsedId = result.data;
    setIsAdding(true);

    try {
      // Check if segment already exists
      const { data: existing } = await supabase
        .from('uetliberg_segments')
        .select('segment_id')
        .eq('segment_id', parsedId)
        .maybeSingle();

      if (existing) {
        toast({
          title: 'Segment existiert bereits',
          description: `Segment ${parsedId} ist bereits in der Datenbank.`,
          variant: 'destructive',
        });
        setIsAdding(false);
        return;
      }

      // Insert placeholder segment
      const { error } = await supabase
        .from('uetliberg_segments')
        .insert({
          segment_id: parsedId,
          name: `Segment ${parsedId}`,
          distance: 0,
          avg_grade: 0,
          climb_category: 0,
          start_latlng: '(0,0)',
          end_latlng: '(0,0)',
          polyline: '',
          priority: 'medium',
        });

      if (error) throw error;

      toast({
        title: 'Segment hinzugefügt',
        description: `Segment ${parsedId} wurde hinzugefügt. Die Details werden automatisch von Strava geladen.`,
      });
      setSegmentId('');
    } catch (error) {
      console.error('Error adding segment:', error);
      toast({
        title: 'Fehler',
        description: error instanceof Error ? error.message : 'Unbekannter Fehler',
        variant: 'destructive',
      });
    } finally {
      setIsAdding(false);
    }
  };

  const handleRefreshAll = async () => {
    if (!user) return;
    
    setIsRefreshing(true);
    try {
      const { data: { session } } = await supabase.auth.getSession();
      
      if (!session?.access_token) {
        throw new Error('Keine aktive Sitzung gefunden');
      }

      const { data, error } = await supabase.functions.invoke('refresh-segment-details', {
        headers: {
          Authorization: `Bearer ${session.access_token}`,
        },
      });
      
      if (error) throw error;
      
      toast({
        title: 'Segmente aktualisiert',
        description: `${data.updated_count} Segment(e) wurden aktualisiert.`,
      });
    } catch (error) {
      console.error('Refresh error:', error);
      toast({
        title: 'Fehler beim Aktualisieren',
        description: error instanceof Error ? error.message : 'Unbekannter Fehler',
        variant: 'destructive',
      });
    } finally {
      setIsRefreshing(false);
    }
  };

  const handleToggleCron = async (enable: boolean) => {
    const { data: { session } } = await supabase.auth.getSession();
    if (!session?.access_token) return;
    
    setIsTogglingCron(true);
    try {
      const { data, error } = await supabase.functions.invoke('manage-webcam-cron', {
        headers: { Authorization: `Bearer ${session.access_token}` },
        body: { action: enable ? 'enable' : 'disable' },
      });
      
      if (error) throw error;
      
      toast({
        title: enable ? 'Webcam-Cron aktiviert' : 'Webcam-Cron deaktiviert',
        description: data.message,
      });
      
      refetchCronStatus();
    } catch (error) {
      console.error('Cron toggle error:', error);
      toast({
        title: 'Fehler',
        description: error instanceof Error ? error.message : 'Unbekannter Fehler',
        variant: 'destructive',
      });
    } finally {
      setIsTogglingCron(false);
    }
  };

  const handleResync = async () => {
    const { data: { session } } = await supabase.auth.getSession();
    if (!session?.access_token) return;
    
    setIsResyncing(true);
    try {
      const { data, error } = await supabase.functions.invoke('admin-resync-segment', {
        headers: { Authorization: `Bearer ${session.access_token}` },
        body: { segment_id: resyncSegmentId === 'all' ? null : resyncSegmentId },
      });
      
      if (error) throw error;
      
      toast({
        title: 'Re-Sync gestartet',
        description: data.message,
      });
      refetchResyncJob();
    } catch (error) {
      console.error('Re-sync error:', error);
      toast({
        title: 'Fehler beim Re-Sync',
        description: error instanceof Error ? error.message : 'Unbekannter Fehler',
        variant: 'destructive',
      });
    } finally {
      setIsResyncing(false);
    }
  };

  const handleCancelResync = async (jobId: string) => {
    const { data: { session } } = await supabase.auth.getSession();
    if (!session?.access_token) return;
    try {
      const { error } = await supabase.functions.invoke('admin-resync-segment', {
        headers: { Authorization: `Bearer ${session.access_token}` },
        body: { cancel_job_id: jobId },
      });
      if (error) throw error;
      toast({ title: 'Resync abgebrochen' });
      refetchResyncJob();
    } catch (error) {
      toast({
        title: 'Abbruch fehlgeschlagen',
        description: error instanceof Error ? error.message : 'Unbekannter Fehler',
        variant: 'destructive',
      });
    }
  };

  if (isLoading) {
    return (
      <div className="min-h-screen flex flex-col bg-background">
        <NavBar />
        <main className="flex-1 container mx-auto px-4 py-8 flex items-center justify-center">
          <RefreshCw className="w-8 h-8 animate-spin text-muted-foreground" />
        </main>
        <Footer />
      </div>
    );
  }

  if (!user) {
    return (
      <div className="min-h-screen flex flex-col bg-background">
        <NavBar />
        <main className="flex-1 container mx-auto px-4 py-8">
          <Card className="max-w-md mx-auto p-8 text-center">
            <AlertTriangle className="w-12 h-12 text-yellow-500 mx-auto mb-4" />
            <h2 className="text-xl font-bold mb-2">Nicht angemeldet</h2>
            <p className="text-muted-foreground mb-4">
              Bitte melde dich an, um auf diese Seite zuzugreifen.
            </p>
            <Button onClick={() => navigate('/auth')}>
              Anmelden
            </Button>
          </Card>
        </main>
        <Footer />
      </div>
    );
  }

  if (!isAdmin) {
    return (
      <div className="min-h-screen flex flex-col bg-background">
        <NavBar />
        <main className="flex-1 container mx-auto px-4 py-8">
          <Card className="max-w-md mx-auto p-8 text-center">
            <Shield className="w-12 h-12 text-destructive mx-auto mb-4" />
            <h2 className="text-xl font-bold mb-2">Zugriff verweigert</h2>
            <p className="text-muted-foreground">
              Du benötigst Admin-Rechte, um auf diese Seite zuzugreifen.
            </p>
          </Card>
        </main>
        <Footer />
      </div>
    );
  }

  return (
    <div className="min-h-screen flex flex-col bg-background">
      <Seo
        title="Admin – Uetliberg Ultras"
        description="Admin-Bereich von Uetliberg Ultras."
        path="/admin"
        noindex
      />
      <NavBar />
      
      <main className="flex-1 container mx-auto px-4 py-8">
        <div className="max-w-2xl mx-auto">
          <div className="flex items-center gap-3 mb-2">
            <Shield className="w-10 h-10 text-primary" />
            <h1 className="text-4xl font-bold text-foreground">
              Admin
            </h1>
          </div>
          <p className="text-muted-foreground mb-8">
            Segmente verwalten und Einstellungen ändern
          </p>

          {/* Segment Suggestions */}
          <Card className="p-6 mb-6">
            <h2 className="text-lg font-semibold mb-4 flex items-center gap-2">
              <Lightbulb className="w-5 h-5 text-primary" />
              Segment-Vorschläge
              {suggestions && suggestions.filter(s => s.status === 'pending').length > 0 && (
                <Badge variant="secondary" className="ml-2">
                  {suggestions.filter(s => s.status === 'pending').length} offen
                </Badge>
              )}
            </h2>
            
            {suggestionsLoading ? (
              <div className="flex items-center justify-center py-4">
                <RefreshCw className="w-5 h-5 animate-spin text-muted-foreground" />
              </div>
            ) : suggestions && suggestions.length > 0 ? (
              <div className="space-y-3">
                {suggestions.map((suggestion) => (
                  <div 
                    key={suggestion.id} 
                    className={`p-3 rounded-lg border ${
                      suggestion.status === 'pending' 
                        ? 'bg-muted/50 border-border' 
                        : suggestion.status === 'approved'
                        ? 'bg-green-500/10 border-green-500/30'
                        : 'bg-red-500/10 border-red-500/30'
                    }`}
                  >
                    <div className="flex flex-col sm:flex-row sm:items-center gap-2 sm:gap-4">
                      <div className="flex-1 min-w-0">
                        <a 
                          href={suggestion.strava_segment_url} 
                          target="_blank" 
                          rel="noopener noreferrer"
                          className="text-sm font-medium text-primary hover:underline flex items-center gap-1 truncate"
                        >
                          {suggestion.strava_segment_url}
                          <ExternalLink className="w-3 h-3 flex-shrink-0" />
                        </a>
                        <p className="text-xs text-muted-foreground mt-1">
                          {new Date(suggestion.created_at).toLocaleDateString('de-CH', {
                            day: '2-digit',
                            month: '2-digit',
                            year: 'numeric',
                            hour: '2-digit',
                            minute: '2-digit',
                          })}
                          {suggestion.email && (
                            <span className="ml-2 text-primary">
                              📧 {suggestion.email}
                            </span>
                          )}
                          {suggestion.wants_updates ? (
                            <span className="ml-2 text-green-600 dark:text-green-400" title="Möchte benachrichtigt werden">
                              <Bell className="w-3 h-3 inline" />
                            </span>
                          ) : (
                            <span className="ml-2 text-muted-foreground" title="Keine Benachrichtigung gewünscht">
                              <BellOff className="w-3 h-3 inline" />
                            </span>
                          )}
                        </p>
                      </div>
                      
                      <div className="flex items-center gap-2">
                        {suggestion.status === 'pending' ? (
                          <>
                            <Button
                              size="sm"
                              variant="outline"
                              className="text-green-600 hover:text-green-700 hover:bg-green-500/10"
                              onClick={() => handleApprove(suggestion)}
                              disabled={processingId === suggestion.id}
                            >
                              {processingId === suggestion.id ? (
                                <RefreshCw className="w-4 h-4 animate-spin" />
                              ) : (
                                <Check className="w-4 h-4" />
                              )}
                            </Button>
                            <Button
                              size="sm"
                              variant="outline"
                              className="text-red-600 hover:text-red-700 hover:bg-red-500/10"
                              onClick={() => handleReject(suggestion.id)}
                              disabled={processingId === suggestion.id}
                            >
                              <X className="w-4 h-4" />
                            </Button>
                          </>
                        ) : (
                          <Badge 
                            variant="secondary"
                            className={
                              suggestion.status === 'approved' 
                                ? 'bg-green-500/20 text-green-700 dark:text-green-400' 
                                : 'bg-red-500/20 text-red-700 dark:text-red-400'
                            }
                          >
                            {suggestion.status === 'approved' ? 'Genehmigt' : 'Abgelehnt'}
                          </Badge>
                        )}
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <p className="text-sm text-muted-foreground text-center py-4">
                Keine Vorschläge vorhanden
              </p>
            )}
          </Card>

          {/* Achievement Suggestions */}
          <Card className="p-6 mb-6">
            <h2 className="text-lg font-semibold mb-4 flex items-center gap-2">
              <Award className="w-5 h-5 text-primary" />
              Achievement-Vorschläge
              {achievementSuggestions && achievementSuggestions.filter(s => s.status === 'pending').length > 0 && (
                <Badge variant="secondary" className="ml-2">
                  {achievementSuggestions.filter(s => s.status === 'pending').length} offen
                </Badge>
              )}
            </h2>
            
            {achievementSuggestionsLoading ? (
              <div className="flex items-center justify-center py-4">
                <RefreshCw className="w-5 h-5 animate-spin text-muted-foreground" />
              </div>
            ) : achievementSuggestions && achievementSuggestions.length > 0 ? (
              <div className="space-y-3">
                {achievementSuggestions.map((suggestion) => (
                  <div 
                    key={suggestion.id} 
                    className={`p-3 rounded-lg border ${
                      suggestion.status === 'pending' 
                        ? 'bg-muted/50 border-border' 
                        : suggestion.status === 'approved'
                        ? 'bg-green-500/10 border-green-500/30'
                        : 'bg-red-500/10 border-red-500/30'
                    }`}
                  >
                    <div className="flex flex-col gap-2">
                      <div className="flex items-start justify-between gap-2">
                        <div className="flex-1 min-w-0">
                          <p className="text-sm font-semibold">{suggestion.title}</p>
                          <p className="text-xs text-muted-foreground">{suggestion.description}</p>
                        </div>
                        
                        <div className="flex items-center gap-2 flex-shrink-0">
                          {suggestion.status === 'pending' ? (
                            <>
                              <Button
                                size="sm"
                                variant="outline"
                                className="text-green-600 hover:text-green-700 hover:bg-green-500/10"
                                onClick={() => handleApproveAchievement(suggestion.id)}
                                disabled={processingId === suggestion.id}
                              >
                                {processingId === suggestion.id ? (
                                  <RefreshCw className="w-4 h-4 animate-spin" />
                                ) : (
                                  <Check className="w-4 h-4" />
                                )}
                              </Button>
                              <Button
                                size="sm"
                                variant="outline"
                                className="text-red-600 hover:text-red-700 hover:bg-red-500/10"
                                onClick={() => handleRejectAchievement(suggestion.id)}
                                disabled={processingId === suggestion.id}
                              >
                                <X className="w-4 h-4" />
                              </Button>
                            </>
                          ) : (
                            <Badge 
                              variant="secondary"
                              className={
                                suggestion.status === 'approved' 
                                  ? 'bg-green-500/20 text-green-700 dark:text-green-400' 
                                  : 'bg-red-500/20 text-red-700 dark:text-red-400'
                              }
                            >
                              {suggestion.status === 'approved' ? 'Genehmigt' : 'Abgelehnt'}
                            </Badge>
                          )}
                        </div>
                      </div>
                      
                      <div className="text-xs text-muted-foreground bg-background/50 rounded p-2">
                        <span className="font-medium">Wie verdienen: </span>{suggestion.how_to_earn}
                      </div>
                      
                      <p className="text-xs text-muted-foreground">
                        {new Date(suggestion.created_at).toLocaleDateString('de-CH', {
                          day: '2-digit',
                          month: '2-digit',
                          year: 'numeric',
                          hour: '2-digit',
                          minute: '2-digit',
                        })}
                        {suggestion.email && (
                          <span className="ml-2 text-primary">
                            📧 {suggestion.email}
                          </span>
                        )}
                        {suggestion.wants_updates ? (
                          <span className="ml-2 text-green-600 dark:text-green-400" title="Möchte benachrichtigt werden">
                            <Bell className="w-3 h-3 inline" />
                          </span>
                        ) : (
                          <span className="ml-2 text-muted-foreground" title="Keine Benachrichtigung gewünscht">
                            <BellOff className="w-3 h-3 inline" />
                          </span>
                        )}
                      </p>
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <p className="text-sm text-muted-foreground text-center py-4">
                Keine Achievement-Vorschläge vorhanden
              </p>
            )}
          </Card>

          {/* Email Contacts */}
          <AdminEmailContacts />

          <Card className="p-6 mb-6">
            <h2 className="text-lg font-semibold mb-4">Neues Segment hinzufügen</h2>
            <form onSubmit={handleAddSegment} className="space-y-4">
              <div>
                <Label htmlFor="segment-id">Strava Segment-ID</Label>
                <Input
                  id="segment-id"
                  type="text"
                  placeholder="z.B. 12345678"
                  value={segmentId}
                  onChange={(e) => setSegmentId(e.target.value)}
                  className="mt-1"
                  maxLength={20}
                />
                <p className="text-xs text-muted-foreground mt-1">
                  Die Segment-ID findest du in der Strava-URL: strava.com/segments/<strong>12345678</strong>
                </p>
              </div>
              <Button type="submit" disabled={isAdding || !segmentId.trim()}>
                {isAdding ? (
                  <>
                    <RefreshCw className="w-4 h-4 mr-2 animate-spin" />
                    Füge hinzu...
                  </>
                ) : (
                  <>
                    <Plus className="w-4 h-4 mr-2" />
                    Segment hinzufügen
                  </>
                )}
              </Button>
            </form>
          </Card>

          {/* Past Months Sync */}
          <Card className="p-6 mb-6">
            <h2 className="text-lg font-semibold mb-2 flex items-center gap-2">
              <Calendar className="w-5 h-5" />
              Vergangene Monate synchronisieren
            </h2>
            <p className="text-sm text-muted-foreground mb-4">
              Lade Aktivitäten aus vergangenen Monaten nach, falls Check-ins fehlen.
            </p>
            <div className="grid grid-cols-4 sm:grid-cols-6 gap-2">
              {MONTHS_DE.map((monthName, index) => {
                const monthNum = index + 1;
                const isFutureMonth = monthNum > currentMonth;
                const isThisMonthScanning = isScanning && scanningMonth === monthNum;
                
                return (
                  <Button
                    key={monthNum}
                    variant="outline"
                    size="sm"
                    onClick={() => scanMonth(currentYear, monthNum)}
                    disabled={isScanning || isFutureMonth}
                  >
                    {isThisMonthScanning ? (
                      <RefreshCw className="w-3 h-3 animate-spin" />
                    ) : (
                      monthName
                    )}
                  </Button>
                );
              })}
            </div>
          </Card>

          {/* Webcam Cron Control */}
          <Card className="p-6 mb-6">
            <h2 className="text-lg font-semibold mb-2 flex items-center gap-2">
              <Camera className="w-5 h-5" />
              Webcam-Screenshots
              {cronStatus?.status === 'active' && (
                <Badge variant="secondary" className="bg-green-500/20 text-green-700 dark:text-green-400">
                  Aktiv
                </Badge>
              )}
              {cronStatus?.status === 'inactive' && (
                <Badge variant="secondary" className="bg-red-500/20 text-red-700 dark:text-red-400">
                  Inaktiv
                </Badge>
              )}
            </h2>
            <p className="text-sm text-muted-foreground mb-4">
              Automatische Screenshots alle 30 Minuten (6:00–20:00 Uhr).
              <br />
              <span className="text-xs">ScreenshotOne Free-Tier: 100 Screenshots/Monat</span>
            </p>
            <div className="flex gap-2">
              <Button
                variant={cronStatus?.status === 'active' ? 'outline' : 'default'}
                onClick={() => handleToggleCron(true)}
                disabled={isTogglingCron || cronStatus?.status === 'active'}
              >
                {isTogglingCron ? (
                  <RefreshCw className="w-4 h-4 mr-2 animate-spin" />
                ) : (
                  <Power className="w-4 h-4 mr-2" />
                )}
                Aktivieren
              </Button>
              <Button
                variant={cronStatus?.status === 'inactive' ? 'outline' : 'destructive'}
                onClick={() => handleToggleCron(false)}
                disabled={isTogglingCron || cronStatus?.status === 'inactive'}
              >
                {isTogglingCron ? (
                  <RefreshCw className="w-4 h-4 mr-2 animate-spin" />
                ) : (
                  <PowerOff className="w-4 h-4 mr-2" />
                )}
                Deaktivieren
              </Button>
            </div>
          </Card>

          {/* Sitemap Resubmission */}
          <Card className="p-6 mb-6">
            <h2 className="text-lg font-semibold mb-2 flex items-center gap-2">
              <Send className="w-5 h-5" />
              Sitemap → Google
              {sitemapState?.last_status === 'ok' && (
                <Badge variant="secondary" className="bg-green-500/20 text-green-700 dark:text-green-400">
                  OK
                </Badge>
              )}
              {sitemapState?.last_status && sitemapState.last_status !== 'ok' && (
                <Badge variant="secondary" className="bg-red-500/20 text-red-700 dark:text-red-400">
                  {sitemapState.last_status}
                </Badge>
              )}
            </h2>
            <p className="text-sm text-muted-foreground mb-4">
              Pingt Google Search Console automatisch alle 6 Stunden und immer dann,
              wenn sich der Inhalt von <code>/sitemap.xml</code> ändert (Hash-Vergleich).
              {sitemapState?.last_submitted_at && (
                <>
                  <br />
                  <span className="text-xs">
                    Letzter Versuch: {new Date(sitemapState.last_submitted_at).toLocaleString('de-CH')}
                    {sitemapState.last_trigger ? ` · ${sitemapState.last_trigger}` : ''}
                  </span>
                </>
              )}
              {sitemapState?.last_error && (
                <>
                  <br />
                  <span className="text-xs text-destructive">{sitemapState.last_error}</span>
                </>
              )}
            </p>
            <div className="flex gap-2">
              <Button onClick={() => handleResubmitSitemap(false)} disabled={isSubmittingSitemap}>
                {isSubmittingSitemap ? (
                  <RefreshCw className="w-4 h-4 mr-2 animate-spin" />
                ) : (
                  <Send className="w-4 h-4 mr-2" />
                )}
                Jetzt prüfen & senden
              </Button>
              <Button
                variant="outline"
                onClick={() => handleResubmitSitemap(true)}
                disabled={isSubmittingSitemap}
              >
                Erzwingen
              </Button>
            </div>
          </Card>

          {/* Segment Re-Sync */}
          <Card className="p-6 mb-6">
            <h2 className="text-lg font-semibold mb-2 flex items-center gap-2">
              <RotateCcw className="w-5 h-5" />
              Segment Re-Sync
            </h2>
            <p className="text-sm text-muted-foreground mb-4">
              Prüft alle User-Aktivitäten erneut auf das gewählte Segment und erstellt fehlende Check-ins.
              Nützlich wenn ein neues Segment hinzugefügt wurde.
            </p>
            {activeResyncJob && (
              <div className="mb-4 p-3 rounded-md border bg-muted/40 text-sm space-y-1">
                <div className="flex items-center justify-between gap-2 flex-wrap">
                  <div>
                    <Badge variant={activeResyncJob.status === 'paused' ? 'secondary' : 'default'}>
                      {activeResyncJob.status}
                    </Badge>{' '}
                    <span className="font-medium">
                      {(activeResyncJob.processed_user_ids?.length ?? 0)} / {activeResyncJob.total_users || '?'} User
                    </span>
                    {' · '}
                    <span>{activeResyncJob.check_ins_created ?? 0} Check-ins</span>
                  </div>
                  <Button size="sm" variant="ghost" onClick={() => handleCancelResync(activeResyncJob.id)}>
                    <X className="w-4 h-4 mr-1" /> Abbrechen
                  </Button>
                </div>
                <div className="text-muted-foreground">
                  Strava-Limit: short {activeResyncJob.rate_limit_short ?? 0}/{activeResyncJob.rate_limit_short_max ?? 100}
                  {' · '} long {activeResyncJob.rate_limit_long ?? 0}/{activeResyncJob.rate_limit_long_max ?? 1000}
                  {activeResyncJob.resume_after && new Date(activeResyncJob.resume_after) > new Date() && (
                    <> · pausiert bis {new Date(activeResyncJob.resume_after).toLocaleTimeString('de-CH', { hour: '2-digit', minute: '2-digit' })}</>
                  )}
                </div>
                {activeResyncJob.last_error && (
                  <div className="text-xs text-muted-foreground">{activeResyncJob.last_error}</div>
                )}
              </div>
            )}
            <div className="flex flex-col sm:flex-row gap-3">
              <Select value={resyncSegmentId} onValueChange={setResyncSegmentId}>
                <SelectTrigger className="w-full sm:w-[280px]">
                  <SelectValue placeholder="Alle Segmente" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">Alle Segmente</SelectItem>
                  {allSegments?.map((segment) => (
                    <SelectItem key={segment.segment_id} value={segment.segment_id.toString()}>
                      {segment.name || `Segment ${segment.segment_id}`}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
              <Button onClick={handleResync} disabled={isResyncing || !!activeResyncJob}>
                {isResyncing || activeResyncJob ? (
                  <>
                    <RefreshCw className="w-4 h-4 mr-2 animate-spin" />
                    Re-Sync läuft...
                  </>
                ) : (
                  <>
                    <RotateCcw className="w-4 h-4 mr-2" />
                    Re-Sync starten
                  </>
                )}
              </Button>
            </div>
          </Card>

          {/* Refresh All Segments */}
          <Card className="p-6">
            <h2 className="text-lg font-semibold mb-4">Segmentdaten aktualisieren</h2>
            <p className="text-sm text-muted-foreground mb-4">
              Lädt Details von Strava für alle Segmente, die noch unvollständige Daten haben (z.B. fehlende Höhendaten).
            </p>
            <Button onClick={handleRefreshAll} disabled={isRefreshing}>
              {isRefreshing ? (
                <>
                  <RefreshCw className="w-4 h-4 mr-2 animate-spin" />
                  Aktualisiere...
                </>
              ) : (
                <>
                  <RefreshCw className="w-4 h-4 mr-2" />
                  Alle Segmente aktualisieren
                </>
              )}
            </Button>
          </Card>
        </div>
      </main>

      <Footer />
    </div>
  );
}
