
# Plan: "Gründungsmitglied" Achievement aktivieren

## Problem
Das `founding_member` Achievement wird nie vergeben, obwohl 9 User das Flag `is_founding_member = true` in ihrem Profil haben. Die Edge Function `check-achievements` enthält keine Logik für dieses Achievement.

## Lösung

### Änderung in `supabase/functions/check-achievements/index.ts`

**1. AchievementType erweitern (Zeile 9-30)**
```typescript
type AchievementType = 
  | 'first_run'
  | 'runs_5'
  // ... bestehende ...
  | 'wasserratte'
  | 'founding_member';  // NEU
```

**2. Profil-Abfrage hinzufügen (nach Zeile 95)**
```typescript
// Get user profile for founding member status
const { data: profile } = await supabaseAdmin
  .from('profiles')
  .select('is_founding_member')
  .eq('id', userId)
  .single();
```

**3. Achievement-Prüfung hinzufügen (nach den Weather-Checks, ca. Zeile 325)**
```typescript
// Check Founding Member achievement
if (profile?.is_founding_member === true && !existingSet.has('founding_member')) {
  newAchievements.push('founding_member');
}
```

## Technische Details

Die Logik ist simpel:
- Wenn `profiles.is_founding_member = true` UND der User das Achievement noch nicht hat
- Dann wird `founding_member` zu den neuen Achievements hinzugefügt

Das Achievement ist permanent (wird nie entfernt), da Founding Member Status sich nicht ändert.

## Dateien die geändert werden

| Datei | Änderung |
|-------|----------|
| `supabase/functions/check-achievements/index.ts` | AchievementType + Profil-Abfrage + Prüflogik |

## Nach dem Deployment

Nach dem Deployment der Edge Function werden die 9 bestehenden Founding Members bei ihrem nächsten Check-In automatisch das Achievement erhalten. 

Optional könnte man auch manuell die Edge Function für alle Founding Members aufrufen, um die Badges sofort zu vergeben.
