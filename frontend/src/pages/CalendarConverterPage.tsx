import { useCallback, useEffect, useRef, useState } from "react";
import { Link } from "react-router-dom";

import { useAuth } from "../auth/AuthProvider";
import { useI18n } from "../i18n/I18nProvider";
import { RequireSuperUser } from "../components/RequireSuperUser";
import {
  ActiveScheduleCard,
  type ScheduleState,
} from "../components/ActiveScheduleCard";
import { ConversionResultPanel } from "../components/ConversionResultPanel";
import { ScheduleUploadForm } from "../components/ScheduleUploadForm";
import {
  convertActiveSchedule,
  fetchActiveSchedule,
  type ActiveSchedule,
  type ApiErrorCode,
  type ConversionResponse,
  type ConversionScope,
} from "../api/calendarConverter";

export const EXAMPLE_SCHEDULE_URL =
  "/api/v1/tools/calendar-converter/example";
export const EXAMPLE_SCHEDULE_FILENAME = "calendar_schedule_example.xlsx";

export type ConversionState =
  | { status: "idle" }
  | { status: "converting" }
  | { status: "result"; result: ConversionResponse }
  | { status: "fatal"; errorCode: ApiErrorCode };

export function CalendarConverterPage() {
  const { t, translateApiError } = useI18n();
  const { user } = useAuth();
  const [schedule, setSchedule] = useState<ScheduleState>({
    status: "loading",
  });
  const [conversion, setConversion] = useState<ConversionState>({
    status: "idle",
  });
  const [personalOnly, setPersonalOnly] = useState(false);
  const outcomeHeadingRef = useRef<HTMLHeadingElement>(null);

  const isSuperUser = user?.role === "super_user";
  const hasPersonnelNumber = Boolean(user?.personnel_number);
  // A super-user reviews the whole schedule unless they ask for their own
  // calendar; every other account only ever receives its own events.
  const scope: ConversionScope =
    isSuperUser && !personalOnly ? "full" : "personal";
  const isConverting = conversion.status === "converting";
  const canConvert =
    schedule.status === "loaded" &&
    !isConverting &&
    (scope === "full" || hasPersonnelNumber);

  const loadSchedule = useCallback(async (signal?: AbortSignal) => {
    setSchedule({ status: "loading" });

    try {
      const stored = await fetchActiveSchedule({ signal });
      if (signal?.aborted) {
        return;
      }

      if (!stored.ok) {
        setSchedule({ status: "unavailable", errorCode: stored.error.code });
        return;
      }

      setSchedule(
        stored.response.schedule === null
          ? { status: "empty" }
          : { status: "loaded", schedule: stored.response.schedule },
      );
    } catch {
      if (!signal?.aborted) {
        setSchedule({ status: "unavailable", errorCode: "internal_error" });
      }
    }
  }, []);

  useEffect(() => {
    const controller = new AbortController();
    void loadSchedule(controller.signal);
    return () => controller.abort();
  }, [loadSchedule]);

  useEffect(() => {
    if (conversion.status === "result" || conversion.status === "fatal") {
      outcomeHeadingRef.current?.focus();
    }
  }, [conversion]);

  function handleScopeChange(nextPersonalOnly: boolean) {
    setPersonalOnly(nextPersonalOnly);
    // A result for the other scope would describe a different calendar.
    setConversion({ status: "idle" });
  }

  function handleUploaded(stored: ActiveSchedule) {
    setSchedule({ status: "loaded", schedule: stored });
    setConversion({ status: "idle" });
  }

  async function handleConvert() {
    if (!canConvert) {
      return;
    }

    setConversion({ status: "converting" });

    try {
      const converted = await convertActiveSchedule({ scope });
      if (converted.ok) {
        setConversion({ status: "result", result: converted.response });
        return;
      }

      // The store self-heals on the server, so mirror an empty store here.
      if (converted.error.code === "no_active_schedule") {
        setSchedule({ status: "empty" });
      }
      setConversion({ status: "fatal", errorCode: converted.error.code });
    } catch {
      setConversion({ status: "fatal", errorCode: "internal_error" });
    }
  }

  return (
    <section className="panel converter-panel" aria-labelledby="converter-title">
      <p className="eyebrow">{t("calendarEyebrow")}</p>
      <h1 id="converter-title">{t("calendarTitle")}</h1>
      <p>{t("calendarUploadIntro")}</p>

      <div className="converter-workspace">
        <aside className="converter-help" aria-labelledby="calendar-help-title">
          <h2 id="calendar-help-title">{t("calendarHelpTitle")}</h2>
          <ol className="workflow-steps">
            {isSuperUser ? <li>{t("calendarHelpStepUpload")}</li> : null}
            <li>{t("calendarHelpStepConvert")}</li>
            <li>{t("calendarHelpStepDownload")}</li>
          </ol>
          <ul className="help-details">
            {isSuperUser ? <li>{t("calendarHelpFormats")}</li> : null}
            {isSuperUser ? <li>{t("calendarHelpLimit")}</li> : null}
            <li>{t("calendarHelpPersonal")}</li>
            {isSuperUser ? <li>{t("calendarHelpParticipants")}</li> : null}
            <li>{t("calendarHelpPartial")}</li>
            <li>{t("calendarHelpPrivacy")}</li>
          </ul>
          {/* Only an uploader needs the source template; a plain account
              downloads the generated ICS and never supplies an XLSX. */}
          {isSuperUser ? (
            <a
              className="text-link example-download-link"
              href={EXAMPLE_SCHEDULE_URL}
              download={EXAMPLE_SCHEDULE_FILENAME}
            >
              {t("calendarExampleDownload")}
            </a>
          ) : null}
        </aside>

        <div className="converter-main">
          <ActiveScheduleCard
            state={schedule}
            onRetry={() => void loadSchedule()}
          />

          {!isSuperUser && !hasPersonnelNumber ? (
            <p className="result-guidance missing-number-notice">
              {t("errorMissingPersonnelNumber")}
            </p>
          ) : null}

          {isSuperUser ? (
            <div className="scope-toggle">
              <label className="scope-toggle-label">
                <input
                  type="checkbox"
                  checked={personalOnly}
                  disabled={!hasPersonnelNumber || isConverting}
                  onChange={(event) => handleScopeChange(event.target.checked)}
                  aria-describedby="scope-toggle-hint"
                />
                {t("converterScopePersonal")}
              </label>
              <p id="scope-toggle-hint" className="scope-toggle-hint">
                {hasPersonnelNumber
                  ? t("converterScopeFullHint")
                  : t("converterScopePersonalUnavailable")}
              </p>
            </div>
          ) : null}

          <div className="convert-actions">
            <button
              className="primary-button"
              type="button"
              onClick={() => void handleConvert()}
              disabled={!canConvert}
            >
              {isConverting ? t("calendarConverting") : t("calendarConvertActive")}
            </button>
          </div>

          {isConverting ? (
            <p className="visually-hidden" role="status" aria-live="polite">
              {t("calendarConverting")}
            </p>
          ) : null}

          {conversion.status === "result" ? (
            <ConversionResultPanel
              result={conversion.result}
              variant={scope === "full" ? "full" : "download"}
              headingRef={outcomeHeadingRef}
            />
          ) : null}

          {conversion.status === "fatal" ? (
            <section
              className="result-panel fatal-result"
              role="alert"
              aria-labelledby="calendar-fatal-title"
            >
              <h2
                id="calendar-fatal-title"
                ref={outcomeHeadingRef}
                tabIndex={-1}
              >
                {t("calendarFatalTitle")}
              </h2>
              <p>{translateApiError(conversion.errorCode)}</p>
            </section>
          ) : null}

          <RequireSuperUser fallback={null}>
            <ScheduleUploadForm onUploaded={handleUploaded} />
          </RequireSuperUser>
        </div>
      </div>

      <Link className="text-link" to="/">
        {t("backToDashboard")}
      </Link>
    </section>
  );
}
