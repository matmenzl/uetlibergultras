

# Monats-Challenge Historie: Dropdown-Filter statt Collapsible

## Konzept

Die aktuelle Collapsible-Liste aller vergangenen Monate wird durch ein Select-Dropdown ersetzt -- genau wie bei "Uetliberg-Ultras unterwegs" mit dem Zeitraum-Filter. Der User waehlt einen Monat aus dem Dropdown und sieht dann die Gewinner dieses Monats.

## Visuelles Konzept

```text
+----------------------------------------------+
| Monats-Challenge Februar                     |
|                                    Noch 18 T |
+----------------------------------------------+
| (aktuelles Live-Leaderboard wie bisher)      |
+----------------------------------------------+
| [v Vergangene Monate: Januar 2026       ]    |
|   Gold   Max M.         (12 Runs)            |
|   Silber Anna S.        (10 Runs)            |
|   Bronze Peter K.       (8 Runs)             |
+----------------------------------------------+
```

Das Dropdown zeigt alle verfuegbaren Monate als Optionen (z.B. "Januar 2026", "Dezember 2025", ...). Standardmaessig ist kein Monat ausgewaehlt und die Historie ist zugeklappt -- erst beim Auswaehlen eines Monats erscheinen die Gewinner darunter.

## Technische Umsetzung

### Datei: `src/components/MonthlyChallenge.tsx`

1. **Collapsible entfernen** -- der Import und die gesamte Collapsible-Sektion (Zeilen 10, 282-312) werden entfernt
2. **Select-Dropdown einbauen** -- Import der Select-Komponenten, ein neuer State `selectedHistoryMonth` (String wie "2026-1")
3. **Dropdown-Optionen** generieren aus den `pastWinners`-Daten: Jeder Eintrag wird zu einer SelectItem-Option (z.B. "Januar 2026")
4. **Gewinner-Anzeige** unterhalb des Dropdowns: Zeigt nur die Gewinner des ausgewaehlten Monats in der bestehenden Darstellung (Rang-Icon + Avatar + Name + Runs), jetzt aber als klickbare Links zum Profil
5. **Placeholder** im Dropdown: "Vergangene Monate" mit dem History-Icon, damit klar ist was der Filter macht

### Aenderungen im Detail

- Neuer State: `const [selectedMonth, setSelectedMonth] = useState<string>("")`
- Select mit Options aus `pastWinners.map(m => value: `${m.year}-${m.month}`, label: `${MONTHS_DE[m.month-1]} ${m.year}`)`
- Conditional Rendering: Wenn `selectedMonth` gesetzt, finde den passenden `pastWinners`-Eintrag und zeige dessen Gewinner
- Die Gewinner werden im gleichen Stil wie das aktuelle Leaderboard dargestellt (mit getRankIcon, getRankBackground, Avatar, Link zum Profil)

### Keine neuen Abhaengigkeiten

- Select-Komponente ist bereits importiert und verfuegbar
- Alle anderen benoetigten Komponenten (Avatar, Link, Icons) sind schon in der Datei

