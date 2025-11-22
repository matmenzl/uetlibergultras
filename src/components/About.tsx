import { Users, Heart, Sunrise } from "lucide-react";
import { Card, CardContent } from "@/components/ui/card";

export const About = () => {
  const features = [
    {
      icon: Sunrise,
      title: "Früh am Morgen",
      description: "Wir starten gemeinsam in den Tag, wenn die Stadt noch schläft und die Luft am frischesten ist.",
    },
    {
      icon: Users,
      title: "Starke Community",
      description: "Egal ob Anfänger oder Marathon-Profi – bei uns findet jeder seinen Platz und neue Laufpartner.",
    },
    {
      icon: Heart,
      title: "Gesund & Fit",
      description: "Regelmässiges Morgenlaufen stärkt Körper und Geist und gibt dir Energie für den ganzen Tag.",
    },
  ];

  return (
    <section className="py-24 bg-background">
      <div className="container mx-auto px-4">
        <div className="text-center mb-16 space-y-4">
          <h2 className="text-4xl md:text-5xl font-bold bg-gradient-sunrise bg-clip-text text-transparent">
            Über morningrun
          </h2>
          <p className="text-lg md:text-xl text-muted-foreground max-w-2xl mx-auto">
            Wir sind eine Laufgruppe, die sich regelmässig trifft, um gemeinsam die schönsten Morgenstunden zu geniessen.
          </p>
        </div>

        <div className="grid md:grid-cols-3 gap-8 max-w-6xl mx-auto">
          {features.map((feature, index) => (
            <Card 
              key={index} 
              className="border-2 hover:border-primary transition-all duration-300 hover:shadow-warm"
            >
              <CardContent className="pt-6 text-center space-y-4">
                <div className="w-16 h-16 mx-auto bg-gradient-sunrise rounded-full flex items-center justify-center shadow-glow">
                  <feature.icon className="h-8 w-8 text-primary-foreground" />
                </div>
                <h3 className="text-xl font-bold">{feature.title}</h3>
                <p className="text-muted-foreground">{feature.description}</p>
              </CardContent>
            </Card>
          ))}
        </div>
      </div>
    </section>
  );
};
