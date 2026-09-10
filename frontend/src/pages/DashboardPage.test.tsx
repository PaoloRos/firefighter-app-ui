import { screen, within } from "@testing-library/react";
import { beforeEach, describe, expect, it } from "vitest";

import { LANGUAGE_STORAGE_KEY } from "../i18n/I18nProvider";
import { renderApp } from "../test/renderApp";

function renderDashboard() {
  return renderApp("/");
}

describe("translated tool dashboard", () => {
  beforeEach(() => {
    window.localStorage.clear();
  });

  it("shows one German calendar-converter card with formats and route", () => {
    const { container } = renderDashboard();

    expect(
      screen.getByText("Praktische Werkzeuge für alltägliche Aufgaben."),
    ).toBeVisible();
    expect(container.querySelector(".tools-grid")).not.toBeNull();
    const cards = screen.getAllByRole("article");
    expect(cards).toHaveLength(1);

    const card = cards[0];
    if (card === undefined) {
      throw new Error("Expected the calendar-converter card");
    }
    expect(
      within(card).getByRole("heading", {
        level: 3,
        name: "Dienstplan konvertieren",
      }),
    ).toBeVisible();
    expect(
      within(card).getByText(
        "CSV- oder XLSX-Dienstpläne für den Import in eine Kalender-App vorbereiten.",
      ),
    ).toBeVisible();
    const formats = within(card).getByRole("list", {
      name: "Akzeptierte Formate",
    });
    expect(within(formats).getAllByRole("listitem")).toHaveLength(2);
    expect(within(formats).getByText("CSV")).toBeVisible();
    expect(within(formats).getByText("XLSX")).toBeVisible();
    expect(
      within(card).getByRole("link", { name: "Werkzeug öffnen" }),
    ).toHaveAttribute("href", "/tools/calendar-converter");
  });

  it("renders the identity panel ahead of the tool cards", () => {
    const { container } = renderDashboard();

    const heading = screen.getByRole("heading", { level: 2, name: "Wer bist du" });
    const panel = heading.closest("section");
    const toolsGrid = container.querySelector(".tools-grid");
    if (panel === null || toolsGrid === null) {
      throw new Error("Expected the identity panel and the tools grid");
    }
    expect(
      panel.compareDocumentPosition(toolsGrid) &
        Node.DOCUMENT_POSITION_FOLLOWING,
    ).toBeTruthy();
  });

  it("translates the complete card into Italian", () => {
    window.localStorage.setItem(LANGUAGE_STORAGE_KEY, "it");
    renderDashboard();

    expect(
      screen.getByText("Strumenti pratici per le attività ordinarie."),
    ).toBeVisible();
    const card = screen.getByRole("article");
    expect(
      within(card).getByRole("heading", {
        level: 3,
        name: "Converti il piano dei turni",
      }),
    ).toBeVisible();
    expect(
      within(card).getByText(
        "Prepara i piani dei turni CSV o XLSX per importarli in un'applicazione calendario.",
      ),
    ).toBeVisible();
    expect(
      within(card).getByRole("list", { name: "Formati accettati" }),
    ).toBeVisible();
    expect(
      within(card).getByRole("link", { name: "Apri lo strumento" }),
    ).toHaveAttribute("href", "/tools/calendar-converter");
  });
});
