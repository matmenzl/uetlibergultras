

# Monats-Challenge Dropdown angleichen an "Uetliberg-Ultras unterwegs"

## Was sich aendert

Der "Vergangene Monate"-Dropdown wird von unten (als separate Sektion) nach oben in die Header-Zeile verschoben -- genau wie der Zeitraum-Filter bei "Uetliberg-Ultras unterwegs".

```text
Vorher:
+----------------------------------------------+
| Trophy  Monats-Challenge Februar   Noch 17 T |
| (Leaderboard...)                             |
| [v Vergangene Monate               ] <-- unten, volle Breite
+----------------------------------------------+

Nachher:
+----------------------------------------------+
| Trophy  Monats-Challenge  [v Februar  ]      |
| (Leaderboard oder Past Winners anzeigen)     |
+----------------------------------------------+
```

## Verhalten

- Der Dropdown steht rechts neben dem Titel in der Header-Zeile
- Optionen: der aktuelle Monat (z.B. "Februar 2026") plus alle vergangenen Monate aus `pastWinners`
- Standardmaessig ist der aktuelle Monat ausgewaehlt -> zeigt das Live-Leaderboard
- Waehlt man einen vergangenen Monat -> zeigt die gespeicherten Gewinner
- Der "Noch X Tage"-Badge wird nur angezeigt, wenn der aktuelle Monat ausgewaehlt ist

## Technische Umsetzung

### Datei: `src/components/MonthlyChallenge.tsx`

1. **State aendern**: `selectedMonth` startet mit dem Wert des aktuellen Monats (z.B. `"2026-2"`) statt leer
2. **Dropdown in die Header-Zeile verschieben**: Das Select wird neben den Titel platziert (wie `TodaysRunners` Zeile 220-231), mit kompakter Breite (`w-[160px]`)
3. **Dropdown-Optionen**: Aktueller Monat als erste Option, dann alle `pastWinners`-Monate
4. **Conditional Rendering**: Wenn `selectedMonth` dem aktuellen Monat entspricht, wird das Live-Leaderboard angezeigt; andernfalls die historischen Gewinner
5. **"Noch X Tage"-Badge** nur bei aktuellem Monat sichtbar
6. **Untere Dropdown-Sektion entfernen**: Die gesamte bisherige Select-Sektion am Ende der Card wird entfernt
7. **Trophy-Icon und Titel vereinfachen**: Titel wird zu "Monats-Challenge" ohne den Monatsnamen (der Monat steht ja im Dropdown)

