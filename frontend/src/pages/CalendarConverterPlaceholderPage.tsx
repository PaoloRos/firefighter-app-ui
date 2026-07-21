import { Link } from "react-router-dom";

export function CalendarConverterPlaceholderPage() {
  return (
    <section className="panel" aria-labelledby="converter-title">
      <p className="eyebrow">Kalender</p>
      <h1 id="converter-title">Dienstplan konvertieren</h1>
      <p>Der Kalender-Konverter wird in einem der nächsten Schritte eingerichtet.</p>
      <Link className="text-link" to="/">
        Zurück zur Übersicht
      </Link>
    </section>
  );
}
