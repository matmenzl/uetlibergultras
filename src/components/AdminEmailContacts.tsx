import { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Mail, Download, RefreshCw, Lightbulb, Award } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';

interface EmailContact {
  email: string;
  source: 'segment' | 'achievement';
  created_at: string;
}

export function AdminEmailContacts() {
  const { toast } = useToast();
  const [isExporting, setIsExporting] = useState(false);

  const { data: contacts, isLoading, refetch } = useQuery({
    queryKey: ['admin-email-contacts'],
    queryFn: async () => {
      // Fetch from segment_suggestions
      const { data: segmentEmails, error: segmentError } = await supabase
        .from('segment_suggestions')
        .select('email, created_at')
        .eq('wants_updates', true)
        .not('email', 'is', null);

      if (segmentError) throw segmentError;

      // Fetch from achievement_suggestions
      const { data: achievementEmails, error: achievementError } = await supabase
        .from('achievement_suggestions')
        .select('email, created_at')
        .eq('wants_updates', true)
        .not('email', 'is', null);

      if (achievementError) throw achievementError;

      // Combine and format
      const allContacts: EmailContact[] = [
        ...(segmentEmails || []).map((s) => ({
          email: s.email!,
          source: 'segment' as const,
          created_at: s.created_at,
        })),
        ...(achievementEmails || []).map((a) => ({
          email: a.email!,
          source: 'achievement' as const,
          created_at: a.created_at,
        })),
      ];

      // Sort by date descending
      allContacts.sort((a, b) => 
        new Date(b.created_at).getTime() - new Date(a.created_at).getTime()
      );

      return allContacts;
    },
  });

  // Get unique emails for export
  const uniqueEmails = contacts 
    ? [...new Set(contacts.map(c => c.email))]
    : [];

  const handleExportCSV = () => {
    if (!contacts || contacts.length === 0) {
      toast({
        title: 'Keine Daten',
        description: 'Es gibt keine E-Mail-Adressen zum Exportieren.',
        variant: 'destructive',
      });
      return;
    }

    setIsExporting(true);

    try {
      // Create CSV content
      const csvHeader = 'Email,Quelle,Datum\n';
      const csvRows = contacts.map(c => 
        `${c.email},${c.source === 'segment' ? 'Segment-Vorschlag' : 'Achievement-Vorschlag'},${new Date(c.created_at).toLocaleDateString('de-CH')}`
      ).join('\n');
      
      const csvContent = csvHeader + csvRows;
      
      // Create blob and download
      const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
      const url = URL.createObjectURL(blob);
      const link = document.createElement('a');
      link.href = url;
      link.download = `email-kontakte-${new Date().toISOString().split('T')[0]}.csv`;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      URL.revokeObjectURL(url);

      toast({
        title: 'Export erfolgreich',
        description: `${contacts.length} Einträge (${uniqueEmails.length} einzigartige E-Mails) exportiert.`,
      });
    } catch (error) {
      console.error('Export error:', error);
      toast({
        title: 'Export fehlgeschlagen',
        description: 'Beim Exportieren ist ein Fehler aufgetreten.',
        variant: 'destructive',
      });
    } finally {
      setIsExporting(false);
    }
  };

  const handleCopyEmails = () => {
    if (uniqueEmails.length === 0) {
      toast({
        title: 'Keine E-Mails',
        description: 'Es gibt keine E-Mail-Adressen zum Kopieren.',
        variant: 'destructive',
      });
      return;
    }

    navigator.clipboard.writeText(uniqueEmails.join(', '));
    toast({
      title: 'Kopiert',
      description: `${uniqueEmails.length} E-Mail-Adressen in die Zwischenablage kopiert.`,
    });
  };

  return (
    <Card className="p-6 mb-6">
      <div className="flex items-center justify-between mb-4">
        <h2 className="text-lg font-semibold flex items-center gap-2">
          <Mail className="w-5 h-5 text-primary" />
          E-Mail-Kontakte
          {contacts && contacts.length > 0 && (
            <Badge variant="secondary" className="ml-2">
              {uniqueEmails.length} Kontakte
            </Badge>
          )}
        </h2>
        <Button
          variant="ghost"
          size="sm"
          onClick={() => refetch()}
          disabled={isLoading}
        >
          <RefreshCw className={`w-4 h-4 ${isLoading ? 'animate-spin' : ''}`} />
        </Button>
      </div>

      <p className="text-sm text-muted-foreground mb-4">
        E-Mail-Adressen von Nutzern, die bei Vorschlägen Status-Updates erhalten möchten.
      </p>

      {isLoading ? (
        <div className="flex items-center justify-center py-8">
          <RefreshCw className="w-5 h-5 animate-spin text-muted-foreground" />
        </div>
      ) : contacts && contacts.length > 0 ? (
        <>
          <div className="space-y-2 max-h-64 overflow-y-auto mb-4">
            {contacts.map((contact, index) => (
              <div
                key={`${contact.email}-${index}`}
                className="flex items-center justify-between p-2 rounded-lg bg-muted/50 border border-border"
              >
                <div className="flex items-center gap-2 min-w-0">
                  {contact.source === 'segment' ? (
                    <Lightbulb className="w-4 h-4 text-muted-foreground flex-shrink-0" />
                  ) : (
                    <Award className="w-4 h-4 text-muted-foreground flex-shrink-0" />
                  )}
                  <span className="text-sm truncate">{contact.email}</span>
                </div>
                <span className="text-xs text-muted-foreground flex-shrink-0">
                  {new Date(contact.created_at).toLocaleDateString('de-CH')}
                </span>
              </div>
            ))}
          </div>

          <div className="flex gap-2">
            <Button onClick={handleExportCSV} disabled={isExporting}>
              {isExporting ? (
                <RefreshCw className="w-4 h-4 mr-2 animate-spin" />
              ) : (
                <Download className="w-4 h-4 mr-2" />
              )}
              CSV exportieren
            </Button>
            <Button variant="outline" onClick={handleCopyEmails}>
              <Mail className="w-4 h-4 mr-2" />
              E-Mails kopieren
            </Button>
          </div>
        </>
      ) : (
        <p className="text-sm text-muted-foreground text-center py-8">
          Noch keine E-Mail-Kontakte gesammelt.
        </p>
      )}
    </Card>
  );
}