import { useEffect } from 'react';
import NavBar from '@/components/NavBar';
import { Footer } from '@/components/Footer';
import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from '@/components/ui/accordion';
import { Card } from '@/components/ui/card';
import { 
  HelpCircle, 
  Mountain, 
  Trophy, 
  Flame, 
  Link as LinkIcon,
  CheckCircle,
  Users,
  Stamp,
  Calendar,
  Shield
} from 'lucide-react';
import { Seo } from '@/components/Seo';
import { badgeDefinitions, categoryStyles, type BadgeCategory } from '@/config/badge-definitions';

// Build live badge list from the single source of truth so the FAQ never drifts.
const categoryOrder: BadgeCategory[] = ['milestone', 'endurance', 'weather', 'community', 'legend'];
const badgeListText = categoryOrder
  .map((cat) => {
    const items = badgeDefinitions.filter((b) => b.category === cat);
    if (items.length === 0) return '';
    const lines = items.map((b) => `• ${b.title} – ${b.howToEarn}`).join('\n');
    return `${categoryStyles[cat].label}:\n${lines}`;
  })
  .filter(Boolean)
  .join('\n\n');
const totalBadgeCount = badgeDefinitions.length;

const faqs = [
  {
    category: 'Erste Schritte',
    icon: <Mountain className="w-5 h-5" />,
    questions: [
      {
        q: 'Was ist Uetliberg Ultras?',
        a: 'Uetliberg Ultras ist eine Community für alle, die gerne auf den Uetliberg laufen. Wir tracken deine Läufe über Strava-Segmente und belohnen dich mit Badges, Leaderboard-Plätzen und Monats-Challenges.'
      },
      {
        q: 'Wie verbinde ich mein Strava-Konto?',
        a: 'Klicke auf der Startseite auf "Los geht\'s" und autorisiere die Verbindung mit Strava. Wir benötigen Lesezugriff auf deine Aktivitäten, um deine Segment-Leistungen zu erfassen.'
      },
      {
        q: 'Welche Strava-Berechtigungen braucht die App?',
        a: 'Wir benötigen nur Lesezugriff auf deine Aktivitäten. Wir können keine Aktivitäten in deinem Namen erstellen oder ändern.'
      },
      {
        q: 'Ab wann zählen meine Läufe?',
        a: 'Die Gamification (Badges, Streaks, Leaderboards, Monats-Challenge) startet am 1. Januar 2026. Ältere Aktivitäten werden nicht gewertet.'
      }
    ]
  },
  {
    category: 'Segmente & Check-ins',
    icon: <CheckCircle className="w-5 h-5" />,
    questions: [
      {
        q: 'Was sind Segmente?',
        a: 'Segmente sind definierte Streckenabschnitte auf Strava. Wir haben spezielle Uetliberg-Segmente ausgewählt, die alle auf oder um den Uetliberg führen. Du findest sie auf der Segmente-Seite.'
      },
      {
        q: 'Wie funktioniert ein Check-in?',
        a: 'Sobald du dein Strava-Konto verbunden hast, werden deine Läufe automatisch erfasst. Immer wenn du eine Aktivität auf Strava speicherst, erkennt unsere App automatisch, ob du Uetliberg-Segmente gelaufen bist, und checkt dich ein – ohne dass du etwas tun musst. Eine Aktivität zählt dabei als ein Run, egal über wie viele Segmente sie führt. Die Verbindung bleibt aktiv, bis du sie in deinen Strava-Einstellungen unter "Apps" widerrufst.'
      },
      {
        q: 'Gibt es auch einen manuellen Check-in?',
        a: 'Ja. Wenn du ohne Strava unterwegs warst (z.B. ohne GPS oder mit anderer App), kannst du im Profil einen manuellen Check-in machen und die gelaufenen Segmente auswählen. Dafür gibt es auch das Badge "Alternativliga".'
      },
      {
        q: 'Warum wird mein Lauf nicht angezeigt?',
        a: 'Stelle sicher, dass deine Strava-Aktivität öffentlich oder für Follower sichtbar ist. Private Aktivitäten können nicht erfasst werden. Ausserdem muss deine Route das Segment vollständig abdecken.'
      }
    ]
  },
  {
    category: 'Badges',
    icon: <Stamp className="w-5 h-5" />,
    questions: [
      {
        q: 'Was sind die Badges?',
        a: 'Badges sind Auszeichnungen, die du durch deine Läufe verdienst. Sie sind in fünf Kategorien unterteilt: Meilensteine, Ausdauer, Wetter, Community und Legenden.'
      },
      {
        q: 'Welche Badges gibt es?',
        a: `Aktuell gibt es ${totalBadgeCount} Badges in fünf Kategorien:\n\n${badgeListText}`
      },
      {
        q: 'Was ist ein Streak?',
        a: 'Ein Streak zählt aufeinanderfolgende Kalenderwochen (Montag bis Sonntag), in denen du mindestens einen Uetliberg-Run absolviert hast. Lässt du eine Woche aus, wird der Streak auf 0 zurückgesetzt.'
      },
      {
        q: 'Wie sehe ich meinen Fortschritt?',
        a: 'Bei den Badges siehst du bei jedem Badge einen Fortschrittsbalken, der anzeigt, wie weit du vom Ziel entfernt bist. Verdiente Badges werden farbig und mit Datum angezeigt.'
      },
      {
        q: 'Werde ich benachrichtigt, wenn ich ein Badge bekomme?',
        a: 'Ja. Du erhältst eine In-App-Benachrichtigung, und falls du eine E-Mail hinterlegt hast, zusätzlich eine kurze Mail.'
      }
    ]
  },
  {
    category: 'Leaderboards',
    icon: <Trophy className="w-5 h-5" />,
    questions: [
      {
        q: 'Welche Leaderboards gibt es?',
        a: `Es gibt drei Leaderboards, alle sortiert nach Anzahl Runs. Bei Gleichstand teilen sich Läufer denselben Rang.\n\n1. 365-Tage Challenge: rollendes 365-Tage-Fenster ab heute zurück. Jede Aktivität mit einem Uetliberg-Segment zählt als ein Run.\n\n2. Monats-Challenge: Runs im aktuellen Kalendermonat. Die Top 3 erhalten am Monatsende automatisch das Gold-, Silber- oder Bronze-Badge.\n\n3. Uetliberg-Ultras unterwegs: gefiltert nach Zeitraum (Heute, Woche, Monat, Jahr).`
      },
      {
        q: 'Wie kann ich im Leaderboard aufsteigen?',
        a: 'Laufe regelmässig Uetliberg-Segmente! Jede Aktivität mit mindestens einem Uetliberg-Segment zählt als ein Run – egal wie viele Segmente sie enthält.'
      },
      {
        q: 'Warum sehe ich als Gast nur die Top 3?',
        a: 'Um die Privatsphäre der Community zu schützen, zeigen wir Gästen nur die Top 3 jedes Leaderboards. Logge dich ein, um alle Plätze zu sehen.'
      }
    ]
  },
  {
    category: 'Monats-Challenge',
    icon: <Calendar className="w-5 h-5" />,
    questions: [
      {
        q: 'Wie funktioniert die Monats-Challenge?',
        a: 'Jeden Monat startet eine neue Challenge bei 0. Wer am Ende des Monats (UTC) die meisten Runs hat, wird Monats-Champion. Bei Gleichstand teilen sich Läufer den Rang.'
      },
      {
        q: 'Wann werden die Monats-Badges vergeben?',
        a: 'Automatisch am Ende jedes Monats (00:00 UTC). Platz 1 erhält "Monats-Champion" (Gold), Platz 2 "Silber-Läufer", Platz 3 "Bronze-Läufer".'
      }
    ]
  },
  {
    category: 'Segment-Vorschläge',
    icon: <LinkIcon className="w-5 h-5" />,
    questions: [
      {
        q: 'Kann ich neue Segmente vorschlagen?',
        a: 'Ja! Wenn du eingeloggt bist, findest du auf der Segmente-Seite ein Formular, um neue Strava-Segmente vorzuschlagen. Admins prüfen den Vorschlag und entscheiden, ob das Segment aufgenommen wird.'
      },
      {
        q: 'Werde ich informiert, wenn mein Vorschlag angenommen wird?',
        a: 'Wenn du beim Vorschlag deine E-Mail-Adresse hinterlässt, benachrichtigen wir dich, sobald wir über deinen Vorschlag entschieden haben.'
      },
      {
        q: 'Welche Segmente werden akzeptiert?',
        a: 'Segmente sollten auf oder um den Uetliberg führen und für Trail-/Bergläufer interessant sein. Reine Strassen-Segmente oder Segmente weit vom Uetliberg entfernt werden in der Regel abgelehnt.'
      }
    ]
  },
  {
    category: 'Privatsphäre',
    icon: <Shield className="w-5 h-5" />,
    questions: [
      {
        q: 'Wer sieht meine Daten?',
        a: 'Persönliche Daten (E-Mail, Strava-Token) sind privat und nur für dich sichtbar. In Leaderboards und öffentlichen Profilen zeigen wir nur Anzeigename, Profilbild und aggregierte Run-Statistiken.'
      },
      {
        q: 'Kann ich mich abmelden?',
        a: 'Ja, jederzeit. Du kannst die Strava-Verbindung in deinen Strava-Einstellungen unter "Apps" widerrufen. Nach dem Logout wirst du auf die Startseite zurückgeleitet.'
      }
    ]
  },
  {
    category: 'Community',
    icon: <Users className="w-5 h-5" />,
    questions: [
      {
        q: 'Wer steckt hinter Uetliberg Ultras?',
        a: 'Uetliberg Ultras ist ein Community-Projekt von und für Läufer, die den Uetliberg lieben. Wir sind keine offizielle Organisation, sondern eine Gruppe von Enthusiasten.'
      },
      {
        q: 'Wie kann ich zur Community beitragen?',
        a: 'Laufe regelmässig, schlage neue Segmente vor, und motiviere andere Läufer! Je aktiver die Community, desto besser wird die App.'
      }
    ]
  }
];

