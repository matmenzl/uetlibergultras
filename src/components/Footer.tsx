import { Instagram, Facebook, Mail, Mountain } from "lucide-react";

export const Footer = () => {
  return (
    <footer className="bg-foreground text-background py-12">
      <div className="container mx-auto px-4">
        <div className="grid md:grid-cols-3 gap-8 items-center">
          <div>
            <div className="flex items-center gap-2 mb-2">
              <Mountain className="h-6 w-6" />
              <h3 className="text-2xl font-bold">Uetliberg Ultras</h3>
            </div>
            <p className="text-background/80 text-sm">
              Dein Uetli. Deine Runs. 🏔️
            </p>
          </div>
          
          <div className="text-center">
            <p className="text-sm text-background/80 mb-2">Folge uns</p>
            <div className="flex justify-center gap-4">
              <a 
                href="#" 
                className="hover:text-primary transition-colors hover:scale-110 transform"
                aria-label="Instagram"
              >
                <Instagram className="h-6 w-6" />
              </a>
              <a 
                href="#" 
                className="hover:text-primary transition-colors hover:scale-110 transform"
                aria-label="Facebook"
              >
                <Facebook className="h-6 w-6" />
              </a>
              <a 
                href="mailto:info@morningrun.ch" 
                className="hover:text-primary transition-colors hover:scale-110 transform"
                aria-label="Email"
              >
                <Mail className="h-6 w-6" />
              </a>
            </div>
          </div>
          
          <div className="text-center md:text-right">
            <p className="text-sm text-background/60">
              © 2024 kollektivauthentisch.ch
            </p>
            <p className="text-sm text-background/60">
              Made with 💪 in Zürich
            </p>
          </div>
        </div>
      </div>
    </footer>
  );
};