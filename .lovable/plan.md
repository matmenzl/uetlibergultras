## Ziel

Login-Typ in PostHog eindeutig als `auth_method: 'strava' | 'email'` tracken, statt des semantisch unklaren `strava_user: true/false`.

## Änderungen

### 1. `src/hooks/usePostHogTracking.ts`
Beim `identifyUser`-Aufruf zusätzlich `auth_method` setzen:

```ts
const authMethod = data?.strava_id ? 'strava' : 'email';
identifyUser(userId, {
  auth_method: authMethod,            // 'strava' | 'email' — eindeutig
  strava_user: data?.strava_id != null, // bleibt für Rückwärtskompatibilität bestehender Insights
  founding_member: data?.is_founding_member ?? false,
  user_number: data?.user_number ?? undefined,
});
```

`strava_user` lassen wir vorerst stehen, damit bestehende PostHog-Dashboards nicht brechen. Kann nach Migration der Insights entfernt werden.

### 2. `src/pages/Auth.tsx`
Beim erfolgreichen Login das gewählte Verfahren sofort als Event + Person Property setzen, damit die Information schon vor dem ersten Profile-Read korrekt ist:

- In `handleStravaLogin`: vor dem Redirect zusätzlich
  `posthog.capture('login_method_selected', { method: 'strava' })` und
  `posthog.setPersonProperties({ auth_method: 'strava' })`.
- In `handleMagicLink` (nach erfolgreichem `signInWithOtp`): analog mit `method: 'email'`.

### 3. Doku-Hinweis (optional)
Kurzer Kommentar in `src/lib/posthog.ts` über dem `identifyUser`, der `auth_method` als kanonische Property dokumentiert.

## Nicht-Ziele
- Keine Änderung an Datenbank/RLS.
- Kein Entfernen von `strava_user` in diesem Schritt (separate Folgeaufgabe nach Insight-Migration).
