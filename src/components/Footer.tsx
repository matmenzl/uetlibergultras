import { Mountain, Settings, Map, ExternalLink } from "lucide-react";
import { Link } from "react-router-dom";
import { useUserRole } from "@/hooks/useUserRole";
import poweredByStrava from "@/assets/api_logo_pwrdBy_strava_horiz_white.svg";

export const Footer = () => {
  const { isAdmin } = useUserRole();

  return (
    <footer className="relative bg-background border-t border-border/40">
      {/* Subtle gradient overlay */}
      <div className="absolute inset-0 bg-gradient-to-t from-muted/30 to-transparent pointer-events-none" />
      
      <div className="container relative mx-auto px-4 py-16">
        <div className="grid md:grid-cols-3 gap-12 items-start">
          {/* Brand */}
          <div className="space-y-4">
            <div className="flex items-center gap-2.5">
              <div className="p-2 rounded-lg bg-primary/10 border border-primary/20">
                <Mountain className="h-5 w-5 text-primary" />
              </div>
              <h3 className="text-xl font-semibold tracking-tight text-foreground">
                Uetliberg Ultras
              </h3>
            </div>
            <p className="text-muted-foreground text-sm leading-relaxed max-w-xs">
              Dein Uetli. Deine Runs. 🏔️
              <br />
              <span className="text-muted-foreground/60">Die Community für Uetliberg-Läufer.</span>
            </p>
            <a 
              href="https://www.strava.com" 
              target="_blank" 
              rel="noopener noreferrer"
              className="inline-flex items-center gap-1.5 opacity-60 hover:opacity-100 transition-opacity duration-300"
            >
              <img 
                src={poweredByStrava} 
                alt="Powered by Strava" 
                className="h-4"
              />
            </a>
          </div>
          
          {/* Links */}
          <div className="space-y-4">
            <h4 className="text-xs font-medium uppercase tracking-wider text-muted-foreground/60">
              Rechtliches
            </h4>
            <nav className="flex flex-col gap-2.5">
              <Link 
                to="/privacy" 
                className="text-sm text-muted-foreground hover:text-foreground transition-colors duration-200 w-fit"
              >
                Datenschutz
              </Link>
              <Link 
                to="/terms" 
                className="text-sm text-muted-foreground hover:text-foreground transition-colors duration-200 w-fit"
              >
                AGB
              </Link>
              <Link 
                to="/support" 
                className="text-sm text-muted-foreground hover:text-foreground transition-colors duration-200 w-fit"
              >
                Support
              </Link>
            </nav>
          </div>

          {/* Credits + Admin */}
          <div className="space-y-4 md:text-right">
            <h4 className="text-xs font-medium uppercase tracking-wider text-muted-foreground/60">
              About
            </h4>
            <div className="space-y-1.5">
              <p className="text-sm text-muted-foreground">
                © 2024{" "}
                <a 
                  href="https://kollektivauthentisch.ch" 
                  target="_blank" 
                  rel="noopener noreferrer"
                  className="hover:text-foreground transition-colors duration-200 inline-flex items-center gap-1"
                >
                  kollektivauthentisch.ch
                  <ExternalLink className="h-3 w-3" />
                </a>
              </p>
              <p className="text-sm text-muted-foreground/60">
                Made with 💪 in Zürich
              </p>
            </div>
            
            {isAdmin && (
              <div className="flex md:justify-end gap-3 pt-4 border-t border-border/30 mt-4">
                <Link 
                  to="/segments" 
                  className="text-xs px-3 py-1.5 rounded-md bg-muted/50 text-muted-foreground hover:bg-muted hover:text-foreground transition-all duration-200 flex items-center gap-1.5"
                >
                  <Map className="h-3.5 w-3.5" />
                  Segments
                </Link>
                <Link 
                  to="/admin" 
                  className="text-xs px-3 py-1.5 rounded-md bg-muted/50 text-muted-foreground hover:bg-muted hover:text-foreground transition-all duration-200 flex items-center gap-1.5"
                >
                  <Settings className="h-3.5 w-3.5" />
                  Admin
                </Link>
              </div>
            )}
          </div>
        </div>
        
        {/* Bottom bar */}
        <div className="mt-12 pt-6 border-t border-border/20">
          <p className="text-center text-xs text-muted-foreground/40">
            Uetliberg Ultras — Run the mountain. Join the crew.
          </p>
        </div>
      </div>
    </footer>
  );
};
