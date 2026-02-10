

# Plan: Monats-Challenge mit Gold/Silber/Bronze Badges

## Uebersicht

Jeden Monat werden die Top 3 Laeufer (nach Anzahl Runs) mit einem Gold-, Silber- bzw. Bronze-Badge fuer diesen Monat ausgezeichnet. Die Badges sind permanent und sammeln sich ueber die Monate an.

## 1. Datenbank-Aenderungen

### Neue Tabelle: `monthly_challenge_winners`

```sql
CREATE TABLE monthly_challenge_winners (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL,
  year integer NOT NULL,
  month integer NOT NULL, -- 1-12
  rank integer NOT NULL,  -- 1=Gold, 2=Silber, 3=Bronze
  total_runs integer NOT NULL,
  awarded_at timestamptz NOT NULL DEFAULT now(),
  UNIQUE(year, month, rank)
);
```

- RLS: Authentifizierte User koennen alle Eintraege lesen (fuer Anzeige)
- Kein INSERT/UPDATE/DELETE fuer normale User (nur Edge Function mit Service Role)

### Kein neuer achievement_type Enum noetig

Die monatlichen Badges sind ein separates System (eigene Tabelle), nicht Teil der bestehenden `user_achievements`. Das haelt es sauber getrennt, da monatliche Badges sich jeden Monat wiederholen koennen.

## 2. Edge Function: `check-monthly-challenge`

Neue Edge Function die am Ende jedes Monats (oder on-demand) aufgerufen wird:

- Zaehlt DISTINCT `activity_id` pro User fuer den angegebenen Monat/Jahr
- Ermittelt Top 3 Laeufer
- Schreibt Ergebnisse in `monthly_challenge_winners`
- Bei Gleichstand: User mit mehr unique Segmenten gewinnt (sekundaerer Tiebreaker)

Parameter: `{ year: number, month: number }` (Default: vorheriger Monat)

## 3. Frontend: Monats-Challenge Leaderboard

### Neue Komponente: `MonthlyChallenge.tsx`

- Zeigt aktuellen Monat mit Countdown (Tage verbleibend)
- Top 10 Laeufer des aktuellen Monats (live aus `check_ins` berechnet)
- Gold/Silber/Bronze Icons fuer Platz 1-3
- Vergangene Monate: kleine Badge-Uebersicht der Gewinner

### Integration auf der Startseite (`Index.tsx`)

- Tabs oder untereinander: "365-Tage Challenge" und "Monats-Challenge {Monat}"
- Monats-Challenge wird neben dem bestehenden Leaderboard angezeigt

### Profil-Anzeige

- Gesammelte monatliche Medaillen auf dem Profil anzeigen (z.B. "3x Gold, 1x Silber, 2x Bronze")

## 4. Automatische Auswertung

Zwei Optionen fuer die monatliche Auswertung:

**Option A**: Cron-Job (wie bei Webcam) - laeuft am 1. jedes Monats
**Option B**: Lazy Evaluation - beim Laden der Monats-Challenge wird geprueft ob der Vormonat schon ausgewertet wurde

Empfehlung: **Option B** (einfacher, kein zusaetzlicher Cron noetig). Die Edge Function prueft beim Aufruf, ob der Vormonat Gewinner hat, und wertet ihn ggf. aus.

## Dateien die erstellt/geaendert werden

| Datei | Aenderung |
|-------|----------|
| Migration SQL | Neue Tabelle `monthly_challenge_winners` + RLS |
| `supabase/functions/check-monthly-challenge/index.ts` | Neue Edge Function |
| `supabase/config.toml` | Neue Function registrieren |
| `src/components/MonthlyChallenge.tsx` | Neue Komponente |
| `src/pages/Index.tsx` | MonthlyChallenge einbinden |
| `src/pages/Profile.tsx` | Monatliche Medaillen anzeigen |
| `src/pages/PublicProfile.tsx` | Monatliche Medaillen anzeigen |

## Resultierende Darstellung auf der Startseite

```
+------------------------------------------+
| 365-Tage Challenge 2026                  |
| (bestehendes Leaderboard)                |
+------------------------------------------+
| Monats-Challenge Februar 2026            |
| Noch X Tage | Gold/Silber/Bronze Icons   |
| 1. [Gold]   Laeufer A    12 Runs        |
| 2. [Silber] Laeufer B     9 Runs        |
| 3. [Bronze] Laeufer C     7 Runs        |
| 4.          Laeufer D     5 Runs        |
| ...                                      |
+------------------------------------------+
```

