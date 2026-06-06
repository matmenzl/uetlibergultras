# PostHog Integration — Analytics & Onboarding-Funnel

## Ziel
PostHog einbauen, um zu verstehen **wo User im Onboarding abspringen** — vor allem beim Strava-OAuth-Flow. Keine Feature-Flags, kein Session-Recording (vorerst), nur Event-Tracking.

## Setup

### 1. Secrets & SDK
- User-Aktion: PostHog-Account erstellen (EU-Region empfohlen für DSGVO), Project-API-Key kopieren.
- Public Key (`VITE_POSTHOG_KEY`) + Host (`VITE_POSTHOG_HOST`, z. B. `https://eu.i.posthog.com`) als ENV-Variablen — Project-API-Key ist öffentlich, darf in Client.
- Package: `posthog-js`.

### 2. Provider
- Neue Datei `src/lib/posthog.ts` — initialisiert PostHog mit:
  - `autocapture: false` (wir tracken explizit)
  - `capture_pageview: false` (wir tracken manuell mit Route-Context)
  - `persistence: 'localStorage+cookie'`
  - `disable_session_recording: true`
  - `respect_dnt: true`
- In `src/main.tsx` initialisieren (vor App-Render).
- Neuer Hook `usePostHogPageviews()` in `App.tsx` — sendet `$pageview` bei Route-Change.
- Bei Login: `posthog.identify(user.id, { strava_id, founding_member })`. Bei Logout: `posthog.reset()`.

## Onboarding-Funnel Events (Hauptfokus)

Klarer 6-Schritte-Funnel, damit wir in PostHog Drop-off pro Stufe sehen:

| Step | Event | Wo |
|------|-------|-----|
| 1 | `onboarding_landing_viewed` | `Index.tsx` (Guest-View beim ersten Render) |
| 2 | `onboarding_auth_page_viewed` | `Auth.tsx` mount |
| 3 | `onboarding_strava_connect_clicked` | "Mit Strava verbinden"-Button in `Auth.tsx` |
| 4 | `onboarding_strava_callback_received` | `AuthStravaCallback.tsx` (mit `had_error: boolean`, `error_code`) |
| 5 | `onboarding_strava_auth_success` | nach erfolgreichem `setSession` in Callback |
| 6 | `onboarding_initial_sync_started` / `_completed` | Callback + späteres Sync-Status-Update |

Zusätzlich für Fehlerdiagnose:
- `onboarding_strava_auth_failed` mit Properties: `stage` (`'denied' | 'no_code' | 'exchange_failed' | 'session_failed'`), `error_message`.
- `onboarding_abandoned` — best-effort via `beforeunload` auf `/auth` und Callback-Page wenn nicht erfolgreich abgeschlossen.

## Weitere Basis-Events (Phase 1)
- `pageview` (automatisch via Router-Hook, mit `path`)
- `manual_checkin_submitted`
- `segment_suggestion_submitted`
- `profile_picture_refreshed`
- `logout_clicked`

Keine Achievement/Badge-Events vorerst — Fokus bleibt Onboarding.

## Privacy / DSGVO
- PostHog-Region: **EU** (Frankfurt).
- Keine PII in Properties (keine Namen, keine E-Mails) — nur `user.id` (UUID) + `strava_id` (numerisch).
- IP-Anonymisierung aktiv (`ip: false` in capture-Options global).
- Update `src/pages/Privacy.tsx`: Abschnitt "Analytics" hinzufügen — PostHog erwähnt, Zweck (Produktverbesserung), Opt-out via DNT.
- Optional Phase 2: Cookie-Consent-Banner mit `posthog.opt_out_capturing()` Default — vorerst nur DNT respektieren.

## Was NICHT in dieser Phase
- Keine Session-Recordings
- Keine Feature-Flags / A-B-Tests
- Keine Heatmaps
- Keine Server-Side-Events aus Edge Functions (kann später ergänzt werden, z. B. Webhook-Erfolgsrate)

## Dateien
- Neu: `src/lib/posthog.ts`, `src/hooks/usePostHogTracking.ts`
- Edit: `src/main.tsx`, `src/App.tsx`, `src/pages/Auth.tsx`, `src/pages/AuthStravaCallback.tsx`, `src/pages/Index.tsx`, `src/pages/Privacy.tsx`, `src/components/NavBar.tsx` (logout), `.env.example`
- Package: `posthog-js`

## Nach Approval
Ich frage dich nach dem PostHog-Project-API-Key + Host und lege los.
