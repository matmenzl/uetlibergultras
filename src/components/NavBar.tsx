import { useState, useEffect } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { supabase } from '@/integrations/supabase/client';
import { Button } from '@/components/ui/button';
import { Mountain, Shield, Menu, Map, HeartHandshake, LogOut } from 'lucide-react';
import { useUserRole } from '@/hooks/useUserRole';
import {
  Sheet,
  SheetContent,
  SheetTrigger,
} from '@/components/ui/sheet';
import { cn } from '@/lib/utils';

export default function NavBar() {
  const navigate = useNavigate();
  const location = useLocation();
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

  const isActive = (path: string) => location.pathname === path;

  const NavItems = ({ onNavigate, inSheet = false }: { onNavigate?: () => void; inSheet?: boolean }) => {
    // Base styles for all states
    const baseClass = "font-medium transition-all duration-200 gap-2";
    
    // In sheet (mobile menu) or when scrolled, use foreground colors
    // When not scrolled (over hero image), use white with text shadow
    const getButtonClass = (path: string) => {
      const active = isActive(path);
      
      if (inSheet) {
        return cn(
          baseClass,
          "w-full justify-start text-foreground hover:bg-accent",
          active && "bg-accent text-primary"
        );
      }
      
      if (isScrolled) {
        return cn(
          baseClass,
          "text-foreground hover:bg-accent hover:text-primary",
          active && "bg-accent/50 text-primary"
        );
      }
      
      // Over hero image - white text with shadow
      return cn(
        baseClass,
        "text-white hover:bg-white/20 [text-shadow:_0_1px_4px_rgba(0,0,0,0.6)]",
        active && "bg-white/20"
      );
    };
    
    return (
      <>
        <Button 
          variant="ghost" 
          size="sm"
          onClick={() => { navigate('/segments'); onNavigate?.(); }} 
          className={cn(getButtonClass('/segments'), "w-full md:w-auto justify-start md:justify-center")}
        >
          <Map className="h-4 w-4" />
          Segmente
        </Button>
        <Button 
          variant="ghost" 
          size="sm"
          onClick={() => { navigate('/support'); onNavigate?.(); }} 
          className={cn(getButtonClass('/support'), "w-full md:w-auto justify-start md:justify-center")}
        >
          <HeartHandshake className="h-4 w-4" />
          Support
        </Button>
        {isAdmin && (
          <Button 
            variant="ghost" 
            size="sm"
            onClick={() => { navigate('/admin'); onNavigate?.(); }}
            className={cn(getButtonClass('/admin'), "w-full md:w-auto justify-start md:justify-center")}
          >
            <Shield className="h-4 w-4" />
            Admin
          </Button>
        )}
        {user ? (
          <Button 
            variant="ghost" 
            size="sm"
            onClick={() => { handleSignOut(); onNavigate?.(); }}
            className={cn(
              baseClass,
              inSheet 
                ? "w-full justify-start text-muted-foreground hover:text-destructive hover:bg-destructive/10" 
                : isScrolled
                  ? "text-muted-foreground hover:text-destructive hover:bg-destructive/10"
                  : "text-white/80 hover:text-white hover:bg-white/20 [text-shadow:_0_1px_4px_rgba(0,0,0,0.6)]",
              "w-full md:w-auto"
            )}
          >
            <LogOut className="h-4 w-4" />
            Abmelden
          </Button>
        ) : (
          <Button 
            size="sm"
            onClick={() => { navigate('/auth'); onNavigate?.(); }}
            className="w-full md:w-auto shadow-md shadow-primary/25 hover:shadow-lg hover:shadow-primary/30 transition-shadow"
          >
            Los geht's
          </Button>
        )}
      </>
    );
  };

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
              <NavItems inSheet={true} />
            </div>
          </SheetContent>
        </Sheet>
      </div>
    </nav>
  );
}