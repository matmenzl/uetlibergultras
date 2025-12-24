import { useState } from 'react';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { Button } from '@/components/ui/button';
import { Camera, RefreshCw } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';

const SUPABASE_URL = import.meta.env.VITE_SUPABASE_URL;

export function WebcamBackground() {
  const [isCapturing, setIsCapturing] = useState(false);
  const queryClient = useQueryClient();
  const { toast } = useToast();

  // Fetch the latest webcam screenshot URL with cache busting
  const { data: webcamData, refetch } = useQuery({
    queryKey: ['webcam-screenshot'],
    queryFn: async () => {
      const { data } = supabase.storage
        .from('webcam-screenshots')
        .getPublicUrl('latest.jpg');
      
      // Add timestamp for cache busting
      const timestamp = Date.now();
      return {
        url: `${data.publicUrl}?t=${timestamp}`,
        capturedAt: new Date() // We'll update this when we get actual metadata
      };
    },
    refetchInterval: 60000, // Refetch every 60 seconds
    staleTime: 30000, // Consider data fresh for 30 seconds
  });

  // Fetch screenshot metadata (last modified time)
  const { data: screenshotMeta } = useQuery({
    queryKey: ['webcam-screenshot-meta'],
    queryFn: async () => {
      const { data, error } = await supabase.storage
        .from('webcam-screenshots')
        .list('', {
          search: 'latest.jpg'
        });
      
      if (error || !data || data.length === 0) {
        return null;
      }
      
      const file = data.find(f => f.name === 'latest.jpg');
      return file ? new Date(file.updated_at) : null;
    },
    refetchInterval: 60000,
    staleTime: 30000,
  });

  const captureScreenshot = async () => {
    setIsCapturing(true);
    try {
      const { data, error } = await supabase.functions.invoke('capture-webcam');
      
      if (error) throw error;
      
      // Refetch both the image and metadata
      await Promise.all([
        refetch(),
        queryClient.invalidateQueries({ queryKey: ['webcam-screenshot-meta'] })
      ]);
      
      toast({
        title: '📸 Screenshot aufgenommen!',
        description: 'Das Webcam-Bild wurde aktualisiert.',
      });
    } catch (error) {
      console.error('Screenshot capture error:', error);
      toast({
        title: 'Fehler beim Screenshot',
        description: error instanceof Error ? error.message : 'Konnte Screenshot nicht aufnehmen',
        variant: 'destructive',
      });
    } finally {
      setIsCapturing(false);
    }
  };

  const formatTimestamp = (date: Date | null | undefined) => {
    if (!date) return 'Unbekannt';
    return date.toLocaleString('de-CH', {
      day: '2-digit',
      month: '2-digit',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
    });
  };

  return (
    <>
      <img
        src={webcamData?.url || ''}
        alt="Uetliberg Webcam"
        className="absolute inset-0 w-full h-full object-cover z-0 bg-muted"
      />
      
      {/* Webcam Controls Overlay - centered on mobile, right on desktop */}
      <div className="absolute bottom-2 left-1/2 -translate-x-1/2 sm:left-auto sm:right-2 sm:translate-x-0 z-30 flex items-center gap-1.5 sm:gap-2">
        <span className="text-[10px] sm:text-xs text-white/80 bg-black/50 px-1.5 sm:px-2 py-0.5 sm:py-1 rounded backdrop-blur-sm">
          📷 {formatTimestamp(screenshotMeta)}
        </span>
        <Button
          size="sm"
          variant="secondary"
          onClick={captureScreenshot}
          disabled={isCapturing}
          className="h-7 w-7 sm:h-8 sm:w-8 p-0 bg-black/50 hover:bg-black/70 text-white border-none backdrop-blur-sm"
        >
          {isCapturing ? (
            <RefreshCw className="w-3.5 h-3.5 sm:w-4 sm:h-4 animate-spin" />
          ) : (
            <Camera className="w-3.5 h-3.5 sm:w-4 sm:h-4" />
          )}
        </Button>
      </div>
    </>
  );
}
