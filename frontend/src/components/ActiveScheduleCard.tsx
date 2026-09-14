import { useI18n } from "../i18n/I18nProvider";
import type { ActiveSchedule, ApiErrorCode } from "../api/calendarConverter";

export type ScheduleState =
  | { status: "loading" }
  | { status: "empty" }
  | { status: "loaded"; schedule: ActiveSchedule }
  | { status: "unavailable"; errorCode: ApiErrorCode };

type ActiveScheduleCardProps = {
  state: ScheduleState;
  onRetry: () => void;
};

/** Show which schedule the server currently holds for every account. */
export function ActiveScheduleCard({
  state,
  onRetry,
}: ActiveScheduleCardProps) {
  const { language, t, translateApiError } = useI18n();

  if (state.status === "loading") {
    return (
      <section className="active-schedule" aria-labelledby="active-schedule-title">
        <h2 id="active-schedule-title">{t("calendarActiveScheduleTitle")}</h2>
        <p role="status" aria-live="polite">
          {t("calendarActiveScheduleLoading")}
        </p>
      </section>
    );
  }

  if (state.status === "unavailable") {
    return (
      <section
        className="active-schedule active-schedule-empty"
        aria-labelledby="active-schedule-title"
      >
        <h2 id="active-schedule-title">{t("calendarActiveScheduleTitle")}</h2>
        <p role="alert">{t("calendarActiveScheduleUnavailable")}</p>
        <p className="active-schedule-detail">
          {translateApiError(state.errorCode)}
        </p>
        <button className="secondary-button" type="button" onClick={onRetry}>
          {t("calendarActiveScheduleRetry")}
        </button>
      </section>
    );
  }

  if (state.status === "empty") {
    return (
      <section
        className="active-schedule active-schedule-empty"
        aria-labelledby="active-schedule-title"
      >
        <h2 id="active-schedule-title">{t("calendarActiveScheduleTitle")}</h2>
        <p>{t("calendarActiveScheduleNone")}</p>
        <p className="active-schedule-detail">
          {t("calendarActiveScheduleNoneHint")}
        </p>
      </section>
    );
  }

  const { schedule } = state;

  return (
    <section className="active-schedule" aria-labelledby="active-schedule-title">
      <h2 id="active-schedule-title">{t("calendarActiveScheduleTitle")}</h2>
      <dl className="active-schedule-meta">
        <div>
          <dt>{t("calendarActiveScheduleFilename")}</dt>
          <dd className="active-schedule-filename">{schedule.filename}</dd>
        </div>
        <div>
          <dt>{t("calendarActiveScheduleUploadedAt")}</dt>
          <dd>{formatUploadedAt(schedule.uploaded_at, language)}</dd>
        </div>
        <div>
          <dt>{t("calendarActiveScheduleUploadedBy")}</dt>
          <dd>{schedule.uploaded_by}</dd>
        </div>
        <div>
          <dt>{t("calendarActiveScheduleSize")}</dt>
          <dd>{formatScheduleSize(schedule.size_bytes)}</dd>
        </div>
      </dl>
    </section>
  );
}

/** Render a byte count as a short, locale-neutral size label. */
export function formatScheduleSize(bytes: number): string {
  if (bytes < 1024) {
    return `${bytes} B`;
  }

  const kib = bytes / 1024;
  if (kib < 1024) {
    return `${kib.toFixed(kib < 10 ? 1 : 0)} KiB`;
  }

  return `${(kib / 1024).toFixed(1)} MiB`;
}

/** Format the stored UTC timestamp in the reader's language. */
export function formatUploadedAt(value: string, language: string): string {
  const parsed = new Date(value);
  if (Number.isNaN(parsed.getTime())) {
    return value;
  }

  return new Intl.DateTimeFormat(language, {
    dateStyle: "medium",
    timeStyle: "short",
  }).format(parsed);
}
