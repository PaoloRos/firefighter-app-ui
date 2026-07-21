import { describe, expect, it } from "vitest";

import {
  DEFAULT_API_PROXY_TARGET,
  resolveApiProxyTarget,
} from "./apiProxy";

describe("API proxy target", () => {
  it("uses the loopback FastAPI server by default", () => {
    expect(resolveApiProxyTarget({})).toBe(DEFAULT_API_PROXY_TARGET);
  });

  it("accepts an explicit local development target", () => {
    expect(
      resolveApiProxyTarget({
        FIREFIGHTER_TOOLS_API_TARGET: "http://localhost:9000/path",
      }),
    ).toBe("http://localhost:9000");
  });

  it.each(["https://127.0.0.1:8000", "http://example.com:8000"])(
    "rejects a non-local HTTP target: %s",
    (target) => {
      expect(() =>
        resolveApiProxyTarget({ FIREFIGHTER_TOOLS_API_TARGET: target }),
      ).toThrow(/HTTP URL on the local computer/);
    },
  );
});
