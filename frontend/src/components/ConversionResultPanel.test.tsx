import { createRef } from "react";
import { render, screen } from "@testing-library/react";
import { describe, expect, it } from "vitest";

import { I18nProvider } from "../i18n/I18nProvider";
import {
  ConversionResultPanel,
  type ResultVariant,
} from "./ConversionResultPanel";
import type { ConversionResponse } from "../api/calendarConverter";

const PARTIAL: ConversionResponse = {
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

function renderPanel(variant: ResultVariant, result = PARTIAL) {
  return render(
    <I18nProvider>
      <ConversionResultPanel
        result={result}
        variant={variant}
        headingRef={createRef<HTMLHeadingElement>()}
      />
    </I18nProvider>,
  );
}

describe("conversion result panel", () => {
  it("shows skipped events and counts in the full variant", () => {
    renderPanel("full");

    expect(
      screen.getByRole("heading", { name: "Probleme im Dienstplan" }),
    ).toBeInTheDocument();
    expect(screen.getByText("invalid-1")).toBeInTheDocument();
    expect(screen.getByText(/Zeile 3/)).toBeInTheDocument();
    expect(screen.getByText("Übersprungen")).toBeInTheDocument();
    expect(screen.getAllByRole("definition")).toHaveLength(3);
  });

  it("hides diagnostics and the skipped count in the download variant", () => {
    renderPanel("download");

    expect(
      screen.queryByRole("heading", { name: "Probleme im Dienstplan" }),
    ).not.toBeInTheDocument();
    expect(screen.queryByText("invalid-1")).not.toBeInTheDocument();
    expect(screen.queryByText("Übersprungen")).not.toBeInTheDocument();
    expect(screen.getAllByRole("definition")).toHaveLength(2);
  });

  it("keeps the download and the partial warning in both variants", () => {
    for (const variant of ["full", "download"] as const) {
      const { unmount } = renderPanel(variant);

      expect(screen.getByText("dienstplan.ics")).toBeInTheDocument();
      expect(
        screen.getByRole("button", { name: "Kalender herunterladen" }),
      ).toBeEnabled();
      expect(
        screen.getByText(
          "Die vorbereitete Kalenderdatei enthält ausschließlich gültige Ereignisse.",
        ),
      ).toBeInTheDocument();

      unmount();
    }
  });

  it("offers no download when every event was invalid", () => {
    renderPanel("download", {
      status: "failure",
      total_count: 1,
      converted_count: 0,
      skipped_count: 1,
      invalid_events: PARTIAL.invalid_events,
      calendar: null,
    });

    expect(
      screen.queryByRole("button", { name: "Kalender herunterladen" }),
    ).not.toBeInTheDocument();
    expect(
      screen.getByText("Es wurde keine Kalenderdatei erstellt."),
    ).toBeInTheDocument();
  });
});
