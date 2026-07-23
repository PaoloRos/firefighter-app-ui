import { Link, NavLink, Route, Routes } from "react-router-dom";

import { I18nProvider, useI18n } from "./i18n/I18nProvider";
import { CalendarConverterPlaceholderPage } from "./pages/CalendarConverterPlaceholderPage";
import { DashboardPage } from "./pages/DashboardPage";

function NotFoundPage() {
  const { t } = useI18n();

  return (
    <section className="panel" aria-labelledby="not-found-title">
      <p className="eyebrow">{t("notFoundEyebrow")}</p>
      <h1 id="not-found-title">{t("notFoundTitle")}</h1>
      <p>{t("notFoundDescription")}</p>
      <Link className="text-link" to="/">
        {t("backToDashboard")}
      </Link>
    </section>
  );
}

function LanguageSwitch() {
  const { language, selectLanguage, t } = useI18n();

  return (
    <div className="language-switch" role="group" aria-label={t("languageLabel")}>
      <button
        type="button"
        lang="de"
        aria-pressed={language === "de"}
        onClick={() => selectLanguage("de")}
      >
        {t("languageGerman")}
      </button>
      <button
        type="button"
        lang="it"
        aria-pressed={language === "it"}
        onClick={() => selectLanguage("it")}
      >
        {t("languageItalian")}
      </button>
    </div>
  );
}

function AppContent() {
  const { t } = useI18n();

  return (
    <div className="app-shell">
      <header className="site-header">
        <Link className="brand" to="/" aria-label={t("brandHomeLabel")}>
          <span className="brand-mark" aria-hidden="true">
            FT
          </span>
          <span>{t("brand")}</span>
        </Link>
        <div className="header-actions">
          <nav aria-label={t("navigationLabel")}>
            <NavLink className={({ isActive }) => (isActive ? "active" : undefined)} to="/" end>
              {t("navigationOverview")}
            </NavLink>
          </nav>
          <LanguageSwitch />
        </div>
      </header>

      <main className="page-content">
        <Routes>
          <Route path="/" element={<DashboardPage />} />
          <Route path="/tools/calendar-converter" element={<CalendarConverterPlaceholderPage />} />
          <Route path="*" element={<NotFoundPage />} />
        </Routes>
      </main>

      <footer className="site-footer">{t("footerLocal")}</footer>
    </div>
  );
}

export function App() {
  return (
    <I18nProvider>
      <AppContent />
    </I18nProvider>
  );
}
