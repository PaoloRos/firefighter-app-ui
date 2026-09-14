import { fireEvent, render, screen, waitFor } from "@testing-library/react";
import { MemoryRouter, Route, Routes } from "react-router-dom";
import { beforeEach, describe, expect, it, vi } from "vitest";

import { fetchCurrentUser, login, logout, type SessionUser } from "../api/auth";
import { AuthProvider } from "../auth/AuthProvider";
import { I18nProvider, LANGUAGE_STORAGE_KEY } from "../i18n/I18nProvider";
import { renderApp } from "../test/renderApp";
import { LoginPage } from "./LoginPage";

vi.mock("../api/auth", () => ({
  fetchCurrentUser: vi.fn(),
  login: vi.fn(),
  logout: vi.fn(),
}));

const mockedFetchCurrentUser = vi.mocked(fetchCurrentUser);
const mockedLogin = vi.mocked(login);
const mockedLogout = vi.mocked(logout);

const superUser: SessionUser = {
  username: "chief",
  role: "super_user",
  name: "Anna",
  surname: null,
  rank: null,
  zug: null,
  gruppe: null,
};

function renderLogin(from = "/") {
  return render(
    <I18nProvider>
      <AuthProvider>
        <MemoryRouter
          initialEntries={[{ pathname: "/login", state: { from: { pathname: from } } }]}
        >
          <Routes>
            <Route path="/login" element={<LoginPage />} />
            <Route path="/" element={<p>dashboard here</p>} />
            <Route
              path="/tools/calendar-converter"
              element={<p>converter here</p>}
            />
          </Routes>
        </MemoryRouter>
      </AuthProvider>
    </I18nProvider>,
  );
}

beforeEach(() => {
  window.localStorage.clear();
  mockedFetchCurrentUser.mockReset();
  mockedLogin.mockReset();
  mockedLogout.mockReset();
  mockedFetchCurrentUser.mockResolvedValue(null);
  mockedLogout.mockResolvedValue(undefined);
});

describe("LoginPage", () => {
  it("renders an accessible German sign-in form by default", async () => {
    renderLogin();

    expect(
      screen.getByRole("heading", {
        level: 1,
        name: "Bei Feuerwehr Tools anmelden",
      }),
    ).toBeVisible();
    expect(screen.getByLabelText("Benutzername")).toHaveAttribute("type", "text");
    expect(screen.getByLabelText("Passwort")).toHaveAttribute(
      "type",
      "password",
    );
    expect(
      screen.getByRole("button", { name: "Anmelden" }),
    ).toBeEnabled();

    await waitFor(() => expect(mockedFetchCurrentUser).toHaveBeenCalled());
  });

  it("renders the form in Italian when that language is stored", async () => {
    window.localStorage.setItem(LANGUAGE_STORAGE_KEY, "it");
    renderLogin();

    expect(
      screen.getByRole("heading", { level: 1, name: "Accedi a Feuerwehr Tools" }),
    ).toBeVisible();
    expect(screen.getByLabelText("Nome utente")).toBeVisible();
    expect(screen.getByRole("button", { name: "Accedi" })).toBeVisible();

    await waitFor(() => expect(mockedFetchCurrentUser).toHaveBeenCalled());
  });

  it("puts the caret in the username field on arrival", async () => {
    renderLogin();

    expect(screen.getByLabelText("Benutzername")).toHaveFocus();

    await waitFor(() => expect(mockedFetchCurrentUser).toHaveBeenCalled());
  });

  it("focuses the form in Italian too", async () => {
    window.localStorage.setItem(LANGUAGE_STORAGE_KEY, "it");
    renderLogin();

    expect(screen.getByLabelText("Nome utente")).toHaveFocus();

    await waitFor(() => expect(mockedFetchCurrentUser).toHaveBeenCalled());
  });

  it("returns focus to the form after a header language switch", () => {
    // Clicking a language button parks focus on that button, where Enter is a
    // no-op instead of a sign-in.
    renderApp("/login", { status: "anonymous", user: null });

    fireEvent.click(screen.getByRole("button", { name: "Italiano" }));

    expect(screen.getByLabelText("Nome utente")).toHaveFocus();
  });

  it("focuses the password field when the username is already typed", () => {
    renderApp("/login", { status: "anonymous", user: null });

    fireEvent.change(screen.getByLabelText("Benutzername"), {
      target: { value: "chief" },
    });
    fireEvent.click(screen.getByRole("button", { name: "Italiano" }));

    expect(screen.getByLabelText("Password")).toHaveFocus();
  });

  it("shows a translated error for invalid credentials", async () => {
    mockedLogin.mockResolvedValue({ ok: false, code: "invalid_credentials" });
    renderLogin();

    fireEvent.change(screen.getByLabelText("Benutzername"), {
      target: { value: "chief" },
    });
    fireEvent.change(screen.getByLabelText("Passwort"), {
      target: { value: "wrong" },
    });
    fireEvent.click(screen.getByRole("button", { name: "Anmelden" }));

    const alert = await screen.findByRole("alert");
    expect(alert).toHaveTextContent("Benutzername oder Passwort ist falsch.");
    expect(mockedLogin).toHaveBeenCalledWith("chief", "wrong");
    expect(screen.getByRole("button", { name: "Anmelden" })).toBeEnabled();
  });

  it("maps an unexpected failure to a safe message", async () => {
    mockedLogin.mockRejectedValue(new Error("/private/path leaked"));
    renderLogin();

    fireEvent.change(screen.getByLabelText("Benutzername"), {
      target: { value: "chief" },
    });
    fireEvent.change(screen.getByLabelText("Passwort"), {
      target: { value: "pw" },
    });
    fireEvent.click(screen.getByRole("button", { name: "Anmelden" }));

    const alert = await screen.findByRole("alert");
    expect(alert).toHaveTextContent(
      "Die Anmeldung ist unerwartet fehlgeschlagen.",
    );
    expect(alert).not.toHaveTextContent("/private/path leaked");
  });

  it("navigates to the intended route after a successful sign-in", async () => {
    mockedLogin.mockResolvedValue({ ok: true, user: superUser });
    renderLogin("/tools/calendar-converter");

    fireEvent.change(screen.getByLabelText("Benutzername"), {
      target: { value: "chief" },
    });
    fireEvent.change(screen.getByLabelText("Passwort"), {
      target: { value: "pw" },
    });
    fireEvent.click(screen.getByRole("button", { name: "Anmelden" }));

    expect(await screen.findByText("converter here")).toBeVisible();
  });
});
