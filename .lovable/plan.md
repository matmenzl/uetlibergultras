## Ziel

Den Admin-Resync so umbauen, dass er Stravas Limits (100 Requests / 15 Min, 1000 / Tag pro App) zuverlässig einhält, **nie ein 429 provoziert** und auch über den Edge-Function-Timeout (~150 s) hinweg sauber weiterläuft – statt wie heute mitten im 4. User abzubrechen.

## Was heute schiefgeht

- Der Resync läuft alle 14 User in einer einzigen Function-Instanz.
- Nur reaktive 60 s-Wartezeit bei 429 – das Limit-Budget wird vorher schon aufgebraucht.
- Bei Timeout (oder Crash) ist der Fortschritt weg, weil pro User nichts persistiert wird.

## Lösung in 3 Bausteinen

### 1) Strava-Limit-Header lesen (proaktiv statt reaktiv)

Strava liefert in **jeder** Antwort:
- `X-RateLimit-Usage: short,long` (z. B. `87,432`)
- `X-RateLimit-Limit: 100,1000`
- `X-ReadRateLimit-Usage/Limit` (read-spezifisch)

Wir bauen einen kleinen `stravaFetch(url, token)`-Wrapper, der:
- die Header nach jedem Call ausliest,
- ein gemeinsames In-Memory-Budget aktualisiert,
- **vor** dem nächsten Call prüft: bei `short_usage ≥ 90` → bis zum nächsten 15-Min-Slot (`:00 / :15 / :30 / :45`) schlafen,
- bei `long_usage ≥ 950` → Sync sauber abbrechen und für den nächsten Tag vormerken,
- 429 weiterhin als Fallback abfängt.

### 2) Persistenter Resync-State (resumierbar)

Neue Tabelle `resync_jobs`:

```text
id, segment_id (nullable), status (queued|running|paused|done|failed),
current_user_id, processed_user_ids[], total_users,
check_ins_created, rate_limit_short, rate_limit_long,
last_heartbeat_at, resume_after, created_by, created_at, finished_at
```

Im Lauf:
- Job wird angelegt → User-Liste eingefroren.
- Pro verarbeitetem User: `processed_user_ids` + `check_ins_created` + Heartbeat updaten.
- Pro User: nach erfolgreichem Monat den Fortschritt in `profiles.initial_sync_months_done` schreiben (nutzen wir schon).

### 3) Selbst-fortsetzender Lauf (gegen Timeout)

In der Function:
- Job laden, dort weitermachen wo `processed_user_ids` aufhört.
- **Zeit-Budget** pro Invocation (z. B. 120 s). Wenn überschritten → Status `paused`, `resume_after = now()` setzen, sauber returnen.
- Direkt vor dem Return einen **Self-Trigger** absetzen: `fetch(SUPABASE_URL/functions/v1/admin-resync-segment, { body: { job_id } })` mit Service-Role-Key.
- Ebenso bei Rate-Limit-Pause: `resume_after = nächster 15-Min-Slot` setzen und einen **pg_cron-One-Shot** registrieren, der den Job zur passenden Zeit wieder anstösst (oder ein bestehender 1-Minuten-Cron picked queued/paused Jobs mit `resume_after <= now()`).

So läuft der Sync in vielen kleinen, limit-konformen Häppchen weiter, ohne dass ein Admin manuell neu starten muss.

## Admin-UI (minimal)

Im Admin-Panel beim Resync-Button:
- Status-Badge: `running 5/14 · short 73/100 · pausiert bis 15:45`.
- Button „Resync starten" (legt Job an), „Abbrechen" (setzt Status `failed`).
- Polling alle 5 s auf `resync_jobs`.

## Was sich **nicht** ändert

- Kein neuer Provider, kein neuer Secret.
- Logik welche Aktivitäten in Check-ins werden, bleibt 1:1.
- Cutoff 1.1.2026 bleibt.
- Manuelle Check-ins und Webhook bleiben unberührt.

## Technische Details

- Neue Datei `supabase/functions/_shared/stravaRateLimit.ts` mit `stravaFetch` + Budget-Singleton (pro Invocation, plus Persistenz im Job-Record).
- Migration: Tabelle `resync_jobs` mit RLS „nur Admins lesen/schreiben" + Index auf `(status, resume_after)`.
- `admin-resync-segment` umbauen auf job-basiertes Modell; alter „one-shot start"-Modus bleibt als POST-Einstieg, legt aber jetzt nur den Job an.
- Optionaler 1-Minuten-Cron `resync-job-runner`, der `paused/queued`-Jobs mit fälligem `resume_after` anstösst (per `pg_net.http_post`).
- Heartbeat-Watchdog: Jobs ohne Heartbeat > 5 Min → automatisch auf `paused` zurückgesetzt, damit ein gecrashter Lauf nicht hängen bleibt.

## Offene Frage

Möchtest du den Self-Trigger lieber **rein per pg_cron** (sauber, etwas träger) oder **Function ruft sich selbst auf** (schneller, braucht Service-Role-Call)? Default-Vorschlag: **beides** – Self-Call für schnelle Fortsetzung nach Timeout, Cron als Sicherheitsnetz für Rate-Limit-Pausen > 1 Min.
