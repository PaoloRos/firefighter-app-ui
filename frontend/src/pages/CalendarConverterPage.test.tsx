import { fireEvent, screen, waitFor, within } from "@testing-library/react";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

import {
  convertActiveSchedule,
  fetchActiveSchedule,
  uploadActiveSchedule,
  type ActiveSchedule,
  type ApiErrorCode,
  type CalendarConverterResult,
  type ConversionResponse,
} from "../api/calendarConverter";
import { LANGUAGE_STORAGE_KEY } from "../i18n/I18nProvider";
import {
  PLAIN_USER,
  SUPER_USER,
  UNNUMBERED_USER,
  renderApp,
} from "../test/renderApp";
import {
  EXAMPLE_SCHEDULE_FILENAME,
  EXAMPLE_SCHEDULE_URL,
} from "./CalendarConverterPage";

vi.mock("../api/calendarConverter", async (importOriginal) => {
  const actual =
    await importOriginal<typeof import("../api/calendarConverter")>();
  return {
    ...actual,
    fetchActiveSchedule: vi.fn(),
    uploadActiveSchedule: vi.fn(),
    convertActiveSchedule: vi.fn(),
  };
});

const mockedFetch = vi.mocked(fetchActiveSchedule);
const mockedUpload = vi.mocked(uploadActiveSchedule);
const mockedConvert = vi.mocked(convertActiveSchedule);

const ROUTE = "/tools/calendar-converter";

const STORED: ActiveSchedule = {
  filename: "dienstplan.xlsx",
  size_bytes: 4925,
  uploaded_at: "2026-09-14T08:30:00Z",
  uploaded_by: "chief",
};

function successfulResult(): CalendarConverterResult {
  return {
    ok: true,
    response: {
      status: "success",
      total_count: 2,
      converted_count: 2,
      skipped_count: 0,
      invalid_events: [],
      calendar: {
        filename: "dienstplan.ics",
        mime_type: "text/calendar;charset=utf-8",
        ics_text: "BEGIN:VCALENDAR\r\nEND:VCALENDAR\r\n",
      },
    },
  };
}

function partialResponse(): ConversionResponse {
  return {
    status: "partial",
    total_count: 3,
    converted_count: 2,
    skipped_count: 1,
    invalid_events: [
      {
        source_position: { event_index: 2, row: 3, worksheet: "Juli" },
        id: "invalid-1",
        summary: "",
        issue_codes: ["empty_summary"],
      },
    ],
    calendar: {
      filename: "dienstplan.ics",
      mime_type: "text/calendar;charset=utf-8",
      ics_text: "BEGIN:VCALENDAR\r\nEND:VCALENDAR\r\n",
    },
  };
}

function fatalResult(code: ApiErrorCode): CalendarConverterResult {
  return {
    ok: false,
    status: 409,
    error: { code, message: "unsafe backend detail" },
  };
}

async function convertAndWait() {
  fireEvent.click(screen.getByRole("button", { name: "Kalender erstellen" }));
  await waitFor(() => expect(mockedConvert).toHaveBeenCalled());
}

