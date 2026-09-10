import { describe, expect, it } from "vitest";

import { presentRank } from "./rankPresentation";

describe("presentRank", () => {
  it("maps command ranks to the red colour", () => {
    expect(presentRank("KDT")).toEqual({ label: "KDT", color: "red" });
  });

  it("canonicalises every spelling of the Kommandant deputy to KDT-STV", () => {
    for (const stored of ["KDT-STV", "kdt stv", "KDTSTV", "KDT-Stellvertreter"]) {
      expect(presentRank(stored)).toEqual({ label: "KDT-STV", color: "red" });
    }
  });

  it("maps leadership ranks and their deputies to the yellow colour", () => {
    expect(presentRank("ZKDT")).toEqual({ label: "ZKDT", color: "yellow" });
    expect(presentRank("ZKDT-STV")).toEqual({
      label: "ZKDT-STV",
      color: "yellow",
    });
    expect(presentRank("GKDT")).toEqual({ label: "GKDT", color: "yellow" });
    expect(presentRank("GKDT-STV")).toEqual({
      label: "GKDT-STV",
      color: "yellow",
    });
  });

  it("keeps ordinary and unknown ranks neutral", () => {
    expect(presentRank("FWM")).toEqual({ label: "FWM", color: "neutral" });
    expect(presentRank("Löschmeister")).toEqual({
      label: "LÖSCHMEISTER",
      color: "neutral",
    });
  });

  it("accepts the spelled-out Feuerwehrmann as an alias for FWM", () => {
    for (const stored of ["Feuerwehrmann", "feuerwehrmann", " FEUERWEHRMANN "]) {
      expect(presentRank(stored)).toEqual({ label: "FWM", color: "neutral" });
    }
  });

  it("still formats an unknown deputy rank with the -STV suffix", () => {
    expect(presentRank("LM-STV")).toEqual({ label: "LM-STV", color: "neutral" });
  });

  it("returns null for an empty or whitespace-only rank", () => {
    expect(presentRank("")).toBeNull();
    expect(presentRank("   ")).toBeNull();
  });
});
