import { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { User } from '@supabase/supabase-js';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Checkbox } from '@/components/ui/checkbox';
import { Label } from '@/components/ui/label';
import { useToast } from '@/hooks/use-toast';
import { useQueryClient } from '@tanstack/react-query';
import { Lightbulb, Send, Loader2, CheckCircle } from 'lucide-react';
import { z } from 'zod';
import stravaConnectButton from '@/assets/btn_strava_connect_with_orange.svg';

const stravaSegmentUrlSchema = z.string()
  .trim()
  .min(1, 'URL ist erforderlich')
  .max(500, 'URL darf maximal 500 Zeichen haben')
  .regex(
    /^https:\/\/(www\.)?strava\.com\/segments\/\d+/,
    'Bitte gib eine gültige Strava-Segment-URL ein (z.B. https://www.strava.com/segments/123456)'
  );

interface SegmentSuggestionFormProps {
  onSuccess?: () => void;
}

export function SegmentSuggestionForm({ onSuccess }: SegmentSuggestionFormProps) {
  const [url, setUrl] = useState('');
  const [email, setEmail] = useState('');
  const [wantsUpdates, setWantsUpdates] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [emailError, setEmailError] = useState<string | null>(null);
  const [user, setUser] = useState<User | null>(null);
  const [showLoginPrompt, setShowLoginPrompt] = useState(false);
  const [showSuccess, setShowSuccess] = useState(false);
  const { toast } = useToast();
  const queryClient = useQueryClient();

  const submitSuggestion = async (userId: string, segmentUrl: string, userEmail: string, updates?: boolean) => {
    // Validate URL
    const validation = stravaSegmentUrlSchema.safeParse(segmentUrl);
    if (!validation.success) {
      setError(validation.error.errors[0].message);
      return;
    }

    // Validate email (required)
    const emailValidation = z.string()
      .trim()
      .min(1, 'E-Mail ist erforderlich')
      .max(255, 'E-Mail darf maximal 255 Zeichen haben')
      .email('Bitte gib eine gültige E-Mail-Adresse ein')
      .safeParse(userEmail);
    if (!emailValidation.success) {
      setEmailError(emailValidation.error.errors[0].message);
      return;
    }

    setIsSubmitting(true);

    try {
      const { error: insertError } = await supabase
        .from('segment_suggestions')
        .insert({
          user_id: userId,
          strava_segment_url: validation.data,
          email: emailValidation.data,
          wants_updates: updates ?? false
        });

      if (insertError) throw insertError;

      toast({
        title: 'Vorschlag eingereicht',
        description: 'Dein Segment-Vorschlag wird von einem Admin geprüft.',
      });

      setUrl('');
      setEmail('');
      setWantsUpdates(false);
      setShowSuccess(true);
      
      // Reset success state after 3 seconds
      setTimeout(() => {
        setShowSuccess(false);
      }, 3000);
      
      // Refresh the suggestions list
      queryClient.invalidateQueries({ queryKey: ['my-suggestions'] });
      
      onSuccess?.();
    } catch (err) {
      console.error('Error submitting suggestion:', err);
      setError('Fehler beim Einreichen des Vorschlags. Bitte versuche es erneut.');
    } finally {
      setIsSubmitting(false);
    }
  };

  useEffect(() => {
    supabase.auth.getSession().then(({ data: { session } }) => {
      setUser(session?.user ?? null);
    });

    const { data: { subscription } } = supabase.auth.onAuthStateChange((_event, session) => {
      setUser(session?.user ?? null);
      if (session?.user) {
        setShowLoginPrompt(false);
        // Check if there's a pending segment suggestion
        const pendingUrl = sessionStorage.getItem('pending_segment_url');
        if (pendingUrl) {
          sessionStorage.removeItem('pending_segment_url');
          setUrl(pendingUrl);
          // Note: email is still required, so don't auto-submit
        }
      }
    });

    return () => subscription.unsubscribe();
  }, []);

  const handleStravaConnect = () => {
    // Save the pending segment URL to submit after auth
    if (url.trim()) {
      sessionStorage.setItem('pending_segment_url', url.trim());
    }
    // Save current URL to return after auth
    sessionStorage.setItem('auth_return_url', window.location.pathname);
    
    const clientId = '186560';
    const redirectUri = `${window.location.origin}/auth/strava-callback`;
    const scope = 'read,activity:read,activity:read_all';
    const stravaAuthUrl = `https://www.strava.com/oauth/authorize?client_id=${clientId}&response_type=code&redirect_uri=${encodeURIComponent(redirectUri)}&approval_prompt=force&scope=${scope}`;
    window.location.href = stravaAuthUrl;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setEmailError(null);

    // Check if user is logged in
    if (!user) {
      // Save URL before showing login prompt
      setShowLoginPrompt(true);
      return;
    }

    await submitSuggestion(user.id, url, email, wantsUpdates);
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
        {showSuccess ? (
          <div className="flex flex-col items-center justify-center py-4 animate-fade-in">
            <div className="w-16 h-16 rounded-full bg-green-500/20 flex items-center justify-center mb-3 animate-scale-in">
              <CheckCircle className="w-10 h-10 text-green-500" />
            </div>
            <p className="text-lg font-semibold text-green-600 dark:text-green-400">
              Erfolgreich eingereicht!
            </p>
            <p className="text-sm text-muted-foreground mt-1">
              Ein Admin wird deinen Vorschlag prüfen.
            </p>
          </div>
        ) : showLoginPrompt ? (
          <div className="space-y-3 text-center">
            <p className="text-sm text-muted-foreground">
              Verbinde dich mit Strava um Segmente vorzuschlagen
            </p>
            <button
              onClick={handleStravaConnect}
              className="inline-block hover:opacity-90 transition-opacity"
            >
              <img
                src={stravaConnectButton}
                alt="Connect with Strava"
                className="h-12"
              />
            </button>
          </div>
        ) : (
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
            <div>
              <Input
                type="email"
                placeholder="deine@email.com"
                value={email}
                onChange={(e) => {
                  setEmail(e.target.value);
                  setEmailError(null);
                }}
                className={emailError ? 'border-destructive' : ''}
                disabled={isSubmitting}
              />
              {emailError && (
                <p className="text-sm text-destructive mt-1">{emailError}</p>
              )}
            </div>
            <div className="flex items-center space-x-2 pt-1">
              <Checkbox
                id="wants-updates-segment"
                checked={wantsUpdates}
                onCheckedChange={(checked) => setWantsUpdates(checked === true)}
              />
              <Label htmlFor="wants-updates-segment" className="text-sm cursor-pointer">
                Benachrichtige mich über Status-Updates
              </Label>
            </div>
            <Button type="submit" disabled={isSubmitting || !url.trim() || !email.trim()} className="w-full">
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
        )}
      </CardContent>
    </Card>
  );
}
