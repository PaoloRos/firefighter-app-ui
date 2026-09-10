import { IdentityPanel } from "../components/IdentityPanel";
import { ToolCard } from "../components/ToolCard";
import { useI18n } from "../i18n/I18nProvider";

export function DashboardPage() {
  const { t } = useI18n();
  const tools = [
    {
      id: "calendar-converter",
      category: t("calendarEyebrow"),
      title: t("calendarTitle"),
      description: t("calendarDescription"),
      formatsLabel: t("calendarAcceptedFormats"),
      formats: ["CSV", "XLSX"],
      actionLabel: t("calendarOpen"),
      to: "/tools/calendar-converter",
    },
  ] as const;

  return (
    <>
      <section className="hero" aria-labelledby="dashboard-title">
        <p className="eyebrow">{t("dashboardEyebrow")}</p>
        <h1 id="dashboard-title">{t("dashboardTitle")}</h1>
        <p>{t("dashboardDescription")}</p>
      </section>

      <IdentityPanel />

      <section aria-labelledby="tools-title">
        <h2 id="tools-title">{t("dashboardToolsTitle")}</h2>
        <div className="tools-grid">
          {tools.map((tool) => (
            <ToolCard key={tool.id} {...tool} />
          ))}
        </div>
      </section>
    </>
  );
}
