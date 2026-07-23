import { describe, expect, it } from "vitest";

import {
  germanTranslations,
  italianTranslations,
  translateApiErrorCode,
  translateConverterIssueCode,
} from "./translations";

describe("translation dictionaries", () => {
  it("keeps German and Italian dictionary keys identical", () => {
    expect(Object.keys(italianTranslations).sort()).toEqual(
      Object.keys(germanTranslations).sort(),
    );
  });

  it("keeps the Feuerwehr Tools brand unchanged in both languages", () => {
    expect(germanTranslations.brand).toBe("Feuerwehr Tools");
    expect(italianTranslations.brand).toBe("Feuerwehr Tools");
  });

  it("translates every stable API error code", () => {
    expect(translateApiErrorCode("de", "oversized_upload")).toContain("10 MiB");
    expect(translateApiErrorCode("it", "oversized_upload")).toContain("10 MiB");
    expect(translateApiErrorCode("de", "internal_error")).not.toBe(
      translateApiErrorCode("it", "internal_error"),
    );
  });

  it("translates converter issue codes", () => {
    expect(translateConverterIssueCode("de", "duplicate_id")).toContain(
      "mehrfach",
    );
    expect(translateConverterIssueCode("it", "duplicate_id")).toContain(
      "più volte",
    );
  });
});
