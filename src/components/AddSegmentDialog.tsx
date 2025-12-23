import { useState } from "react";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Plus, Loader2 } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";

interface AddSegmentDialogProps {
  onSegmentAdded?: () => void;
}

export function AddSegmentDialog({ onSegmentAdded }: AddSegmentDialogProps) {
  const [open, setOpen] = useState(false);
  const [segmentId, setSegmentId] = useState("");
  const [isLoading, setIsLoading] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    const id = segmentId.trim();
    if (!id) {
      toast.error("Bitte eine Segment-ID eingeben");
      return;
    }

    // Extract numeric ID if user pasted a URL
    const numericId = id.match(/segments\/(\d+)/)?.[1] || id.match(/^\d+$/)?.[0];
    
    if (!numericId) {
      toast.error("Ungültige Segment-ID. Bitte eine Zahl oder Strava-URL eingeben.");
      return;
    }

    setIsLoading(true);

    try {
      const { data: { session } } = await supabase.auth.getSession();
      
      if (!session) {
        toast.error("Bitte zuerst anmelden");
        return;
      }

      const { data, error } = await supabase.functions.invoke("add-segment", {
        body: { segment_id: numericId },
      });

      if (error) throw error;

      if (data.error) {
        if (data.status === 404) {
          toast.error("Segment nicht gefunden. Überprüfe die ID.");
        } else {
          toast.error(data.error);
        }
        return;
      }

      toast.success(`Segment "${data.segment.name}" hinzugefügt!`);
      setSegmentId("");
      setOpen(false);
      onSegmentAdded?.();
    } catch (error) {
      console.error("Error adding segment:", error);
      toast.error("Fehler beim Hinzufügen des Segments");
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button variant="outline" size="sm">
          <Plus className="h-4 w-4 mr-2" />
          Segment hinzufügen
        </Button>
      </DialogTrigger>
      <DialogContent className="sm:max-w-[425px]">
        <form onSubmit={handleSubmit}>
          <DialogHeader>
            <DialogTitle>Segment hinzufügen</DialogTitle>
            <DialogDescription>
              Füge ein Strava-Segment per ID oder URL hinzu.
            </DialogDescription>
          </DialogHeader>
          <div className="grid gap-4 py-4">
            <div className="grid gap-2">
              <Label htmlFor="segment-id">Segment ID oder URL</Label>
              <Input
                id="segment-id"
                placeholder="z.B. 16089555 oder https://www.strava.com/segments/16089555"
                value={segmentId}
                onChange={(e) => setSegmentId(e.target.value)}
                disabled={isLoading}
              />
              <p className="text-xs text-muted-foreground">
                Die Segment-ID findest du in der URL auf Strava.
              </p>
            </div>
          </div>
          <DialogFooter>
            <Button type="button" variant="outline" onClick={() => setOpen(false)} disabled={isLoading}>
              Abbrechen
            </Button>
            <Button type="submit" disabled={isLoading}>
              {isLoading ? (
                <>
                  <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                  Wird hinzugefügt...
                </>
              ) : (
                "Hinzufügen"
              )}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
