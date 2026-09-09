import path from "node:path";

/**
 * Single source of truth for the throwaway end-to-end database. Computed from
 * this file's location so every process (Playwright runner, global setup,
 * `webServer` child) resolves the exact same absolute path regardless of how
 * many times the config module is evaluated. `data/` is git-ignored and
 * ignored by `scripts/verify.py`.
 */
export const E2E_DATABASE_FILE = path.resolve(
  import.meta.dirname,
  "../../data/e2e.db",
);

export const E2E_DATABASE_URL = `sqlite:///${E2E_DATABASE_FILE}`;

export const E2E_SECRET_KEY = "e2e-only-insecure-session-secret";
