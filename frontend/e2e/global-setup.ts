import { execFileSync } from "node:child_process";
import path from "node:path";

import type { FullConfig } from "@playwright/test";

import { E2E_ACCOUNTS } from "./credentials";
import { E2E_DATABASE_FILE, E2E_DATABASE_URL, E2E_SECRET_KEY } from "./database";

const backendPython = path.resolve(
  import.meta.dirname,
  "../../backend/.venv/bin/python",
);

/**
 * Seed the throwaway user database before the browser tests run. The web
 * server has already started (Playwright runs plugin setup before global
 * setup) and holds this SQLite file open, so the file is written in place —
 * `playwright.config.ts` is responsible for starting from a clean file.
 */
export default async function globalSetup(_config: FullConfig): Promise<void> {
  const env = {
    ...process.env,
    FIREFIGHTER_TOOLS_DATABASE_URL: E2E_DATABASE_URL,
    FIREFIGHTER_TOOLS_SECRET_KEY: E2E_SECRET_KEY,
  };

  for (const account of E2E_ACCOUNTS) {
    execFileSync(
      backendPython,
      [
        "-m",
        "firefighter_tools_backend",
        "create-user",
        "--username",
        account.username,
        "--role",
        account.role,
        "--name",
        account.username,
      ],
      {
        input: `${account.password}\n${account.password}\n`,
        stdio: ["pipe", "pipe", "pipe"],
        env,
      },
    );
  }

  console.log(
    `[e2e] seeded ${E2E_ACCOUNTS.length} accounts into ${E2E_DATABASE_FILE}`,
  );
}
