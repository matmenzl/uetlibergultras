import { useNavigate } from 'react-router-dom';
import { supabase } from '@/integrations/supabase/client';
import { Button } from '@/components/ui/button';
import { Award, Mountain, Shield } from 'lucide-react';
import { useUserRole } from '@/hooks/useUserRole';

export default function NavBar() {
  const navigate = useNavigate();
  const { user, isAdmin } = useUserRole();

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
          <Button variant="ghost" onClick={() => navigate('/segments')}>
            <Mountain className="h-4 w-4 mr-2" />
            Segmente
          </Button>
          {isAdmin && (
            <Button variant="ghost" onClick={() => navigate('/admin')}>
              <Shield className="h-4 w-4 mr-2" />
              Admin
            </Button>
          )}
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
