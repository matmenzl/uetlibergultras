import NavBar from "@/components/NavBar";
import { Footer } from "@/components/Footer";
import { ArrowLeft } from "lucide-react";
import { Link } from "react-router-dom";
import { Seo } from "@/components/Seo";
const Privacy = () => {
  return <div className="min-h-screen bg-background">
      <Seo
        title="Datenschutzerklärung – Uetliberg Ultras"
        description="Wie Uetliberg Ultras deine Strava- und Profildaten gemäss Schweizer Datenschutzgesetz bearbeitet."
        path="/privacy"
      />
      <NavBar />
      
      <main className="container mx-auto px-4 py-12 max-w-4xl">
        <Link to="/" className="inline-flex items-center gap-2 text-muted-foreground hover:text-foreground transition-colors mb-8">
          <ArrowLeft className="h-4 w-4" />
          Zurück zur Startseite
        </Link>

        <h1 className="text-4xl font-bold mb-8">Datenschutzerklärung</h1>
        
        <div className="prose prose-lg max-w-none space-y-8 text-foreground/90">
          <section>
            <p className="text-muted-foreground">
              Stand: Juni 2026
            </p>
          </section>

          <section>
            <h2 className="text-2xl font-semibold mb-4">1. Verantwortliche Stelle</h2>
            <p>
              Verantwortlich für die Datenbearbeitung auf dieser Website ist:
            </p>
            <p className="mt-2">
              uetlibergultras.ch<br />
              Zürich, Schweiz
            </p>
          </section>

          <section>
            <h2 className="text-2xl font-semibold mb-4">2. Geltungsbereich</h2>
            <p>Diese Datenschutzerklärung gilt für die Nutzung der Website www.uetlibergultras.ch und die damit verbundene App «Uetliberg Ultras». Sie erläutert, wie wir Personendaten im Sinne des Schweizer Datenschutzgesetzes (DSG) bearbeiten.</p>
          </section>

          <section>
            <h2 className="text-2xl font-semibold mb-4">3. Erhobene Daten</h2>
            <p>Wir bearbeiten folgende Personendaten:</p>
            <ul className="list-disc pl-6 mt-2 space-y-2">
              <li>
                <strong>Strava-Profildaten:</strong> Vorname, Nachname, Profilbild und Strava-ID, 
                die bei der Anmeldung über Strava übermittelt werden.
              </li>
              <li>
                <strong>Aktivitätsdaten:</strong> Laufdaten (Segmente, Zeiten, Distanzen), 
                die über die Strava API abgerufen werden, um Check-ins und Achievements zu ermitteln.
              </li>
              <li>
                <strong>E-Mail-Adresse (optional):</strong> Wenn Sie bei Segment- oder Achievement-Vorschlägen 
                die Option «Benachrichtige mich über Status-Updates» aktivieren, speichern wir Ihre E-Mail-Adresse 
                zusammen mit dem jeweiligen Vorschlag, um Sie über dessen Status informieren zu können.
              </li>
              <li>
                <strong>Technische Daten:</strong> IP-Adresse (temporär für Rate Limiting), 
                Browsertyp und Zugriffszeiten für die technische Bereitstellung der Website.
              </li>
            </ul>
          </section>

          <section>
            <h2 className="text-2xl font-semibold mb-4">4. Zweck der Datenbearbeitung</h2>
            <p>Wir bearbeiten Ihre Daten für folgende Zwecke:</p>
            <ul className="list-disc pl-6 mt-2 space-y-2">
              <li>Bereitstellung und Betrieb der App-Funktionen (Leaderboard, Achievements, Streaks)</li>
              <li>Anzeige Ihres Profils und Ihrer Statistiken</li>
              <li>Benachrichtigung über den Status Ihrer eingereichten Vorschläge (nur bei expliziter Einwilligung)</li>
              <li>Verbesserung der Benutzererfahrung</li>
              <li>Technische Sicherheit (Missbrauchsschutz)</li>
            </ul>
          </section>

          <section>
            <h2 className="text-2xl font-semibold mb-4">5. Rechtsgrundlage</h2>
            <p>
              Die Bearbeitung Ihrer Daten erfolgt gestützt auf Art. 31 Abs. 1 DSG 
              (Einwilligung durch Strava-Autorisierung) sowie Art. 31 Abs. 2 lit. a DSG 
              (Vertragserfüllung für die Nutzung der App).
            </p>
          </section>

          <section>
            <h2 className="text-2xl font-semibold mb-4">6. Datenweitergabe</h2>
            <p>
              Wir geben Ihre Daten nicht an Dritte weiter, ausser:
            </p>
            <ul className="list-disc pl-6 mt-2 space-y-2">
              <li>An Strava zur Authentifizierung und zum Abruf Ihrer Aktivitäten</li>
              <li>An unseren Hosting-Anbieter (Lovable Cloud / Supabase) für den technischen Betrieb</li>
              <li>An Resend (E-Mail-Versand) für Bestätigungs- und Benachrichtigungs-Mails</li>
              <li>An Mapbox für die Karten-Darstellung (nur die Anzeige der Uetliberg-Segmente)</li>
              <li>An ScreenshotOne für die Webcam-Anzeige (keine personenbezogenen Daten)</li>
              <li>Wenn wir gesetzlich dazu verpflichtet sind</li>
            </ul>
            <p className="mt-4">
              An keinen dieser Anbieter werden Strava-Aktivitätsdetails (Run-Name,
              Distanz, Zeit) weitergegeben. Strava-Daten verlassen unseren Backend
              nicht und werden gemäss Strava-API-Policy nie für Werbung,
              KI-Training oder Datenverkauf verwendet.
            </p>
            <p className="mt-4">
              Das öffentliche Leaderboard zeigt Ihren Anzeigenamen und Ihre Statistiken. 
              Ihr Profilbild und Ihre Platzierung sind für andere Nutzer sichtbar.
            </p>
          </section>

          <section>
            <h2 className="text-2xl font-semibold mb-4">7. Datenspeicherung und -löschung</h2>
            <p>
              <strong>Strava-Rohdaten (7-Tage-Regel):</strong> Aktivitätsname,
              Distanz, Zeit und Höhenmeter werden gemäss Strava-API-Policy
              (Section 6.2) spätestens nach 7 Tagen automatisch gelöscht.
              Anonymisierte Aggregate wie Anzahl Runs und Badges bleiben als
              eigene App-Daten erhalten.
            </p>
            <p className="mt-2">
              <strong>Löschung auf Strava:</strong> Wenn Sie eine Aktivität auf
              Strava löschen oder die App-Autorisierung widerrufen, wird das
              innerhalb von 48 Stunden bei uns gespiegelt.
            </p>
            <p className="mt-2">
              <strong>Konto-Löschung auf Anfrage:</strong> Sie können Ihr Konto
              und alle damit verbundenen Daten jederzeit selbst über das Profil
              löschen («Konto & alle Daten löschen»). Sie erhalten eine
              schriftliche Bestätigung per E-Mail.
            </p>
            <p className="mt-2">
              Die Strava-Autorisierung können Sie zusätzlich jederzeit in Ihren
              Strava-Einstellungen unter{" "}
              <a href="https://www.strava.com/settings/apps" className="text-primary hover:underline">
                strava.com/settings/apps
              </a>{" "}
              widerrufen.
            </p>
          </section>

          <section>
            <h2 className="text-2xl font-semibold mb-4">8. Ihre Rechte</h2>
            <p>
              Gemäss dem Schweizer Datenschutzgesetz (DSG) haben Sie folgende Rechte:
            </p>
            <ul className="list-disc pl-6 mt-2 space-y-2">
              <li><strong>Auskunftsrecht:</strong> Sie können Auskunft über Ihre gespeicherten Daten verlangen.</li>
              <li><strong>Berichtigungsrecht:</strong> Sie können die Korrektur falscher Daten verlangen.</li>
              <li><strong>Löschungsrecht:</strong> Sie können die Löschung Ihrer Daten verlangen.</li>
              <li><strong>Datenportabilität:</strong> Sie können Ihre Daten in einem gängigen Format erhalten.</li>
            </ul>
          </section>

          <section>
            <h2 className="text-2xl font-semibold mb-4">9. Cookies und Tracking</h2>
            <p>
              Wir verwenden nur technisch notwendige Cookies für die Authentifizierung 
              und Session-Verwaltung. Es werden keine Tracking- oder Werbe-Cookies eingesetzt.
            </p>
            <p className="mt-4">
              <strong>Produkt-Analytics (PostHog):</strong> Zur Verbesserung der App
              setzen wir PostHog (EU-Hosting, Frankfurt) ein. Wir erfassen
              pseudonymisierte Nutzungsereignisse (z. B. Seitenaufrufe,
              Onboarding-Schritte), um zu verstehen, wo Nutzer im Strava-Login
              abbrechen. Es werden keine Namen, E-Mail-Adressen oder
              Aktivitätsdetails übermittelt; IP-Adressen werden nicht
              gespeichert. Wenn Ihr Browser den Header «Do Not Track» sendet,
              wird PostHog automatisch deaktiviert.
            </p>
          </section>

          <section>
            <h2 className="text-2xl font-semibold mb-4">10. Datensicherheit</h2>
            <p>
              Wir treffen angemessene technische und organisatorische Massnahmen zum Schutz 
              Ihrer Daten vor unbefugtem Zugriff, Verlust oder Missbrauch. Die Datenübertragung 
              erfolgt verschlüsselt (HTTPS).
            </p>
          </section>

          <section>
            <h2 className="text-2xl font-semibold mb-4">11. Änderungen</h2>
            <p>
              Wir behalten uns vor, diese Datenschutzerklärung jederzeit anzupassen. 
              Die aktuelle Version ist stets auf dieser Seite verfügbar.
            </p>
          </section>

          <section>
            <h2 className="text-2xl font-semibold mb-4">12. Kontakt</h2>
            <p>
              Bei Fragen zum Datenschutz können Sie uns über die Support-Seite kontaktieren.
            </p>
            <Link to="/support" className="text-primary hover:underline">
              Zur Support-Seite →
            </Link>
          </section>
        </div>
      </main>

      <Footer />
    </div>;
};
export default Privacy;