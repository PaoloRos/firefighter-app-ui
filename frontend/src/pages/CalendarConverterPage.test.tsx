import { fireEvent, render, screen } from "@testing-library/react";
import { MemoryRouter } from "react-router-dom";
import { beforeEach, describe, expect, it, vi } from "vitest";

import {
  type ApiErrorCode,
  convertCalendar,
  type CalendarConverterResult,
  type ConversionResponse,
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
    setViewportWidth(1024);
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
      "Es werden nur CSV- und XLSX-Dateien unterstützt.",
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

    const result = await screen.findByRole("status");
    expect(result).toHaveTextContent("Konvertierung erfolgreich");
    expect(result).toHaveTextContent("Konvertierte Ereignisse");
    expect(result).toHaveTextContent("1");
    expect(result).toHaveTextContent("schedule.ics");
  });

  it("renders a translated partial result and each skipped-event issue", async () => {
    mockedConvertCalendar.mockResolvedValue(partialResult());
    renderConverter();
    selectSchedule("mixed.xlsx");

    fireEvent.click(
      screen.getByRole("button", { name: "Konvertierung starten" }),
    );

    const result = await screen.findByRole("status");
    expect(result).toHaveTextContent("Teilweise konvertiert");
    expect(result).toHaveTextContent("Konvertierte Ereignisse");
    expect(result).toHaveTextContent("Übersprungene Ereignisse");
    expect(result).toHaveTextContent("Übung ohne Kennung");
    expect(result).toHaveTextContent("Zeile 3 · Arbeitsblatt Juli");
    expect(result).toHaveTextContent("Die Ereignis-ID fehlt.");
    expect(result).toHaveTextContent("mixed.ics");
  });

  it("keeps an all-invalid result distinct from a fatal error", async () => {
    mockedConvertCalendar.mockResolvedValue(allInvalidResult());
    renderConverter();
    selectSchedule("invalid.csv");

    fireEvent.click(
      screen.getByRole("button", { name: "Konvertierung starten" }),
    );

    const result = await screen.findByRole("status");
    expect(result).toHaveTextContent("Keine Ereignisse konvertiert");
    expect(result).toHaveTextContent("alle Ereignisse waren ungültig");
    expect(result).toHaveTextContent("Die Zusammenfassung fehlt.");
    expect(screen.queryByRole("alert")).not.toBeInTheDocument();
    expect(
      screen.queryByText("Vorbereitete Kalenderdatei"),
    ).not.toBeInTheDocument();
  });

  it.each([
    [
      "oversized_upload",
      "Die Datei überschreitet die maximale Größe von 10 MiB.",
    ],
    ["malformed_csv", "Die CSV-Datei ist nicht lesbar oder ungültig aufgebaut."],
    ["malformed_xlsx", "Die XLSX-Datei ist nicht lesbar oder ungültig aufgebaut."],
    ["internal_error", "Die Konvertierung ist unerwartet fehlgeschlagen."],
  ] satisfies [ApiErrorCode, string][])(
    "translates the %s fatal API error without exposing backend text",
    async (errorCode, translatedMessage) => {
      mockedConvertCalendar.mockResolvedValue(fatalResult(errorCode));
      renderConverter();
      selectSchedule("schedule.csv");

      fireEvent.click(
        screen.getByRole("button", { name: "Konvertierung starten" }),
      );

      const alert = await screen.findByRole("alert");
      expect(alert).toHaveTextContent("Konvertierung nicht möglich");
      expect(alert).toHaveTextContent(translatedMessage);
      expect(alert).not.toHaveTextContent("unsafe backend detail");
      expect(screen.getByText("schedule.csv")).toBeVisible();
      expect(screen.getByText("Andere Datei auswählen")).toBeVisible();
    },
  );

  it("maps an unexpected client failure to the safe internal error", async () => {
    mockedConvertCalendar.mockRejectedValue(new Error("/private/schedule.csv"));
    renderConverter();
    selectSchedule("schedule.csv");

    fireEvent.click(
      screen.getByRole("button", { name: "Konvertierung starten" }),
    );

    const alert = await screen.findByRole("alert");
    expect(alert).toHaveTextContent(
      "Die Konvertierung ist unerwartet fehlgeschlagen.",
    );
    expect(alert).not.toHaveTextContent("/private/schedule.csv");
  });

  it("resets completed outcomes and accepts a replacement file", async () => {
    renderConverter();
    selectSchedule("first.csv");
    fireEvent.click(
      screen.getByRole("button", { name: "Konvertierung starten" }),
    );
    await screen.findByRole("status");

    fireEvent.change(screen.getByLabelText("Andere Datei auswählen"), {
      target: {
        files: [new File(["schedule"], "replacement.xlsx")],
      },
    });

    expect(screen.queryByRole("status")).not.toBeInTheDocument();
    expect(screen.getByText("replacement.xlsx")).toBeVisible();
    expect(
      screen.getByRole("button", { name: "Konvertierung starten" }),
    ).toBeEnabled();

    fireEvent.click(screen.getByRole("button", { name: "Zurücksetzen" }));

    expect(screen.queryByText("replacement.xlsx")).not.toBeInTheDocument();
    expect(
      screen.getByRole("button", { name: "Konvertierung starten" }),
    ).toBeDisabled();
  });

  it("translates selection, validation, and results into Italian", async () => {
    window.localStorage.setItem(LANGUAGE_STORAGE_KEY, "it");
    mockedConvertCalendar.mockResolvedValue(partialResult());
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
      "Sono supportati soltanto file CSV e XLSX.",
    );

    selectSchedule("mixed.xlsx", "Scegli un file");
    fireEvent.click(
      screen.getByRole("button", { name: "Avvia la conversione" }),
    );

    const result = await screen.findByRole("status");
    expect(result).toHaveTextContent("Conversione parziale");
    expect(result).toHaveTextContent("Eventi convertiti");
    expect(result).toHaveTextContent("Eventi ignorati");
    expect(result).toHaveTextContent("Manca l'ID dell'evento.");
  });

  it("preserves a completed result while switching Italian and German", async () => {
    mockedConvertCalendar.mockResolvedValue(partialResult());
    renderConverter();
    selectSchedule("mixed.xlsx");
    fireEvent.click(
      screen.getByRole("button", { name: "Konvertierung starten" }),
    );
    await screen.findByRole("status");

    fireEvent.click(screen.getByRole("button", { name: "Italiano" }));

    expect(screen.getByRole("status")).toHaveTextContent(
      "Conversione parziale",
    );
    expect(screen.getByText("mixed.xlsx")).toBeVisible();
    expect(screen.getByText("mixed.ics")).toBeVisible();
    expect(mockedConvertCalendar).toHaveBeenCalledOnce();

    fireEvent.click(screen.getByRole("button", { name: "Deutsch" }));

    expect(screen.getByRole("status")).toHaveTextContent(
      "Teilweise konvertiert",
    );
    expect(screen.getByText("mixed.xlsx")).toBeVisible();
    expect(screen.getByText("mixed.ics")).toBeVisible();
    expect(window.localStorage.getItem(LANGUAGE_STORAGE_KEY)).toBe("de");
    expect(mockedConvertCalendar).toHaveBeenCalledOnce();
  });

  it.each([320, 1280])(
    "keeps the functional partial-result workflow rendered at %ipx",
    async (width) => {
      setViewportWidth(width);
      mockedConvertCalendar.mockResolvedValue(partialResult());
      const { container } = renderConverter();
      selectSchedule("mixed.xlsx");

      fireEvent.click(
        screen.getByRole("button", { name: "Konvertierung starten" }),
      );

      expect(await screen.findByRole("status")).toHaveClass(
        "result-panel",
        "partial-result",
      );
      expect(container.querySelectorAll(".result-counts > div")).toHaveLength(
        2,
      );
      expect(container.querySelector(".invalid-event-list")).not.toBeNull();
      expect(container.querySelector(".form-actions")).not.toBeNull();
      expect(screen.getByText("Andere Datei auswählen")).toBeVisible();
      expect(screen.getByRole("button", { name: "Zurücksetzen" })).toBeEnabled();
    },
  );
});

