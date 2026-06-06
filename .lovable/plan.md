## Info-Hinweis bei Runs ohne Strava-Details (>7 Tage)

### Ziel
Bei Runs, deren Strava-Rohdaten (Name, Distanz, Zeit) aufgrund der 7-Tage-Regel geleert wurden, soll ein dezenter Info-Hinweis erscheinen — auf Desktop **und** Mobile bedienbar.

### Umsetzung
Statt eines reinen Hover-Tooltips (funktioniert auf Touch nicht) nutzen wir ein **Popover mit Info-Icon** (`Info` aus lucide-react). Klick/Tap öffnet ein kleines Popover mit dem Text. Das fühlt sich auf Desktop wie ein Tooltip an, ist aber auf Mobile tap-bar.

### Wo der Hinweis erscheint
1. **`src/pages/Index.tsx`** — in der "Deine Runs in {Jahr}"-Liste. Neben dem Run-Titel erscheint ein kleines `(i)`-Icon, **nur wenn** `activity_name` ein Datums-Fallback ist (d. h. die ursprünglichen Strava-Felder sind NULL — erkennbar daran, dass `activityDistance == null && activityElapsedTime == null` UND der Run >7 Tage alt ist).
2. **`src/pages/PublicProfile.tsx`** — analog in der "Runs von …"-Liste.

### Erkennungslogik
Ein Run gilt als "redacted" wenn:
- `checked_in_at` > 7 Tage in der Vergangenheit liegt UND
- `activity_distance == null && activity_elapsed_time == null` (d. h. die Felder wurden vom Retention-Cron geleert, oder waren nie vorhanden — in beiden Fällen ist die Info korrekt).

### Hinweis-Text (DE, Swiss-Tone)
> "Strava erlaubt uns die Anzeige der Run-Details (Name, Distanz, Zeit) nur 7 Tage rückwirkend. Ältere Runs zeigen wir nur als Datum — deine Segmente, Badges und Zähler bleiben unverändert."

### Komponente
Neue kleine Komponente `src/components/StravaRetentionInfo.tsx`:
- Rendert ein `Popover` mit `Info`-Icon-Trigger (klein, `text-muted-foreground`, `h-3.5 w-3.5`).
- `PopoverContent` enthält den obigen Text.
- Wird inline neben dem Run-Titel platziert.

### Was NICHT geändert wird
- Keine Backend-/DB-Änderungen.
- Keine Änderung an der Retention-Logik selbst.
- Keine Änderung am Layout der bestehenden Run-Cards (nur Icon hinzu).

### Dateien
- Neu: `src/components/StravaRetentionInfo.tsx`
- Edit: `src/pages/Index.tsx` (Run-Titel-Zeile)
- Edit: `src/pages/PublicProfile.tsx` (Run-Titel-Zeile)