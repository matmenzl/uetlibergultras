## Ziel

Eingeloggte User sollen bei jedem Besuch (und live während einer Session) sehen, welche Badges neu freigeschaltet wurden – via Sonner-Toast, app-weit, unabhängig von der aktuellen Seite.

## Aktueller Stand

- Sonner ist bereits in `App.tsx` gemountet.
- `UetlibergPass.tsx` erkennt zwar "newlyEarned" für die Animation auf der Pass-Seite, zeigt aber **keinen** Toast und funktioniert nur, wenn der User die Pass-Seite öffnet.
- Es gibt keinen globalen Listener auf `user_achievements`.
- `mem://features/badge-notification-strategy` sieht In-App-Toast + Resend-Mail vor. E-Mail-Versand ist nicht Teil dieses Requests.

## Neuer Mechanismus

Neue Komponente `BadgeNotifier` – wird einmalig in `App.tsx` innerhalb des `QueryClientProvider`/Router gemountet und macht keine UI sichtbar, sondern feuert nur Toasts.

### Logik

1. **Auth-Listener** – `supabase.auth.getSession()` + `onAuthStateChange` ermitteln die aktuelle `userId`. Bei Logout: Cleanup, keine Toasts.
2. **Initial-Fetch nach Login/Reload**:
   - Lade alle `user_achievements` des Users (id, achievement, earned_at).
   - Vergleich gegen `localStorage["seen_achievements:<userId>"]` (Set von `achievement`-IDs).
   - Beim **allerersten Mal** (kein Eintrag im LocalStorage) → alle als "gesehen" markieren, **keinen** Toast feuern (sonst kriegt jeder Bestandsnutzer beim Rollout 16 Toasts).
   - Danach: für jede unbekannte Achievement-ID einen Toast feuern (max. ein Toast pro Badge, gestaffelt mit 400 ms Delay damit Sonner sie stapelt statt überschreibt).
   - Set in LocalStorage aktualisieren.
3. **Realtime-Subscription** auf `user_achievements WHERE user_id=eq.<userId>` (INSERT). Bei jedem neuen Insert während offener Session: Toast + LocalStorage-Update. Channel beim Unmount/Logout sauber abmelden.

### Toast-Inhalt

- `toast.success` mit:
  - **Title:** Badge-Name aus `badgeDefinitions` (Fallback: rohe ID).
  - **Description:** `description` des Badges (kurz).
  - **Action-Button** "Anschauen" → navigiert zu `/pass`.
  - **Duration:** 8000 ms (etwas länger als Default).
- Unbekannte Achievement-IDs (z. B. neue Server-Badges, die das Frontend noch nicht kennt): generischer Text "Neues Badge freigeschaltet!".

### LocalStorage-Schlüssel

`uu:seen_achievements:<userId>` (JSON-Array). User-spezifisch, damit Geräte-Sharing / Account-Wechsel kein Cross-Talk erzeugen.

## Zu ändernde Dateien

- **Neu:** `src/components/BadgeNotifier.tsx` – die oben beschriebene Logik.
- **Bearbeiten:** `src/App.tsx` – `<BadgeNotifier />` einmal mounten (im authentifizierten Tree, neben `<Sonner />`).

Keine Backend-, RLS- oder Migrationsänderungen nötig. `user_achievements` hat bereits eine SELECT-Policy für authentifizierte User. Realtime für die Tabelle muss eventuell via `ALTER PUBLICATION supabase_realtime ADD TABLE public.user_achievements;` aktiviert werden – das wird im Build-Step geprüft und ggf. per Migration ergänzt.

## Nicht Teil dieses Plans

- E-Mail-Benachrichtigungen (Resend) – separater Request.
- Push-Notifications.
- Anpassung des Pass-Animation-Flows in `UetlibergPass.tsx` (bleibt wie ist).
