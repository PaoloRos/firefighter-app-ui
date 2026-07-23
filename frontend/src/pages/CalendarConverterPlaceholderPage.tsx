import { Link } from "react-router-dom";

import { useI18n } from "../i18n/I18nProvider";

export function CalendarConverterPlaceholderPage() {
  const { t } = useI18n();

  return (
    <section className="panel" aria-labelledby="converter-title">
      <p className="eyebrow">{t("calendarEyebrow")}</p>
      <h1 id="converter-title">{t("calendarTitle")}</h1>
      <p>{t("calendarPlaceholder")}</p>
      <Link className="text-link" to="/">
        {t("backToDashboard")}
      </Link>
    </section>
  );
}
