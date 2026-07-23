import { fireEvent, render, screen } from "@testing-library/react";
import { MemoryRouter } from "react-router-dom";
import { beforeEach, describe, expect, it } from "vitest";

import { App } from "./App";
import { LANGUAGE_STORAGE_KEY } from "./i18n/I18nProvider";

describe("App routing", () => {
  beforeEach(() => {
    window.localStorage.clear();
  });

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

  it("defaults to German without persisting an implicit choice", () => {
    render(
      <MemoryRouter initialEntries={["/"]}>
        <App />
      </MemoryRouter>,
    );

    expect(screen.getByRole("heading", { level: 1, name: "Werkzeuge für die Feuerwehr" })).toBeVisible();
    expect(screen.getByRole("button", { name: "Deutsch" })).toHaveAttribute("aria-pressed", "true");
    expect(document.documentElement).toHaveAttribute("lang", "de");
    expect(window.localStorage.getItem(LANGUAGE_STORAGE_KEY)).toBeNull();
  });

  it("switches to Italian and persists the explicit choice", () => {
    render(
      <MemoryRouter initialEntries={["/"]}>
        <App />
      </MemoryRouter>,
    );

    fireEvent.click(screen.getByRole("button", { name: "Italiano" }));

    expect(screen.getByRole("heading", { level: 1, name: "Strumenti per i vigili del fuoco" })).toBeVisible();
    expect(screen.getByRole("link", { name: "Apri lo strumento" })).toBeVisible();
    expect(screen.getByRole("button", { name: "Italiano" })).toHaveAttribute("aria-pressed", "true");
    expect(screen.getByText("Feuerwehr Tools")).toBeVisible();
    expect(document.documentElement).toHaveAttribute("lang", "it");
    expect(window.localStorage.getItem(LANGUAGE_STORAGE_KEY)).toBe("it");
  });

  it("restores a previously selected language", () => {
    window.localStorage.setItem(LANGUAGE_STORAGE_KEY, "it");

    render(
      <MemoryRouter initialEntries={["/tools/calendar-converter"]}>
        <App />
      </MemoryRouter>,
    );

    expect(screen.getByRole("heading", { level: 1, name: "Converti il piano dei turni" })).toBeVisible();
    expect(screen.getByText(/sarà configurato in uno dei prossimi passaggi/)).toBeVisible();
    expect(screen.getByRole("link", { name: "Torna alla panoramica" })).toBeVisible();
  });
});
