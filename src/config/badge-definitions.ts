import { ComponentType, SVGProps } from "react";

export type BadgeCategory = "milestone" | "endurance" | "weather" | "community" | "legend";

export interface BadgeDefinition {
  id: string;
  category: BadgeCategory;
  title: string;
  description: string;
  howToEarn: string;
  symbolId: string; // Reference to symbol component (fallback)
  imageUrl?: string; // Optional 3D clay image path (preferred over symbolId)
  colors: {
    primary: string; // HSL values for primary color
    secondary?: string; // Optional accent
    background: string; // Shield fill
  };
  target?: number;
  progressType?: "runs" | "streak" | "segments" | "snow_runs" | "frost_runs" | "rain_runs" | "coiffeur_runs";
}

// Category styling configuration
export const categoryStyles: Record<
  BadgeCategory,
  {
    primaryHsl: string;
    glowColor: string;
    label: string;
  }
> = {
  milestone: {
    primaryHsl: "45 93% 47%", // Gold
    glowColor: "hsl(45, 93%, 47%)",
    label: "Meilenstein",
  },
  endurance: {
    primaryHsl: "12 76% 61%", // Orange/Flame
    glowColor: "hsl(12, 76%, 61%)",
    label: "Ausdauer",
  },
  weather: {
    primaryHsl: "199 89% 48%", // Sky Blue
    glowColor: "hsl(199, 89%, 48%)",
    label: "Wetter",
  },
  community: {
    primaryHsl: "142 71% 45%", // Forest Green
    glowColor: "hsl(142, 71%, 45%)",
    label: "Community",
  },
  legend: {
    primaryHsl: "280 68% 60%", // Royal Purple
    glowColor: "hsl(280, 68%, 60%)",
    label: "Legende",
  },
};

