import { useState, useMemo, useRef, useEffect } from 'react';
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
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  // 0 = sehr dunkel, 1 = sehr hell. null = noch nicht gemessen → Default-Scrim
  const [brightness, setBrightness] = useState<number | null>(null);
  const imgRef = useRef<HTMLImageElement | null>(null);
  const queryClient = useQueryClient();
  const { toast } = useToast();
  const { data: weatherData } = useWeather();

  useEffect(() => {
    supabase.auth.getSession().then(({ data: { session } }) => {
      setIsAuthenticated(!!session);
    });
    const { data: { subscription } } = supabase.auth.onAuthStateChange((_e, session) => {
      setIsAuthenticated(!!session);
    });
    return () => subscription.unsubscribe();
  }, []);

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

  const measureBrightness = (img: HTMLImageElement) => {
    try {
      const size = 32;
      const canvas = document.createElement('canvas');
      canvas.width = size;
      canvas.height = size;
      const ctx = canvas.getContext('2d');
      if (!ctx) return;
      ctx.drawImage(img, 0, 0, size, size);
      const { data } = ctx.getImageData(0, 0, size, size);
      let total = 0;
      const pixels = data.length / 4;
      for (let i = 0; i < data.length; i += 4) {
        total += 0.299 * data[i] + 0.587 * data[i + 1] + 0.114 * data[i + 2];
      }
      const avg = total / pixels / 255; // 0..1
      setBrightness(avg);
    } catch (err) {
      console.warn('Brightness measurement failed (CORS?)', err);
      setBrightness(null);
    }
  };

  // Scrim-Opacity an Helligkeit koppeln:
  // hell (1.0) → ~0.55, mittel (0.5) → ~0.25, dunkel (0.0) → ~0.05
  const scrimOpacity = useMemo(() => {
    if (brightness === null) return 0.3; // Fallback
    const clamped = Math.max(0, Math.min(1, brightness));
    return 0.05 + clamped * 0.5;
  }, [brightness]);

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
          ref={imgRef}
          crossOrigin="anonymous"
          src={webcamData.url}
          alt="Uetliberg Webcam"
          className={`absolute inset-0 w-full h-full object-cover z-0 transition-opacity duration-500 ${
            imageLoaded ? 'opacity-100' : 'opacity-0'
          }`}
          onLoad={(e) => {
            console.log('Webcam image loaded successfully');
            setImageLoaded(true);
            setImageError(false);
            measureBrightness(e.currentTarget);
          }}
          onError={(e) => {
            console.error('Webcam image failed to load:', e);
            setImageError(true);
            setImageLoaded(false);
          }}
        />
      )}

      {/* Adaptiver Scrim für Lesbarkeit – Opacity passt sich der Bildhelligkeit an */}
      {imageLoaded && (
        <div
          aria-hidden="true"
          className="absolute inset-0 z-10 pointer-events-none transition-opacity duration-500"
          style={{
            background: `linear-gradient(to bottom, rgba(0,0,0,${(scrimOpacity * 0.9).toFixed(3)}) 0%, rgba(0,0,0,${scrimOpacity.toFixed(3)}) 40%, rgba(0,0,0,${(scrimOpacity * 1.1).toFixed(3)}) 100%)`,
          }}
        />
      )}

      {/* Webcam Info Bar - Bottom */}
      {imageLoaded && (
        <div className="absolute top-0 left-0 right-0 z-20">
          <div className="bg-black/40 backdrop-blur-sm">
            {/* Desktop: single line */}
            <div className="hidden md:flex items-center justify-between px-4 py-1.5">
              <div className="flex items-center gap-4 text-white">
                <span className="flex items-center gap-1">
                  <Camera className="w-3.5 h-3.5 opacity-70" />
                  <span className="text-xs font-medium opacity-90">Webcam</span>
                </span>
                {weatherData && (
                <span className="text-xs opacity-80">
                    {weatherData.weather} {weatherData.temperature}°C
                  </span>
                )}
                <span className="text-xs text-white/70">
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
              {isAuthenticated && (
              <Button
                size="sm"
                onClick={captureScreenshot}
                disabled={isCapturing || cooldownInfo.isOnCooldown}
                className="bg-white/15 hover:bg-white/25 text-white border-0 h-7 px-2 text-xs"
              >
                {isCapturing ? (
                  <RefreshCw className="w-3.5 h-3.5 animate-spin" />
                ) : cooldownInfo.isOnCooldown ? (
                  <>
                    <Clock className="w-3.5 h-3.5 mr-1" />
                    {cooldownInfo.remainingMinutes}m
                  </>
                ) : (
                  <RefreshCw className="w-3.5 h-3.5" />
                )}
              </Button>
              )}
            </div>

            {/* Mobile: two lines */}
            <div className="md:hidden px-2.5 py-1">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-1.5 text-white/80 text-[11px]">
                  <Camera className="w-3 h-3 opacity-70" />
                  {weatherData && (
                    <span>{weatherData.weather} {weatherData.temperature}°C</span>
                  )}
                  <span className="opacity-50">·</span>
                  {isLive ? (
                    <span className="flex items-center gap-1">
                      <span className="w-1.5 h-1.5 bg-red-500 rounded-full animate-pulse" />
                      Live
                    </span>
                  ) : (
                    <span>{formatTime(screenshotMeta)}</span>
                  )}
                </div>
                {isAuthenticated && (
                <Button
                  size="sm"
                  onClick={captureScreenshot}
                  disabled={isCapturing || cooldownInfo.isOnCooldown}
                  className="bg-white/15 hover:bg-white/25 text-white border-0 h-6 px-1.5 text-[11px]"
                >
                  {isCapturing ? (
                    <RefreshCw className="w-3 h-3 animate-spin" />
                  ) : cooldownInfo.isOnCooldown ? (
                    <>⏳ {cooldownInfo.remainingMinutes}m</>
                  ) : (
                    <RefreshCw className="w-3 h-3" />
                  )}
                </Button>
                )}
              </div>
            </div>
          </div>
        </div>
      )}
    </>
  );
}
