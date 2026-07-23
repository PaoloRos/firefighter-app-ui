import { fireEvent, render, screen } from "@testing-library/react";
import { MemoryRouter } from "react-router-dom";
import { beforeEach, describe, expect, it, vi } from "vitest";

import {
  convertCalendar,
  type CalendarConverterResult,
} from "../api/calendarConverter";
import { App } from "../App";
import { LANGUAGE_STORAGE_KEY } from "../i18n/I18nProvider";

vi.mock("../api/calendarConverter", async (importOriginal) => {
  const actual =
    await importOriginal<typeof import("../api/calendarConverter")>();
  return {
    ...actual,
    convertCalendar: vi.fn(),
  };
});

const mockedConvertCalendar = vi.mocked(convertCalendar);

function renderConverter() {
  return render(
    <MemoryRouter initialEntries={["/tools/calendar-converter"]}>
      <App />
    </MemoryRouter>,
  );
}

describe("calendar converter upload workflow", () => {
  beforeEach(() => {
    window.localStorage.clear();
    mockedConvertCalendar.mockReset();
    mockedConvertCalendar.mockResolvedValue(successfulResult());
  });

  it("starts with an extension-filtered picker and disabled actions", () => {
    renderConverter();

    const input = screen.getByLabelText("Datei auswählen");
    expect(input).toHaveAttribute("type", "file");
    expect(input).toHaveAttribute("accept", ".csv,.xlsx");
    expect(
      screen.getByRole("button", { name: "Konvertierung starten" }),
    ).toBeDisabled();
    expect(screen.getByRole("button", { name: "Zurücksetzen" })).toBeDisabled();
  });

  it("selects supported files and resets the workflow", () => {
    renderConverter();
    const input = screen.getByLabelText("Datei auswählen");
    const file = new File(["schedule"], "Übungsplan.CSV", {
      type: "text/csv",
    });

    fireEvent.change(input, { target: { files: [file] } });

    expect(screen.getByText("Übungsplan.CSV")).toBeVisible();
    expect(screen.getByText("Andere Datei auswählen")).toBeVisible();
    expect(
      screen.getByRole("button", { name: "Konvertierung starten" }),
    ).toBeEnabled();

    fireEvent.click(screen.getByRole("button", { name: "Zurücksetzen" }));

    expect(screen.queryByText("Übungsplan.CSV")).not.toBeInTheDocument();
    expect(
      screen.getByRole("button", { name: "Konvertierung starten" }),
    ).toBeDisabled();
  });

  it("rejects unsupported extensions immediately", () => {
    renderConverter();

    fireEvent.change(screen.getByLabelText("Datei auswählen"), {
      target: {
        files: [new File(["schedule"], "schedule.txt")],
      },
    });

    expect(screen.getByRole("alert")).toHaveTextContent(
      "Bitte wählen Sie eine Datei mit der Endung .csv oder .xlsx.",
    );
    expect(
      screen.getByRole("button", { name: "Konvertierung starten" }),
    ).toBeDisabled();
  });

  it("uses the same selection path for drag-and-drop", () => {
    renderConverter();
    const dropZone = screen
      .getByText("Dienstplan hier ablegen")
      .closest(".drop-zone");
    if (dropZone === null) {
      throw new Error("Expected the upload drop zone");
    }
    const file = new File(["schedule"], "schedule.xlsx", {
      type:
        "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
    });

    fireEvent.drop(dropZone, {
      dataTransfer: {
        files: [file],
      },
    });

    expect(screen.getByText("schedule.xlsx")).toBeVisible();
    expect(
      screen.getByRole("button", { name: "Konvertierung starten" }),
    ).toBeEnabled();
  });

  it("submits once and disables duplicate actions while converting", async () => {
    let resolveConversion:
      | ((result: CalendarConverterResult) => void)
      | undefined;
    mockedConvertCalendar.mockReturnValue(
      new Promise((resolve) => {
        resolveConversion = resolve;
      }),
    );
    renderConverter();
    const file = new File(["schedule"], "schedule.csv", {
      type: "text/csv",
    });
    fireEvent.change(screen.getByLabelText("Datei auswählen"), {
      target: { files: [file] },
    });

    const submitButton = screen.getByRole("button", {
      name: "Konvertierung starten",
    });
    fireEvent.click(submitButton);
    fireEvent.click(submitButton);

    expect(mockedConvertCalendar).toHaveBeenCalledOnce();
    expect(mockedConvertCalendar).toHaveBeenCalledWith(file);
    expect(
      screen.getByRole("button", { name: "Wird konvertiert …" }),
    ).toBeDisabled();
    expect(screen.getByText("Andere Datei auswählen")).toHaveAttribute(
      "aria-disabled",
      "true",
    );
    expect(screen.getByRole("button", { name: "Zurücksetzen" })).toBeDisabled();

    resolveConversion?.(successfulResult());

    expect(
      await screen.findByRole("status"),
    ).toHaveTextContent("Die Konvertierung ist abgeschlossen.");
  });

  it("translates selection and validation into Italian", () => {
    window.localStorage.setItem(LANGUAGE_STORAGE_KEY, "it");
    renderConverter();

    expect(screen.getByText("Trascina qui il piano dei turni")).toBeVisible();
    expect(screen.getByLabelText("Scegli un file")).toHaveAttribute(
      "accept",
      ".csv,.xlsx",
    );

    fireEvent.change(screen.getByLabelText("Scegli un file"), {
      target: {
        files: [new File(["schedule"], "schedule.pdf")],
      },
    });

    expect(screen.getByRole("alert")).toHaveTextContent(
      "Scegli un file con estensione .csv o .xlsx.",
    );
  });
});

function successfulResult(): CalendarConverterResult {
  return {
    ok: true,
    response: {
      status: "success",
      total_count: 1,
      converted_count: 1,
      skipped_count: 0,
      invalid_events: [],
      calendar: {
        filename: "schedule.ics",
        mime_type: "text/calendar;charset=utf-8",
        ics_text: "BEGIN:VCALENDAR\r\nEND:VCALENDAR\r\n",
      },
    },
  };
}
