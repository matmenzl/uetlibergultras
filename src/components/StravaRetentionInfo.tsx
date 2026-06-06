import { Info } from "lucide-react";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";

interface Props {
  className?: string;
}

export function StravaRetentionInfo({ className }: Props) {
  return (
    <Popover>
      <PopoverTrigger
        asChild
        onClick={(e) => {
          e.stopPropagation();
          e.preventDefault();
        }}
      >
        <button
          type="button"
          aria-label="Warum fehlen die Run-Details?"
          className={
            "inline-flex items-center justify-center text-muted-foreground hover:text-foreground transition-colors " +
            (className ?? "")
          }
        >
          <Info className="h-3.5 w-3.5" />
        </button>
      </PopoverTrigger>
      <PopoverContent
        side="top"
        align="start"
        className="w-72 text-xs leading-relaxed"
        onClick={(e) => e.stopPropagation()}
      >
        Strava erlaubt uns die Anzeige der Run-Details (Name, Distanz, Zeit) nur 7 Tage
        rückwirkend. Ältere Runs zeigen wir nur als Datum — deine Segmente, Badges und
        Zähler bleiben unverändert.
      </PopoverContent>
    </Popover>
  );
}

export function isRunRedacted(params: {
  checkedInAt: string;
  activityDistance: number | null | undefined;
  activityElapsedTime: number | null | undefined;
}): boolean {
  const { checkedInAt, activityDistance, activityElapsedTime } = params;
  if (activityDistance != null || activityElapsedTime != null) return false;
  const ageMs = Date.now() - new Date(checkedInAt).getTime();
  return ageMs > 7 * 24 * 60 * 60 * 1000;
}