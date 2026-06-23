## Ziel

Beim Erstellen des Webcam-Screenshots (`capture-webcam` Edge Function) wird bereits eine Liste von Roundshot-Overlays ausgeblendet, bevor ScreenshotOne das Bild aufnimmt. Das neue Angular-Modal `app-camera-offline-modal` (inkl. Material-Dialog-Backdrop) ist dort noch nicht enthalten und erscheint deshalb mitten im aktuellen `latest.jpg`. Wir erweitern die bestehende Ausblend-Logik um dieses Modal.

## Änderung

Nur eine Datei: `supabase/functions/capture-webcam/index.ts`

1. **CSS-Block (`customCSS`)** ergänzen um Selektoren, die das Offline-Modal samt Material-Dialog-Backdrop unsichtbar machen:
   - `app-camera-offline-modal`
   - `mat-dialog-container`, `.mat-dialog-container`, `.cdk-overlay-container`, `.cdk-overlay-backdrop`, `.mat-dialog-content`, `.mat-dialog-title`
   - Zusätzlich `[id^="mat-dialog-"]` als Catch-all für künftige Dialoge

   Jeweils mit `display:none !important; visibility:hidden !important; opacity:0 !important; pointer-events:none !important;`.

2. **`hideSelectors`-Array** (wird als `hide_selectors[]` an ScreenshotOne übergeben) um dieselben Selektoren erweitern:
   - `app-camera-offline-modal`
   - `mat-dialog-container`
   - `.cdk-overlay-container`
   - `.cdk-overlay-backdrop`

Keine weiteren Änderungen an Rate-Limit, Auth, Upload oder Frontend. Nach Deploy wird der nächste Cron-Lauf (bzw. manueller Trigger im Admin) ein sauberes Bild ohne Offline-Modal hochladen — sofern die Kamera ein Bild liefert. Liefert die Kamera weiterhin nur einen Offline-Zustand, ist das Resultat ein leerer/dunkler Canvas, was im Sinne des Auftrags ist (nur Overlays werden entfernt, nicht der Kamerazustand selbst).

## Hinweis

Falls Roundshot das Modal mit Inline-Styles direkt aufs Backdrop legt, das CSS aber durchgreift (Erfahrung aus den bisherigen Selektoren), reicht diese rein deklarative Lösung. Sollte es nach dem Deploy doch noch durchscheinen, ergänzen wir in einem Folgeschritt `body > .cdk-overlay-container` als zusätzliche Sicherung.
