import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { NavBar } from "@/components/NavBar";
import { SegmentMap } from "@/components/uetliberg/SegmentMap";
import { SegmentList } from "@/components/uetliberg/SegmentList";
import { SegmentDetail } from "@/components/uetliberg/SegmentDetail";
import { ActivityLeaderboard } from "@/components/leaderboards/ActivityLeaderboard";
import { Footer } from "@/components/Footer";
import { SegmentData } from "@/lib/mapUtils";

const Index = () => {
  const [selectedSegmentId, setSelectedSegmentId] = useState<number | null>(null);
  const [detailSegment, setDetailSegment] = useState<SegmentData | null>(null);
  const [detailOpen, setDetailOpen] = useState(false);

  const {
    data: segments = [],
    isLoading,
    error,
  } = useQuery({
    queryKey: ["uetliberg-segments"],
    queryFn: async () => {
      console.log("Fetching segments from edge function...");
      const { data, error } = await supabase.functions.invoke("strava-uetliberg-segments");

      if (error) {
        console.error("Error fetching segments:", error);
        throw error;
      }

      console.log("Segments fetched:", data?.segments?.length || 0);
      return data?.segments || [];
    },
    staleTime: 1000 * 60 * 60 * 24, // 24h cache
  });

  const handleSegmentSelect = (segment: SegmentData) => {
    setSelectedSegmentId(segment.id);
  };

  const handleSegmentDetail = (segment: SegmentData) => {
    setDetailSegment(segment);
    setDetailOpen(true);
  };

  return (
    <main className="min-h-screen flex flex-col">
      {/* Navigation Bar */}
      <NavBar />

      {/* Hero Header */}
      <section className="bg-gradient-to-r from-primary to-primary/80 py-12 px-4">
        <div className="container mx-auto text-center">
          <h1 className="text-4xl md:text-5xl font-bold text-primary-foreground mb-4">Uetliberg Segmente</h1>
          <p className="text-lg md:text-xl text-primary-foreground/90">
            Entdecke die besten Running-Segmente auf Zürichs Hausberg
          </p>
          {error && (
            <div className="mt-4 text-destructive-foreground bg-destructive/20 px-4 py-2 rounded-md inline-block">
              Fehler beim Laden der Segmente. Bitte versuche es später erneut.
            </div>
          )}
        </div>
      </section>

      {/* Main Content: Map + Sidebar */}
      <section className="flex-1 flex flex-col lg:flex-row">
        <div className="w-full lg:w-2/3 h-[500px] lg:h-auto">
          <SegmentMap
            segments={segments}
            isLoading={isLoading}
            selectedSegmentId={selectedSegmentId}
            onSegmentClick={handleSegmentSelect}
          />
        </div>
        <div className="w-full lg:w-1/3 bg-card shadow-lg lg:min-h-screen">
          <SegmentList
            segments={segments}
            isLoading={isLoading}
            onSegmentSelect={handleSegmentSelect}
            onSegmentDetail={handleSegmentDetail}
            selectedSegmentId={selectedSegmentId}
          />
        </div>
      </section>

      {/* Segment Detail Dialog */}
      <SegmentDetail segment={detailSegment} open={detailOpen} onOpenChange={setDetailOpen} />

      {/* Community Leaderboards */}
      <ActivityLeaderboard />

      {/* Footer */}
      <Footer />
    </main>
  );
};

export default Index;