// All badge definitions
export const badgeDefinitions: BadgeDefinition[] = [
  // === MILESTONE BADGES ===
  {
    id: "first_run",
    category: "milestone",
    title: "Ein Mal ist keinmal",
    description: "Dein erster Schritt auf den Uetliberg",
    howToEarn: "Absolviere deinen ersten Uetliberg-Lauf",
    symbolId: "mountain-single",
    colors: {
      primary: "45 93% 47%",
      background: "40 20% 95%",
    },
    target: 1,
    progressType: "runs",
  },
  {
    id: "runs_5",
    category: "milestone",
    title: "I got 5 on it",
    description: "5 Besteigungen geschafft",
    howToEarn: "Besteige den Uetliberg 5 Mal",
    symbolId: "mountain-five",
    colors: {
      primary: "45 93% 47%",
      background: "40 20% 95%",
    },
    target: 5,
    progressType: "runs",
  },
  {
    id: "runs_10",
    category: "milestone",
    title: "Bergfloh",
    description: "10 Besteigungen - nicht schlecht",
    howToEarn: "Besteige den Uetliberg 10 Mal",
    symbolId: "mountain-ten",
    colors: {
      primary: "45 93% 47%",
      background: "40 20% 95%",
    },
    target: 10,
    progressType: "runs",
  },
  {
    id: "runs_25",
    category: "milestone",
    title: "Bergziege",
    description: "25 Besteigungen - beeindruckend!",
    howToEarn: "Besteige den Uetliberg 25 Mal",
    symbolId: "mountain-twentyfive",
    colors: {
      primary: "45 93% 47%",
      background: "40 20% 95%",
    },
    target: 25,
    progressType: "runs",
  },
  {
    id: "runs_50",
    category: "milestone",
    title: "Nifty Fifty",
    description: "50 Besteigungen - eine wahre Leistung",
    howToEarn: "Besteige den Uetliberg 50 Mal",
    symbolId: "mountain-fifty",
    colors: {
      primary: "45 93% 47%",
      background: "40 20% 95%",
    },
    target: 50,
    progressType: "runs",
  },
  {
    id: "runs_100",
    category: "milestone",
    title: "🐐",
    description: "100 Besteigungen - legendär!",
    howToEarn: "Besteige den Uetliberg 100 Mal",
    symbolId: "mountain-hundred",
    colors: {
      primary: "45 93% 47%",
      secondary: "280 68% 60%",
      background: "40 20% 95%",
    },
    target: 100,
    progressType: "runs",
  },

  // === ENDURANCE BADGES ===
  {
    id: "streak_2",
    category: "endurance",
    title: "Doppio",
    description: "2 Wochen am Stück aktiv",
    howToEarn: "Laufe 2 Wochen in Folge auf den Uetliberg",
    symbolId: "flame-double",
    colors: {
      primary: "12 76% 61%",
      background: "40 20% 95%",
    },
    target: 2,
    progressType: "streak",
  },
  {
    id: "streak_4",
    category: "endurance",
    title: "Four to the floor",
    description: "4 Wochen Durchhaltevermögen",
    howToEarn: "Laufe 4 Wochen in Folge auf den Uetliberg",
    symbolId: "flame-quad",
    colors: {
      primary: "12 76% 61%",
      background: "40 20% 95%",
    },
    target: 4,
    progressType: "streak",
  },
  {
    id: "streak_8",
    category: "endurance",
    title: "Achtsam",
    description: "8 Wochen - nichts hält dich auf",
    howToEarn: "Laufe 8 Wochen in Folge auf den Uetliberg",
    symbolId: "flame-eight",
    colors: {
      primary: "12 76% 61%",
      secondary: "45 93% 47%",
      background: "40 20% 95%",
    },
    target: 8,
    progressType: "streak",
  },
  {
    id: "all_segments",
    category: "endurance",
    title: "Pfadfinder",
    description: "Alle Routen erkundet",
    howToEarn: "Laufe alle Uetliberg-Segmente mindestens einmal",
    symbolId: "paths",
    colors: {
      primary: "12 76% 61%",
      background: "40 20% 95%",
    },
    progressType: "segments",
  },

  // === WEATHER BADGES ===
  {
    id: "early_bird",
    category: "weather",
    title: "Early Bird",
    description: "Vor Sonnenaufgang unterwegs",
    howToEarn: "Starte einen Lauf vor 6:00 Uhr",
    symbolId: "sunrise",
    colors: {
      primary: "35 91% 55%",
      secondary: "199 89% 48%",
      background: "40 20% 95%",
    },
  },
  {
    id: "night_owl",
    category: "weather",
    title: "Fledermaus",
    description: "Die Dunkelheit ist dein Freund",
    howToEarn: "Starte einen Lauf nach 21:00 Uhr",
    symbolId: "moon",
    colors: {
      primary: "230 35% 35%",
      secondary: "45 93% 70%",
      background: "230 25% 15%",
    },
  },
  {
    id: "snow_bunny",
    category: "weather",
    title: "Schneehase",
    description: "Laufen bei Schneefall",
    howToEarn: "Laufe 3 mal bei Schnee auf den Uetliberg",
    symbolId: "snowflake",
    colors: {
      primary: "199 89% 70%",
      background: "199 30% 95%",
    },
    target: 3,
    progressType: "snow_runs",
  },
  {
    id: "frosty",
    category: "weather",
    title: "Ice Ice Baby",
    description: "Unter null Grad unterwegs",
    howToEarn: "Laufe 5 mal bei Temperaturen unter 0°C",
    symbolId: "frost",
    colors: {
      primary: "199 89% 48%",
      background: "199 30% 95%",
    },
    target: 5,
    progressType: "frost_runs",
  },
  {
    id: "wasserratte",
    category: "weather",
    title: "Nicht aus Zucker",
    description: "Regen kann dich nicht stoppen",
    howToEarn: "Laufe 5 mal bei Regen auf den Uetliberg",
    symbolId: "rain",
    colors: {
      primary: "199 89% 48%",
      background: "40 20% 95%",
    },
    target: 5,
    progressType: "rain_runs",
  },

  // === COMMUNITY BADGES ===
  {
    id: "founding_member",
    category: "community",
    title: "Gründungsmitglied",
    description: "Von Anfang an dabei",
    howToEarn: "Sei unter den ersten 100 Mitgliedern",
    symbolId: "star-founding",
    colors: {
      primary: "142 71% 45%",
      secondary: "45 93% 47%",
      background: "40 20% 95%",
    },
  },
  {
    id: "pioneer_10",
    category: "community",
    title: "Pionier",
    description: "Top 10 der Community",
    howToEarn: "Gehöre zu den Top 10 Läufern",
    symbolId: "trophy-ten",
    colors: {
      primary: "142 71% 45%",
      background: "40 20% 95%",
    },
  },
  {
    id: "pioneer_25",
    category: "community",
    title: "Vorreiter",
    description: "Top 25 der Community",
    howToEarn: "Gehöre zu den Top 25 Läufern",
    symbolId: "trophy-twentyfive",
    colors: {
      primary: "142 71% 45%",
      background: "40 20% 95%",
    },
  },
  {
    id: "pioneer_50",
    category: "community",
    title: "Wegbereiter",
    description: "Top 50 der Community",
    howToEarn: "Gehöre zu den Top 50 Läufern",
    symbolId: "trophy-fifty",
    colors: {
      primary: "142 71% 45%",
      background: "40 20% 95%",
    },
  },

  // === LEGEND BADGES ===
  {
    id: "denzlerweg_king",
    category: "legend",
    title: "S Brot isch no warm",
    description: "Meister des steilsten Weges",
    howToEarn: "Halte den Rekord auf dem Denzlerweg-Segment",
    symbolId: "crown",
    colors: {
      primary: "280 68% 60%",
      secondary: "45 93% 47%",
      background: "280 30% 15%",
    },
  },
  {
    id: "coiffeur",
    category: "legend",
    title: "Vokuhila",
    description: "Stammgast beim Coiffeur",
    howToEarn: "Laufe 10 mal im Jahr über ein Coiffeur-Segment",
    symbolId: "crown",
    colors: {
      primary: "280 68% 60%",
      secondary: "45 93% 47%",
      background: "280 30% 15%",
    },
    target: 10,
    progressType: "coiffeur_runs",
  },
  {
    id: "alternativliga",
    category: "legend",
    title: "Alternativliga",
    description: "Ohne GPS unterwegs",
    howToEarn: "Nutze den manuellen Check-in",
    symbolId: "compass",
    colors: {
      primary: "280 68% 60%",
      background: "40 20% 95%",
    },
  },

  // === MONTHLY CHALLENGE BADGES ===
  {
    id: "monthly_gold",
    category: "community",
    title: "Monats-Champion",
    description: "Platz 1 der Monats-Challenge",
    howToEarn: "Werde Monatssieger mit den meisten Runs",
    symbolId: "medal-gold",
    colors: {
      primary: "45 93% 47%",
      secondary: "45 93% 65%",
      background: "45 30% 95%",
    },
  },
  {
    id: "monthly_silver",
    category: "community",
    title: "Silber-Läufer",
    description: "Platz 2 der Monats-Challenge",
    howToEarn: "Erreiche Platz 2 in einer Monats-Challenge",
    symbolId: "medal-silver",
    colors: {
      primary: "0 0% 70%",
      secondary: "0 0% 85%",
      background: "0 0% 95%",
    },
  },
  {
    id: "monthly_bronze",
    category: "community",
    title: "Bronze-Läufer",
    description: "Platz 3 der Monats-Challenge",
    howToEarn: "Erreiche Platz 3 in einer Monats-Challenge",
    symbolId: "medal-bronze",
    colors: {
      primary: "25 70% 45%",
      secondary: "25 70% 60%",
      background: "25 30% 95%",
    },
  },
];

// Helper to get badge by ID
export function getBadgeById(id: string): BadgeDefinition | undefined {
  return badgeDefinitions.find((b) => b.id === id);
}

// Helper to get badges by category
export function getBadgesByCategory(category: BadgeCategory): BadgeDefinition[] {
  return badgeDefinitions.filter((b) => b.category === category);
}
