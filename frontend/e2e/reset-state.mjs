// Wipe the throwaway end-to-end database and schedule store right before the
// web server opens them. This runs as part of the `webServer` command rather
// than at config load: editors and `playwright test --list` evaluate
// `playwright.config.ts` at arbitrary moments, and deleting the database
// there would pull it out from under a server that is mid-run.
import { mkdirSync, rmSync } from "node:fs";
import path from "node:path";

const databaseFile = process.env.E2E_DATABASE_FILE;
const scheduleStore = process.env.FIREFIGHTER_TOOLS_SCHEDULE_STORE;

if (!databaseFile || !scheduleStore) {
  console.error(
    "[e2e] E2E_DATABASE_FILE and FIREFIGHTER_TOOLS_SCHEDULE_STORE must be set.",
  );
  process.exit(1);
}

mkdirSync(path.dirname(databaseFile), { recursive: true });
for (const suffix of ["", "-wal", "-shm"]) {
  rmSync(`${databaseFile}${suffix}`, { force: true });
}
rmSync(scheduleStore, { recursive: true, force: true });
