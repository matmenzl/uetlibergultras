import { useState, useEffect } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { supabase } from '@/integrations/supabase/client';
import { Button } from '@/components/ui/button';
import { Avatar, AvatarImage, AvatarFallback } from '@/components/ui/avatar';
import { Shield, Menu, User } from 'lucide-react';
import { useUserRole } from '@/hooks/useUserRole';
import { Sheet, SheetContent, SheetTrigger } from '@/components/ui/sheet';
import { cn } from '@/lib/utils';
import logo from '@/assets/uu_logo.svg';
export default function NavBar() {
  const navigate = useNavigate();
  const location = useLocation();
  const {
    user,
    isAdmin
  } = useUserRole();
  const [isScrolled, setIsScrolled] = useState(false);
  const [profilePicture, setProfilePicture] = useState<string | null>(null);
  const [displayName, setDisplayName] = useState<string | null>(null);
  
  useEffect(() => {
    const handleScroll = () => {
      setIsScrolled(window.scrollY > 10);
    };
    window.addEventListener('scroll', handleScroll, {
      passive: true
    });
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

  // Fetch profile picture for logged in user
  useEffect(() => {
    const fetchProfile = async () => {
      if (!user) {
        setProfilePicture(null);
        setDisplayName(null);
        return;
      }
      
      const { data } = await supabase
        .from('profiles')
        .select('profile_picture, display_name, first_name')
        .eq('id', user.id)
        .single();
      
      if (data) {
        setProfilePicture(data.profile_picture);
        setDisplayName(data.display_name || data.first_name);
      }
    };
    
    fetchProfile();
  }, [user]);

  const handleSignOut = async () => {
    await supabase.auth.signOut();
    navigate('/auth');
  };
  const isActive = (path: string) => location.pathname === path;
  
  const getInitials = () => {
    if (displayName) return displayName.substring(0, 1).toUpperCase();
    return 'U';
  };
  const NavItems = ({
    onNavigate,
    inSheet = false
  }: {
    onNavigate?: () => void;
    inSheet?: boolean;
  }) => {
    // Text link style - clean and minimal like in the screenshot
    const getLinkClass = (path: string) => {
      const active = isActive(path);
      if (inSheet) {
        return cn("text-base font-medium transition-colors py-2", active ? "text-primary" : "text-foreground hover:text-primary");
      }
      return cn("text-sm font-medium transition-colors px-3 py-1.5 rounded-md", active ? "text-primary" : "text-muted-foreground hover:text-foreground");
    };
    return <>
        <button onClick={() => {
        navigate('/segments');
        onNavigate?.();
      }} className={getLinkClass('/segments')}>
          Segmente
        </button>
        <button onClick={() => {
        navigate('/support');
        onNavigate?.();
      }} className={getLinkClass('/support')}>
          Support
        </button>
        {isAdmin && <button onClick={() => {
        navigate('/admin');
        onNavigate?.();
      }} className={cn(getLinkClass('/admin'), "flex items-center gap-1.5")}>
            <Shield className="h-3.5 w-3.5" />
            Admin
          </button>}
        {user ? <>
          <button onClick={() => {
            navigate('/profile');
            onNavigate?.();
          }} className={cn(getLinkClass('/profile'), "flex items-center gap-1.5")}>
            <Avatar className="h-5 w-5">
              <AvatarImage src={profilePicture || undefined} alt="Profil" />
              <AvatarFallback className="text-xs bg-primary/10 text-primary">
                {getInitials()}
              </AvatarFallback>
            </Avatar>
            {inSheet && "Profil"}
          </button>
          <button onClick={() => {
            handleSignOut();
            onNavigate?.();
          }} className={cn("text-sm font-medium transition-colors px-3 py-1.5", inSheet ? "text-muted-foreground hover:text-destructive py-2" : "text-muted-foreground hover:text-destructive")}>
            Abmelden
          </button>
        </> : <Button size="sm" onClick={() => {
        navigate('/auth');
        onNavigate?.();
      }} className="ml-2 px-4">
            Anmelden
          </Button>}
      </>;
  };
  return <nav className={cn("sticky top-0 z-50 transition-all duration-300", isScrolled ? "bg-background/80 backdrop-blur-lg border-b border-border/50 shadow-sm" : "bg-transparent border-b border-transparent")}>
      <div className="container mx-auto px-4 py-3 flex items-center justify-between">
        <div className="flex items-center gap-2 cursor-pointer group" onClick={() => navigate('/')}>
          <img src={logo} alt="Uetliberg Ultras" className="h-20 w-auto -my-6 group-hover:scale-105 transition-transform" />
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
    </nav>;
}