export default function Support() {
  useEffect(() => {
    const script = document.createElement('script');
    script.src = 'https://tally.so/widgets/embed.js';
    script.onload = () => {
      if (typeof (window as any).Tally !== 'undefined') {
        (window as any).Tally.loadEmbeds();
      }
    };
    document.body.appendChild(script);

    return () => {
      document.body.removeChild(script);
    };
  }, []);
  return (
    <div className="min-h-screen flex flex-col bg-background">
      <Seo
        title="Support & FAQ – Uetliberg Ultras"
        description="Antworten auf häufige Fragen zu Strava-Verbindung, Check-ins, Badges, Streaks und Leaderboards bei Uetliberg Ultras."
        path="/support"
        jsonLd={{
          "@context": "https://schema.org",
          "@type": "FAQPage",
          mainEntity: faqs.flatMap((section) =>
            section.questions.map((qa) => ({
              "@type": "Question",
              name: qa.q,
              acceptedAnswer: {
                "@type": "Answer",
                text: qa.a,
              },
            }))
          ),
        }}
      />
      <NavBar />
      
      <main className="flex-1 container mx-auto px-4 py-8 max-w-4xl">
        {/* Header */}
        <div className="text-center mb-8">
          <div className="flex items-center justify-center gap-3 mb-4">
            <HelpCircle className="w-8 h-8 sm:w-10 sm:h-10 text-primary" />
            <h1 className="text-2xl sm:text-4xl font-bold">Support & FAQ</h1>
          </div>
          <p className="text-muted-foreground max-w-2xl mx-auto">
            Hier findest du Antworten auf häufig gestellte Fragen zu Uetliberg Ultras.
          </p>
        </div>

        {/* FAQ Sections */}
        <div className="space-y-6">
          {faqs.map((section, sectionIndex) => (
            <Card key={sectionIndex} className="p-4 sm:p-6">
              <div className="flex items-center gap-2 mb-4">
                <span className="text-primary">{section.icon}</span>
                <h2 className="font-bold text-lg">{section.category}</h2>
              </div>
              
              <Accordion type="single" collapsible className="w-full">
                {section.questions.map((faq, faqIndex) => (
                  <AccordionItem 
                    key={faqIndex} 
                    value={`${sectionIndex}-${faqIndex}`}
                    className="border-b last:border-b-0"
                  >
                    <AccordionTrigger className="text-left text-sm sm:text-base hover:no-underline">
                      {faq.q}
                    </AccordionTrigger>
                    <AccordionContent className="text-muted-foreground text-sm whitespace-pre-line">
                      {faq.a}
                    </AccordionContent>
                  </AccordionItem>
                ))}
              </Accordion>
            </Card>
          ))}
        </div>

        {/* Contact Section */}
        <Card className="mt-8 p-6">
          <h2 className="font-bold text-lg mb-4 text-center">Noch Fragen?</h2>
          <p className="text-muted-foreground text-sm text-center mb-6">
            Falls deine Frage nicht beantwortet wurde, schreib uns gerne eine Nachricht.
          </p>
          <iframe
            data-tally-src="https://tally.so/embed/rjBg7v?alignLeft=1&hideTitle=1&transparentBackground=1&dynamicHeight=1"
            loading="lazy"
            width="100%"
            height="342"
            frameBorder="0"
            title="Uetliberg Ultras Kontaktformular"
            className="w-full"
          />
        </Card>
      </main>

      <Footer />
    </div>
  );
}
