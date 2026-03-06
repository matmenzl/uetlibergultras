import { useState, useMemo } from 'react';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { Button } from '@/components/ui/button';
import { Camera, RefreshCw, Clock } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
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
      
      {/* Webcam Info Bar - Bottom */}
      {imageLoaded && (
        <div className="absolute top-0 left-0 right-0 z-20">
          <div className="bg-black/60 backdrop-blur-sm">
            {/* Desktop: single line */}
            <div className="hidden md:flex items-center justify-between px-4 py-2.5">
              <div className="flex items-center gap-4 text-white">
                <span className="flex items-center gap-1.5">
                  <Camera className="w-4 h-4" />
                  <span className="text-sm font-medium">Uetliberg Webcam</span>
                </span>
                {weatherData && (
                  <span className="text-sm">
                    {weatherData.weather} {weatherData.temperature}°C
                  </span>
                )}
                <span className="text-sm text-white/80">
                  {isLive ? (
                    <span className="flex items-center gap-1.5">
                      <span className="w-2 h-2 bg-red-500 rounded-full animate-pulse" />
                      Live
                    </span>
                  ) : (
                    formatTime(screenshotMeta)
                  )}
                </span>
              </div>
              <Button
                size="sm"
                onClick={captureScreenshot}
                disabled={isCapturing || cooldownInfo.isOnCooldown}
                className="bg-white/20 hover:bg-white/30 text-white border-0"
              >
                {isCapturing ? (
                  <>
                    <RefreshCw className="w-4 h-4 animate-spin mr-1.5" />
                    Lädt...
                  </>
                ) : cooldownInfo.isOnCooldown ? (
                  <>
                    <Clock className="w-4 h-4 mr-1.5" />
                    {cooldownInfo.remainingMinutes} Min
                  </>
                ) : (
                  <>
                    <RefreshCw className="w-4 h-4 mr-1.5" />
                    Aktualisieren
                  </>
                )}
              </Button>
            </div>

            {/* Mobile: two lines */}
            <div className="md:hidden px-3 py-2">
              <div className="flex items-center gap-1.5 text-white text-sm mb-1.5">
                <Camera className="w-3.5 h-3.5" />
                <span className="font-medium">Uetliberg Webcam</span>
              </div>
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2 text-white/90 text-xs">
                  {weatherData && (
                    <span>{weatherData.weather} {weatherData.temperature}°C</span>
                  )}
                  <span>·</span>
                  {isLive ? (
                    <span className="flex items-center gap-1">
                      <span className="w-1.5 h-1.5 bg-red-500 rounded-full animate-pulse" />
                      Live
                    </span>
                  ) : (
                    <span>{formatTime(screenshotMeta)}</span>
                  )}
                </div>
                <Button
                  size="sm"
                  onClick={captureScreenshot}
                  disabled={isCapturing || cooldownInfo.isOnCooldown}
                  className="bg-white/20 hover:bg-white/30 text-white border-0 h-8 px-2.5 text-xs"
                >
                  {isCapturing ? (
                    <RefreshCw className="w-3.5 h-3.5 animate-spin" />
                  ) : cooldownInfo.isOnCooldown ? (
                    <>⏳ {cooldownInfo.remainingMinutes}m</>
                  ) : (
                    <>
                      <RefreshCw className="w-3.5 h-3.5 mr-1" />
                      Neu
                    </>
                  )}
                </Button>
              </div>
            </div>
          </div>
        </div>
      )}
    </>
  );
}
