# Plan: Eigene Run-Synchronisation via GPX/FIT-Upload

## Ziel

User soll einen fertig getrackten Run (Apple Health, Strava-Export, Garmin Connect) als Datei in die App laden. Die App matched die GPS-Spur gegen die `uetliberg_segments`-Polylines und legt für jedes erkannte Segment einen Check-in an — identisch zum Strava-Webhook-Pfad.

**Kein** Live-Tracking, **kein** OAuth zu Garmin/Apple, **keine** neuen Datenquellen-Integrationen. Nur Datei-Upload + Matching.

## User Flow

1. User klickt auf Profil-Seite "Run hochladen"
2. Datei-Picker akzeptiert `.gpx`, `.tcx`, `.fit`
3. Upload → Edge Function parsed die Datei, extrahiert Trackpoints (lat/lng/time)
4. Server matched gegen alle aktiven Uetliberg-Segmente
5. Für jedes erkannte Segment: Check-in wird angelegt (mit Wetter, Distanz, Zeit)
6. UI zeigt "X Segmente erkannt" + Liste der Treffer + Confetti bei neuen Badges
7. `check-achievements` wird wie beim Strava-Pfad getriggert

## Scope-Grenzen

- Nur Läufe (kein Bike/Hike)
- Nur Trackpoints mit Zeitstempel
- Max. eine Datei pro Upload, max. 10 MB
- Cutoff-Datum 1.1.2026 gilt weiter (ältere Runs werden ignoriert)
- Keine Dedup mit Strava-Activities in Phase 1 — Hinweistext: "Wenn du Strava verbunden hast, wird dein Run automatisch synct. Diese Funktion ist für User ohne Strava."

## Datenmodell

Neue Tabelle `manual_run_uploads` zum Tracking der Uploads (für Debugging + UI-History):

- `id`, `user_id`, `filename`, `format` (gpx/tcx/fit)
- `started_at`, `distance_m`, `elapsed_s`, `trackpoint_count`
- `segments_matched` (int), `check_ins_created` (int)
- `status` (pending/processed/failed), `error`
- RLS: User sieht eigene, Admin alle

`check_ins` bekommt zwei optionale Spalten:
- `source` (text, default `'strava'`, neue Werte: `'manual_upload'`)
- `upload_id` (uuid, FK auf `manual_run_uploads`, nullable)

`activity_id` wird für Upload-Check-ins aus einem deterministischen Hash (user_id + started_at) erzeugt, damit der bestehende Unique-Constraint (`user_id, segment_id, activity_id`) funktioniert.

## Segment-Matching-Algorithmus

Pro Segment:
1. Decode `polyline` zu Lat/Lng-Punkten
2. Prüfe ob die Trackpoint-Spur in Reihenfolge nahe an Start- und End-Punkt des Segments vorbeikommt (Toleranz ~25 m)
3. Wenn ja: schneide den Trackpoint-Abschnitt zwischen Start- und End-Match heraus
4. Validiere Richtung: durchschnittliche Distanz der Trackpoints zur Segment-Polyline < 30 m (Frechet-Approximation oder Punkt-zu-Polyline-Mittel)
5. Bei Match: berechne `elapsed_time` und `distance` aus dem Abschnitt

Library: `@mapbox/polyline` (decode) + eigene Haversine-Helper. Kein externes Matching-SDK nötig.

## Edge Function `upload-run`

- `verify_jwt`-Validation in-code
- Akzeptiert multipart/form-data
- Parser:
  - GPX/TCX → XML, mit `fast-xml-parser` (npm:)
  - FIT → `fit-file-parser` (npm:) — falls Bundle zu gross, in Phase 1 nur GPX/TCX und FIT später
- Schreibt `manual_run_uploads`-Row, matched, schreibt Check-ins, ruft `check-achievements`

## UI-Änderungen

- `src/components/ManualRunUploadButton.tsx` (neu) — neben `ManualCheckInButton` auf `/profile`
- Dialog mit Datei-Picker, Progress, Resultate
- Hinweistext-Box: "Du nutzt Strava? Verbinde stattdessen dein Konto für automatische Syncs."
- Auf `/profile` kleine History der letzten 5 Uploads (Erfolg/Fehler)

## Phasen

1. **Phase 1 (MVP):** GPX + TCX Upload, Matching, Check-ins, einfache UI. Ziel: erster Nicht-Strava-User kann mitmachen.
2. **Phase 2:** FIT-Support (Garmin native)
3. **Phase 3:** Drag & Drop Multi-File, Dedup gegen Strava-Activities, Upload-Verlauf-Seite

## Offene Punkte

1. Toleranzwerte für Matching (25/30 m) — final mit ein paar Test-GPX validieren
2. Soll der Upload-Button auch für Strava-User sichtbar sein, oder nur für User ohne `strava_credentials`?
3. Sollen Manual-Upload-Check-ins im Leaderboard mit Icon markiert werden (Transparenz)?
