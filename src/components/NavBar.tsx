import { useNavigate } from 'react-router-dom';
import { supabase } from '@/integrations/supabase/client';
import { Button } from '@/components/ui/button';
import { Shield, Menu } from 'lucide-react';
import uetlibergLogo from '@/assets/uetliberg-logo.png';
import { useUserRole } from '@/hooks/useUserRole';
import {
  Sheet,
  SheetContent,
  SheetTrigger,
} from '@/components/ui/sheet';

export default function NavBar() {
  const navigate = useNavigate();
  const { user, isAdmin } = useUserRole();

  const handleSignOut = async () => {
    await supabase.auth.signOut();
    navigate('/auth');
  };

  const NavItems = ({ onNavigate }: { onNavigate?: () => void }) => (
    <>
      <Button 
        variant="ghost" 
        onClick={() => { navigate('/segments'); onNavigate?.(); }} 
        className="hover:scale-105 transition-transform w-full md:w-auto justify-start md:justify-center"
      >
        Segmente
      </Button>
      <Button 
        variant="ghost" 
        onClick={() => { navigate('/support'); onNavigate?.(); }} 
        className="hover:scale-105 transition-transform w-full md:w-auto justify-start md:justify-center"
      >
        Support
      </Button>
      {isAdmin && (
        <Button 
          variant="ghost" 
          onClick={() => { navigate('/admin'); onNavigate?.(); }}
          className="w-full md:w-auto justify-start md:justify-center"
        >
          <Shield className="h-4 w-4 mr-2" />
          Admin
        </Button>
      )}
      {user ? (
        <Button 
          variant="outline" 
          onClick={() => { handleSignOut(); onNavigate?.(); }}
          className="w-full md:w-auto"
        >
          Abmelden
        </Button>
      ) : (
        <Button 
          onClick={() => { navigate('/auth'); onNavigate?.(); }}
          className="w-full md:w-auto"
        >
          Los geht's! 🏃
        </Button>
      )}
    </>
  );

  return (
    <nav className="border-b bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60">
      <div className="container mx-auto px-4 py-4 flex items-center justify-between">
        <div 
          className="flex items-center gap-2 cursor-pointer group"
          onClick={() => navigate('/')}
        >
          <img src={uetlibergLogo} alt="Uetliberg Ultras" className="h-8 w-auto group-hover:scale-110 transition-transform" />
          <span className="text-xl font-bold">Uetliberg Ultras</span>
        </div>

        {/* Desktop Navigation */}
        <div className="hidden md:flex items-center gap-4">
          <NavItems />
        </div>

        {/* Mobile Navigation */}
        <Sheet>
          <SheetTrigger asChild className="md:hidden">
            <Button variant="ghost" size="icon">
              <Menu className="h-6 w-6" />
            </Button>
          </SheetTrigger>
          <SheetContent side="right" className="w-[280px]">
            <div className="flex flex-col gap-4 mt-8">
              <NavItems />
            </div>
          </SheetContent>
        </Sheet>
      </div>
    </nav>
  );
}