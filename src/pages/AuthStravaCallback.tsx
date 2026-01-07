import { useEffect, useState } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { supabase } from '@/integrations/supabase/client';
import { Card } from '@/components/ui/card';
import { Loader2, CheckCircle, XCircle } from 'lucide-react';
import { toast } from 'sonner';
import { Progress } from '@/components/ui/progress';

export default function AuthStravaCallback() {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const [status, setStatus] = useState<'loading' | 'success' | 'syncing' | 'error'>('loading');
  const [message, setMessage] = useState('Verbinde mit Strava...');
  const [syncProgress, setSyncProgress] = useState(0);

  useEffect(() => {
    const handleCallback = async () => {
      const code = searchParams.get('code');
      const error = searchParams.get('error');

      if (error) {
        setStatus('error');
        setMessage('Strava-Autorisierung abgebrochen');
        toast.error('Strava-Autorisierung abgebrochen');
        setTimeout(() => navigate('/auth'), 3000);
        return;
      }

      if (!code) {
        setStatus('error');
        setMessage('Ungültige Callback-Parameter');
        toast.error('Ungültige Callback-Parameter');
        setTimeout(() => navigate('/auth'), 3000);
        return;
      }

      try {
        // Exchange code for tokens and get session via edge function
        const { data, error: exchangeError } = await supabase.functions.invoke('strava-auth-exchange', {
          body: { code }
        });

        if (exchangeError || !data.success) {
          throw new Error(data?.error || 'Failed to authenticate with Strava');
        }

        // Set the session manually
        if (data.session) {
          const { error: setError } = await supabase.auth.setSession({
            access_token: data.session.access_token,
            refresh_token: data.session.refresh_token,
          });
          
          if (setError) {
            console.error('Error setting session:', setError);
            throw new Error('Failed to set session');
          }

          // Check if initial sync is needed
          const { data: { user } } = await supabase.auth.getUser();
          if (user) {
            const { data: profile } = await supabase
              .from('profiles')
              .select('initial_sync_completed')
              .eq('id', user.id)
              .single();

            if (profile && !profile.initial_sync_completed) {
              setStatus('syncing');
              setMessage('Synchronisiere deine Runs...');
              
              // Trigger initial sync (fire-and-forget)
              supabase.functions.invoke('initial-sync').then(({ data: syncData, error: syncError }) => {
                if (syncError) {
                  console.error('Initial sync error:', syncError);
                } else {
                  console.log('Initial sync triggered:', syncData);
                }
              });
              
              toast.success('Mit Strava angemeldet! Deine Runs werden im Hintergrund synchronisiert.');
            } else {
              setStatus('success');
              setMessage('Erfolgreich angemeldet!');
              toast.success('Mit Strava angemeldet');
            }
          } else {
            setStatus('success');
            setMessage('Erfolgreich angemeldet!');
            toast.success('Mit Strava angemeldet');
          }
        }

        // Get return URL or default to home
        const returnUrl = sessionStorage.getItem('auth_return_url') || '/';
        sessionStorage.removeItem('auth_return_url');
        
        setTimeout(() => navigate(returnUrl), 2000);

      } catch (err) {
        console.error('Callback error:', err);
        setStatus('error');
        setMessage('Fehler beim Anmelden');
        toast.error('Fehler beim Anmelden mit Strava');
        setTimeout(() => navigate('/auth'), 3000);
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
          {status === 'syncing' && (
            <>
              <Loader2 className="h-12 w-12 animate-spin text-primary" />
              <h2 className="text-2xl font-bold">{message}</h2>
              <p className="text-muted-foreground">Dies geschieht im Hintergrund...</p>
              <Progress value={syncProgress} className="w-full h-2" />
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
