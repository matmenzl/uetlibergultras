## Ziel
Text im Hero bleibt unabhängig vom Webcam-Bild (Schnee/Sonne/Nebel/Nacht) gut lesbar, indem ein **transparentes Backdrop-Layer** dynamisch an die Bildhelligkeit angepasst wird.

## Vorgehen

### 1. Helligkeit messen (`WebcamBackground.tsx`)
- Beim `onLoad` des Webcam-Bilds das Bild in einen kleinen Offscreen-`<canvas>` (z. B. 32×32 px) zeichnen.
- `crossOrigin="anonymous"` setzen, damit Pixel ausgelesen werden dürfen (Supabase Storage liefert passende CORS-Header).
- Über alle Pixel die Luminanz berechnen: `L = 0.299·R + 0.587·G + 0.114·B`, dann Durchschnitt (0–255).
- Ergebnis als `brightness`-State (0–1) speichern.

### 2. Backdrop-Element rendern
Zusätzlich zum bestehenden Bild ein Overlay-`<div>` über dem Webcam-Bild, unter dem Content (`z-10`, Content liegt schon auf `z-20`):

```text
[ Webcam-Bild   z-0 ]
[ Adaptive Scrim z-10 ]  ← neu
[ Info-Bar oben  z-20 ]
[ Logo / Text   z-20 ]
```

- Hell (z. B. Schneetag): dunkler Scrim, `bg-black/35` bis `bg-black/55`
- Mittel: leichter Scrim, `bg-black/20`
- Dunkel (Nacht): minimal oder gar nicht, evtl. leichter Aufheller `bg-white/5`
- Sanfter vertikaler Verlauf (oben/unten etwas dunkler) für bessere Lesbarkeit der Info-Bar und des CTA-Buttons.
- Opacity wird per Inline-Style aus `brightness` interpoliert (smooth Transition 500 ms).

### 3. Fallbacks
- Falls Canvas-Auslesen scheitert (CORS / Fehler): Default-Scrim `bg-black/25` aktivieren – nie schlechter als heute.
- Beim Bildwechsel (neuer Screenshot) Helligkeit neu berechnen.

### 4. Cleanup
- Bestehende `[text-shadow:...]`-Utilities am Text bleiben als zweite Sicherheit erhalten.
- Keine Änderung an Layout, Inhalten oder anderen Komponenten.

## Geänderte Dateien
- `src/components/WebcamBackground.tsx` – Helligkeitsmessung + adaptives Overlay

## Verifikation
- Manuell im Preview: Screenshot bei hellem Tageslicht und (falls verfügbar) abends – Konsole prüft `brightness`, Overlay-Opacity passt sich sichtbar an.
