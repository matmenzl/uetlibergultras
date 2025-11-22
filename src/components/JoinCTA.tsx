import { Button } from "@/components/ui/button";
import { Mail, MessageCircle } from "lucide-react";

export const JoinCTA = () => {
  return (
    <section className="py-24 bg-gradient-sunrise">
      <div className="container mx-auto px-4 text-center">
        <div className="max-w-3xl mx-auto space-y-8">
          <h2 className="text-4xl md:text-5xl font-bold text-primary-foreground">
            Bereit für deinen ersten Lauf?
          </h2>
          <p className="text-lg md:text-xl text-primary-foreground/90">
            Melde dich bei uns und werde Teil unserer Lauf-Community. 
            Keine Anmeldung nötig – komm einfach vorbei!
          </p>
          <div className="flex flex-col sm:flex-row gap-4 justify-center pt-4">
            <Button 
              size="lg"
              variant="secondary"
              className="text-lg px-8 py-6 shadow-lg hover:shadow-xl transition-shadow"
            >
              <Mail className="mr-2 h-5 w-5" />
              info@morningrun.ch
            </Button>
            <Button 
              size="lg"
              variant="outline"
              className="border-2 border-primary-foreground text-primary-foreground hover:bg-primary-foreground hover:text-primary text-lg px-8 py-6 backdrop-blur-sm"
            >
              <MessageCircle className="mr-2 h-5 w-5" />
              WhatsApp Gruppe
            </Button>
          </div>
          <p className="text-sm text-primary-foreground/80 pt-4">
            Fragen? Schreib uns einfach – wir freuen uns auf dich!
          </p>
        </div>
      </div>
    </section>
  );
};
