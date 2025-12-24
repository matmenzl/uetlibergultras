import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import heroImage from '@/assets/hero-runners.jpg';

const SUPABASE_URL = import.meta.env.VITE_SUPABASE_URL;

export function WebcamBackground() {
  // Fetch the latest webcam screenshot URL with cache busting
  const { data: webcamUrl } = useQuery({
    queryKey: ['webcam-screenshot'],
    queryFn: async () => {
      const { data } = supabase.storage
        .from('webcam-screenshots')
        .getPublicUrl('latest.jpg');
      
      // Add timestamp for cache busting
      return `${data.publicUrl}?t=${Date.now()}`;
    },
    refetchInterval: 60000, // Refetch every 60 seconds
    staleTime: 30000, // Consider data fresh for 30 seconds
  });

  return (
    <img
      src={webcamUrl || heroImage}
      alt="Uetliberg Webcam"
      className="absolute inset-0 w-full h-full object-cover z-0"
      onError={(e) => {
        // Fallback to hero image if screenshot fails to load
        const target = e.target as HTMLImageElement;
        target.src = heroImage;
      }}
    />
  );
}
