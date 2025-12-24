import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';

export function useWeather() {
  return useQuery({
    queryKey: ['weather'],
    queryFn: async () => {
      const { data, error } = await supabase.functions.invoke('analyze-weather');
      
      if (error) {
        console.error('Weather fetch error:', error);
        return { weather: '🌤️', timestamp: new Date().toISOString() };
      }
      
      return data as { weather: string; timestamp: string };
    },
    staleTime: 1000 * 60 * 30, // Cache for 30 minutes
    refetchInterval: 1000 * 60 * 30, // Refetch every 30 minutes
  });
}
