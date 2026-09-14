import { existsSync, rmSync } from "node:fs";

import { E2E_DATABASE_FILE, E2E_SCHEDULE_STORE } from "./database";

/** Remove the throwaway user database and schedule store created for the suite. */
export default async function globalTeardown(): Promise<void> {
  for (const suffix of ["", "-wal", "-shm"]) {
    const file = `${E2E_DATABASE_FILE}${suffix}`;
    if (existsSync(file)) {
      rmSync(file);
    }
  }

  rmSync(E2E_SCHEDULE_STORE, { recursive: true, force: true });
}
