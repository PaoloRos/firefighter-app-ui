export const AUTH_LOGIN_ENDPOINT = "/api/v1/auth/login";
export const AUTH_LOGOUT_ENDPOINT = "/api/v1/auth/logout";
export const AUTH_ME_ENDPOINT = "/api/v1/auth/me";

export type Role = "super_user" | "user";

export type AuthErrorCode =
  | "invalid_credentials"
  | "not_authenticated"
  | "forbidden";

export type SessionUser = {
  username: string;
  role: Role;
  name: string | null;
  surname: string | null;
  rank: string | null;
  zug: string | null;
  gruppe: string | null;
  personnel_number: string | null;
};

export type AuthErrorResponse = {
  code: AuthErrorCode;
  message: string;
};

export type LoginResult =
  | { ok: true; user: SessionUser }
  | { ok: false; code: AuthErrorCode };

export class AuthContractError extends Error {
  constructor(message: string) {
    super(message);
    this.name = "AuthContractError";
  }
}

const roles = new Set<Role>(["super_user", "user"]);
const authErrorCodes = new Set<AuthErrorCode>([
  "invalid_credentials",
  "not_authenticated",
  "forbidden",
]);

export async function login(
  username: string,
  password: string,
): Promise<LoginResult> {
  const httpResponse = await fetch(AUTH_LOGIN_ENDPOINT, {
    method: "POST",
    headers: { "content-type": "application/json" },
    body: JSON.stringify({ username, password }),
  });
  const payload: unknown = await readJson(httpResponse);

  if (httpResponse.ok) {
    if (!isSessionUser(payload)) {
      throw new AuthContractError(
        "The authentication service returned an invalid account.",
      );
    }
    return { ok: true, user: payload };
  }

  if (!isAuthErrorResponse(payload)) {
    throw new AuthContractError(
      "The authentication service returned an invalid error response.",
    );
  }
  return { ok: false, code: payload.code };
}

export async function logout(): Promise<void> {
  await fetch(AUTH_LOGOUT_ENDPOINT, { method: "POST" });
}

export async function fetchCurrentUser(): Promise<SessionUser | null> {
  const httpResponse = await fetch(AUTH_ME_ENDPOINT, { method: "GET" });

  if (httpResponse.status === 401) {
    return null;
  }

  const payload: unknown = await readJson(httpResponse);
  if (!httpResponse.ok || !isSessionUser(payload)) {
    throw new AuthContractError(
      "The authentication service returned an invalid account.",
    );
  }
  return payload;
}

async function readJson(response: Response): Promise<unknown> {
  try {
    return await response.json();
  } catch {
    throw new AuthContractError(
      "The authentication service returned a non-JSON response.",
    );
  }
}

function isSessionUser(value: unknown): value is SessionUser {
  if (!isRecord(value)) {
    return false;
  }

  return (
    typeof value.username === "string" &&
    value.username.length > 0 &&
    typeof value.role === "string" &&
    roles.has(value.role as Role) &&
    isNullableString(value.name) &&
    isNullableString(value.surname) &&
    isNullableString(value.rank) &&
    isNullableString(value.zug) &&
    isNullableString(value.gruppe) &&
    isNullableString(value.personnel_number)
  );
}

function isAuthErrorResponse(value: unknown): value is AuthErrorResponse {
  if (!isRecord(value)) {
    return false;
  }

  return (
    typeof value.code === "string" &&
    authErrorCodes.has(value.code as AuthErrorCode) &&
    typeof value.message === "string" &&
    value.message.length > 0
  );
}

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === "object" && value !== null && !Array.isArray(value);
}

function isNullableString(value: unknown): value is string | null {
  return value === null || value === undefined || typeof value === "string";
}
