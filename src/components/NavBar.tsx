import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { supabase } from '@/integrations/supabase/client';
import { Button } from '@/components/ui/button';
import { Mountain, Shield, Menu } from 'lucide-react';
import { useUserRole } from '@/hooks/useUserRole';
import {
  Sheet,
  SheetContent,
  SheetTrigger,
} from '@/components/ui/sheet';
import { cn } from '@/lib/utils';

export default function NavBar() {
  const navigate = useNavigate();
  const { user, isAdmin } = useUserRole();
  const [isScrolled, setIsScrolled] = useState(false);

  useEffect(() => {
    const handleScroll = () => {
      setIsScrolled(window.scrollY > 10);
    };
    
    window.addEventListener('scroll', handleScroll, { passive: true });
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

  const handleSignOut = async () => {
    await supabase.auth.signOut();
    navigate('/auth');
  };

  const NavItems = ({ onNavigate }: { onNavigate?: () => void }) => (
    <>
      <Button 
        variant="ghost" 
        size="sm"
        onClick={() => { navigate('/segments'); onNavigate?.(); }} 
        className="text-white font-medium hover:text-white hover:bg-white/20 transition-colors w-full md:w-auto justify-start md:justify-center"
      >
        Segmente
      </Button>
      <Button 
        variant="ghost" 
        size="sm"
        onClick={() => { navigate('/support'); onNavigate?.(); }} 
        className="text-white font-medium hover:text-white hover:bg-white/20 transition-colors w-full md:w-auto justify-start md:justify-center"
      >
        Support
      </Button>
      {isAdmin && (
        <Button 
          variant="ghost" 
          size="sm"
          onClick={() => { navigate('/admin'); onNavigate?.(); }}
          className="text-white font-medium hover:text-white hover:bg-white/20 transition-colors w-full md:w-auto justify-start md:justify-center"
        >
          <Shield className="h-3.5 w-3.5 mr-1.5" />
          Admin
        </Button>
      )}
      {user ? (
        <Button 
          variant="ghost" 
          size="sm"
          onClick={() => { handleSignOut(); onNavigate?.(); }}
          className="text-white font-medium hover:text-white hover:bg-white/20 w-full md:w-auto"
        >
          Abmelden
        </Button>
      ) : (
        <Button 
          size="sm"
          onClick={() => { navigate('/auth'); onNavigate?.(); }}
          className="w-full md:w-auto"
        >
          Los geht's
        </Button>
      )}
    </>
  );

  return (
    <nav 
      className={cn(
        "sticky top-0 z-50 transition-all duration-300",
        isScrolled 
          ? "bg-background/80 backdrop-blur-lg border-b border-border/50 shadow-sm" 
          : "bg-transparent border-b border-transparent"
      )}
    >
      <div className="container mx-auto px-4 py-3 flex items-center justify-between">
        <div 
          className="flex items-center gap-2 cursor-pointer group"
          onClick={() => navigate('/')}
        >
          <Mountain className="h-5 w-5 text-primary group-hover:scale-110 transition-transform" />
          <span className="text-lg font-semibold tracking-tight">Uetliberg Ultras</span>
        </div>

        {/* Desktop Navigation */}
        <div className="hidden md:flex items-center gap-1">
          <NavItems />
        </div>

        {/* Mobile Navigation */}
        <Sheet>
          <SheetTrigger asChild className="md:hidden">
            <Button variant="ghost" size="icon" className="h-8 w-8">
              <Menu className="h-5 w-5" />
            </Button>
          </SheetTrigger>
          <SheetContent side="right" className="w-[280px]">
            <div className="flex flex-col gap-2 mt-8">
              <NavItems />
            </div>
          </SheetContent>
        </Sheet>
      </div>
    </nav>
  );
}