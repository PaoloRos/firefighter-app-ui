import { render, screen } from "@testing-library/react";
import { describe, expect, it, vi } from "vitest";

import { I18nProvider } from "../i18n/I18nProvider";
import {
  ActiveScheduleCard,
  formatScheduleSize,
  type ScheduleState,
} from "./ActiveScheduleCard";
import type { ActiveSchedule } from "../api/calendarConverter";

const SCHEDULE: ActiveSchedule = {
  filename: "dienstplan.xlsx",
  size_bytes: 4925,
  uploaded_at: "2026-09-14T08:30:00Z",
  uploaded_by: "chief",
};

function renderCard(state: ScheduleState, onRetry = vi.fn()) {
  return render(
    <I18nProvider>
      <ActiveScheduleCard state={state} onRetry={onRetry} />
    </I18nProvider>,
  );
}

describe("active schedule card", () => {
  it("announces the loading state politely", () => {
    renderCard({ status: "loading" });

    const status = screen.getByRole("status");
    expect(status).toHaveTextContent("Dienstplan wird geladen");
    expect(status).toHaveAttribute("aria-live", "polite");
  });

  it("explains an empty store and who can fill it", () => {
    renderCard({ status: "empty" });

    expect(
      screen.getByText(
        "Es ist noch kein Dienstplan auf dem Server hinterlegt.",
      ),
    ).toBeInTheDocument();
    expect(screen.getByText(/Super-User/)).toBeInTheDocument();
    expect(screen.queryByRole("button")).not.toBeInTheDocument();
  });

  it("shows the stored filename, uploader, and size", () => {
    renderCard({ status: "loaded", schedule: SCHEDULE });

    expect(screen.getByText("dienstplan.xlsx")).toBeInTheDocument();
    expect(screen.getByText("chief")).toBeInTheDocument();
    expect(screen.getByText("4.8 KiB")).toBeInTheDocument();
  });

  it("never renders an opaque stored filename", () => {
    const { container } = renderCard({
      status: "loaded",
      schedule: SCHEDULE,
    });

    expect(container.textContent).not.toMatch(/[0-9a-f]{32}/);
  });

  it("offers a retry when the schedule could not be loaded", async () => {
    const onRetry = vi.fn();
    renderCard({ status: "unavailable", errorCode: "internal_error" }, onRetry);

    expect(screen.getByRole("alert")).toHaveTextContent(
      "Der aktuelle Dienstplan konnte nicht geladen werden.",
    );

    screen.getByRole("button", { name: "Erneut versuchen" }).click();
    expect(onRetry).toHaveBeenCalledOnce();
  });

  it("formats sizes across the byte, KiB, and MiB ranges", () => {
    expect(formatScheduleSize(512)).toBe("512 B");
    expect(formatScheduleSize(4925)).toBe("4.8 KiB");
    expect(formatScheduleSize(200 * 1024)).toBe("200 KiB");
    expect(formatScheduleSize(3 * 1024 * 1024)).toBe("3.0 MiB");
  });
});
