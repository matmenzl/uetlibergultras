import { useState } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { useToast } from '@/hooks/use-toast';
import { Lightbulb, Send, Loader2 } from 'lucide-react';
import { z } from 'zod';

const stravaSegmentUrlSchema = z.string()
  .trim()
  .min(1, 'URL ist erforderlich')
  .regex(
    /^https:\/\/(www\.)?strava\.com\/segments\/\d+/,
    'Bitte gib eine gültige Strava-Segment-URL ein (z.B. https://www.strava.com/segments/123456)'
  );

interface SegmentSuggestionFormProps {
  onSuccess?: () => void;
}

export function SegmentSuggestionForm({ onSuccess }: SegmentSuggestionFormProps) {
  const [url, setUrl] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const { toast } = useToast();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);

    // Validate URL
    const validation = stravaSegmentUrlSchema.safeParse(url);
    if (!validation.success) {
      setError(validation.error.errors[0].message);
      return;
    }

    setIsSubmitting(true);

    try {
      const { data: { user } } = await supabase.auth.getUser();
      
      if (!user) {
        setError('Du musst eingeloggt sein um Segmente vorzuschlagen.');
        return;
      }

      const { error: insertError } = await supabase
        .from('segment_suggestions')
        .insert({
          user_id: user.id,
          strava_segment_url: validation.data
        });

      if (insertError) throw insertError;

      toast({
        title: 'Vorschlag eingereicht',
        description: 'Dein Segment-Vorschlag wird von einem Admin geprüft.',
      });

      setUrl('');
      onSuccess?.();
    } catch (err) {
      console.error('Error submitting suggestion:', err);
      setError('Fehler beim Einreichen des Vorschlags. Bitte versuche es erneut.');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <Card className="border-primary/20 bg-primary/5">
      <CardHeader className="pb-3">
        <CardTitle className="flex items-center gap-2 text-lg">
          <Lightbulb className="w-5 h-5 text-primary" />
          Segment vorschlagen
        </CardTitle>
      </CardHeader>
      <CardContent>
        <form onSubmit={handleSubmit} className="space-y-3">
          <div>
            <Input
              type="url"
              placeholder="https://www.strava.com/segments/..."
              value={url}
              onChange={(e) => {
                setUrl(e.target.value);
                setError(null);
              }}
              className={error ? 'border-destructive' : ''}
              disabled={isSubmitting}
            />
            {error && (
              <p className="text-sm text-destructive mt-1">{error}</p>
            )}
          </div>
          <Button type="submit" disabled={isSubmitting || !url.trim()} className="w-full">
            {isSubmitting ? (
              <>
                <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                Wird eingereicht...
              </>
            ) : (
              <>
                <Send className="w-4 h-4 mr-2" />
                Vorschlagen
              </>
            )}
          </Button>
          <p className="text-xs text-muted-foreground">
            Kopiere die URL eines Strava-Segments. Ein Admin wird deinen Vorschlag prüfen.
          </p>
        </form>
      </CardContent>
    </Card>
  );
}
