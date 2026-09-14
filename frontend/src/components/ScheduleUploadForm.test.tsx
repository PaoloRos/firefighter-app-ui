import { fireEvent, render, screen, waitFor } from "@testing-library/react";
import { beforeEach, describe, expect, it, vi } from "vitest";

import { I18nProvider } from "../i18n/I18nProvider";
import { ScheduleUploadForm, hasSupportedExtension } from "./ScheduleUploadForm";
import { uploadActiveSchedule } from "../api/calendarConverter";
import type { ActiveSchedule } from "../api/calendarConverter";

vi.mock("../api/calendarConverter", async (importOriginal) => {
  const actual =
    await importOriginal<typeof import("../api/calendarConverter")>();
  return { ...actual, uploadActiveSchedule: vi.fn() };
});

const mockedUpload = vi.mocked(uploadActiveSchedule);

const STORED: ActiveSchedule = {
  filename: "dienstplan.csv",
  size_bytes: 128,
  uploaded_at: "2026-09-14T08:30:00Z",
  uploaded_by: "chief",
};

function renderForm(onUploaded = vi.fn()) {
  render(
    <I18nProvider>
      <ScheduleUploadForm onUploaded={onUploaded} />
    </I18nProvider>,
  );
  return onUploaded;
}

function csvFile(name = "dienstplan.csv") {
  return new File(["id,summary\n"], name, { type: "text/csv" });
}

function selectFile(file: File) {
  fireEvent.change(screen.getByLabelText("Datei auswählen"), {
    target: { files: [file] },
  });
}

function clickButton(name: string) {
  fireEvent.click(screen.getByRole("button", { name }));
}

describe("schedule upload form", () => {
  beforeEach(() => {
    mockedUpload.mockReset();
    mockedUpload.mockResolvedValue({
      ok: true,
      response: { schedule: STORED },
    });
  });

  it("warns that an upload replaces the schedule for everyone", () => {
    renderForm();

    expect(
      screen.getByText(
        "Ein neuer Upload ersetzt den aktuellen Dienstplan für alle Konten.",
      ),
    ).toBeInTheDocument();
    expect(screen.getByRole("button", { name: "Dienstplan hochladen" })).toBeDisabled();
  });

  it("uploads the selected file and reports the stored schedule", async () => {
    const onUploaded = renderForm();

    selectFile(csvFile());
    clickButton("Dienstplan hochladen");

    await waitFor(() => expect(onUploaded).toHaveBeenCalledWith(STORED));
    expect(mockedUpload).toHaveBeenCalledOnce();
    expect(
      await screen.findByText("Der Dienstplan wurde auf dem Server hinterlegt."),
    ).toBeInTheDocument();
  });

  it("rejects an unsupported extension without calling the API", () => {
    renderForm();

    selectFile(new File(["x"], "notes.txt", { type: "text/plain" }));

    expect(screen.getByRole("alert")).toHaveTextContent(
      "Es werden nur CSV- und XLSX-Dateien unterstützt.",
    );
    expect(mockedUpload).not.toHaveBeenCalled();
  });

  it("surfaces a translated server rejection and keeps the file", async () => {
    mockedUpload.mockResolvedValue({
      ok: false,
      status: 413,
      error: { code: "oversized_upload", message: "unsafe backend detail" },
    });
    renderForm();

    selectFile(csvFile());
    clickButton("Dienstplan hochladen");

    expect(await screen.findByRole("alert")).toHaveTextContent("10 MiB");
    expect(screen.queryByText("unsafe backend detail")).not.toBeInTheDocument();
    expect(screen.getByText("dienstplan.csv")).toBeInTheDocument();
  });

  it("resets the selection", () => {
    renderForm();

    selectFile(csvFile());
    expect(screen.getByText("dienstplan.csv")).toBeInTheDocument();

    clickButton("Zurücksetzen");
    expect(screen.queryByText("dienstplan.csv")).not.toBeInTheDocument();
  });

  it("accepts supported extensions case-insensitively", () => {
    expect(hasSupportedExtension("plan.CSV")).toBe(true);
    expect(hasSupportedExtension("plan.xlsx")).toBe(true);
    expect(hasSupportedExtension("plan.txt")).toBe(false);
  });
});
