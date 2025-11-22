import { useEffect, useState } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { supabase } from '@/integrations/supabase/client';
import { Card } from '@/components/ui/card';
import { Loader2, CheckCircle, XCircle } from 'lucide-react';
import { toast } from 'sonner';

export default function StravaCallback() {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const [status, setStatus] = useState<'loading' | 'success' | 'error'>('loading');
  const [message, setMessage] = useState('Verbinde mit Strava...');

  useEffect(() => {
    const handleCallback = async () => {
      const code = searchParams.get('code');
      const state = searchParams.get('state'); // userId
      const error = searchParams.get('error');

      if (error) {
        setStatus('error');
        setMessage('Strava-Autorisierung abgebrochen');
        toast.error('Strava-Autorisierung abgebrochen');
        setTimeout(() => navigate('/'), 3000);
        return;
      }

      if (!code || !state) {
        setStatus('error');
        setMessage('Ungültige Callback-Parameter');
        toast.error('Ungültige Callback-Parameter');
        setTimeout(() => navigate('/'), 3000);
        return;
      }

      try {
        // Exchange code for tokens via edge function
        const { data, error: callbackError } = await supabase.functions.invoke('strava-oauth-callback', {
          body: { code, userId: state }
        });

        if (callbackError) {
          throw callbackError;
        }

        if (!data.success) {
          throw new Error('Failed to connect Strava account');
        }

        setStatus('success');
        setMessage('Erfolgreich mit Strava verbunden!');
        toast.success('Strava-Account verbunden');

        // Sync segment efforts
        setTimeout(async () => {
          setMessage('Synchronisiere deine Segmente...');
          
          const { error: syncError } = await supabase.functions.invoke('sync-segment-efforts');
          
          if (syncError) {
            console.error('Sync error:', syncError);
            toast.error('Fehler beim Synchronisieren');
          } else {
            toast.success('Segmente synchronisiert');
          }

          setTimeout(() => navigate('/'), 1000);
        }, 1000);

      } catch (err) {
        console.error('Callback error:', err);
        setStatus('error');
        setMessage('Fehler beim Verbinden mit Strava');
        toast.error('Fehler beim Verbinden mit Strava');
        setTimeout(() => navigate('/'), 3000);
      }
    };

    handleCallback();
  }, [searchParams, navigate]);

  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-primary/10 to-background p-4">
      <Card className="w-full max-w-md p-8">
        <div className="flex flex-col items-center text-center space-y-4">
          {status === 'loading' && (
            <>
              <Loader2 className="h-12 w-12 animate-spin text-primary" />
              <h2 className="text-2xl font-bold">{message}</h2>
            </>
          )}
          {status === 'success' && (
            <>
              <CheckCircle className="h-12 w-12 text-green-500" />
              <h2 className="text-2xl font-bold">{message}</h2>
              <p className="text-muted-foreground">Du wirst weitergeleitet...</p>
            </>
          )}
          {status === 'error' && (
            <>
              <XCircle className="h-12 w-12 text-destructive" />
              <h2 className="text-2xl font-bold">{message}</h2>
              <p className="text-muted-foreground">Du wirst weitergeleitet...</p>
            </>
          )}
        </div>
      </Card>
    </div>
  );
}