function setViewportWidth(width: number) {
  Object.defineProperty(window, "innerWidth", {
    configurable: true,
    value: width,
  });
  window.dispatchEvent(new Event("resize"));
}

function selectSchedule(filename: string, label = "Datei auswählen") {
  fireEvent.change(screen.getByLabelText(label), {
    target: {
      files: [new File(["schedule"], filename)],
    },
  });
}

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

function partialResult(): CalendarConverterResult {
  return {
    ok: true,
    response: conversionResponse({
      status: "partial",
      total_count: 2,
      converted_count: 1,
      skipped_count: 1,
      invalid_events: [
        {
          source_position: {
            event_index: 2,
            row: 3,
            worksheet: "Juli",
          },
          id: "",
          summary: "Übung ohne Kennung",
          issue_codes: ["empty_id"],
        },
      ],
      calendar: {
        filename: "mixed.ics",
        mime_type: "text/calendar;charset=utf-8",
        ics_text: "BEGIN:VCALENDAR\r\nEND:VCALENDAR\r\n",
      },
    }),
  };
}

function allInvalidResult(): CalendarConverterResult {
  return {
    ok: true,
    response: conversionResponse({
      status: "failure",
      total_count: 1,
      converted_count: 0,
      skipped_count: 1,
      invalid_events: [
        {
          source_position: {
            event_index: 1,
            row: 2,
            worksheet: null,
          },
          id: "invalid",
          summary: "",
          issue_codes: ["empty_summary"],
        },
      ],
      calendar: null,
    }),
  };
}

function fatalResult(errorCode: ApiErrorCode): CalendarConverterResult {
  return {
    ok: false,
    status: errorCode === "oversized_upload" ? 413 : 422,
    error: {
      code: errorCode,
      message: "unsafe backend detail",
    },
  };
}

function conversionResponse(
  response: ConversionResponse,
): ConversionResponse {
  return response;
}
