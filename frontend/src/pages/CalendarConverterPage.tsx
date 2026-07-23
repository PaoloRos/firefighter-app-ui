import {
  type ChangeEvent,
  type DragEvent,
  type FormEvent,
  useRef,
  useState,
} from "react";
import { Link } from "react-router-dom";

import { convertCalendar } from "../api/calendarConverter";
import { useI18n } from "../i18n/I18nProvider";

type RequestStatus = "ready" | "completed" | "failed";

export function CalendarConverterPage() {
  const { t } = useI18n();
  const inputRef = useRef<HTMLInputElement>(null);
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [selectionError, setSelectionError] = useState(false);
  const [isDragging, setIsDragging] = useState(false);
  const [isConverting, setIsConverting] = useState(false);
  const [requestStatus, setRequestStatus] = useState<RequestStatus>("ready");

  function selectFile(file: File | null) {
    setRequestStatus("ready");

    if (file === null) {
      setSelectedFile(null);
      setSelectionError(false);
      return;
    }

    if (!hasSupportedExtension(file.name)) {
      setSelectedFile(null);
      setSelectionError(true);
      if (inputRef.current !== null) {
        inputRef.current.value = "";
      }
      return;
    }

    setSelectedFile(file);
    setSelectionError(false);
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
    if (selectedFile === null || isConverting) {
      return;
    }

    setIsConverting(true);
    setRequestStatus("ready");
    try {
      const result = await convertCalendar(selectedFile);
      setRequestStatus(result.ok ? "completed" : "failed");
    } catch {
      setRequestStatus("failed");
    } finally {
      setIsConverting(false);
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

        {selectionError ? (
          <p className="form-message error-message" role="alert">
            {t("calendarInvalidExtension")}
          </p>
        ) : null}

        {selectedFile !== null ? (
          <div className="selected-file" aria-live="polite">
            <span>{t("calendarSelectedFile")}</span>
            <strong>{selectedFile.name}</strong>
          </div>
        ) : null}

        {requestStatus === "completed" ? (
          <p className="form-message" role="status">
            {t("calendarRequestCompleted")}
          </p>
        ) : null}
        {requestStatus === "failed" ? (
          <p className="form-message error-message" role="alert">
            {t("calendarRequestFailed")}
          </p>
        ) : null}

        <div className="form-actions">
          <button
            className="primary-button"
            type="submit"
            disabled={selectedFile === null || isConverting}
          >
            {isConverting
              ? t("calendarConverting")
              : t("calendarSubmit")}
          </button>
          <button
            className="secondary-button"
            type="button"
            disabled={
              isConverting ||
              (selectedFile === null &&
                !selectionError &&
                requestStatus === "ready")
            }
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
}

export function hasSupportedExtension(filename: string): boolean {
  return /\.(csv|xlsx)$/i.test(filename);
}
