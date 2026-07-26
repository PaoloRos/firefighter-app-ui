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

    expect(
      screen.getByRole("heading", {
        level: 1,
        name: "Werkzeuge für die Feuerwehr",
      }),
    ).toBeVisible();
    expect(screen.getByRole("link", { name: "Werkzeug öffnen" })).toHaveAttribute(
      "href",
      "/tools/calendar-converter",
    );
  });

  it("provides a translated skip link to the main landmark", () => {
    render(
      <MemoryRouter initialEntries={["/"]}>
        <App />
      </MemoryRouter>,
    );

    expect(
      screen.getByRole("link", { name: "Zum Hauptinhalt springen" }),
    ).toHaveAttribute("href", "#main-content");
    expect(screen.getByRole("main")).toHaveAttribute("id", "main-content");
    expect(screen.getByRole("main")).toHaveAttribute("tabindex", "-1");
  });

  it("navigates from the dashboard into the converter workflow", () => {
    render(
      <MemoryRouter initialEntries={["/"]}>
        <App />
      </MemoryRouter>,
    );

    fireEvent.click(screen.getByRole("link", { name: "Werkzeug öffnen" }));

    expect(
      screen.getByRole("heading", {
        level: 1,
        name: "Dienstplan konvertieren",
      }),
    ).toBeVisible();
    expect(screen.getByLabelText("Datei auswählen")).toHaveAttribute(
      "accept",
      ".csv,.xlsx",
    );
  });

  it("shows the calendar converter upload route", () => {
    render(
      <MemoryRouter initialEntries={["/tools/calendar-converter"]}>
        <App />
      </MemoryRouter>,
    );

    expect(
      screen.getByRole("heading", {
        level: 1,
        name: "Dienstplan konvertieren",
      }),
    ).toBeVisible();
    expect(screen.getByLabelText("Datei auswählen")).toHaveAttribute(
      "accept",
      ".csv,.xlsx",
    );
  });

  it("defaults to German without persisting an implicit choice", () => {
    render(
      <MemoryRouter initialEntries={["/"]}>
        <App />
      </MemoryRouter>,
    );

    expect(
      screen.getByRole("heading", {
        level: 1,
        name: "Werkzeuge für die Feuerwehr",
      }),
    ).toBeVisible();
    expect(
      screen.getByRole("button", { name: "Deutsch" }),
    ).toHaveAttribute("aria-pressed", "true");
    expect(document.documentElement).toHaveAttribute("lang", "de");
    expect(window.localStorage.getItem(LANGUAGE_STORAGE_KEY)).toBeNull();
  });

  it("switches to Italian and back while persisting each explicit choice", () => {
    render(
      <MemoryRouter initialEntries={["/"]}>
        <App />
      </MemoryRouter>,
    );

    fireEvent.click(screen.getByRole("button", { name: "Italiano" }));

    expect(
      screen.getByRole("heading", {
        level: 1,
        name: "Strumenti per i vigili del fuoco",
      }),
    ).toBeVisible();
    expect(screen.getByRole("link", { name: "Apri lo strumento" })).toBeVisible();
    expect(
      screen.getByRole("button", { name: "Italiano" }),
    ).toHaveAttribute("aria-pressed", "true");
    expect(screen.getByText("Feuerwehr Tools")).toBeVisible();
    expect(document.documentElement).toHaveAttribute("lang", "it");
    expect(window.localStorage.getItem(LANGUAGE_STORAGE_KEY)).toBe("it");

    fireEvent.click(screen.getByRole("button", { name: "Deutsch" }));

    expect(
      screen.getByRole("heading", {
        level: 1,
        name: "Werkzeuge für die Feuerwehr",
      }),
    ).toBeVisible();
    expect(
      screen.getByRole("button", { name: "Deutsch" }),
    ).toHaveAttribute("aria-pressed", "true");
    expect(document.documentElement).toHaveAttribute("lang", "de");
    expect(window.localStorage.getItem(LANGUAGE_STORAGE_KEY)).toBe("de");
  });

  it("restores a previously selected language", () => {
    window.localStorage.setItem(LANGUAGE_STORAGE_KEY, "it");

    render(
      <MemoryRouter initialEntries={["/tools/calendar-converter"]}>
        <App />
      </MemoryRouter>,
    );

    expect(
      screen.getByRole("heading", {
        level: 1,
        name: "Converti il piano dei turni",
      }),
    ).toBeVisible();
    expect(screen.getByLabelText("Scegli un file")).toBeVisible();
    expect(screen.getByRole("link", { name: "Torna alla panoramica" })).toBeVisible();
  });
});
