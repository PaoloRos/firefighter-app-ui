import { Link, NavLink, Route, Routes } from "react-router-dom";

import { I18nProvider, useI18n } from "./i18n/I18nProvider";
import { CalendarConverterPage } from "./pages/CalendarConverterPage";
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

function GitHubIcon() {
  return (
    <svg
      className="footer-credit-icon"
      viewBox="0 0 16 16"
      aria-hidden="true"
      focusable="false"
    >
      <path
        fill="currentColor"
        d="M8 0C3.58 0 0 3.64 0 8.13c0 3.59 2.29 6.63 5.47 7.71.4.08.55-.18.55-.39 0-.19-.01-.82-.01-1.49-2.01.44-2.43-.49-2.43-.49-.33-.87-.8-1.1-.8-1.1-.65-.46.05-.45.05-.45.72.05 1.1.75 1.1.75.64 1.1 1.67.78 2.08.6.07-.47.25-.78.46-.96-1.6-.18-3.28-.82-3.28-3.62 0-.8.28-1.45.75-1.96-.08-.18-.33-.93.07-1.94 0 0 .62-.2 2.03.75A7.1 7.1 0 0 1 8 4.81c.68 0 1.36.09 2 .27 1.41-.95 2.03-.75 2.03-.75.4 1.01.15 1.76.08 1.94.47.51.75 1.16.75 1.96 0 2.81-1.68 3.43-3.29 3.61.26.23.49.67.49 1.36 0 .96-.01 1.73-.01 1.96 0 .21.15.47.55.39A8.16 8.16 0 0 0 16 8.13C16 3.64 12.42 0 8 0Z"
      />
    </svg>
  );
}

function AppContent() {
  const { t } = useI18n();

  return (
    <div className="app-shell">
      <a className="skip-link" href="#main-content">
        {t("skipToContent")}
      </a>
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

      <main className="page-content" id="main-content" tabIndex={-1}>
        <Routes>
          <Route path="/" element={<DashboardPage />} />
          <Route path="/tools/calendar-converter" element={<CalendarConverterPage />} />
          <Route path="*" element={<NotFoundPage />} />
        </Routes>
      </main>

      <footer className="site-footer">
        <a className="footer-credit" href="https://github.com/PaoloRos">
          <GitHubIcon />
          <span>{t("footerCredit")}</span>
        </a>
      </footer>
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
