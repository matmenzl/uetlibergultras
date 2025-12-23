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
  Award, 
  Flame, 
  Link as LinkIcon,
  CheckCircle,
  Users
} from 'lucide-react';

const faqs = [
  {
    category: 'Erste Schritte',
    icon: <Mountain className="w-5 h-5" />,
    questions: [
      {
        q: 'Was ist Uetliberg Ultras?',
        a: 'Uetliberg Ultras ist eine Community für alle, die gerne auf den Uetliberg laufen. Wir tracken deine Läufe über Strava-Segmente und belohnen dich mit Achievements für deine Fortschritte.'
      },
      {
        q: 'Wie verbinde ich mein Strava-Konto?',
        a: 'Klicke auf der Startseite auf "Los geht\'s" und autorisiere die Verbindung mit Strava. Wir benötigen Lesezugriff auf deine Aktivitäten, um deine Segment-Leistungen zu erfassen.'
      },
      {
        q: 'Welche Strava-Berechtigungen braucht die App?',
        a: 'Wir benötigen nur Lesezugriff auf deine Aktivitäten. Wir können keine Aktivitäten in deinem Namen erstellen oder ändern.'
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
        a: 'Nachdem du eine Aktivität auf Strava aufgezeichnet hast, gehst du auf die Startseite und klickst auf "Check-in". Die App erkennt automatisch, welche Uetliberg-Segmente du gelaufen bist und checkt dich ein.'
      },
      {
        q: 'Warum wird mein Lauf nicht angezeigt?',
        a: 'Stelle sicher, dass deine Strava-Aktivität öffentlich oder für Follower sichtbar ist. Private Aktivitäten können nicht erfasst werden. Ausserdem muss deine Route das Segment vollständig abdecken.'
      }
    ]
  },
  {
    category: 'Achievements',
    icon: <Award className="w-5 h-5" />,
    questions: [
      {
        q: 'Wie verdiene ich Achievements?',
        a: 'Achievements werden automatisch vergeben, wenn du bestimmte Meilensteine erreichst. Dazu gehören: Anzahl Läufe (5, 10, 25, 50, 100), Wochen-Streaks, alle Segmente laufen, oder zu bestimmten Zeiten laufen.'
      },
      {
        q: 'Welche Achievements gibt es?',
        a: `Es gibt 12 Achievements:
• Erstbesteigung – Dein erster Uetli Run
• Bergfreund/Bergläufer/Veteran/Gipfelstürmer/Legende – 5/10/25/50/100 Runs
• Segmentjäger – Alle verfügbaren Segmente mindestens einmal gelaufen
• Dranbleiber/Durchhalter/Unaufhaltsam – 2/4/8 Wochen Streak
• Frühaufsteher – Ein Run vor 7 Uhr morgens
• Nachteule – Ein Run nach 20 Uhr abends`
      },
      {
        q: 'Was ist ein Streak?',
        a: 'Ein Streak zählt aufeinanderfolgende Wochen, in denen du mindestens einen Uetliberg-Run absolviert hast. Der Streak bricht ab, wenn eine Woche ohne Run vergeht.'
      }
    ]
  },
  {
    category: 'Leaderboard',
    icon: <Trophy className="w-5 h-5" />,
    questions: [
      {
        q: 'Wie funktioniert das Leaderboard?',
        a: 'Das Leaderboard zeigt die Top 10 Läufer, sortiert nach der Gesamtanzahl ihrer Uetliberg-Runs. Es werden auch die Anzahl der verdienten Achievements angezeigt.'
      },
      {
        q: 'Wie kann ich aufsteigen?',
        a: 'Laufe regelmässig Uetliberg-Segmente! Jeder Check-in zählt zu deiner Gesamtzahl. Je mehr Runs, desto höher dein Rang.'
      }
    ]
  },
  {
    category: 'Streaks',
    icon: <Flame className="w-5 h-5" />,
    questions: [
      {
        q: 'Wie wird mein Streak berechnet?',
        a: 'Ein Streak zählt aufeinanderfolgende Kalenderwochen (Montag bis Sonntag), in denen du mindestens einen Uetliberg-Run absolviert hast.'
      },
      {
        q: 'Was passiert, wenn ich eine Woche auslasse?',
        a: 'Dein Streak wird auf 0 zurückgesetzt. Aber keine Sorge – du kannst jederzeit einen neuen Streak starten!'
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
        q: 'Welche Segmente werden akzeptiert?',
        a: 'Segmente sollten auf oder um den Uetliberg führen und für Trail-/Bergläufer interessant sein. Reine Strassen-Segmente oder Segmente weit vom Uetliberg entfernt werden in der Regel abgelehnt.'
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
  return (
    <div className="min-h-screen flex flex-col bg-background">
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
        <Card className="mt-8 p-6 text-center">
          <h2 className="font-bold text-lg mb-2">Noch Fragen?</h2>
          <p className="text-muted-foreground text-sm">
            Falls deine Frage nicht beantwortet wurde, schreib uns gerne eine Nachricht.
          </p>
        </Card>
      </main>

      <Footer />
    </div>
  );
}
