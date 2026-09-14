import { useEffect, useRef, useState } from "react";
import type { ChangeEvent, DragEvent, FormEvent } from "react";

import { useI18n } from "../i18n/I18nProvider";
import {
  uploadActiveSchedule,
  type ActiveSchedule,
  type ApiErrorCode,
} from "../api/calendarConverter";

type UploadState =
  | { status: "idle" }
  | { status: "selected"; file: File }
  | { status: "uploading"; file: File }
  | { status: "fatal"; file?: File; errorCode: ApiErrorCode };

type ScheduleUploadFormProps = {
  onUploaded: (schedule: ActiveSchedule) => void;
};

/** Let a super-user replace the schedule every account converts. */
export function ScheduleUploadForm({ onUploaded }: ScheduleUploadFormProps) {
  const { t, translateApiError } = useI18n();
  const [upload, setUpload] = useState<UploadState>({ status: "idle" });
  const [isDragging, setIsDragging] = useState(false);
  const [justUploaded, setJustUploaded] = useState(false);
  const inputRef = useRef<HTMLInputElement>(null);

  const isUploading = upload.status === "uploading";
  const selectedFile = getStateFile(upload);
  const hasFileValidationError =
    upload.status === "fatal" && upload.file === undefined;
  const fileDescriptionIds = [
    "calendar-file-requirements",
    hasFileValidationError ? "calendar-file-validation" : null,
  ]
    .filter((id): id is string => id !== null)
    .join(" ");

  useEffect(() => {
    if (!justUploaded) {
      return;
    }

    const timer = window.setTimeout(() => setJustUploaded(false), 6000);
    return () => window.clearTimeout(timer);
  }, [justUploaded]);

  function selectFile(file: File | null) {
    setJustUploaded(false);

    if (file === null) {
      setUpload({ status: "idle" });
      return;
    }

    if (!hasSupportedExtension(file.name)) {
      setUpload({ status: "fatal", errorCode: "unsupported_file_type" });
      if (inputRef.current !== null) {
        inputRef.current.value = "";
      }
      return;
    }

    setUpload({ status: "selected", file });
  }

  function handleFileChange(event: ChangeEvent<HTMLInputElement>) {
    selectFile(event.target.files?.[0] ?? null);
  }

  function handleDragOver(event: DragEvent<HTMLDivElement>) {
    event.preventDefault();
    if (!isUploading) {
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
    if (!isUploading) {
      selectFile(event.dataTransfer.files[0] ?? null);
    }
  }

  function resetForm() {
    if (isUploading) {
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
    if (upload.status !== "selected") {
      return;
    }

    const file = upload.file;
    setUpload({ status: "uploading", file });

    try {
      const stored = await uploadActiveSchedule(file);
      if (stored.ok && stored.response.schedule !== null) {
        setUpload({ status: "idle" });
        setJustUploaded(true);
        if (inputRef.current !== null) {
          inputRef.current.value = "";
        }
        onUploaded(stored.response.schedule);
        return;
      }

      setUpload({
        status: "fatal",
        file,
        errorCode: stored.ok ? "internal_error" : stored.error.code,
      });
    } catch {
      setUpload({ status: "fatal", file, errorCode: "internal_error" });
    }
  }

  return (
    <section className="upload-panel" aria-labelledby="calendar-upload-title">
      <h2 id="calendar-upload-title">{t("calendarUploadTitle")}</h2>
      <p className="result-guidance upload-replace-notice">
        {t("calendarUploadReplaceNotice")}
      </p>

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
            disabled={isUploading}
            onChange={handleFileChange}
          />
          <label
            className="file-picker-button"
            htmlFor="calendar-schedule-file"
            aria-disabled={isUploading}
          >
            {selectedFile === null
              ? t("calendarChooseFile")
              : t("calendarChooseAnother")}
          </label>
          <p className="file-requirements" id="calendar-file-requirements">
            {t("calendarFileRequirements")}
          </p>
        </div>

        <p className="schedule-upload-status" role="status" aria-live="polite">
          {isUploading ? t("calendarUploading") : null}
          {justUploaded ? t("calendarUploadSuccess") : null}
        </p>

        {selectedFile !== null ? (
          <p className="selected-file">
            <span>{t("calendarSelectedFile")}</span>
            <strong>{selectedFile.name}</strong>
          </p>
        ) : null}

        {upload.status === "fatal" ? (
          <section
            className="result-panel fatal-result"
            role="alert"
            aria-labelledby="calendar-upload-error-title"
          >
            <h3 id="calendar-upload-error-title">{t("calendarFatalTitle")}</h3>
            <p id={hasFileValidationError ? "calendar-file-validation" : undefined}>
              {translateApiError(upload.errorCode)}
            </p>
          </section>
        ) : null}

        <div className="form-actions">
          <button
            className="primary-button"
            type="submit"
            disabled={upload.status !== "selected"}
          >
            {isUploading ? t("calendarUploading") : t("calendarUploadSubmit")}
          </button>
          <button
            className="secondary-button"
            type="button"
            onClick={resetForm}
            disabled={upload.status === "idle" || isUploading}
          >
            {t("calendarReset")}
          </button>
        </div>
      </form>
    </section>
  );
}

function getStateFile(state: UploadState): File | null {
  return "file" in state && state.file !== undefined ? state.file : null;
}

/** Reject an unsupported extension before spending an upload round trip. */
export function hasSupportedExtension(filename: string): boolean {
  return /\.(csv|xlsx)$/i.test(filename);
}