describe("calendar converter page", () => {
  beforeEach(() => {
    window.localStorage.clear();
    mockedFetch.mockReset();
    mockedUpload.mockReset();
    mockedConvert.mockReset();
    mockedFetch.mockResolvedValue({ ok: true, response: { schedule: STORED } });
    mockedConvert.mockResolvedValue(successfulResult());
    mockedUpload.mockResolvedValue({
      ok: true,
      response: { schedule: STORED },
    });
  });

  afterEach(() => {
    vi.unstubAllGlobals();
  });

  it("loads the stored schedule on mount", async () => {
    renderApp(ROUTE);

    expect(await screen.findByText("dienstplan.xlsx")).toBeInTheDocument();
    expect(screen.getByText("chief")).toBeInTheDocument();
    expect(mockedFetch).toHaveBeenCalledOnce();
  });

  it("reports an empty store and disables conversion", async () => {
    mockedFetch.mockResolvedValue({ ok: true, response: { schedule: null } });
    renderApp(ROUTE);

    expect(
      await screen.findByText(
        "Es ist noch kein Dienstplan auf dem Server hinterlegt.",
      ),
    ).toBeInTheDocument();
    expect(
      screen.getByRole("button", { name: "Kalender erstellen" }),
    ).toBeDisabled();
  });

  it("converts the stored schedule and focuses the outcome", async () => {
    renderApp(ROUTE);
    await screen.findByText("dienstplan.xlsx");

    await convertAndWait();

    const heading = await screen.findByRole("heading", {
      name: "Konvertierung erfolgreich",
    });
    await waitFor(() => expect(heading).toHaveFocus());
    expect(
      screen.getByRole("button", { name: "Kalender herunterladen" }),
    ).toBeEnabled();
  });

  it("shows a stale store as empty when the server reports none", async () => {
    mockedConvert.mockResolvedValue(fatalResult("no_active_schedule"));
    renderApp(ROUTE);
    await screen.findByText("dienstplan.xlsx");

    await convertAndWait();

    expect(await screen.findByRole("alert")).toHaveTextContent(
      "Es ist kein Dienstplan hinterlegt.",
    );
    expect(
      screen.getByText("Es ist noch kein Dienstplan auf dem Server hinterlegt."),
    ).toBeInTheDocument();
    expect(screen.queryByText("unsafe backend detail")).not.toBeInTheDocument();
  });

  it("offers a retry when the schedule cannot be loaded", async () => {
    mockedFetch.mockRejectedValueOnce(new Error("offline"));
    renderApp(ROUTE);

    const retry = await screen.findByRole("button", {
      name: "Erneut versuchen",
    });

    mockedFetch.mockResolvedValue({
      ok: true,
      response: { schedule: STORED },
    });
    fireEvent.click(retry);

    expect(await screen.findByText("dienstplan.xlsx")).toBeInTheDocument();
  });

  it("gives a super-user the upload form and full diagnostics", async () => {
    mockedConvert.mockResolvedValue({ ok: true, response: partialResponse() });
    renderApp(ROUTE);
    await screen.findByText("dienstplan.xlsx");

    expect(screen.getByLabelText("Datei auswählen")).toBeInTheDocument();
    expect(
      screen.getByRole("button", { name: "Dienstplan hochladen" }),
    ).toBeInTheDocument();

    await convertAndWait();

    expect(
      await screen.findByRole("heading", { name: "Probleme im Dienstplan" }),
    ).toBeInTheDocument();
    expect(screen.getByText("invalid-1")).toBeInTheDocument();
  });

  it("shows a plain user only the schedule, conversion, and download", async () => {
    mockedConvert.mockResolvedValue({ ok: true, response: partialResponse() });
    renderApp(ROUTE, { user: PLAIN_USER });
    await screen.findByText("dienstplan.xlsx");

    expect(screen.queryByLabelText("Datei auswählen")).not.toBeInTheDocument();
    expect(
      screen.queryByRole("button", { name: "Dienstplan hochladen" }),
    ).not.toBeInTheDocument();

    await convertAndWait();
    await screen.findByRole("heading", { name: "Teilweise konvertiert" });

    expect(
      screen.queryByRole("heading", { name: "Probleme im Dienstplan" }),
    ).not.toBeInTheDocument();
    expect(screen.queryByText("invalid-1")).not.toBeInTheDocument();
    expect(screen.queryByText("Übersprungen")).not.toBeInTheDocument();
    expect(
      screen.getByRole("button", { name: "Kalender herunterladen" }),
    ).toBeEnabled();
  });

  it("offers the example schedule to a super-user who uploads", async () => {
    renderApp(ROUTE);
    await screen.findByText("dienstplan.xlsx");

    const link = screen.getByRole("link", {
      name: "XLSX-Beispieldienstplan herunterladen",
    });
    expect(link).toHaveAttribute("href", EXAMPLE_SCHEDULE_URL);
    expect(link).toHaveAttribute("download", EXAMPLE_SCHEDULE_FILENAME);
  });

  it("hides the example schedule from a plain user", async () => {
    renderApp(ROUTE, { user: PLAIN_USER });
    await screen.findByText("dienstplan.xlsx");

    expect(
      screen.queryByRole("link", {
        name: "XLSX-Beispieldienstplan herunterladen",
      }),
    ).not.toBeInTheDocument();
  });

  it("trims the help steps for a plain user", async () => {
    renderApp(ROUTE, { user: PLAIN_USER });
    await screen.findByText("dienstplan.xlsx");

    const help = screen.getByRole("complementary");
    expect(within(help).queryByText(/Dienstplan hochladen;/)).toBeNull();
    expect(
      within(help).getByText(
        "Konvertierung starten und übersprungene Ereignisse prüfen.",
      ),
    ).toBeInTheDocument();
  });

  it("replaces the shown schedule after a successful upload", async () => {
    renderApp(ROUTE);
    await screen.findByText("dienstplan.xlsx");

    mockedUpload.mockResolvedValue({
      ok: true,
      response: {
        schedule: { ...STORED, filename: "neuer-plan.csv", uploaded_by: "anna" },
      },
    });

    fireEvent.change(screen.getByLabelText("Datei auswählen"), {
      target: { files: [new File(["id\n"], "neuer-plan.csv")] },
    });
    fireEvent.click(
      screen.getByRole("button", { name: "Dienstplan hochladen" }),
    );
    await waitFor(() => expect(mockedUpload).toHaveBeenCalled());

    const card = await screen.findByRole("region", {
      name: "Aktueller Dienstplan",
    });
    expect(await within(card).findByText("neuer-plan.csv")).toBeInTheDocument();
    expect(screen.getByText("anna")).toBeInTheDocument();
  });

  it("downloads the generated calendar as a local blob", async () => {
    const clicked: { download: string; href: string }[] = [];
    const createObjectURL = vi.fn(() => "blob:calendar-download-1");
    const revokeObjectURL = vi.fn();
    vi.stubGlobal("URL", {
      ...URL,
      createObjectURL,
      revokeObjectURL,
    });
    const clickSpy = vi
      .spyOn(HTMLAnchorElement.prototype, "click")
      .mockImplementation(function (this: HTMLAnchorElement) {
        clicked.push({ download: this.download, href: this.href });
      });

    renderApp(ROUTE);
    await screen.findByText("dienstplan.xlsx");
    await convertAndWait();

    fireEvent.click(
      await screen.findByRole("button", { name: "Kalender herunterladen" }),
    );

    expect(clicked).toEqual([
      { download: "dienstplan.ics", href: "blob:calendar-download-1" },
    ]);
    expect(revokeObjectURL).toHaveBeenCalledWith("blob:calendar-download-1");
    clickSpy.mockRestore();
  });

  it("renders the Italian experience", async () => {
    window.localStorage.setItem(LANGUAGE_STORAGE_KEY, "it");
    renderApp(ROUTE, { user: PLAIN_USER });

    expect(
      await screen.findByRole("heading", { name: "Piano dei turni attuale" }),
    ).toBeInTheDocument();
    expect(
      screen.getByRole("button", { name: "Crea il calendario" }),
    ).toBeInTheDocument();
  });

  describe("per-person calendars", () => {
    const personalToggle = () =>
      screen.getByRole("checkbox", { name: "Nur meine Termine" });

    it("converts the full schedule for a super-user by default", async () => {
      renderApp(ROUTE);
      await screen.findByText("dienstplan.xlsx");

      expect(personalToggle()).not.toBeChecked();
      await convertAndWait();

      expect(mockedConvert).toHaveBeenCalledWith({ scope: "full" });
    });

    it("converts a super-user's own events when the toggle is on", async () => {
      mockedConvert.mockResolvedValue({ ok: true, response: partialResponse() });
      renderApp(ROUTE);
      await screen.findByText("dienstplan.xlsx");

      fireEvent.click(personalToggle());
      await convertAndWait();
      await screen.findByRole("heading", { name: "Teilweise konvertiert" });

      expect(mockedConvert).toHaveBeenCalledWith({ scope: "personal" });
      // The personal calendar is a download, not a review of the file.
      expect(screen.queryByText("invalid-1")).not.toBeInTheDocument();
    });

    it("clears a shown result when the toggle changes", async () => {
      renderApp(ROUTE);
      await screen.findByText("dienstplan.xlsx");
      await convertAndWait();
      await screen.findByRole("heading", { name: "Konvertierung erfolgreich" });

      fireEvent.click(personalToggle());

      expect(
        screen.queryByRole("heading", { name: "Konvertierung erfolgreich" }),
      ).not.toBeInTheDocument();
    });

    it("disables the toggle for a super-user without a personnel number", async () => {
      renderApp(ROUTE, {
        user: { ...SUPER_USER, personnel_number: null },
      });
      await screen.findByText("dienstplan.xlsx");

      expect(personalToggle()).toBeDisabled();
      expect(
        screen.getByText(
          "Nicht verfügbar: Ihrem Konto ist keine Personalnummer zugeordnet.",
        ),
      ).toBeInTheDocument();
      expect(
        screen.getByRole("button", { name: "Kalender erstellen" }),
      ).toBeEnabled();
    });

    it("converts a plain user's own events without offering the toggle", async () => {
      renderApp(ROUTE, { user: PLAIN_USER });
      await screen.findByText("dienstplan.xlsx");

      expect(screen.queryByRole("checkbox")).not.toBeInTheDocument();
      await convertAndWait();

      expect(mockedConvert).toHaveBeenCalledWith({ scope: "personal" });
    });

    it("blocks a plain user without a personnel number before converting", async () => {
      renderApp(ROUTE, { user: UNNUMBERED_USER });
      await screen.findByText("dienstplan.xlsx");

      expect(
        screen.getByText(/Ihrem Konto ist keine Personalnummer zugeordnet\./),
      ).toBeInTheDocument();
      expect(
        screen.getByRole("button", { name: "Kalender erstellen" }),
      ).toBeDisabled();
      expect(mockedConvert).not.toHaveBeenCalled();
    });

    it("translates a missing personnel number reported by the server", async () => {
      mockedConvert.mockResolvedValue(fatalResult("missing_personnel_number"));
      renderApp(ROUTE, { user: PLAIN_USER });
      await screen.findByText("dienstplan.xlsx");
      await convertAndWait();

      const alert = await screen.findByRole("alert");
      expect(
        within(alert).getByText(
          /Bitte wenden Sie sich an einen Super-User, damit Ihre persönlichen Termine/,
        ),
      ).toBeInTheDocument();
      expect(within(alert).queryByText("unsafe backend detail")).toBeNull();
    });

    it("tells a plain user when the schedule has no events for them", async () => {
      mockedConvert.mockResolvedValue({
        ok: true,
        response: {
          status: "failure",
          total_count: 0,
          converted_count: 0,
          skipped_count: 0,
          invalid_events: [],
          calendar: null,
        },
      });
      renderApp(ROUTE, { user: PLAIN_USER });
      await screen.findByText("dienstplan.xlsx");
      await convertAndWait();

      expect(
        await screen.findByRole("heading", { name: "Keine Termine für Sie" }),
      ).toBeInTheDocument();
    });

    it("explains the participants column only to a super-user", async () => {
      const participantsHelp = /Die optionale Spalte „participants“/;

      const { unmount } = renderApp(ROUTE);
      await screen.findByText("dienstplan.xlsx");
      const superHelp = screen.getByRole("complementary");
      expect(within(superHelp).getByText(participantsHelp)).toBeInTheDocument();
      unmount();

      renderApp(ROUTE, { user: PLAIN_USER });
      await screen.findByText("dienstplan.xlsx");
      const help = screen.getByRole("complementary");
      expect(within(help).queryByText(participantsHelp)).toBeNull();
      expect(
        within(help).getByText(
          "Der Kalender enthält Ihre eigenen Termine und die Termine für alle.",
        ),
      ).toBeInTheDocument();
    });

    it("labels the toggle in Italian", async () => {
      window.localStorage.setItem(LANGUAGE_STORAGE_KEY, "it");
      renderApp(ROUTE);
      await screen.findByText("dienstplan.xlsx");

      expect(
        screen.getByRole("checkbox", { name: "Solo i miei impegni" }),
      ).toBeInTheDocument();
    });
  });
});
