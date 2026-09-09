import {
  type ChangeEvent,
  type DragEvent,
  type FormEvent,
  useEffect,
  useRef,
  useState,
} from "react";
import { Link } from "react-router-dom";

import {
  type ApiErrorCode,
  type Calendar,
  type ConversionResponse,
  convertCalendar,
  type InvalidEvent,
} from "../api/calendarConverter";
import { RequireSuperUser } from "../components/RequireSuperUser";
import { useI18n } from "../i18n/I18nProvider";

export const EXAMPLE_SCHEDULE_URL =
  "/api/v1/tools/calendar-converter/example";
export const EXAMPLE_SCHEDULE_FILENAME =
  "calendar_schedule_example.xlsx";

export type ConverterState =
  | { status: "idle" }
  | { status: "selected"; file: File }
  | { status: "converting"; file: File }
  | { status: "result"; file: File; result: ConversionResponse }
  | { status: "fatal"; file?: File; errorCode: ApiErrorCode };

export function CalendarConverterPage() {
  const { t, translateApiError, translateConverterIssue } = useI18n();
  const inputRef = useRef<HTMLInputElement>(null);
  const outcomeHeadingRef = useRef<HTMLHeadingElement>(null);
  const [workflow, setWorkflow] = useState<ConverterState>({ status: "idle" });
  const [isDragging, setIsDragging] = useState(false);
  const isConverting = workflow.status === "converting";
  const selectedFile = getStateFile(workflow);
  const hasFileValidationError =
    workflow.status === "fatal" && workflow.file === undefined;
  const fileDescriptionIds = [
    "calendar-file-requirements",
    hasFileValidationError ? "calendar-file-validation" : null,
  ]
    .filter((id): id is string => id !== null)
    .join(" ");

  useEffect(() => {
    if (workflow.status === "result" || workflow.status === "fatal") {
      outcomeHeadingRef.current?.focus();
    }
  }, [workflow]);

  function selectFile(file: File | null) {
    if (file === null) {
      setWorkflow({ status: "idle" });
      return;
    }

    if (!hasSupportedExtension(file.name)) {
      setWorkflow({
        status: "fatal",
        errorCode: "unsupported_file_type",
      });
      if (inputRef.current !== null) {
        inputRef.current.value = "";
      }
      return;
    }

    setWorkflow({ status: "selected", file });
  }

  function handleFileChange(event: ChangeEvent<HTMLInputElement>) {
    selectFile(event.target.files?.[0] ?? null);
  }

  function handleDragOver(event: DragEvent<HTMLDivElement>) {
    event.preventDefault();
    if (!isConverting) {
      setIsDragging(true);
    }
  }

  function handleDragLeave(event: DragEvent<HTMLDivElement>) {
    event.preventDefault();
    setIsDragging(false);
  }

  function handleDrop(event: DragEvent<HTMLDivElement>) {
    event.preventDefault();
    setIsDragging(false);
    if (!isConverting) {
      selectFile(event.dataTransfer.files[0] ?? null);
    }
  }

  function resetWorkflow() {
    if (isConverting) {
      return;
    }
    selectFile(null);
    if (inputRef.current !== null) {
      inputRef.current.value = "";
      inputRef.current.focus();
    }
  }

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (workflow.status !== "selected") {
      return;
    }

    const file = workflow.file;
    setWorkflow({ status: "converting", file });

    try {
      const conversion = await convertCalendar(file);
      if (conversion.ok) {
        setWorkflow({
          status: "result",
          file,
          result: conversion.response,
        });
      } else {
        setWorkflow({
          status: "fatal",
          file,
          errorCode: conversion.error.code,
        });
      }
    } catch {
      setWorkflow({
        status: "fatal",
        file,
        errorCode: "internal_error",
      });
    }
  }

  return (
    <section className="panel converter-panel" aria-labelledby="converter-title">
      <p className="eyebrow">{t("calendarEyebrow")}</p>
      <h1 id="converter-title">{t("calendarTitle")}</h1>
      <p>{t("calendarUploadIntro")}</p>

      <div className="converter-workspace">
        <aside
          className="converter-help"
          aria-labelledby="calendar-help-title"
        >
          <h2 id="calendar-help-title">{t("calendarHelpTitle")}</h2>
          <ol className="workflow-steps">
            <li>{t("calendarHelpStepSelect")}</li>
            <li>{t("calendarHelpStepConvert")}</li>
            <li>{t("calendarHelpStepDownload")}</li>
          </ol>
          <ul className="help-details">
            <li>{t("calendarHelpFormats")}</li>
            <li>{t("calendarHelpLimit")}</li>
            <li>{t("calendarHelpPartial")}</li>
            <li>{t("calendarHelpPrivacy")}</li>
          </ul>
          <a
            className="text-link example-download-link"
            href={EXAMPLE_SCHEDULE_URL}
            download={EXAMPLE_SCHEDULE_FILENAME}
          >
            {t("calendarExampleDownload")}
          </a>
        </aside>

        <RequireSuperUser
          fallback={
            <div className="upload-restricted" role="note">
              <h2>{t("converterUploadRestrictedTitle")}</h2>
              <p>{t("converterUploadRestricted")}</p>
            </div>
          }
        >
          <form className="upload-form" onSubmit={handleSubmit}>
            <div
              className={`drop-zone${isDragging ? " dragging" : ""}`}
              onDragOver={handleDragOver}
              onDragLeave={handleDragLeave}
              onDrop={handleDrop}
            >
              <p className="drop-zone-title">{t("calendarDropTitle")}</p>
              <p>{t("calendarDropHint")}</p>
              <input
                ref={inputRef}
                className="visually-hidden"
                id="calendar-schedule-file"
                type="file"
                accept=".csv,.xlsx"
                aria-describedby={fileDescriptionIds}
                disabled={isConverting}
                onChange={handleFileChange}
              />
              <label
                className="file-picker-button"
                htmlFor="calendar-schedule-file"
                aria-disabled={isConverting}
              >
                {selectedFile === null
                  ? t("calendarChooseFile")
                  : t("calendarChooseAnother")}
              </label>
              <p
                className="file-requirements"
                id="calendar-file-requirements"
              >
                {t("calendarFileRequirements")}
              </p>
            </div>

            {isConverting ? (
              <p
                className="visually-hidden"
                role="status"
                aria-live="polite"
                aria-atomic="true"
              >
                {t("calendarConverting")}
              </p>
            ) : null}

            {selectedFile !== null ? (
              <div className="selected-file" aria-live="polite">
                <span>{t("calendarSelectedFile")}</span>
                <strong>{selectedFile.name}</strong>
              </div>
            ) : null}

            {workflow.status === "result" ? (
              <ConversionResultPanel result={workflow.result} />
            ) : null}
            {workflow.status === "fatal" ? (
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
                <p
                  id={
                    hasFileValidationError
                      ? "calendar-file-validation"
                      : undefined
                  }
                >
                  {translateApiError(workflow.errorCode)}
                </p>
              </section>
            ) : null}

            <div className="form-actions">
              <button
                className="primary-button"
                type="submit"
                disabled={workflow.status !== "selected"}
              >
                {isConverting
                  ? t("calendarConverting")
                  : t("calendarSubmit")}
              </button>
              <button
                className="secondary-button"
                type="button"
                disabled={workflow.status === "idle" || isConverting}
                onClick={resetWorkflow}
              >
                {t("calendarReset")}
              </button>
            </div>
          </form>
        </RequireSuperUser>
      </div>

      <Link className="text-link" to="/">
        {t("backToDashboard")}
      </Link>
    </section>
  );

  function ConversionResultPanel({ result }: { result: ConversionResponse }) {
    const calendar = result.calendar;
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
          <h2
            id="calendar-result-title"
            ref={outcomeHeadingRef}
            tabIndex={-1}
          >
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
          <div>
            <dt>{t("calendarSkippedCount")}</dt>
            <dd>{result.skipped_count}</dd>
          </div>
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

        {result.invalid_events.length > 0 ? (
          <div className="invalid-events">
            <h3>{t("calendarInvalidEventsTitle")}</h3>
            <ul className="invalid-event-list">
              {result.invalid_events.map((event, index) => (
                <InvalidEventItem
                  event={event}
                  key={`${event.source_position.event_index}-${index}`}
                />
              ))}
            </ul>
          </div>
        ) : null}
      </section>
    );
  }

  function InvalidEventItem({ event }: { event: InvalidEvent }) {
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
              <li key={code}>{translateConverterIssue(code)}</li>
            ))}
          </ul>
        </div>
      </li>
    );
  }
}

export function downloadCalendar(calendar: Calendar): void {
  const blob = new Blob([calendar.ics_text], {
    type: calendar.mime_type,
  });
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

export function hasSupportedExtension(filename: string): boolean {
  return /\.(csv|xlsx)$/i.test(filename);
}

function getStateFile(state: ConverterState): File | null {
  return "file" in state && state.file !== undefined ? state.file : null;
}
