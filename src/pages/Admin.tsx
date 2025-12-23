import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { supabase } from '@/integrations/supabase/client';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { useToast } from '@/hooks/use-toast';
import { useUserRole } from '@/hooks/useUserRole';
import NavBar from '@/components/NavBar';
import { Footer } from '@/components/Footer';
import { Shield, Plus, RefreshCw, AlertTriangle } from 'lucide-react';
import { z } from 'zod';

const segmentIdSchema = z.string()
  .trim()
  .regex(/^\d+$/, 'Bitte gib eine gültige Segment-ID ein (nur Zahlen)')
  .transform(val => parseInt(val, 10));

export default function Admin() {
  const navigate = useNavigate();
  const { user, isAdmin, isLoading } = useUserRole();
  const { toast } = useToast();
  const [segmentId, setSegmentId] = useState('');
  const [isAdding, setIsAdding] = useState(false);
  const [isRefreshing, setIsRefreshing] = useState(false);

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

          {/* Add Segment Form */}
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
