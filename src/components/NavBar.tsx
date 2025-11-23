import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { supabase } from '@/integrations/supabase/client';
import { Button } from '@/components/ui/button';
import { Award } from 'lucide-react';
import { User } from '@supabase/supabase-js';

export default function NavBar() {
  const navigate = useNavigate();
  const [user, setUser] = useState<User | null>(null);

  useEffect(() => {
    supabase.auth.getSession().then(({ data: { session } }) => {
      setUser(session?.user ?? null);
    });

    const { data: { subscription } } = supabase.auth.onAuthStateChange((_event, session) => {
      setUser(session?.user ?? null);
    });

    return () => subscription.unsubscribe();
  }, []);

  const handleSignOut = async () => {
    await supabase.auth.signOut();
    navigate('/auth');
  };

  return (
    <nav className="border-b bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60">
      <div className="container mx-auto px-4 py-4 flex items-center justify-between">
        <div 
          className="flex items-center gap-2 cursor-pointer"
          onClick={() => navigate('/')}
        >
          <Award className="h-6 w-6 text-primary" />
          <span className="text-xl font-bold">Uetliberg Läufe</span>
        </div>

        <div className="flex items-center gap-4">
          {user ? (
            <Button variant="outline" onClick={handleSignOut}>
              Abmelden
            </Button>
          ) : (
            <Button onClick={() => navigate('/auth')}>
              Anmelden
            </Button>
          )}
        </div>
      </div>
    </nav>
  );
}
