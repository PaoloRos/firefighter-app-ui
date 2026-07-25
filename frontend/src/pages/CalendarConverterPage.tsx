import {
  type ChangeEvent,
  type DragEvent,
  type FormEvent,
  useRef,
  useState,
} from "react";
import { Link } from "react-router-dom";

import {
  type ApiErrorCode,
  type ConversionResponse,
  convertCalendar,
  type InvalidEvent,
} from "../api/calendarConverter";
import { useI18n } from "../i18n/I18nProvider";

export type ConverterState =
  | { status: "idle" }
  | { status: "selected"; file: File }
  | { status: "converting"; file: File }
  | { status: "result"; file: File; result: ConversionResponse }
  | { status: "fatal"; file?: File; errorCode: ApiErrorCode };

export function CalendarConverterPage() {
  const { t, translateApiError, translateConverterIssue } = useI18n();
  const inputRef = useRef<HTMLInputElement>(null);
  const [workflow, setWorkflow] = useState<ConverterState>({ status: "idle" });
  const [isDragging, setIsDragging] = useState(false);
  const isConverting = workflow.status === "converting";
  const selectedFile = getStateFile(workflow);

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
          <p className="file-requirements">{t("calendarFileRequirements")}</p>
        </div>

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
          <section className="result-panel fatal-result" role="alert">
            <h2>{t("calendarFatalTitle")}</h2>
            <p>{translateApiError(workflow.errorCode)}</p>
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

      <Link className="text-link" to="/">
        {t("backToDashboard")}
      </Link>
    </section>
  );

  function ConversionResultPanel({ result }: { result: ConversionResponse }) {
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

    return (
      <section
        className={`result-panel ${result.status}-result`}
        role="status"
      >
        <h2>{t(titleKey)}</h2>
        <p>{t(descriptionKey)}</p>
        <dl className="result-counts">
          <div>
            <dt>{t("calendarConvertedCount")}</dt>
            <dd>{result.converted_count}</dd>
          </div>
          <div>
            <dt>{t("calendarSkippedCount")}</dt>
            <dd>{result.skipped_count}</dd>
          </div>
        </dl>

        {result.calendar !== null ? (
          <p className="calendar-result-file">
            <span>{t("calendarResultFilename")}</span>
            <strong>{result.calendar.filename}</strong>
          </p>
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
        <strong>{eventName}</strong>
        <span className="event-source">
          {t("calendarRowLabel")} {event.source_position.row}
          {event.source_position.worksheet === null
            ? null
            : ` · ${t("calendarWorksheetLabel")} ${event.source_position.worksheet}`}
        </span>
        <ul>
          {event.issue_codes.map((code) => (
            <li key={code}>{translateConverterIssue(code)}</li>
          ))}
        </ul>
      </li>
    );
  }
}

export function hasSupportedExtension(filename: string): boolean {
  return /\.(csv|xlsx)$/i.test(filename);
}

function getStateFile(state: ConverterState): File | null {
  return "file" in state && state.file !== undefined ? state.file : null;
}
