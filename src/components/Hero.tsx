import { Button } from "@/components/ui/button";
import { ArrowRight } from "lucide-react";
import heroImage from "@/assets/hero-runners.jpg";

export const Hero = () => {
  return (
    <section className="relative min-h-screen flex items-center justify-center overflow-hidden">
      {/* Background Image with Overlay */}
      <div className="absolute inset-0 z-0">
        <img 
          src={heroImage} 
          alt="Läufer bei Sonnenaufgang" 
          className="w-full h-full object-cover"
        />
        <div className="absolute inset-0 bg-gradient-to-b from-foreground/60 via-foreground/40 to-background/95" />
      </div>

      {/* Content */}
      <div className="container relative z-10 mx-auto px-4 py-20 text-center">
        <div className="animate-fade-in space-y-6 max-w-4xl mx-auto">
          <h1 className="text-5xl md:text-7xl lg:text-8xl font-bold text-background drop-shadow-lg">
            morningrun
          </h1>
          <p className="text-xl md:text-2xl lg:text-3xl text-background/95 font-medium max-w-2xl mx-auto drop-shadow">
            Starte deinen Tag mit Energie, Gemeinschaft und frischer Luft
          </p>
          <div className="flex flex-col sm:flex-row gap-4 justify-center pt-8">
            <Button 
              size="lg" 
              className="bg-primary hover:bg-primary/90 text-primary-foreground shadow-warm text-lg px-8 py-6"
            >
              Mach mit
              <ArrowRight className="ml-2 h-5 w-5" />
            </Button>
            <Button 
              size="lg" 
              variant="outline" 
              className="border-2 border-background text-background hover:bg-background hover:text-foreground text-lg px-8 py-6 backdrop-blur-sm"
            >
              Mehr erfahren
            </Button>
          </div>
        </div>
      </div>

      {/* Scroll Indicator */}
      <div className="absolute bottom-8 left-1/2 -translate-x-1/2 z-10 animate-bounce">
        <div className="w-6 h-10 border-2 border-background rounded-full flex justify-center pt-2">
          <div className="w-1 h-3 bg-background rounded-full" />
        </div>
      </div>
    </section>
  );
};
