import type { RefObject } from "react";

import { useI18n } from "../i18n/I18nProvider";
import type {
  Calendar,
  ConversionResponse,
  InvalidEvent,
} from "../api/calendarConverter";

/**
 * How much of a result to show.
 *
 * `full` is the authoring view: counts plus every skipped event and its
 * problems. `download` is what a plain account sees — what the calendar it is
 * about to download contains, without diagnostics it cannot act on.
 */
export type ResultVariant = "full" | "download";

type ConversionResultPanelProps = {
  result: ConversionResponse;
  variant: ResultVariant;
  headingRef: RefObject<HTMLHeadingElement | null>;
};

export function ConversionResultPanel({
  result,
  variant,
  headingRef,
}: ConversionResultPanelProps) {
  const { t, translateConverterIssue } = useI18n();
  const calendar = result.calendar;
  const showDiagnostics = variant === "full";

  const titleKey =
    result.status === "success"
      ? "calendarSuccessTitle"
      : result.status === "partial"
        ? "calendarPartialTitle"
        : "calendarFailureTitle";
  const descriptionKey =
    result.status === "success"
      ? "calendarSuccessDescription"
      : result.status === "partial"
        ? "calendarPartialDescription"
        : "calendarFailureDescription";
  const statusLabelKey =
    result.status === "success"
      ? "calendarStatusSuccess"
      : result.status === "partial"
        ? "calendarStatusPartial"
        : "calendarStatusFailure";

  return (
    <section
      className={`result-panel ${result.status}-result`}
      role="status"
      aria-labelledby="calendar-result-title"
    >
      <div className="result-heading">
        <span className="result-status-label">{t(statusLabelKey)}</span>
        <h2 id="calendar-result-title" ref={headingRef} tabIndex={-1}>
          {t(titleKey)}
        </h2>
      </div>
      <p>{t(descriptionKey)}</p>

      {result.status === "partial" ? (
        <p className="result-guidance partial-calendar-notice">
          {t("calendarPartialValidOnly")}
        </p>
      ) : null}
      {result.status === "failure" ? (
        <p className="result-guidance no-calendar-notice">
          {t("calendarFailureNoCalendar")}
        </p>
      ) : null}

      <dl className="result-counts">
        <div>
          <dt>{t("calendarTotalCount")}</dt>
          <dd>{result.total_count}</dd>
        </div>
        <div>
          <dt>{t("calendarConvertedCount")}</dt>
          <dd>{result.converted_count}</dd>
        </div>
        {showDiagnostics ? (
          <div>
            <dt>{t("calendarSkippedCount")}</dt>
            <dd>{result.skipped_count}</dd>
          </div>
        ) : null}
      </dl>

      {calendar !== null ? (
        <div className="calendar-result">
          <p className="calendar-result-file">
            <span>{t("calendarResultFilename")}</span>
            <strong>{calendar.filename}</strong>
          </p>
          <button
            className="primary-button calendar-download-button"
            type="button"
            onClick={() => downloadCalendar(calendar)}
          >
            {t("calendarDownload")}
          </button>
        </div>
      ) : null}

      {showDiagnostics && result.invalid_events.length > 0 ? (
        <div className="invalid-events">
          <h3>{t("calendarInvalidEventsTitle")}</h3>
          <ul className="invalid-event-list">
            {result.invalid_events.map((event, index) => (
              <InvalidEventItem
                event={event}
                key={`${event.source_position.event_index}-${index}`}
                translateIssue={translateConverterIssue}
              />
            ))}
          </ul>
        </div>
      ) : null}
    </section>
  );
}

type InvalidEventItemProps = {
  event: InvalidEvent;
  translateIssue: (code: InvalidEvent["issue_codes"][number]) => string;
};

function InvalidEventItem({ event, translateIssue }: InvalidEventItemProps) {
  const { t } = useI18n();
  const eventName =
    event.summary.trim() ||
    event.id.trim() ||
    `${t("calendarEventFallback")} ${event.source_position.event_index}`;

  return (
    <li>
      <div className="invalid-event-header">
        <strong>{eventName}</strong>
        <span className="skipped-event-label">
          {t("calendarSkippedEventLabel")}
        </span>
      </div>
      <span className="event-source">
        {t("calendarRowLabel")} {event.source_position.row}
        {event.source_position.worksheet === null
          ? null
          : ` · ${t("calendarWorksheetLabel")} ${event.source_position.worksheet}`}
      </span>
      <div className="invalid-event-issues">
        <span>{t("calendarEventIssuesLabel")}</span>
        <ul>
          {event.issue_codes.map((code) => (
            <li key={code}>{translateIssue(code)}</li>
          ))}
        </ul>
      </div>
    </li>
  );
}

/** Turn the returned ICS text into a browser-initiated local download. */
export function downloadCalendar(calendar: Calendar): void {
  const blob = new Blob([calendar.ics_text], { type: calendar.mime_type });
  const objectUrl = URL.createObjectURL(blob);
  const link = document.createElement("a");
  link.href = objectUrl;
  link.download = calendar.filename;
  link.hidden = true;
  document.body.append(link);

  try {
    link.click();
  } finally {
    link.remove();
    URL.revokeObjectURL(objectUrl);
  }
}
