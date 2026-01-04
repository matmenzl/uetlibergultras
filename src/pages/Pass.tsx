import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { supabase } from '@/integrations/supabase/client';
import { User } from '@supabase/supabase-js';
import NavBar from '@/components/NavBar';
import { Footer } from '@/components/Footer';
import { UetlibergPass } from '@/components/pass/UetlibergPass';
import { Button } from '@/components/ui/button';
import { ArrowLeft } from 'lucide-react';

export default function Pass() {
  const navigate = useNavigate();
  const [user, setUser] = useState<User | null>(null);
  const [displayName, setDisplayName] = useState<string | undefined>();

  useEffect(() => {
    const initSession = async () => {
      const { data: { session } } = await supabase.auth.getSession();
      if (session?.user) {
        setUser(session.user);
        // Fetch display name
        const { data: profile } = await supabase
          .from('profiles')
          .select('display_name, first_name')
          .eq('id', session.user.id)
          .single();
        if (profile) {
          setDisplayName(profile.display_name || profile.first_name || undefined);
        }
      } else {
        navigate('/auth');
      }
    };
    
    initSession();
    
    const { data: { subscription } } = supabase.auth.onAuthStateChange((_event, session) => {
      if (!session) {
        navigate('/auth');
      } else {
        setUser(session.user);
      }
    });
    
    return () => subscription.unsubscribe();
  }, [navigate]);

  if (!user) return null;

  return (
    <div className="min-h-screen flex flex-col bg-background">
      <NavBar />
      
      <main className="flex-1 container mx-auto px-4 py-8">
        <div className="max-w-2xl mx-auto">
          {/* Back button */}
          <Button
            variant="ghost"
            className="mb-4"
            onClick={() => navigate('/')}
          >
            <ArrowLeft className="w-4 h-4 mr-2" />
            Zurück
          </Button>

          {/* Full Pass */}
          <UetlibergPass 
            userId={user.id} 
            displayName={displayName}
          />
        </div>
      </main>

      <Footer />
    </div>
  );
}
