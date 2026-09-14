import { existsSync, mkdirSync, rmSync } from "node:fs";
import path from "node:path";

import { defineConfig } from "@playwright/test";

import {
  E2E_DATABASE_FILE,
  E2E_DATABASE_URL,
  E2E_SCHEDULE_STORE,
  E2E_SECRET_KEY,
} from "./e2e/database";

// Only the main runner process (workers set TEST_WORKER_INDEX) prepares a
// clean database file, and it does so before the webServer opens it. Global
// setup must not unlink this file afterwards: the server already holds it open.
if (process.env.TEST_WORKER_INDEX === undefined) {
  mkdirSync(path.dirname(E2E_DATABASE_FILE), { recursive: true });
  for (const suffix of ["", "-wal", "-shm"]) {
    const staleFile = `${E2E_DATABASE_FILE}${suffix}`;
    if (existsSync(staleFile)) {
      rmSync(staleFile);
    }
  }
  rmSync(E2E_SCHEDULE_STORE, { recursive: true, force: true });
}

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
    baseURL: "http://127.0.0.1:8000",
    browserName: "chromium",
    trace: "retain-on-failure",
  },
  webServer: {
    command:
      "../backend/.venv/bin/python -m firefighter_tools_backend --frontend-dist dist",
    url: "http://127.0.0.1:8000/api/v1/health",
    reuseExistingServer: false,
    stdout: "pipe",
    stderr: "pipe",
    timeout: 30_000,
    env: {
      FIREFIGHTER_TOOLS_DATABASE_URL: E2E_DATABASE_URL,
      FIREFIGHTER_TOOLS_SECRET_KEY: E2E_SECRET_KEY,
      FIREFIGHTER_TOOLS_SCHEDULE_STORE: E2E_SCHEDULE_STORE,
    },
  },
});
