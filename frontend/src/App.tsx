import { Link, NavLink, Route, Routes } from "react-router-dom";

import { CalendarConverterPlaceholderPage } from "./pages/CalendarConverterPlaceholderPage";
import { DashboardPage } from "./pages/DashboardPage";

function NotFoundPage() {
  return (
    <section className="panel" aria-labelledby="not-found-title">
      <p className="eyebrow">Fehler 404</p>
      <h1 id="not-found-title">Seite nicht gefunden</h1>
      <p>Die angeforderte Seite ist nicht verfügbar.</p>
      <Link className="text-link" to="/">
        Zurück zur Übersicht
      </Link>
    </section>
  );
}

export function App() {
  return (
    <div className="app-shell">
      <header className="site-header">
        <Link className="brand" to="/" aria-label="Feuerwehr Tools Startseite">
          <span className="brand-mark" aria-hidden="true">
            FT
          </span>
          <span>Feuerwehr Tools</span>
        </Link>
        <nav aria-label="Hauptnavigation">
          <NavLink className={({ isActive }) => (isActive ? "active" : undefined)} to="/" end>
            Übersicht
          </NavLink>
        </nav>
      </header>

      <main className="page-content">
        <Routes>
          <Route path="/" element={<DashboardPage />} />
          <Route path="/tools/calendar-converter" element={<CalendarConverterPlaceholderPage />} />
          <Route path="*" element={<NotFoundPage />} />
        </Routes>
      </main>

      <footer className="site-footer">Lokal auf diesem Gerät</footer>
    </div>
  );
}
