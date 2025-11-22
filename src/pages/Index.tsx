import { NavBar } from "@/components/NavBar";
import { ActivityLeaderboard } from "@/components/leaderboards/ActivityLeaderboard";
import { Footer } from "@/components/Footer";
import { Button } from "@/components/ui/button";
import { Link } from "react-router-dom";
import { Mountain, TrendingUp, Users } from "lucide-react";

const Index = () => {

  return (
    <main className="min-h-screen flex flex-col">
      {/* Navigation Bar */}
      <NavBar />

      {/* Hero Section */}
      <section className="bg-gradient-to-r from-primary to-primary/80 py-16 px-4">
        <div className="container mx-auto text-center">
          <Mountain className="w-16 h-16 text-primary-foreground mx-auto mb-4" />
          <h1 className="text-4xl md:text-6xl font-bold text-primary-foreground mb-4">
            Uetliberg Running Community
          </h1>
          <p className="text-lg md:text-xl text-primary-foreground/90 mb-8 max-w-2xl mx-auto">
            Werde Teil der aktivsten Lauf-Community auf Zürichs Hausberg. Tracke deine Fortschritte, vergleiche dich mit anderen und sammle Achievements.
          </p>
          <div className="flex flex-wrap gap-4 justify-center">
            <Button asChild size="lg" variant="secondary">
              <Link to="/segments">
                <Mountain className="mr-2 h-5 w-5" />
                Segmente entdecken
              </Link>
            </Button>
            <Button asChild size="lg" variant="outline" className="bg-white/10 border-white/20 text-primary-foreground hover:bg-white/20">
              <Link to="/auth">
                <Users className="mr-2 h-5 w-5" />
                Jetzt beitreten
              </Link>
            </Button>
          </div>
        </div>
      </section>

      {/* Features Section */}
      <section className="py-12 px-4 bg-muted/30">
        <div className="container mx-auto">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-8 max-w-5xl mx-auto">
            <div className="text-center p-6">
              <TrendingUp className="w-12 h-12 text-primary mx-auto mb-4" />
              <h3 className="text-xl font-semibold mb-2">Progress Tracking</h3>
              <p className="text-muted-foreground">
                Verfolge deine Zeiten über Zeit und sieh deine Verbesserungen
              </p>
            </div>
            <div className="text-center p-6">
              <Users className="w-12 h-12 text-primary mx-auto mb-4" />
              <h3 className="text-xl font-semibold mb-2">Community Leaderboards</h3>
              <p className="text-muted-foreground">
                Vergleiche dich mit anderen Athletes und entdecke neue Motivation
              </p>
            </div>
            <div className="text-center p-6">
              <Mountain className="w-12 h-12 text-primary mx-auto mb-4" />
              <h3 className="text-xl font-semibold mb-2">25+ Segmente</h3>
              <p className="text-muted-foreground">
                Erkunde alle Running-Strecken auf dem Uetliberg
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* Community Leaderboards */}
      <ActivityLeaderboard />

      {/* Footer */}
      <Footer />
    </main>
  );
};

export default Index;
