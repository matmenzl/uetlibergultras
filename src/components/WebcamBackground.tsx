import { useState, useMemo } from 'react';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { Button } from '@/components/ui/button';
import { Camera, RefreshCw, Clock } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from '@/components/ui/tooltip';
import { useWeather } from '@/hooks/useWeather';

const RATE_LIMIT_MINUTES = 15;

export function WebcamBackground() {
  const [isCapturing, setIsCapturing] = useState(false);
  const [imageLoaded, setImageLoaded] = useState(false);
  const [imageError, setImageError] = useState(false);
  const queryClient = useQueryClient();
  const { toast } = useToast();
  const { data: weatherData } = useWeather();

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

  // Calculate cooldown and live status based on last screenshot time
  const { cooldownInfo, isLive } = useMemo(() => {
    if (!screenshotMeta) return { 
      cooldownInfo: { isOnCooldown: false, remainingMinutes: 0 },
      isLive: false 
    };
    
    const now = new Date();
    const minutesSinceLastUpdate = (now.getTime() - screenshotMeta.getTime()) / (1000 * 60);
    const isOnCooldown = minutesSinceLastUpdate < RATE_LIMIT_MINUTES;
    const remainingMinutes = Math.ceil(RATE_LIMIT_MINUTES - minutesSinceLastUpdate);
    // Consider "live" if screenshot is less than 30 minutes old
    const isLive = minutesSinceLastUpdate < 30;
    
    return { 
      cooldownInfo: { isOnCooldown, remainingMinutes },
      isLive 
    };
  }, [screenshotMeta]);

  const captureScreenshot = async () => {
    setIsCapturing(true);
    try {
      const { data, error } = await supabase.functions.invoke('capture-webcam');
      
      // Check if the response indicates rate limiting
      if (data?.rateLimited) {
        toast({
          title: '⏰ Bitte warten',
          description: `Nächster Screenshot in ${data.remainingMinutes} Minute${data.remainingMinutes === 1 ? '' : 'n'} möglich.`,
        });
        // Refresh metadata to update cooldown display
        queryClient.invalidateQueries({ queryKey: ['webcam-screenshot-meta'] });
        return;
      }
      
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

  const formatTime = (date: Date | null | undefined) => {
    if (!date) return '';
    return date.toLocaleString('de-CH', {
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
      
      {/* Weather overlay with live indicator - positioned to avoid overlap on mobile */}
      {imageLoaded && (
        <div className="absolute bottom-14 sm:bottom-auto sm:top-4 left-2 sm:left-4 z-20 flex items-center gap-1.5 sm:gap-2">
          {/* Live indicator or timestamp */}
          {isLive ? (
            <div className="bg-red-600/90 backdrop-blur-sm rounded-full px-2 sm:px-2.5 py-0.5 sm:py-1 flex items-center gap-1 sm:gap-1.5">
              <span className="w-1.5 sm:w-2 h-1.5 sm:h-2 bg-white rounded-full animate-pulse" />
              <span className="text-white text-[10px] sm:text-xs font-semibold uppercase tracking-wide">Live</span>
            </div>
          ) : screenshotMeta && (
            <div className="bg-black/40 backdrop-blur-sm rounded-full px-2 sm:px-2.5 py-0.5 sm:py-1 flex items-center gap-1 sm:gap-1.5">
              <Clock className="w-2.5 sm:w-3 h-2.5 sm:h-3 text-white/80" />
              <span className="text-white text-[10px] sm:text-xs font-medium">{formatTime(screenshotMeta)}</span>
            </div>
          )}
          
          {/* Weather info */}
          {weatherData && (
            <div className="bg-black/40 backdrop-blur-sm rounded-lg px-2 sm:px-3 py-1 sm:py-1.5 text-white">
              <div className="flex items-center gap-1 sm:gap-2">
                <span className="text-base sm:text-xl">{weatherData.weather}</span>
                {weatherData.temperature !== null && (
                  <span className="text-xs sm:text-base font-medium">{weatherData.temperature}°C</span>
                )}
              </div>
            </div>
          )}
        </div>
      )}
      
      {/* Screenshot button - bottom right, smaller on mobile */}
      <div className="absolute bottom-2 right-2 z-30">
        <TooltipProvider>
          <Tooltip>
            <TooltipTrigger asChild>
              <Button
                size="sm"
                variant="secondary"
                onClick={captureScreenshot}
                disabled={isCapturing || cooldownInfo.isOnCooldown}
                className="bg-black/50 hover:bg-black/70 text-white disabled:opacity-70 text-xs sm:text-sm px-2 sm:px-3 h-7 sm:h-9"
              >
                {isCapturing ? (
                  <RefreshCw className="w-3 sm:w-4 h-3 sm:h-4 animate-spin mr-1 sm:mr-2" />
                ) : cooldownInfo.isOnCooldown ? (
                  <Clock className="w-3 sm:w-4 h-3 sm:h-4 mr-1 sm:mr-2" />
                ) : (
                  <Camera className="w-3 sm:w-4 h-3 sm:h-4 mr-1 sm:mr-2" />
                )}
                <span className="hidden sm:inline">{screenshotMeta ? formatTime(screenshotMeta) : 'Screenshot'}</span>
                <span className="sm:hidden">{screenshotMeta ? formatTime(screenshotMeta) : '📸'}</span>
                {cooldownInfo.isOnCooldown && <span className="hidden sm:inline"> ({cooldownInfo.remainingMinutes} Min)</span>}
              </Button>
            </TooltipTrigger>
            <TooltipContent>
              {cooldownInfo.isOnCooldown 
                ? <p>Nächster Screenshot in {cooldownInfo.remainingMinutes} Minute{cooldownInfo.remainingMinutes === 1 ? '' : 'n'} möglich</p>
                : <p>Neuen Screenshot aufnehmen</p>
              }
            </TooltipContent>
          </Tooltip>
        </TooltipProvider>
      </div>
    </>
  );
}
