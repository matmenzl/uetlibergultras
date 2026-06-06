
# Strava API 2026 Compliance – Komplett-Plan

Ziel: Volle Konformität mit der ab 1. Juni 2026 gültigen Strava API Policy. Wir adressieren alle kritischen Punkte in **einem** Bundle, mit klarer Reihenfolge.

## Was wir abdecken

| Section | Thema | Massnahme |
|---|---|---|
| 2.1 | Consent-Disclosure beim OAuth | Consent-Screen-Text + Privacy Page |
| 2.5 / 7.4 | Recht auf Löschung + Bestätigung | "Account löschen" Button + Email |
| 5.3 | Kein AI/ML mit Strava-Daten | Memory-Guardrail (no impl. change) |
| 5.4 | Keine Aggregate/Analytics | Community Stats prüfen, ggf. anpassen |
| 5.5 | Kein Persistent Index | Memory-Guardrail |
| 5.8 | Keine Bezahl-Features auf Strava-Funktionalität | Memory-Guardrail |
| 5.10 | Keine Strava-Details an Dritte | Email-Templates auditieren |
| 5.16 | Keine MCP/Agent-Interfaces | Memory-Guardrail |
| 6.2 | 7-Tage-Cache-Limit | Retention Cron + UI fallback |
| 6.3 | 48h Reaktion auf Delete/Deauth | Webhook erweitern |
| 8.3 | 24h Breach Notification | Runbook + Memory |

---

## Teil A: Sichtbare App-Änderungen

### A1) Activity-Liste – Runs älter als 7 Tage werden geschlankt
- `activity_name`, `activity_distance`, `distance`, `elapsed_time`, `activity_elapsed_time`, `elevation_gain` → nach 7 Tagen NULL
- UI fallback: "Run vom 15. Mai" statt Strava-Name, Distanz/Zeit/Höhenmeter ausgeblendet
- Datum, Segment, Wetter, Badges bleiben sichtbar
- Leaderboards/Counts/Badges **unverändert** (zählen `count(*)`)

### A2) Profilbild – einmaliger Copy nach eigenem Storage
- Bei Login/Webhook: Strava-Avatar in `profile-pictures` Bucket kopieren
- `profiles.profile_picture` zeigt danach auf unseren Storage
- Optisch identisch, aber kein Ablaufdatum mehr
- Existierende `Strava Avatar Refresh` Memory wird ersetzt

### A3) "Account löschen" Funktion im Profil
- Neuer Button "Konto & alle Daten löschen" mit Confirm-Dialog
- Edge Function `delete-account`:
  - Löscht `check_ins`, `strava_credentials`, `manual_run_uploads`, `user_achievements`, `monthly_challenge_winners`, `profiles`, Storage-Avatar, auth.user
  - Behält anonymisierte Aggregate falls rechtlich nötig (vermutlich nicht)
- Schickt Bestätigungs-Email via Resend: "Dein Uetliberg Ultras Konto und alle Daten wurden am DATUM gelöscht."
- Logout + Redirect auf `/`

### A4) Consent-Screen vor Strava-Connect
- Neue Seite/Modal `/connect/strava` mit Liste:
  - Welche Daten: Aktivitäten (Name, Distanz, Zeit, GPS, Datum), Profilbild, Vor-/Nachname
  - Wie: OAuth + Webhook bei neuen Aktivitäten
  - Wie zurückziehen: in Strava-Settings ODER über "Konto löschen"
  - Wie Daten löschen: über "Konto löschen" Funktion mit Email-Bestätigung
- Checkbox "Ich stimme zu" → erst dann startet OAuth
- Link auf neue `/privacy` Seite

### A5) Privacy Policy Page `/privacy`
- Welche Daten wir verarbeiten (Strava, Email, Avatar)
- Subprocessors: Lovable Cloud (Supabase), Resend, ScreenshotOne, Mapbox, Google OAuth
- Wie löschen
- Kontakt-Email
- Hinweis auf Strava Privacy Policy
- Standard Contractual Clauses Referenz für EU-Datentransfer

### A6) Community Stats prüfen (Section 5.4)
- View `community_annual_stats` checken: nur Counts erlaubt
- Falls Mittelwerte/Verteilungen drin → entfernen
- `effort_count` pro Segment: prüfen ob öffentlich angezeigt → falls ja, hinter Login

