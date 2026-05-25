## Ziel

Die Leaderboards zeigen aktuell nur die Top 10. Du willst **alle Läufer** sehen — konsistent über alle Boards hinweg.

## Was geändert wird

**1. `src/components/Leaderboard.tsx` (365-Tage Challenge)**
- `.limit(10)` aus der Supabase-Query entfernen → alle Einträge laden.
- Container scrollbar machen (`max-h-[600px] overflow-y-auto`), damit lange Listen die Seite nicht sprengen.
- Verhalten für Gäste bleibt: Top 3 klar sichtbar, danach 4 geblurrte Zeilen als Teaser mit Login-CTA (Memory: "Guests show top 3, blur the rest").

**2. `src/components/MonthlyChallenge.tsx` (Monats-Challenge)**
- `.slice(0, 10)` entfernen → alle Teilnehmer des Monats anzeigen.
- Gleiche scrollbare Container-Lösung wie oben.
- Gast-Teaser-Logik bleibt unverändert.

**3. Nicht geändert**
- `CurrentMonthChallengeBox.tsx` zeigt bewusst nur Gold/Silber/Bronze (Top 3 Sieger des Vormonats) — das ist ein kompaktes Box-Format, kein vollständiges Ranking. Bleibt wie es ist.
- Andere Treffer (`Achievements`, `StreakCounter`, `PublicProfile`, `ManualCheckInButton`, `UetlibergPass`, `BadgeShowcase`) nutzen `check_ins`/`leaderboard_stats` für persönliche Stats, nicht für Ranglisten — keine Änderung nötig.

## Technische Details

- Supabase Default-Limit ist 1000 Zeilen pro Query. Bei aktueller Community-Grösse (wenige hundert User) reicht das problemlos. Falls die App später >1000 aktive Teilnehmer hat, müssten wir paginieren — heute nicht relevant.
- Sortierung bleibt: `total_runs DESC, achievement_count DESC` (Tie-Breaker laut Memory).
- Performance: Listen-Rendering bleibt günstig, da jede Zeile leichtgewichtig ist (Avatar + Text).

## Resultat

Eingeloggte Nutzer sehen die komplette Community-Rangliste (scrollbar). Gäste sehen weiterhin Top 3 + geblurrten Teaser, um zur Anmeldung zu motivieren.