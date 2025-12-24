import NavBar from "@/components/NavBar";
import { Footer } from "@/components/Footer";
import { ArrowLeft } from "lucide-react";
import { Link } from "react-router-dom";

const Terms = () => {
  return (
    <div className="min-h-screen bg-background">
      <NavBar />
      
      <main className="container mx-auto px-4 py-12 max-w-4xl">
        <Link 
          to="/" 
          className="inline-flex items-center gap-2 text-muted-foreground hover:text-foreground transition-colors mb-8"
        >
          <ArrowLeft className="h-4 w-4" />
          Zurück zur Startseite
        </Link>

        <h1 className="text-4xl font-bold mb-8">Allgemeine Geschäftsbedingungen (AGB)</h1>
        
        <div className="prose prose-lg max-w-none space-y-8 text-foreground/90">
          <section>
            <p className="text-muted-foreground">
              Stand: Dezember 2024
            </p>
          </section>

          <section>
            <h2 className="text-2xl font-semibold mb-4">1. Geltungsbereich</h2>
            <p>
              Diese Allgemeinen Geschäftsbedingungen (AGB) gelten für die Nutzung der Plattform 
              «Uetliberg Ultras» (nachfolgend «App»), betrieben von kollektivauthentisch.ch 
              (nachfolgend «Betreiber»).
            </p>
            <p className="mt-2">
              Mit der Nutzung der App akzeptieren Sie diese AGB. 
              Es gilt Schweizer Recht, insbesondere das Schweizerische Obligationenrecht (OR) 
              und das Schweizerische Zivilgesetzbuch (ZGB).
            </p>
          </section>

          <section>
            <h2 className="text-2xl font-semibold mb-4">2. Leistungsbeschreibung</h2>
            <p>
              Die App «Uetliberg Ultras» ist eine kostenlose Community-Plattform für Läufer, 
              die ihre Aktivitäten auf dem Uetliberg tracken möchten. Die App bietet:
            </p>
            <ul className="list-disc pl-6 mt-2 space-y-2">
              <li>Erfassung von Läufen auf definierten Uetliberg-Segmenten</li>
              <li>Leaderboard mit Rangliste der Teilnehmer</li>
              <li>Achievements und Streak-Tracking</li>
              <li>Persönliche Statistiken</li>
            </ul>
          </section>

          <section>
            <h2 className="text-2xl font-semibold mb-4">3. Registrierung und Konto</h2>
            <p>
              Die Nutzung der App erfordert eine Anmeldung über Strava. 
              Mit der Anmeldung erklären Sie sich einverstanden, dass wir Ihre Strava-Daten 
              gemäss unserer Datenschutzerklärung verarbeiten.
            </p>
            <p className="mt-2">
              Sie sind verantwortlich für die Sicherheit Ihres Strava-Kontos. 
              Der Betreiber haftet nicht für unbefugten Zugriff auf Ihr Konto.
            </p>
          </section>

          <section>
            <h2 className="text-2xl font-semibold mb-4">4. Nutzungsrechte und -pflichten</h2>
            <p>Sie verpflichten sich:</p>
            <ul className="list-disc pl-6 mt-2 space-y-2">
              <li>Die App nur für ihren vorgesehenen Zweck zu nutzen</li>
              <li>Keine falschen oder irreführenden Informationen zu übermitteln</li>
              <li>Die App nicht zu manipulieren oder zu missbrauchen</li>
              <li>Die Rechte anderer Nutzer zu respektieren</li>
              <li>Keine automatisierten Zugriffe ohne Genehmigung durchzuführen</li>
            </ul>
          </section>

          <section>
            <h2 className="text-2xl font-semibold mb-4">5. Geistiges Eigentum</h2>
            <p>
              Alle Rechte an der App, einschliesslich Design, Logos, Texte und Software, 
              liegen beim Betreiber oder dessen Lizenzgebern. Die Nutzung dieser Inhalte 
              ausserhalb der App ist ohne ausdrückliche Genehmigung nicht gestattet.
            </p>
          </section>

          <section>
            <h2 className="text-2xl font-semibold mb-4">6. Verfügbarkeit und Änderungen</h2>
            <p>
              Der Betreiber bemüht sich um eine hohe Verfügbarkeit der App, 
              garantiert jedoch keine ununterbrochene Verfügbarkeit. 
              Wartungsarbeiten und technische Störungen können auftreten.
            </p>
            <p className="mt-2">
              Der Betreiber behält sich vor, die App jederzeit zu ändern, 
              zu erweitern oder einzustellen. Über wesentliche Änderungen 
              werden die Nutzer informiert.
            </p>
          </section>

          <section>
            <h2 className="text-2xl font-semibold mb-4">7. Haftungsausschluss</h2>
            <p>
              Die App wird «wie besehen» bereitgestellt. Der Betreiber übernimmt keine Gewähr 
              für die Richtigkeit, Vollständigkeit oder Aktualität der angezeigten Daten.
            </p>
            <p className="mt-2">
              Im Rahmen des gesetzlich Zulässigen schliesst der Betreiber jede Haftung aus für:
            </p>
            <ul className="list-disc pl-6 mt-2 space-y-2">
              <li>Schäden aus der Nutzung oder Nichtnutzung der App</li>
              <li>Datenverlust oder technische Störungen</li>
              <li>Handlungen Dritter (z.B. Strava)</li>
              <li>Indirekte Schäden und entgangenen Gewinn</li>
            </ul>
            <p className="mt-4">
              Die Haftung für Vorsatz und grobe Fahrlässigkeit bleibt unberührt 
              (Art. 100 OR).
            </p>
          </section>

          <section>
            <h2 className="text-2xl font-semibold mb-4">8. Kündigung</h2>
            <p>
              Sie können Ihr Konto jederzeit löschen lassen. 
              Der Betreiber kann Konten bei Verstössen gegen diese AGB sperren oder löschen.
            </p>
            <p className="mt-2">
              Bei Beendigung der Nutzung werden Ihre Daten gemäss der 
              Datenschutzerklärung behandelt.
            </p>
          </section>

          <section>
            <h2 className="text-2xl font-semibold mb-4">9. Änderungen der AGB</h2>
            <p>
              Der Betreiber kann diese AGB jederzeit ändern. 
              Die jeweils aktuelle Version ist auf dieser Seite verfügbar. 
              Bei wesentlichen Änderungen werden die Nutzer informiert.
            </p>
            <p className="mt-2">
              Die fortgesetzte Nutzung der App nach einer Änderung gilt als Zustimmung 
              zu den neuen AGB.
            </p>
          </section>

          <section>
            <h2 className="text-2xl font-semibold mb-4">10. Salvatorische Klausel</h2>
            <p>
              Sollten einzelne Bestimmungen dieser AGB unwirksam sein oder werden, 
              berührt dies die Wirksamkeit der übrigen Bestimmungen nicht (Art. 20 OR).
            </p>
          </section>

          <section>
            <h2 className="text-2xl font-semibold mb-4">11. Anwendbares Recht und Gerichtsstand</h2>
            <p>
              Es gilt Schweizer Recht unter Ausschluss des internationalen Privatrechts.
            </p>
            <p className="mt-2">
              Gerichtsstand ist Zürich, Schweiz, soweit gesetzlich zulässig.
            </p>
          </section>

          <section>
            <h2 className="text-2xl font-semibold mb-4">12. Kontakt</h2>
            <p>
              Bei Fragen zu diesen AGB können Sie uns über die Support-Seite kontaktieren.
            </p>
            <Link 
              to="/support" 
              className="text-primary hover:underline"
            >
              Zur Support-Seite →
            </Link>
          </section>
        </div>
      </main>

      <Footer />
    </div>
  );
};

export default Terms;
