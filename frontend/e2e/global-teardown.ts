import { existsSync, rmSync } from "node:fs";

import { E2E_DATABASE_FILE } from "./database";

/** Remove the throwaway user database created for the suite. */
export default async function globalTeardown(): Promise<void> {
  for (const suffix of ["", "-wal", "-shm"]) {
    const file = `${E2E_DATABASE_FILE}${suffix}`;
    if (existsSync(file)) {
      rmSync(file);
    }
  }
}
