import { useState } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { Button } from '@/components/ui/button';
import { Calendar } from '@/components/ui/calendar';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { Mountain, CalendarIcon, Check, Loader2 } from 'lucide-react';
import { format } from 'date-fns';
import { de } from 'date-fns/locale';
import { cn } from '@/lib/utils';
import { toast } from 'sonner';
import { triggerConfetti } from '@/lib/confetti';

// Default segment: Triemli bis Spilpi
const DEFAULT_SEGMENT_ID = 4072914;
const DEFAULT_SEGMENT_DISTANCE = 1475.5;

interface ManualCheckInButtonProps {
  userId: string;
  onSuccess?: () => void;
}

export function ManualCheckInButton({ userId, onSuccess }: ManualCheckInButtonProps) {
  const [date, setDate] = useState<Date>(new Date());
  const [isLoading, setIsLoading] = useState(false);
  const [showDatePicker, setShowDatePicker] = useState(false);

  const handleCheckIn = async () => {
    setIsLoading(true);
    try {
      // Generate a unique activity_id from timestamp
      const activityId = Date.now();
      
      const { error } = await supabase.from('check_ins').insert({
        user_id: userId,
        segment_id: DEFAULT_SEGMENT_ID,
        activity_id: activityId,
        checked_in_at: date.toISOString(),
        distance: DEFAULT_SEGMENT_DISTANCE,
        is_manual: true,
        activity_name: 'Manueller Uetliberg-Run',
      });

      if (error) throw error;

      // Check for achievements
      await supabase.functions.invoke('check-achievements');

      triggerConfetti();
      toast.success('Uetliberg-Run erfasst! 🏔️');
      onSuccess?.();
    } catch (error) {
      console.error('Error checking in:', error);
      toast.error('Fehler beim Erfassen des Runs');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="flex flex-col sm:flex-row items-center gap-2">
      <Popover open={showDatePicker} onOpenChange={setShowDatePicker}>
        <PopoverTrigger asChild>
          <Button
            variant="outline"
            size="sm"
            className={cn(
              'justify-start text-left font-normal',
              !date && 'text-muted-foreground'
            )}
          >
            <CalendarIcon className="mr-2 h-4 w-4" />
            {format(date, 'dd.MM.yyyy', { locale: de })}
          </Button>
        </PopoverTrigger>
        <PopoverContent className="w-auto p-0" align="start">
          <Calendar
            mode="single"
            selected={date}
            onSelect={(newDate) => {
              if (newDate) {
                setDate(newDate);
                setShowDatePicker(false);
              }
            }}
            disabled={(date) => date > new Date()}
            locale={de}
            initialFocus
          />
        </PopoverContent>
      </Popover>

      <Button
        onClick={handleCheckIn}
        disabled={isLoading}
        className="gap-2"
      >
        {isLoading ? (
          <Loader2 className="h-4 w-4 animate-spin" />
        ) : (
          <Mountain className="h-4 w-4" />
        )}
        Uetliberg-Run erfassen
      </Button>
    </div>
  );
}
