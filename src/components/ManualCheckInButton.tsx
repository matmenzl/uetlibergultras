import { useState } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { Button } from '@/components/ui/button';
import { Calendar } from '@/components/ui/calendar';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { Mountain, CalendarIcon, Loader2 } from 'lucide-react';
import { format, startOfDay, endOfDay } from 'date-fns';
import { de } from 'date-fns/locale';
import { cn } from '@/lib/utils';
import { toast } from 'sonner';
import { triggerConfetti } from '@/lib/confetti';
import { SegmentMultiSelect } from './SegmentMultiSelect';

// Manual check-ins use segment_id = 0 to indicate "general Uetliberg activity" (when no segments selected)
const MANUAL_CHECKIN_SEGMENT_ID = 0;

interface ManualCheckInButtonProps {
  userId: string;
  onSuccess?: () => void;
}

export function ManualCheckInButton({ userId, onSuccess }: ManualCheckInButtonProps) {
  const [date, setDate] = useState<Date>(new Date());
  const [title, setTitle] = useState('');
  const [distance, setDistance] = useState('');
  const [elevation, setElevation] = useState('');
  const [selectedSegmentIds, setSelectedSegmentIds] = useState<number[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [showDatePicker, setShowDatePicker] = useState(false);

  const handleCheckIn = async () => {
    // Validate required field
    if (!title.trim()) {
      toast.error('Bitte gib einen Titel ein');
      return;
    }

    setIsLoading(true);
    try {
      // Check if user already has a manual check-in for this day
      const dayStart = startOfDay(date);
      const dayEnd = endOfDay(date);

      const { data: existingCheckIn, error: checkError } = await supabase
        .from('check_ins')
        .select('id')
        .eq('user_id', userId)
        .eq('is_manual', true)
        .gte('checked_in_at', dayStart.toISOString())
        .lte('checked_in_at', dayEnd.toISOString())
        .maybeSingle();

      if (checkError) throw checkError;

      if (existingCheckIn) {
        toast.error('Du hast heute bereits einen manuellen Run erfasst');
        setIsLoading(false);
        return;
      }

      // Generate a unique activity_id from timestamp
      const activityId = Date.now();
      
      // Parse optional numeric fields
      const distanceValue = distance ? parseFloat(distance) * 1000 : null; // Convert km to meters
      const elevationValue = elevation ? parseInt(elevation, 10) : null;

      // Build check-in entries
      if (selectedSegmentIds.length > 0) {
        // Create one check-in per selected segment (all with same activity_id)
        const checkIns = selectedSegmentIds.map((segmentId) => ({
          user_id: userId,
          segment_id: segmentId,
          activity_id: activityId,
          checked_in_at: date.toISOString(),
          is_manual: true,
          activity_name: title.trim(),
          distance: distanceValue,
          elevation_gain: elevationValue,
        }));

        const { error } = await supabase.from('check_ins').insert(checkIns);
        if (error) throw error;
      } else {
        // No segments selected: create single check-in with segment_id = 0
        const { error } = await supabase.from('check_ins').insert({
          user_id: userId,
          segment_id: MANUAL_CHECKIN_SEGMENT_ID,
          activity_id: activityId,
          checked_in_at: date.toISOString(),
          is_manual: true,
          activity_name: title.trim(),
          distance: distanceValue,
          elevation_gain: elevationValue,
        });

        if (error) throw error;
      }

      // Check for achievements
      await supabase.functions.invoke('check-achievements');

      triggerConfetti();
      toast.success('Uetliberg-Run erfasst! 🏔️');
      
      // Reset form
      setTitle('');
      setDistance('');
      setElevation('');
      setDate(new Date());
      setSelectedSegmentIds([]);
      
      onSuccess?.();
    } catch (error) {
      console.error('Error checking in:', error);
      toast.error('Fehler beim Erfassen des Runs');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="space-y-4">
      <h3 className="font-semibold flex items-center gap-2 text-lg">
        <Mountain className="h-5 w-5" />
        Uetliberg-Run manuell erfassen
      </h3>
      
      <div className="space-y-3">
        <div className="space-y-1.5">
          <Label htmlFor="title">Titel *</Label>
          <Input
            id="title"
            placeholder="z.B. Morgen-Lauf zum Uto Kulm"
            value={title}
            onChange={(e) => setTitle(e.target.value)}
            maxLength={100}
          />
        </div>

        <div className="grid grid-cols-2 gap-3">
          <div className="space-y-1.5">
            <Label htmlFor="distance">Distanz (km)</Label>
            <Input
              id="distance"
              type="number"
              step="0.1"
              min="0"
              max="100"
              placeholder="z.B. 5.2"
              value={distance}
              onChange={(e) => setDistance(e.target.value)}
            />
          </div>
          
          <div className="space-y-1.5">
            <Label htmlFor="elevation">Höhenmeter</Label>
            <Input
              id="elevation"
              type="number"
              step="1"
              min="0"
              max="3000"
              placeholder="z.B. 450"
              value={elevation}
              onChange={(e) => setElevation(e.target.value)}
            />
          </div>
        </div>

        <div className="space-y-1.5">
          <Label>Datum</Label>
          <Popover open={showDatePicker} onOpenChange={setShowDatePicker}>
            <PopoverTrigger asChild>
              <Button
                variant="outline"
                className={cn(
                  'w-full justify-start text-left font-normal',
                  !date && 'text-muted-foreground'
                )}
              >
                <CalendarIcon className="mr-2 h-4 w-4" />
                {format(date, 'dd. MMMM yyyy', { locale: de })}
              </Button>
            </PopoverTrigger>
            <PopoverContent className="w-auto p-0 z-50 bg-popover" align="start">
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
        </div>

        <div className="space-y-1.5">
          <Label>Segmente (optional)</Label>
          <SegmentMultiSelect
            selectedSegmentIds={selectedSegmentIds}
            onSelectionChange={setSelectedSegmentIds}
            disabled={isLoading}
          />
          <p className="text-xs text-muted-foreground">
            Wähle die Segmente aus, die du gelaufen bist, um segment-spezifische Achievements freizuschalten.
          </p>
          <p className="text-xs text-amber-600 dark:text-amber-500 mt-1">
            ⚠️ Bitte nur Segmente wählen, die du tatsächlich gelaufen bist.
          </p>
        </div>
      </div>

      <Button
        onClick={handleCheckIn}
        disabled={isLoading || !title.trim()}
        className="w-full gap-2"
      >
        {isLoading ? (
          <Loader2 className="h-4 w-4 animate-spin" />
        ) : (
          <Mountain className="h-4 w-4" />
        )}
        Run erfassen
      </Button>
      
      <p className="text-xs text-muted-foreground text-center">
        Max. 1 manueller Run pro Tag
      </p>
    </div>
  );
}
