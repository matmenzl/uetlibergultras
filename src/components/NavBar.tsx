import { useState, useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { supabase } from '@/integrations/supabase/client';
import { Button } from '@/components/ui/button';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { User, LogOut, Award, Mountain, RefreshCw, Trophy, Map } from 'lucide-react';
import { User as SupabaseUser, Session } from '@supabase/supabase-js';
import { toast } from 'sonner';

export const NavBar = () => {
  const navigate = useNavigate();
  const [user, setUser] = useState<SupabaseUser | null>(null);
  const [session, setSession] = useState<Session | null>(null);
  const [profile, setProfile] = useState<any>(null);
  const [isSyncing, setIsSyncing] = useState(false);

  useEffect(() => {
    // Set up auth state listener
    const { data: { subscription } } = supabase.auth.onAuthStateChange((event, session) => {
      setSession(session);
      setUser(session?.user ?? null);
      
      // Fetch profile after auth change
      if (session?.user) {
        setTimeout(() => {
          fetchProfile(session.user.id);
        }, 0);
      } else {
        setProfile(null);
      }
    });

    // Check for existing session
    supabase.auth.getSession().then(({ data: { session } }) => {
      setSession(session);
      setUser(session?.user ?? null);
      
      if (session?.user) {
        fetchProfile(session.user.id);
      }
    });

    return () => subscription.unsubscribe();
  }, []);

  const fetchProfile = async (userId: string) => {
    const { data, error } = await supabase
      .from('profiles')
      .select('*')
      .eq('id', userId)
      .single();

    if (!error && data) {
      setProfile(data);
    }
  };

  const handleSignOut = async () => {
    const { error } = await supabase.auth.signOut();
    if (error) {
      toast.error('Fehler beim Abmelden');
    } else {
      toast.success('Erfolgreich abgemeldet');
      navigate('/');
    }
  };

  const syncStrava = async () => {
    if (!user || isSyncing) return;
    
    setIsSyncing(true);
    toast.info('Synchronisiere Strava-Daten...', {
      description: 'Dies kann einige Sekunden dauern',
    });
    
    try {
      const { data, error } = await supabase.functions.invoke('sync-segment-efforts');
      
      if (error) {
        console.error('Sync error:', error);
        toast.error('Fehler beim Synchronisieren', {
          description: 'Bitte versuche es später erneut',
        });
      } else {
        const effortsCount = data?.effortsCount || 0;
        toast.success('Strava-Daten synchronisiert!', {
          description: `${effortsCount} Segment-Efforts geladen`,
        });
        
        // Refresh Leaderboard nach Sync
        window.dispatchEvent(new CustomEvent('refetch-leaderboard'));
      }
    } catch (err) {
      console.error('Sync error:', err);
      toast.error('Fehler beim Synchronisieren');
    } finally {
      setIsSyncing(false);
    }
  };

  return (
    <nav className="border-b bg-card">
      <div className="container mx-auto px-4 py-3 flex items-center justify-between">
        <Link to="/" className="flex items-center gap-2">
          <Mountain className="h-6 w-6 text-primary" />
          <span className="text-xl font-bold">Uetliberg Ultras</span>
        </Link>

        <div className="flex items-center gap-6">
          {/* Navigation Links */}
          <div className="hidden md:flex items-center gap-2">
            <Button variant="ghost" asChild>
              <Link to="/" className="flex items-center gap-2">
                <Trophy className="h-4 w-4" />
                Community
              </Link>
            </Button>
            <Button variant="ghost" asChild>
              <Link to="/segments" className="flex items-center gap-2">
                <Map className="h-4 w-4" />
                Segmente
              </Link>
            </Button>
          </div>

          {/* User Menu */}
          <div className="flex items-center gap-4">
          {user ? (
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button variant="ghost" className="relative h-10 w-10 rounded-full">
                  <Avatar className="h-10 w-10">
                    <AvatarImage src={profile?.profile_picture} alt={profile?.first_name || 'User'} />
                    <AvatarFallback>
                      {profile?.first_name?.charAt(0) || user.email?.charAt(0).toUpperCase()}
                    </AvatarFallback>
                  </Avatar>
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end" className="w-56">
                <DropdownMenuLabel>
                  <div className="flex flex-col space-y-1">
                    <p className="text-sm font-medium leading-none">
                      {profile?.first_name} {profile?.last_name}
                    </p>
                    <p className="text-xs leading-none text-muted-foreground">
                      {user.email}
                    </p>
                  </div>
                </DropdownMenuLabel>
                <DropdownMenuSeparator />
                {profile?.strava_id && (
                  <DropdownMenuItem onClick={syncStrava} disabled={isSyncing}>
                    <RefreshCw className={`mr-2 h-4 w-4 ${isSyncing ? 'animate-spin' : ''}`} />
                    {isSyncing ? 'Synchronisiere...' : 'Strava synchronisieren'}
                  </DropdownMenuItem>
                )}
                <DropdownMenuSeparator />
                <DropdownMenuItem onClick={handleSignOut}>
                  <LogOut className="mr-2 h-4 w-4" />
                  Abmelden
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
          ) : (
            <div className="flex items-center gap-2">
              <Button variant="ghost" asChild>
                <Link to="/auth">Anmelden</Link>
              </Button>
              <Button asChild>
                <Link to="/auth">Registrieren</Link>
              </Button>
            </div>
          )}
          </div>
        </div>
      </div>
    </nav>
  );
};
