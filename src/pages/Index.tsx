import { Hero } from "@/components/Hero";
import { About } from "@/components/About";
import { Schedule } from "@/components/Schedule";
import { JoinCTA } from "@/components/JoinCTA";
import { Footer } from "@/components/Footer";

const Index = () => {
  return (
    <main className="min-h-screen">
      <Hero />
      <About />
      <Schedule />
      <JoinCTA />
      <Footer />
    </main>
  );
};

export default Index;
