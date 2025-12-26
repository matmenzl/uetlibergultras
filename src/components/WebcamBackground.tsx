import { useState, useMemo } from 'react';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { Button } from '@/components/ui/button';
import { Camera, RefreshCw, Clock } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from '@/components/ui/tooltip';

const RATE_LIMIT_MINUTES = 15;

export function WebcamBackground() {
  const [isCapturing, setIsCapturing] = useState(false);
  const [imageLoaded, setImageLoaded] = useState(false);
  const [imageError, setImageError] = useState(false);
  const queryClient = useQueryClient();
  const { toast } = useToast();

  // Fetch the latest webcam screenshot URL with cache busting
  const { data: webcamData, refetch } = useQuery({
    queryKey: ['webcam-screenshot'],
    queryFn: async () => {
      // First check if the file exists
      const { data: files, error: listError } = await supabase.storage
        .from('webcam-screenshots')
        .list('', { search: 'latest.jpg' });
      
      if (listError || !files || files.length === 0) {
        console.log('Webcam screenshot not found in storage');
        return null;
      }
      
      const { data } = supabase.storage
        .from('webcam-screenshots')
        .getPublicUrl('latest.jpg');
      
      // Add timestamp for cache busting
      const timestamp = Date.now();
      console.log('Webcam URL:', `${data.publicUrl}?t=${timestamp}`);
      return {
        url: `${data.publicUrl}?t=${timestamp}`,
        capturedAt: new Date()
      };
    },
    refetchInterval: 60000,
    staleTime: 30000,
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
    refetchInterval: 30000, // Check more frequently to update cooldown status
    staleTime: 15000,
  });

  // RATE LIMIT TEMPORARILY DISABLED FOR DEBUGGING
  const cooldownInfo = useMemo(() => {
    return { isOnCooldown: false, remainingMinutes: 0 };
  }, []);

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
      {/* Fallback gradient background when no image */}
      <div className="absolute inset-0 bg-gradient-to-br from-primary/20 via-muted to-primary/10 z-0" />
      
      {webcamData?.url && !imageError && (
        <img
          src={webcamData.url}
          alt="Uetliberg Webcam"
          className={`absolute inset-0 w-full h-full object-cover z-0 transition-opacity duration-500 ${
            imageLoaded ? 'opacity-100' : 'opacity-0'
          }`}
          onLoad={() => {
            console.log('Webcam image loaded successfully');
            setImageLoaded(true);
            setImageError(false);
          }}
          onError={(e) => {
            console.error('Webcam image failed to load:', e);
            setImageError(true);
            setImageLoaded(false);
          }}
        />
      )}
      
      {/* Simple debug button */}
      <div className="absolute bottom-2 right-2 z-30">
        <Button
          size="sm"
          variant="secondary"
          onClick={captureScreenshot}
          disabled={isCapturing}
          className="bg-black/50 hover:bg-black/70 text-white"
        >
          {isCapturing ? (
            <RefreshCw className="w-4 h-4 animate-spin mr-2" />
          ) : (
            <Camera className="w-4 h-4 mr-2" />
          )}
          Screenshot
        </Button>
      </div>
    </>
  );
}
