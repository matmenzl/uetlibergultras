import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Capacitor } from '@capacitor/core';
import { Browser } from '@capacitor/browser';
import { supabase } from '@/integrations/supabase/client';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Label } from '@/components/ui/label';
import { Award, Mail, Loader2, CheckCircle, User } from 'lucide-react';
import stravaConnectButton from '@/assets/btn_strava_connect_with_orange.svg';
import { toast } from 'sonner';

export default function Auth() {
  const navigate = useNavigate();
  const [email, setEmail] = useState('');
  const [runnerName, setRunnerName] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [magicLinkSent, setMagicLinkSent] = useState(false);

  useEffect(() => {
    // Check if already logged in
    supabase.auth.getSession().then(({ data: { session } }) => {
      if (session) {
        navigate('/');
      }
    });

    // Listen for auth changes
    const { data: { subscription } } = supabase.auth.onAuthStateChange(async (event, session) => {
      if (session) {
        // Check if profile exists, if not create one
        const { data: existingProfile } = await supabase
          .from('profiles')
          .select('id')
          .eq('id', session.user.id)
          .single();

        if (!existingProfile) {
          // Get runner name from user metadata (stored during signup)
          const displayName = session.user.user_metadata?.runner_name || 
            session.user.email?.split('@')[0] || 'User';

          await supabase.from('profiles').insert({
            id: session.user.id,
            display_name: displayName,
            initial_sync_completed: true, // Manual users don't need sync
          });
        }

        navigate('/');
      }
    });

    return () => subscription.unsubscribe();
  }, [navigate]);

  const handleStravaLogin = async () => {
    const clientId = import.meta.env.VITE_STRAVA_CLIENT_ID || '186560';
    const appUrl = import.meta.env.VITE_APP_URL || window.location.origin;
    const redirectUri = `${appUrl}/auth/strava-callback`;
    const scope = 'read,read_all,profile:read_all,activity:read_all';
    const isNative = Capacitor.isNativePlatform();
    const state = isNative ? 'native' : 'web';

    const stravaUrl = `https://www.strava.com/oauth/authorize?client_id=${clientId}&redirect_uri=${encodeURIComponent(redirectUri)}&response_type=code&approval_prompt=force&scope=${scope}&state=${state}`;

    if (isNative) {
      await Browser.open({ url: stravaUrl });
    } else {
      sessionStorage.setItem('auth_return_url', '/');
      window.location.href = stravaUrl;
    }
  };

  const handleMagicLink = async () => {
    if (!runnerName.trim()) {
      toast.error('Bitte gib einen Läufernamen ein');
      return;
    }
    if (!email || !email.includes('@')) {
      toast.error('Bitte gib eine gültige E-Mail-Adresse ein');
      return;
    }

    setIsLoading(true);
    try {
      const { error } = await supabase.auth.signInWithOtp({
        email,
        options: {
          emailRedirectTo: window.location.origin,
          data: {
            runner_name: runnerName.trim(),
          },
        },
      });

      if (error) throw error;

      setMagicLinkSent(true);
      toast.success('Magic Link gesendet! Schau in dein E-Mail-Postfach.');
    } catch (error) {
      console.error('Magic link error:', error);
      toast.error('Fehler beim Senden des Magic Links');
    } finally {
      setIsLoading(false);
    }
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

        <Tabs defaultValue="strava" className="w-full">
          <TabsList className="grid w-full grid-cols-2 mb-6">
            <TabsTrigger value="strava">Mit Strava</TabsTrigger>
            <TabsTrigger value="alternativliga">Alternativliga</TabsTrigger>
          </TabsList>

          <TabsContent value="strava" className="space-y-4">
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
                um deine Segmente automatisch zu synchronisieren
              </p>
            </div>
          </TabsContent>

          <TabsContent value="alternativliga" className="space-y-4">
            {magicLinkSent ? (
              <div className="text-center py-6">
                <CheckCircle className="h-12 w-12 text-green-500 mx-auto mb-4" />
                <p className="font-medium mb-2">E-Mail gesendet!</p>
                <p className="text-sm text-muted-foreground">
                  Klicke auf den Link in deiner E-Mail, um dich anzumelden.
                </p>
              </div>
            ) : (
              <>
                <div className="text-center text-sm text-muted-foreground mb-4">
                  <p>
                    Kein GPS? Kein Problem!
                    <br />
                    Erfasse deine Runs manuell.
                  </p>
                </div>

                <div className="space-y-3">
                  <div className="space-y-1.5">
                    <Label htmlFor="runnerName">Läufername *</Label>
                    <div className="relative">
                      <User className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                      <Input
                        id="runnerName"
                        type="text"
                        placeholder="Dein Läufername"
                        value={runnerName}
                        onChange={(e) => setRunnerName(e.target.value)}
                        className="pl-10"
                        maxLength={50}
                      />
                    </div>
                  </div>

                  <div className="space-y-1.5">
                    <Label htmlFor="email">E-Mail *</Label>
                    <div className="relative">
                      <Mail className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                      <Input
                        id="email"
                        type="email"
                        placeholder="deine@email.ch"
                        value={email}
                        onChange={(e) => setEmail(e.target.value)}
                        onKeyDown={(e) => e.key === 'Enter' && handleMagicLink()}
                        className="pl-10"
                      />
                    </div>
                  </div>

                  <Button
                    onClick={handleMagicLink}
                    disabled={isLoading || !runnerName.trim() || !email}
                    className="w-full gap-2"
                  >
                    {isLoading ? (
                      <Loader2 className="h-4 w-4 animate-spin" />
                    ) : (
                      <Mail className="h-4 w-4" />
                    )}
                    Magic Link senden
                  </Button>
                </div>

                <p className="text-xs text-center text-muted-foreground mt-4">
                  Du erhältst einen Link per E-Mail, um dich ohne Passwort anzumelden.
                </p>
              </>
            )}
          </TabsContent>
        </Tabs>

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
