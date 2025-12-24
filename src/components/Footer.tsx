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
            <p className="text-background/80 text-sm mb-4">
              Dein Uetli. Deine Runs. 🏔️
            </p>
            <a 
              href="https://www.strava.com" 
              target="_blank" 
              rel="noopener noreferrer"
              className="inline-flex items-center gap-2 text-background/60 hover:text-[#FC5200] transition-colors"
            >
              <span className="text-xs">Powered by</span>
              <svg width="60" height="12" viewBox="0 0 60 12" fill="currentColor" xmlns="http://www.w3.org/2000/svg">
                <path d="M10.6 5.53L8.03 10.7h2.65l1.42-2.86L13.51 10.7h2.65l-2.57-5.17L10.6 0 7.61 5.53h2.99zm5.27-5.53l-2.86 5.53 2.86 5.53 2.86-5.53L15.87 0zM6.74 7.87L4.11 2.7H1.46L0 5.53 1.46 8.4h2.65l2.63 5.2L9.6 8.4H6.74v-.53zm39.13-2.34c-.97 0-1.6.34-2.06.82V5.7h-1.54v8.4h1.54v-4.6c0-1.2.67-1.74 1.6-1.74.82 0 1.4.47 1.4 1.5v4.84h1.54V9c0-1.94-1.13-3.47-2.48-3.47zm-8.8 0c-2.14 0-3.74 1.53-3.74 4.37 0 2.84 1.6 4.37 3.74 4.37.97 0 1.87-.4 2.5-1.14l-.94-.93c-.47.47-.94.73-1.56.73-1.2 0-2-.8-2.13-2.03h4.87v-.67c0-2.9-1.47-4.7-3.74-4.7zm-2.2 3.6c.14-1.24.87-2.27 2.2-2.27 1.34 0 2.07 1.03 2.14 2.27h-4.34zm-4.6-3.6c-.6 0-1.2.27-1.6.67v-.5h-1.54v8.4h1.54v-4.6c0-1.27.6-1.74 1.27-1.74.33 0 .67.07.87.2l.4-1.4c-.27-.13-.6-.2-.94-.2zm-6.2 0c-2.07 0-3.4 1.53-3.4 4.37s1.33 4.37 3.4 4.37c2.06 0 3.4-1.53 3.4-4.37s-1.34-4.37-3.4-4.37zm0 7.4c-1.2 0-1.87-1-1.87-3.03s.67-3.04 1.87-3.04 1.87 1 1.87 3.04-.67 3.03-1.87 3.03zm-6.67-7.23v.83c-.53-.67-1.26-1-2.13-1-1.8 0-3.27 1.6-3.27 4.37 0 2.77 1.47 4.37 3.27 4.37.87 0 1.6-.33 2.13-1v.83h1.54V5.7h-1.54zm-1.8 6.24c-1.2 0-1.93-1-1.93-3.04s.73-3.03 1.93-3.03c1.2 0 1.93 1 1.93 3.03 0 2.04-.73 3.04-1.93 3.04z"/>
              </svg>
            </a>
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