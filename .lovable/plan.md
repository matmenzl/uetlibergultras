# Install-to-Homescreen für Mobile

## Ziel
Mobile Besucher sehen eine fixed Box am unteren Bildschirmrand, die zum Speichern der App auf dem Homescreen einlädt. Android nutzt den nativen Install-Dialog, iOS bekommt eine kurze Anleitung.

## Was wir bauen

### 1. Web-App-Manifest (`public/manifest.json`)
- `name`: "Uetliberg Ultras"
- `short_name`: "Ultras"
- `start_url`: "/"
- `display`: "standalone"
- `theme_color` & `background_color` passend zum Design-Token
- Icons: bestehende `apple-touch-icon.png` + `favicon.svg` referenzieren (192/512 falls vorhanden, sonst eine 512er generieren)

In `index.html` einbinden via `<link rel="manifest" href="/manifest.json">`.

### 2. Komponente `InstallPrompt.tsx`
Fixed Box unten (`bottom-4 inset-x-4`, `z-40`), nur auf Mobile (`useIsMobile`).

Verhalten:
- **Android/Chrome**: Fängt `beforeinstallprompt`-Event ab, zeigt Button "App installieren" → ruft `prompt()` auf.
- **iOS Safari** (UA-Detection): Zeigt Text "Tippe auf ⎘ und 'Zum Home-Bildschirm'" mit Share-Icon.
- **Bereits installiert** (`display-mode: standalone` oder `navigator.standalone`): Box wird nicht gezeigt.
- **Dismiss**: X-Button speichert `install-prompt-dismissed` in localStorage → erscheint nicht mehr.

Design: Card mit Logo links, kurzem Text, CTA-Button rechts, X zum Schliessen. Verwendet semantische Tokens (`bg-card`, `border-border`, `shadow-lg`).

### 3. Einbinden
In `App.tsx` global rendern (innerhalb `BrowserRouter`, ausserhalb `Routes`), damit es auf jeder Seite verfügbar ist.

## Wichtige Hinweise
- **Kein Service Worker** → keine Offline-Funktion, dafür keine Caching-Probleme im Lovable-Editor-Preview.
- **iOS-Limit**: Apple bietet keine API um den "Add to Homescreen"-Dialog programmatisch zu öffnen – wir können dort nur eine Anleitung anzeigen. Das ist eine OS-Beschränkung, nicht behebbar.
- Box erscheint nicht in der nativen Capacitor-App (dort ist sie schon installiert).

## Technische Details
- Detection: `window.matchMedia('(display-mode: standalone)').matches` + `(navigator as any).standalone` für iOS-PWA-Mode.
- iOS-UA: `/iPhone|iPad|iPod/.test(navigator.userAgent) && !(window as any).MSStream`.
- Capacitor: `import { Capacitor } from '@capacitor/core'; Capacitor.isNativePlatform()` → Box ausblenden.

## Dateien
- Neu: `public/manifest.json`, `src/components/InstallPrompt.tsx`
- Edit: `index.html` (Manifest-Link), `src/App.tsx` (Komponente einbinden)
