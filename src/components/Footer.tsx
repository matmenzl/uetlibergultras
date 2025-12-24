import { Mountain, Settings, Map } from "lucide-react";
import { Link } from "react-router-dom";
import { useUserRole } from "@/hooks/useUserRole";

export const Footer = () => {
  const { isAdmin } = useUserRole();

  return (
    <footer className="bg-foreground text-background py-12">
      <div className="container mx-auto px-4">
        <div className="grid md:grid-cols-2 gap-8 items-center">
          <div>
            <div className="flex items-center gap-2 mb-2">
              <Mountain className="h-6 w-6" />
              <h3 className="text-2xl font-bold">Uetliberg Ultras</h3>
            </div>
            <p className="text-background/80 text-sm">
              Dein Uetli. Deine Runs. 🏔️
            </p>
          </div>
          
          
          <div className="text-center md:text-right">
            <div className="flex justify-center md:justify-end gap-4 mb-2">
              <Link 
                to="/privacy" 
                className="text-sm text-background/60 hover:text-primary transition-colors"
              >
                Datenschutz
              </Link>
              <Link 
                to="/terms" 
                className="text-sm text-background/60 hover:text-primary transition-colors"
              >
                AGB
              </Link>
              <Link 
                to="/support" 
                className="text-sm text-background/60 hover:text-primary transition-colors"
              >
                Support
              </Link>
            </div>
            <p className="text-sm text-background/60">
              © 2024 kollektivauthentisch.ch
            </p>
            <p className="text-sm text-background/60">
              Made with 💪 in Zürich
            </p>
            {isAdmin && (
              <div className="flex justify-center md:justify-end gap-4 mt-3">
                <Link 
                  to="/segments" 
                  className="text-sm text-background/60 hover:text-primary transition-colors flex items-center gap-1"
                >
                  <Map className="h-4 w-4" />
                  Segments
                </Link>
                <Link 
                  to="/admin" 
                  className="text-sm text-background/60 hover:text-primary transition-colors flex items-center gap-1"
                >
                  <Settings className="h-4 w-4" />
                  Admin
                </Link>
              </div>
            )}
          </div>
        </div>
      </div>
    </footer>
  );
};