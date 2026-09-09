import { fireEvent, screen } from "@testing-library/react";
import { beforeEach, describe, expect, it } from "vitest";

import { LANGUAGE_STORAGE_KEY } from "./i18n/I18nProvider";
import { PLAIN_USER, renderApp } from "./test/renderApp";

describe("App routing", () => {
  beforeEach(() => {
    window.localStorage.clear();
  });

  it("shows the Feuerwehr Tools dashboard at the root route", () => {
    renderApp("/");

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
    renderApp("/");

    expect(
      screen.getByRole("link", { name: "Zum Hauptinhalt springen" }),
    ).toHaveAttribute("href", "#main-content");
    expect(screen.getByRole("main")).toHaveAttribute("id", "main-content");
    expect(screen.getByRole("main")).toHaveAttribute("tabindex", "-1");
  });

  it("links the localized developer credit and GitHub icon to PaoloRos", () => {
    renderApp("/");

    const developerCredit = screen.getByRole("link", {
      name: "Entwickelt von PaoloRos.",
    });
    expect(developerCredit).toHaveAttribute(
      "href",
      "https://github.com/PaoloRos",
    );
    const githubIcon = developerCredit.querySelector("svg");
    expect(githubIcon).toHaveClass("footer-credit-icon");
    expect(githubIcon).toHaveAttribute("aria-hidden", "true");

    fireEvent.click(screen.getByRole("button", { name: "Italiano" }));
    expect(
      screen.getByRole("link", { name: "Sviluppato da PaoloRos." }),
    ).toHaveAttribute("href", "https://github.com/PaoloRos");
  });

  it("navigates from the dashboard into the converter workflow", () => {
    renderApp("/");

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
    renderApp("/tools/calendar-converter");

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
    renderApp("/");

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
    renderApp("/");

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

    renderApp("/tools/calendar-converter");

    expect(
      screen.getByRole("heading", {
        level: 1,
        name: "Converti il piano dei turni",
      }),
    ).toBeVisible();
    expect(screen.getByLabelText("Scegli un file")).toBeVisible();
    expect(screen.getByRole("link", { name: "Torna alla panoramica" })).toBeVisible();
  });

  it("redirects an anonymous visitor to the login screen", () => {
    renderApp("/", { status: "anonymous", user: null });

    expect(
      screen.getByRole("heading", {
        level: 1,
        name: "Bei Feuerwehr Tools anmelden",
      }),
    ).toBeVisible();
    expect(screen.getByLabelText("Benutzername")).toBeVisible();
    expect(screen.queryByRole("group", { name: "Konto" })).not.toBeInTheDocument();
  });

  it("shows the account menu with a role badge for a signed-in user", () => {
    renderApp("/", { user: PLAIN_USER });

    const accountMenu = screen.getByRole("group", { name: "Konto" });
    expect(accountMenu).toHaveTextContent("Angemeldet als");
    expect(accountMenu).toHaveTextContent("Member");
    expect(accountMenu).toHaveTextContent("Benutzer");
    expect(
      screen.getByRole("button", { name: "Abmelden" }),
    ).toBeVisible();
  });
});
