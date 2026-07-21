import { render, screen } from "@testing-library/react";
import { MemoryRouter } from "react-router-dom";
import { describe, expect, it } from "vitest";

import { App } from "./App";

describe("App routing", () => {
  it("shows the Feuerwehr Tools dashboard at the root route", () => {
    render(
      <MemoryRouter initialEntries={["/"]}>
        <App />
      </MemoryRouter>,
    );

    expect(screen.getByRole("heading", { level: 1, name: "Werkzeuge für die Feuerwehr" })).toBeVisible();
    expect(screen.getByRole("link", { name: "Werkzeug öffnen" })).toHaveAttribute(
      "href",
      "/tools/calendar-converter",
    );
  });

  it("shows the calendar converter placeholder route", () => {
    render(
      <MemoryRouter initialEntries={["/tools/calendar-converter"]}>
        <App />
      </MemoryRouter>,
    );

    expect(screen.getByRole("heading", { level: 1, name: "Dienstplan konvertieren" })).toBeVisible();
    expect(screen.getByText(/wird in einem der nächsten Schritte eingerichtet/)).toBeVisible();
  });
});
