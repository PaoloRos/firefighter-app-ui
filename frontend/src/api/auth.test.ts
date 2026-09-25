import { afterEach, describe, expect, it, vi } from "vitest";

import {
  AUTH_LOGIN_ENDPOINT,
  AUTH_LOGOUT_ENDPOINT,
  AUTH_ME_ENDPOINT,
  AuthContractError,
  fetchCurrentUser,
  login,
  logout,
  type SessionUser,
} from "./auth";

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

afterEach(() => {
  vi.unstubAllGlobals();
});

describe("auth API client", () => {
  it("posts JSON credentials to the versioned login endpoint", async () => {
    let requestInput: RequestInfo | URL | undefined;
    let requestInit: RequestInit | undefined;
    vi.stubGlobal(
      "fetch",
      vi.fn(async (input: RequestInfo | URL, init?: RequestInit) => {
        requestInput = input;
        requestInit = init;
        return jsonResponse(superUser);
      }),
    );

    const result = await login("chief", "s3cret");

    expect(result).toEqual({ ok: true, user: superUser });
    expect(requestInput).toBe(AUTH_LOGIN_ENDPOINT);
    expect(requestInit?.method).toBe("POST");
    expect(requestInit?.body).toBe(
      JSON.stringify({ username: "chief", password: "s3cret" }),
    );
  });

  it("returns a stable code for invalid credentials without reading the message", async () => {
    vi.stubGlobal(
      "fetch",
      vi.fn(async () =>
        jsonResponse(
          { code: "invalid_credentials", message: "wording may change" },
          401,
        ),
      ),
    );

    await expect(login("chief", "wrong")).resolves.toEqual({
      ok: false,
      code: "invalid_credentials",
    });
  });

  it("rejects an unknown auth error code as a contract error", async () => {
    vi.stubGlobal(
      "fetch",
      vi.fn(async () => jsonResponse({ code: "teapot", message: "no" }, 418)),
    );

    await expect(login("chief", "x")).rejects.toThrow(AuthContractError);
  });

  it("reads the current account from the me endpoint", async () => {
    let requestInput: RequestInfo | URL | undefined;
    vi.stubGlobal(
      "fetch",
      vi.fn(async (input: RequestInfo | URL) => {
        requestInput = input;
        return jsonResponse(superUser);
      }),
    );

    await expect(fetchCurrentUser()).resolves.toEqual(superUser);
    expect(requestInput).toBe(AUTH_ME_ENDPOINT);
  });

  it("reads the account's own personnel number from the me endpoint", async () => {
    const numbered: SessionUser = { ...superUser, personnel_number: "101" };
    vi.stubGlobal("fetch", vi.fn(async () => jsonResponse(numbered)));

    await expect(fetchCurrentUser()).resolves.toEqual(numbered);
  });

  it("rejects a personnel number that is not a string", async () => {
    vi.stubGlobal(
      "fetch",
      vi.fn(async () => jsonResponse({ ...superUser, personnel_number: 101 })),
    );

    await expect(fetchCurrentUser()).rejects.toBeInstanceOf(AuthContractError);
  });

  it("treats a 401 from the me endpoint as an anonymous session", async () => {
    vi.stubGlobal(
      "fetch",
      vi.fn(async () =>
        jsonResponse({ code: "not_authenticated", message: "x" }, 401),
      ),
    );

    await expect(fetchCurrentUser()).resolves.toBeNull();
  });

  it("rejects a malformed current-account payload", async () => {
    vi.stubGlobal(
      "fetch",
      vi.fn(async () => jsonResponse({ username: "chief", role: "root" })),
    );

    await expect(fetchCurrentUser()).rejects.toThrow(AuthContractError);
  });

  it("posts to the logout endpoint", async () => {
    let requestInput: RequestInfo | URL | undefined;
    let requestInit: RequestInit | undefined;
    vi.stubGlobal(
      "fetch",
      vi.fn(async (input: RequestInfo | URL, init?: RequestInit) => {
        requestInput = input;
        requestInit = init;
        return new Response(null, { status: 204 });
      }),
    );

    await logout();

    expect(requestInput).toBe(AUTH_LOGOUT_ENDPOINT);
    expect(requestInit?.method).toBe("POST");
  });
});

function jsonResponse(payload: unknown, status = 200): Response {
  return new Response(JSON.stringify(payload), {
    status,
    headers: { "Content-Type": "application/json" },
  });
}
