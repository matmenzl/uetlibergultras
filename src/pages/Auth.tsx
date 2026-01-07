import { useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { supabase } from '@/integrations/supabase/client';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Award } from 'lucide-react';
import stravaConnectButton from '@/assets/btn_strava_connect_with_orange.svg';

export default function Auth() {
  const navigate = useNavigate();

  useEffect(() => {
    // Check if already logged in
    supabase.auth.getSession().then(({ data: { session } }) => {
      if (session) {
        navigate('/');
      }
    });

    // Listen for auth changes
    const { data: { subscription } } = supabase.auth.onAuthStateChange((event, session) => {
      if (session) {
        navigate('/');
      }
    });

    return () => subscription.unsubscribe();
  }, [navigate]);

  const handleStravaLogin = () => {
    const clientId = import.meta.env.VITE_STRAVA_CLIENT_ID || '186560';
    const redirectUri = `${window.location.origin}/auth/strava-callback`;
    const scope = 'read,read_all,profile:read_all,activity:read_all';
    
    // Store return URL for after auth
    sessionStorage.setItem('auth_return_url', '/');
    
    window.location.href = `https://www.strava.com/oauth/authorize?client_id=${clientId}&redirect_uri=${redirectUri}&response_type=code&approval_prompt=force&scope=${scope}`;
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-primary/10 to-background p-4">
      <Card className="w-full max-w-md p-8">
        <div className="text-center mb-8">
          <div className="flex justify-center mb-4">
            <Award className="h-16 w-16 text-primary" />
          </div>
          <h1 className="text-3xl font-bold mb-2">Uetliberg Läufe</h1>
          <p className="text-muted-foreground">
            Tracke deine persönlichen Rekorde und vergleiche deine Zeiten
          </p>
        </div>

        <div className="space-y-4">
          <button 
            onClick={handleStravaLogin}
            className="w-full flex justify-center hover:opacity-90 transition-opacity"
          >
            <img 
              src={stravaConnectButton} 
              alt="Connect with Strava" 
              className="h-12 pointer-events-none select-none"
            />
          </button>

          <div className="text-center text-sm text-muted-foreground">
            <p>
              Melde dich mit deinem Strava-Account an,
              <br />
              um deine Segmente zu synchronisieren
            </p>
          </div>
        </div>

        <div className="mt-8 text-center">
          <Button
            variant="link"
            onClick={() => navigate('/')}
            className="text-sm"
          >
            Zurück zur Startseite
          </Button>
        </div>
      </Card>
    </div>
  );
}
