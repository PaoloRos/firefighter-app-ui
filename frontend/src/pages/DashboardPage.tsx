import { Link } from "react-router-dom";

export function DashboardPage() {
  return (
    <>
      <section className="hero" aria-labelledby="dashboard-title">
        <p className="eyebrow">Einsatzbereit im Alltag</p>
        <h1 id="dashboard-title">Werkzeuge für die Feuerwehr</h1>
        <p>Praktische Hilfsmittel für wiederkehrende Aufgaben – sicher und lokal auf diesem Gerät.</p>
      </section>

      <section aria-labelledby="tools-title">
        <h2 id="tools-title">Verfügbare Werkzeuge</h2>
        <article className="tool-card">
          <div>
            <p className="eyebrow">Kalender</p>
            <h3>Dienstplan konvertieren</h3>
            <p>CSV- oder XLSX-Dienstpläne für den Import in eine Kalender-App vorbereiten.</p>
          </div>
          <Link className="button-link" to="/tools/calendar-converter">
            Werkzeug öffnen
          </Link>
        </article>
      </section>
    </>
  );
}
