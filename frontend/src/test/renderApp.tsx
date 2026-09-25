import { render, type RenderResult } from "@testing-library/react";
import { MemoryRouter } from "react-router-dom";

import type { SessionUser } from "../api/auth";
import { App } from "../App";
import type { InitialAuth } from "../auth/AuthProvider";

export const SUPER_USER: SessionUser = {
  username: "chief",
  role: "super_user",
  name: "Chief",
  surname: null,
  rank: null,
  zug: null,
  gruppe: null,
  personnel_number: "101",
};

export const PLAIN_USER: SessionUser = {
  username: "member",
  role: "user",
  name: "Member",
  surname: null,
  rank: null,
  zug: null,
  gruppe: null,
  personnel_number: "204",
};

/** A plain account that has no personnel number assigned yet. */
export const UNNUMBERED_USER: SessionUser = {
  ...PLAIN_USER,
  username: "recruit",
  name: "Recruit",
  personnel_number: null,
};

/**
 * Render the full app at `route` with the auth state seeded synchronously.
 * Defaults to an authenticated super-user so existing behavior tests keep
 * their synchronous assertions.
 */
export function renderApp(
  route: string,
  auth: Partial<InitialAuth> = {},
): RenderResult {
  const initialAuth: InitialAuth = {
    status: "authenticated",
    user: SUPER_USER,
    ...auth,
  };

  return render(
    <MemoryRouter initialEntries={[route]}>
      <App initialAuth={initialAuth} />
    </MemoryRouter>,
  );
}