---

## Teil B: Backend-Compliance (keine UI-Änderung)

### B1) Retention Cron `strava-data-retention`
- Täglich 03:00 UTC
- NULL setzt Strava-Rohfelder in `check_ins` älter als 7 Tage
- Refresht `uetliberg_segments` älter als 7 Tage (rate-limited)
- Loggt in neue Tabelle `strava_retention_runs`

### B2) Webhook `strava-webhook` erweitern (48h)
- `object_type=activity, aspect_type=delete` → `check_ins` für `activity_id` löschen
- `object_type=athlete, updates.authorized=false` → Tokens löschen, alle source='strava' check_ins löschen, `strava_id`/`profile_picture` nullen, Badges **behalten**
- Antwort innerhalb 2s, Cleanup async (background task)

### B3) Email-Templates auditieren (Section 5.10)
- Welcome-Email, Badge-Notifications, Suggestion-Emails durchgehen
- Strava-Details (Run-Name, Distanz, Datum, Zeit) raus
- Erlaubt: "Du hast Badge X verdient", "Du bist auf Platz 3" – also abgeleitete/aggregierte Infos
- Verboten: "Dein Run am 5.6. mit 12.4 km..."

### B4) Admin-UI: Compliance Dashboard
- Card in `/admin`: Retention-Status, letzter Lauf, # geleerte Check-ins
- Liste der gelöschten Accounts (Audit)
- Manueller "Retention jetzt ausführen" Button

---

## Teil C: Memory-Guardrails (keine Code-Änderung)

Neue Memories für zukünftige Entwicklung:

- `compliance/strava-7day-cache` – 7-Tage-Regel, was bleibt, was geht
- `compliance/strava-no-ai-ml` – Section 5.3: Strava-Daten nie in LLM-Context, kein Embedding, kein RAG
- `compliance/strava-no-aggregation` – Section 5.4: keine Mittelwerte, Verteilungen, Benchmarks; nur Counts und Ranks
- `compliance/strava-no-persistent-index` – Section 5.5: keine Vector Stores mit Strava-Daten
- `compliance/strava-no-mcp` – Section 5.16: keine MCP-Server bauen
- `compliance/strava-no-paywall-on-api` – Section 5.8: keine Bezahl-Features auf Strava-Funktionalität
- `compliance/strava-no-third-party-data` – Section 5.10: keine Strava-Details an Resend/etc.
- `compliance/strava-breach-24h` – Section 8.3: 24h Breach Notification an legal@strava.com

Update bestehender Memories:
- `Strava Avatar Refresh` – ersetzt durch "Avatar im eigenen Storage"
- `Check-in Logic` – Delete/Deauthorize-Webhook ergänzt

---

## Technische Reihenfolge

```text
1. Migration: strava_retention_runs Tabelle + Index check_ins(checked_in_at)
2. Edge Function strava-data-retention + pg_cron schedule
3. Edge Function strava-webhook erweitern (delete + deauthorize)
4. Edge Function copy-strava-avatar + Trigger bei Login
5. Edge Function delete-account
6. Resend integration check (falls noch nicht für delete-confirmation)
7. UI: RunCard fallback wenn NULL
8. UI: /privacy Page
9. UI: /connect/strava Consent-Screen
10. UI: Profil "Konto löschen" Button + Modal
11. UI: Admin Compliance Card
12. Audit: community_annual_stats View prüfen, ggf. anpassen
13. Audit: Email-Templates durchgehen
14. Memories anlegen/updaten
```

---

## Bewusst NICHT im Scope

- Lazy refresh (Strava bei Anzeige neu fetchen) – API-Quota
- Löschen alter Aggregate/Badges – sind keine Strava Data
- Brand-Guidelines-Check (4.1) – separater kleiner Plan später
- Full Subscription/Tier-Handling (3.3) – aktuell nicht erzwungen

---

## Offene Punkte (Defaults gewählt, kannst widersprechen)

- **Avatar:** eigener Storage (statt 7-Tage-Refresh)
- **Retention-Aktion:** NULL setzen (statt Refresh)
- **Deauth-Achievements:** behalten (abgeleitete Daten)
- **Privacy Page:** generiert auf Basis Standard-Template, du reviewst Text
- **Delete-Confirmation Email:** via Resend (bereits konfiguriert für Suggestions)
