import react from "@vitejs/plugin-react";
import { loadEnv } from "vite";
import { defineConfig } from "vitest/config";

import { resolveApiProxyTarget } from "./config/apiProxy";

export default defineConfig(({ mode }) => {
  const environment = loadEnv(mode, process.cwd(), "FIREFIGHTER_TOOLS_");

  return {
    plugins: [react()],
    server: {
      host: "127.0.0.1",
      strictPort: true,
      proxy: {
        "/api": {
          target: resolveApiProxyTarget(environment),
        },
      },
    },
    preview: {
      host: "127.0.0.1",
    },
    test: {
      environment: "jsdom",
      include: ["src/**/*.test.{ts,tsx}", "config/**/*.test.ts"],
      setupFiles: "./src/test/setup.ts",
    },
  };
});
