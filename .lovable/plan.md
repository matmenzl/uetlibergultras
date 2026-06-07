## Return Visitor Tracking auf der Landing Page

1. Importiere `posthog` zusätzlich zu `track` aus `@/lib/posthog` in `src/pages/Index.tsx`.
2. Füge im bestehenden `useEffect` (leeres Dependency Array `[]`) direkt nach dem `track('onboarding_landing_viewed', …)`-Aufruf folgenden Code ein:

````text
  const visits = parseInt(localStorage.getItem('lu_visits') || '0') + 1;
  localStorage.setItem('lu_visits', String(visits));
  if (visits > 1) {
    posthog.setPersonProperties({ is_returning_visitor: true });
  }
````

Der Code läuft einmalig beim ersten Render, aktualisiert den `lu_visits`-Counter im `localStorage` und markiert bei wiederholten Besuchen die Person in PostHog als `is_returning_visitor`.