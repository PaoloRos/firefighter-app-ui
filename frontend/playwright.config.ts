import { defineConfig } from "@playwright/test";

import {
  E2E_DATABASE_FILE,
  E2E_DATABASE_URL,
  E2E_SCHEDULE_STORE,
  E2E_SECRET_KEY,
} from "./e2e/database";

// Loading this config must have no side effects: editors and
// `playwright test --list` evaluate it while a run may be in progress. The
// webServer command resets the database and store before the server starts.

// A dedicated port keeps the suite from colliding with a developer's
// `make run` or `make dev` backend on 8000.
const E2E_PORT = process.env.FIREFIGHTER_TOOLS_E2E_PORT ?? "8765";
const E2E_ORIGIN = `http://127.0.0.1:${E2E_PORT}`;

process.env.FIREFIGHTER_TOOLS_DATABASE_URL = E2E_DATABASE_URL;
process.env.FIREFIGHTER_TOOLS_SECRET_KEY = E2E_SECRET_KEY;
process.env.FIREFIGHTER_TOOLS_SCHEDULE_STORE = E2E_SCHEDULE_STORE;

export default defineConfig({
  testDir: "./e2e",
  outputDir: "./test-results",
  fullyParallel: false,
  // The server holds ONE active schedule, so specs share mutable state.
  // Parallel workers would replace each other's schedule mid-test.
  workers: 1,
  forbidOnly: Boolean(process.env.CI),
  retries: process.env.CI ? 1 : 0,
  reporter: [["list"], ["html", { open: "never" }]],
  globalSetup: "./e2e/global-setup.ts",
  globalTeardown: "./e2e/global-teardown.ts",
  use: {
    baseURL: E2E_ORIGIN,
    browserName: "chromium",
    trace: "retain-on-failure",
  },
  webServer: {
    command: `node e2e/reset-state.mjs && ../backend/.venv/bin/python -m firefighter_tools_backend --frontend-dist dist --port ${E2E_PORT}`,
    url: `${E2E_ORIGIN}/api/v1/health`,
    reuseExistingServer: false,
    stdout: "pipe",
    stderr: "pipe",
    timeout: 30_000,
    env: {
      E2E_DATABASE_FILE,
      FIREFIGHTER_TOOLS_DATABASE_URL: E2E_DATABASE_URL,
      FIREFIGHTER_TOOLS_SECRET_KEY: E2E_SECRET_KEY,
      FIREFIGHTER_TOOLS_SCHEDULE_STORE: E2E_SCHEDULE_STORE,
    },
  },
});
