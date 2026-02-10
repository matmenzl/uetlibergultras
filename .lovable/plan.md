

## Profilbild automatisch aktualisieren

### Problem
Strava-Profilbild-URLs laufen nach einiger Zeit ab. Aktuell wird das Bild nur beim Login (strava-auth-exchange) aktualisiert. Nutzer, die sich selten neu anmelden, haben veraltete URLs.

### Loesung
Das Profilbild wird zusaetzlich bei jeder Webhook-Aktivitaet (neue Runs) automatisch aktualisiert, da wir dort bereits einen gueltig authentifizierten API-Zugang haben.

### Aenderungen

**1. strava-webhook/index.ts erweitern**
- Nach dem Abrufen der Aktivitaetsdetails wird zusaetzlich der Strava-Athleten-Endpunkt (`/api/v3/athlete`) aufgerufen
- Das Profilbild (`athlete.profile`) wird in der `profiles`-Tabelle aktualisiert
- Dies geschieht nur bei `create`/`update` Events (nicht bei `delete`)
- Ein einzelner zusaetzlicher API-Call pro Webhook-Event

**2. Ablauf**

```text
Strava Webhook (neue Aktivitaet)
  |
  +-> Aktivitaet abrufen (bestehend)
  +-> Athleten-Profil abrufen (NEU)
  +-> Profilbild in DB aktualisieren (NEU)
  +-> Check-Ins erstellen (bestehend)
```

### Technische Details

- In der `processActivityEvent` Funktion wird nach dem Token-Refresh ein zusaetzlicher Fetch auf `https://www.strava.com/api/v3/athlete` durchgefuehrt
- Das Ergebnis wird per `supabaseAdmin.from('profiles').update({ profile_picture: athlete.profile })` gespeichert
- Fehler beim Bild-Update sind nicht-fatal (werden geloggt, blockieren aber nicht die Verarbeitung)

