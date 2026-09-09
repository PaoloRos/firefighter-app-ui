import { fireEvent, screen, waitFor } from "@testing-library/react";
import {
  afterEach,
  beforeEach,
  describe,
  expect,
  it,
  vi,
} from "vitest";

import {
  type ApiErrorCode,
  convertCalendar,
  type CalendarConverterResult,
  type ConversionResponse,
} from "../api/calendarConverter";
import { LANGUAGE_STORAGE_KEY } from "../i18n/I18nProvider";
import { PLAIN_USER, renderApp } from "../test/renderApp";

vi.mock("../api/calendarConverter", async (importOriginal) => {
  const actual =
    await importOriginal<typeof import("../api/calendarConverter")>();
  return {
    ...actual,
    convertCalendar: vi.fn(),
  };
});

const mockedConvertCalendar = vi.mocked(convertCalendar);
const originalCreateObjectUrl = Object.getOwnPropertyDescriptor(
  URL,
  "createObjectURL",
);
const originalRevokeObjectUrl = Object.getOwnPropertyDescriptor(
  URL,
  "revokeObjectURL",
);

function renderConverter() {
  return renderApp("/tools/calendar-converter");
}

describe("calendar converter upload workflow", () => {
  beforeEach(() => {
    window.localStorage.clear();
    setViewportWidth(1024);
    mockedConvertCalendar.mockReset();
    mockedConvertCalendar.mockResolvedValue(successfulResult());
  });

  afterEach(() => {
    vi.restoreAllMocks();
    restoreProperty(URL, "createObjectURL", originalCreateObjectUrl);
    restoreProperty(URL, "revokeObjectURL", originalRevokeObjectUrl);
  });

  it("starts with an extension-filtered picker and disabled actions", () => {
    renderConverter();

    const input = screen.getByLabelText("Datei auswählen");
    expect(input).toHaveAttribute("type", "file");
    expect(input).toHaveAttribute("accept", ".csv,.xlsx");
    expect(input).toHaveAccessibleDescription(
      "Akzeptiert werden CSV- und XLSX-Dateien.",
    );
    expect(
      screen.getByRole("button", { name: "Konvertierung starten" }),
    ).toBeDisabled();
    expect(screen.getByRole("button", { name: "Zurücksetzen" })).toBeDisabled();
  });

  it("shows bilingual-ready inline help and one stable sample URL", () => {
    renderConverter();

    expect(
      screen.getByRole("complementary", {
        name: "So funktioniert die Konvertierung",
      }),
    ).toBeVisible();
    expect(
      screen.getByText(
        "CSV- oder XLSX-Dienstplan auswählen oder hier ablegen.",
      ),
    ).toBeVisible();
    expect(screen.getByText("Maximale Dateigröße: 10 MiB.")).toBeVisible();
    expect(
      screen.getByText(
        "Bei einer Teilkonvertierung enthält der Kalender nur gültige Ereignisse.",
      ),
    ).toBeVisible();
    expect(
      screen.getByText(
        "Uploads und erzeugte Kalender werden von der Anwendung nicht gespeichert.",
      ),
    ).toBeVisible();
    const exampleLink = screen.getByRole("link", {
      name: "XLSX-Beispieldienstplan herunterladen",
    });
    expect(exampleLink).toHaveAttribute(
      "href",
      "/api/v1/tools/calendar-converter/example",
    );
    expect(exampleLink).toHaveAttribute(
      "download",
      "calendar_schedule_example.xlsx",
    );
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
    expect(screen.getByLabelText("Datei auswählen")).toHaveAccessibleDescription(
      "Akzeptiert werden CSV- und XLSX-Dateien. Es werden nur CSV- und XLSX-Dateien unterstützt.",
    );
    expect(
      screen.getByRole("heading", {
        level: 2,
        name: "Konvertierung nicht möglich",
      }),
    ).toHaveFocus();
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
    expect(dropZone).not.toHaveAttribute("role", "button");
    expect(dropZone).not.toHaveAttribute("tabindex");
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
    expect(screen.getByRole("status")).toHaveTextContent(
      "Wird konvertiert …",
    );
    expect(screen.getByText("Andere Datei auswählen")).toHaveAttribute(
      "aria-disabled",
      "true",
    );
    expect(screen.getByRole("button", { name: "Zurücksetzen" })).toBeDisabled();

    resolveConversion?.(successfulResult());

    const result = await screen.findByRole("status", {
      name: "Konvertierung erfolgreich",
    });
    expect(result).toHaveTextContent("Konvertierung erfolgreich");
    expect(result).toHaveTextContent("Konvertierte Ereignisse");
    expect(result).toHaveTextContent("1");
    expect(result).toHaveTextContent("schedule.ics");
    await waitFor(() => {
      expect(
        screen.getByRole("heading", {
          level: 2,
          name: "Konvertierung erfolgreich",
        }),
      ).toHaveFocus();
    });
  });

  it("downloads a successful calendar with its response filename and MIME type", async () => {
    const downloads = observeCalendarDownloads();
    renderConverter();
    selectSchedule("schedule.csv");

    fireEvent.click(
      screen.getByRole("button", { name: "Konvertierung starten" }),
    );

    await screen.findByRole("status", {
      name: "Konvertierung erfolgreich",
    });
    fireEvent.click(
      screen.getByRole("button", { name: "Kalender herunterladen" }),
    );

    expect(downloads.createObjectUrl).toHaveBeenCalledOnce();
    const blob = downloads.createObjectUrl.mock.calls[0]?.[0];
    expect(blob).toBeInstanceOf(Blob);
    expect(blob?.type).toBe("text/calendar;charset=utf-8");
    expect(await readBlob(blob)).toBe(
      "BEGIN:VCALENDAR\r\nEND:VCALENDAR\r\n",
    );
    expect(downloads.clickedLinks).toEqual([
      {
        download: "schedule.ics",
        href: "blob:calendar-download-1",
      },
    ]);
    expect(downloads.revokeObjectUrl).toHaveBeenCalledWith(
      "blob:calendar-download-1",
    );
  });

  it("renders a translated partial result and each skipped-event issue", async () => {
    mockedConvertCalendar.mockResolvedValue(partialResult());
    renderConverter();
    selectSchedule("mixed.xlsx");

    fireEvent.click(
      screen.getByRole("button", { name: "Konvertierung starten" }),
    );

    const result = await screen.findByRole("status", {
      name: "Teilweise konvertiert",
    });
    expect(result).toHaveTextContent("Teilergebnis");
    expect(result).toHaveTextContent("Ereignisse insgesamt");
    expect(result).toHaveTextContent("Teilweise konvertiert");
    expect(result).toHaveTextContent("Konvertierte Ereignisse");
    expect(result).toHaveTextContent("Übersprungene Ereignisse");
    expect(result).toHaveTextContent(
      "Die vorbereitete Kalenderdatei enthält ausschließlich gültige Ereignisse.",
    );
    expect(result).toHaveTextContent("Übung ohne Kennung");
    expect(result).toHaveTextContent("Übersprungen");
    expect(result).toHaveTextContent("Zeile 3 · Arbeitsblatt Juli");
    expect(result).toHaveTextContent("Probleme");
    expect(result).toHaveTextContent("Die Ereignis-ID fehlt.");
    expect(result).toHaveTextContent("mixed.ics");
    expect(
      screen.getByRole("button", { name: "Kalender herunterladen" }),
    ).toBeEnabled();
    await waitFor(() => {
      expect(
        screen.getByRole("heading", {
          level: 2,
          name: "Teilweise konvertiert",
        }),
      ).toHaveFocus();
    });
  });

  it("allows a partial calendar to be downloaded repeatedly without retaining object URLs", async () => {
    const downloads = observeCalendarDownloads();
    mockedConvertCalendar.mockResolvedValue(partialResult());
    renderConverter();
    selectSchedule("mixed.xlsx");

    fireEvent.click(
      screen.getByRole("button", { name: "Konvertierung starten" }),
    );

    await screen.findByRole("status", {
      name: "Teilweise konvertiert",
    });
    const downloadButton = screen.getByRole("button", {
      name: "Kalender herunterladen",
    });
    fireEvent.click(downloadButton);
    fireEvent.click(downloadButton);

    expect(downloads.createObjectUrl).toHaveBeenCalledTimes(2);
    expect(downloads.clickedLinks).toEqual([
      {
        download: "mixed.ics",
        href: "blob:calendar-download-1",
      },
      {
        download: "mixed.ics",
        href: "blob:calendar-download-2",
      },
    ]);
    expect(downloads.revokeObjectUrl.mock.calls).toEqual([
      ["blob:calendar-download-1"],
      ["blob:calendar-download-2"],
    ]);
  });

  it("keeps an all-invalid result distinct from a fatal error", async () => {
    mockedConvertCalendar.mockResolvedValue(allInvalidResult());
    renderConverter();
    selectSchedule("invalid.csv");

    fireEvent.click(
      screen.getByRole("button", { name: "Konvertierung starten" }),
    );

    const result = await screen.findByRole("status", {
      name: "Keine Ereignisse konvertiert",
    });
    expect(result).toHaveTextContent("Keine Ereignisse konvertiert");
    expect(result).toHaveTextContent("alle Ereignisse waren ungültig");
    expect(result).toHaveTextContent(
      "Es wurde keine Kalenderdatei erstellt.",
    );
    expect(result).toHaveTextContent("Die Zusammenfassung fehlt.");
    expect(screen.queryByRole("alert")).not.toBeInTheDocument();
    expect(
      screen.queryByText("Vorbereitete Kalenderdatei"),
    ).not.toBeInTheDocument();
    expect(
      screen.queryByRole("button", { name: "Kalender herunterladen" }),
    ).not.toBeInTheDocument();
    await waitFor(() => {
      expect(
        screen.getByRole("heading", {
          level: 2,
          name: "Keine Ereignisse konvertiert",
        }),
      ).toHaveFocus();
    });
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
      await waitFor(() => {
        expect(
          screen.getByRole("heading", {
            level: 2,
            name: "Konvertierung nicht möglich",
          }),
        ).toHaveFocus();
      });
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
    await screen.findByRole("status", {
      name: "Konvertierung erfolgreich",
    });
    expect(
      screen.getByRole("button", { name: "Kalender herunterladen" }),
    ).toBeVisible();

    fireEvent.change(screen.getByLabelText("Andere Datei auswählen"), {
      target: {
        files: [new File(["schedule"], "replacement.xlsx")],
      },
    });

    expect(screen.queryByRole("status")).not.toBeInTheDocument();
    expect(
      screen.queryByRole("button", { name: "Kalender herunterladen" }),
    ).not.toBeInTheDocument();
    expect(screen.getByText("replacement.xlsx")).toBeVisible();
    expect(
      screen.getByRole("button", { name: "Konvertierung starten" }),
    ).toBeEnabled();

    fireEvent.click(screen.getByRole("button", { name: "Zurücksetzen" }));

    expect(screen.queryByText("replacement.xlsx")).not.toBeInTheDocument();
    expect(
      screen.getByRole("button", { name: "Konvertierung starten" }),
    ).toBeDisabled();
    expect(screen.getByLabelText("Datei auswählen")).toHaveFocus();
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

    const result = await screen.findByRole("status", {
      name: "Conversione parziale",
    });
    expect(result).toHaveTextContent("Conversione parziale");
    expect(result).toHaveTextContent("Risultato parziale");
    expect(result).toHaveTextContent("Eventi totali");
    expect(result).toHaveTextContent("Eventi convertiti");
    expect(result).toHaveTextContent("Eventi ignorati");
    expect(result).toHaveTextContent(
      "Il file calendario preparato contiene esclusivamente gli eventi validi.",
    );
    expect(result).toHaveTextContent("Ignorato");
    expect(result).toHaveTextContent("Manca l'ID dell'evento.");
    expect(
      screen.getByRole("button", { name: "Scarica il calendario" }),
    ).toBeEnabled();
    expect(
      screen.getByRole("complementary", {
        name: "Come funziona la conversione",
      }),
    ).toHaveTextContent(
      "I caricamenti e i calendari generati non vengono salvati dall'applicazione.",
    );
    expect(
      screen.getByRole("link", {
        name: "Scarica il piano dei turni XLSX di esempio",
      }),
    ).toHaveAttribute(
      "href",
      "/api/v1/tools/calendar-converter/example",
    );
  });

  it("preserves a completed result while switching Italian and German", async () => {
    mockedConvertCalendar.mockResolvedValue(partialResult());
    renderConverter();
    selectSchedule("mixed.xlsx");
    fireEvent.click(
      screen.getByRole("button", { name: "Konvertierung starten" }),
    );
    await screen.findByRole("status", {
      name: "Teilweise konvertiert",
    });

    fireEvent.click(screen.getByRole("button", { name: "Italiano" }));

    expect(
      screen.getByRole("status", { name: "Conversione parziale" }),
    ).toHaveTextContent(
      "Conversione parziale",
    );
    expect(screen.getByText("mixed.xlsx")).toBeVisible();
    expect(screen.getByText("mixed.ics")).toBeVisible();
    expect(mockedConvertCalendar).toHaveBeenCalledOnce();

    fireEvent.click(screen.getByRole("button", { name: "Deutsch" }));

    expect(
      screen.getByRole("status", { name: "Teilweise konvertiert" }),
    ).toHaveTextContent(
      "Teilweise konvertiert",
    );
    expect(screen.getByText("mixed.xlsx")).toBeVisible();
    expect(screen.getByText("mixed.ics")).toBeVisible();
    expect(window.localStorage.getItem(LANGUAGE_STORAGE_KEY)).toBe("de");
    expect(mockedConvertCalendar).toHaveBeenCalledOnce();
  });

  it("hides the upload form from a non-super-user account", () => {
    renderApp("/tools/calendar-converter", { user: PLAIN_USER });

    expect(
      screen.getByRole("heading", {
        level: 2,
        name: "Upload ist eingeschränkt",
      }),
    ).toBeVisible();
    expect(
      screen.getByText(
        "Das Hochladen von Dienstplänen ist Super-User-Konten vorbehalten. Personalisierte Kalender-Downloads folgen in einer späteren Version.",
      ),
    ).toBeVisible();
    expect(
      screen.queryByLabelText("Datei auswählen"),
    ).not.toBeInTheDocument();
    expect(
      screen.queryByRole("button", { name: "Konvertierung starten" }),
    ).not.toBeInTheDocument();
    expect(
      screen.getByRole("link", {
        name: "XLSX-Beispieldienstplan herunterladen",
      }),
    ).toBeVisible();
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

      expect(
        await screen.findByRole("status", {
          name: "Teilweise konvertiert",
        }),
      ).toHaveClass(
        "result-panel",
        "partial-result",
      );
      expect(container.querySelectorAll(".result-counts > div")).toHaveLength(
        3,
      );
      expect(container.querySelector(".result-guidance")).not.toBeNull();
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

function observeCalendarDownloads() {
  let objectUrlIndex = 0;
  const createObjectUrl = vi.fn((_blob: Blob) => {
    objectUrlIndex += 1;
    return `blob:calendar-download-${objectUrlIndex}`;
  });
  const revokeObjectUrl = vi.fn((_url: string) => undefined);
  const clickedLinks: { download: string; href: string }[] = [];

  Object.defineProperty(URL, "createObjectURL", {
    configurable: true,
    value: createObjectUrl,
  });
  Object.defineProperty(URL, "revokeObjectURL", {
    configurable: true,
    value: revokeObjectUrl,
  });
  vi.spyOn(HTMLAnchorElement.prototype, "click").mockImplementation(
    function recordDownload(this: HTMLAnchorElement) {
      clickedLinks.push({
        download: this.download,
        href: this.getAttribute("href") ?? "",
      });
    },
  );

  return {
    clickedLinks,
    createObjectUrl,
    revokeObjectUrl,
  };
}

function restoreProperty(
  target: typeof URL,
  property: "createObjectURL" | "revokeObjectURL",
  descriptor: PropertyDescriptor | undefined,
) {
  if (descriptor === undefined) {
    Reflect.deleteProperty(target, property);
    return;
  }
  Object.defineProperty(target, property, descriptor);
}

function readBlob(blob: Blob | undefined): Promise<string> {
  if (blob === undefined) {
    throw new Error("Expected a calendar Blob");
  }

  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.addEventListener("load", () => resolve(String(reader.result)));
    reader.addEventListener("error", () => reject(reader.error));
    reader.readAsText(blob);
  });
}
