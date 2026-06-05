import { useRef, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { useToast } from "@/hooks/use-toast";
import { Upload, Loader2, CheckCircle2 } from "lucide-react";

interface MatchResult {
  segment_id: number;
  name: string;
  elapsed_time: number;
  distance: number;
}

interface UploadResponse {
  upload_id: string;
  started_at?: string;
  distance_m?: number;
  elapsed_s?: number;
  segments_matched: number;
  check_ins_created: number;
  matches?: MatchResult[];
  message?: string;
  error?: string;
}

interface Props {
  onUploaded?: () => void;
}

export const RunUploadCard = ({ onUploaded }: Props) => {
  const inputRef = useRef<HTMLInputElement>(null);
  const { toast } = useToast();
  const [uploading, setUploading] = useState(false);
  const [lastResult, setLastResult] = useState<UploadResponse | null>(null);

  const handlePick = () => inputRef.current?.click();

  const handleFile = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const lower = file.name.toLowerCase();
    if (!lower.endsWith(".gpx") && !lower.endsWith(".tcx")) {
      toast({ title: "Format nicht unterstützt", description: "Bitte eine .gpx- oder .tcx-Datei wählen.", variant: "destructive" });
      if (inputRef.current) inputRef.current.value = "";
      return;
    }
    if (file.size > 10 * 1024 * 1024) {
      toast({ title: "Datei zu gross", description: "Maximal 10 MB pro Datei.", variant: "destructive" });
      if (inputRef.current) inputRef.current.value = "";
      return;
    }

    setUploading(true);
    setLastResult(null);

    try {
      const { data: { session } } = await supabase.auth.getSession();
      if (!session) throw new Error("Nicht eingeloggt");

      const form = new FormData();
      form.append("file", file);

      const url = `https://${import.meta.env.VITE_SUPABASE_PROJECT_ID}.supabase.co/functions/v1/upload-run`;
      const res = await fetch(url, {
        method: "POST",
        headers: { Authorization: `Bearer ${session.access_token}` },
        body: form,
      });
      const json: UploadResponse = await res.json();

      if (!res.ok) {
        toast({ title: "Upload fehlgeschlagen", description: json.error || "Unbekannter Fehler", variant: "destructive" });
        return;
      }

      setLastResult(json);

      if (json.message) {
        toast({ title: "Hinweis", description: json.message });
      } else if (json.segments_matched > 0) {
        toast({
          title: `${json.segments_matched} Segment${json.segments_matched === 1 ? "" : "e"} erkannt!`,
          description: `Dein Run wurde gewertet.`,
        });
      } else {
        toast({
          title: "Keine Uetliberg-Segmente erkannt",
          description: "Dein Track verläuft nicht über eines unserer Segmente.",
        });
      }

      onUploaded?.();
    } catch (err) {
      console.error(err);
      toast({ title: "Upload fehlgeschlagen", description: (err as Error).message, variant: "destructive" });
    } finally {
      setUploading(false);
      if (inputRef.current) inputRef.current.value = "";
    }
  };

  return (
    <Card className="mt-6">
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Upload className="h-5 w-5" />
          Run hochladen
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        <p className="text-sm text-muted-foreground">
          Lade deinen Lauf als <strong>.gpx</strong> oder <strong>.tcx</strong> hoch (Export aus Apple Health, Garmin Connect, Strava etc.).
          Wir prüfen automatisch, ob du eines unserer Uetliberg-Segmente gelaufen bist.
        </p>

        <input
          ref={inputRef}
          type="file"
          accept=".gpx,.tcx"
          className="hidden"
          onChange={handleFile}
        />

        <Button onClick={handlePick} disabled={uploading} className="w-full">
          {uploading ? (
            <>
              <Loader2 className="h-4 w-4 mr-2 animate-spin" />
              Verarbeite...
            </>
          ) : (
            <>
              <Upload className="h-4 w-4 mr-2" />
              Datei auswählen
            </>
          )}
        </Button>

        {lastResult && lastResult.matches && lastResult.matches.length > 0 && (
          <div className="rounded-lg border bg-muted/30 p-3 space-y-2">
            <div className="flex items-center gap-2 text-sm font-medium">
              <CheckCircle2 className="h-4 w-4 text-primary" />
              {lastResult.segments_matched} Segment{lastResult.segments_matched === 1 ? "" : "e"} erkannt
            </div>
            <ul className="text-sm text-muted-foreground space-y-1">
              {lastResult.matches.map((m) => (
                <li key={m.segment_id} className="flex justify-between gap-2">
                  <span className="truncate">{m.name}</span>
                  <span className="shrink-0 tabular-nums">
                    {Math.floor(m.elapsed_time / 60)}:{String(m.elapsed_time % 60).padStart(2, "0")} min
                  </span>
                </li>
              ))}
            </ul>
          </div>
        )}
      </CardContent>
    </Card>
  );
};

export default RunUploadCard;