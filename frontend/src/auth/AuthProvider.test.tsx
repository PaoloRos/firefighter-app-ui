import { fireEvent, render, screen, waitFor } from "@testing-library/react";
import { beforeEach, describe, expect, it, vi } from "vitest";

import {
  fetchCurrentUser,
  login,
  logout,
  type SessionUser,
} from "../api/auth";
import { AuthProvider, useAuth } from "./AuthProvider";

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
  personnel_number: null,
};

function Probe() {
  const { status, user, signIn, signOut } = useAuth();
  return (
    <div>
      <p data-testid="status">{status}</p>
      <p data-testid="user">{user?.username ?? "none"}</p>
      <button type="button" onClick={() => void signIn("chief", "pw")}>
        sign in
      </button>
      <button type="button" onClick={() => void signOut()}>
        sign out
      </button>
    </div>
  );
}

function renderProbe() {
  return render(
    <AuthProvider>
      <Probe />
    </AuthProvider>,
  );
}

beforeEach(() => {
  mockedFetchCurrentUser.mockReset();
  mockedLogin.mockReset();
  mockedLogout.mockReset();
});

describe("AuthProvider", () => {
  it("starts loading and resolves to an authenticated session", async () => {
    mockedFetchCurrentUser.mockResolvedValue(superUser);

    renderProbe();

    expect(screen.getByTestId("status")).toHaveTextContent("loading");
    await waitFor(() => {
      expect(screen.getByTestId("status")).toHaveTextContent("authenticated");
    });
    expect(screen.getByTestId("user")).toHaveTextContent("chief");
  });

  it("resolves to anonymous when there is no session", async () => {
    mockedFetchCurrentUser.mockResolvedValue(null);

    renderProbe();

    await waitFor(() => {
      expect(screen.getByTestId("status")).toHaveTextContent("anonymous");
    });
    expect(screen.getByTestId("user")).toHaveTextContent("none");
  });

  it("treats a failed session lookup as anonymous", async () => {
    mockedFetchCurrentUser.mockRejectedValue(new Error("network down"));

    renderProbe();

    await waitFor(() => {
      expect(screen.getByTestId("status")).toHaveTextContent("anonymous");
    });
  });

  it("updates the context after a successful sign-in", async () => {
    mockedFetchCurrentUser.mockResolvedValue(null);
    mockedLogin.mockResolvedValue({ ok: true, user: superUser });

    renderProbe();
    await waitFor(() => {
      expect(screen.getByTestId("status")).toHaveTextContent("anonymous");
    });

    fireEvent.click(screen.getByRole("button", { name: "sign in" }));

    await waitFor(() => {
      expect(screen.getByTestId("status")).toHaveTextContent("authenticated");
    });
    expect(screen.getByTestId("user")).toHaveTextContent("chief");
  });

  it("clears the context after signing out", async () => {
    mockedFetchCurrentUser.mockResolvedValue(superUser);
    mockedLogout.mockResolvedValue(undefined);

    renderProbe();
    await waitFor(() => {
      expect(screen.getByTestId("status")).toHaveTextContent("authenticated");
    });

    fireEvent.click(screen.getByRole("button", { name: "sign out" }));

    await waitFor(() => {
      expect(screen.getByTestId("status")).toHaveTextContent("anonymous");
    });
    expect(screen.getByTestId("user")).toHaveTextContent("none");
    expect(mockedLogout).toHaveBeenCalledOnce();
  });

  it("throws when useAuth is used outside the provider", () => {
    const consoleError = vi
      .spyOn(console, "error")
      .mockImplementation(() => undefined);

    expect(() => render(<Probe />)).toThrow(
      "useAuth must be used within AuthProvider",
    );

    consoleError.mockRestore();
  });
});
