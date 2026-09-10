export type RankColor = "red" | "yellow" | "neutral";

export type RankPresentation = {
  label: string;
  color: RankColor;
};

/**
 * Canonical firefighter ranks keyed by their tolerant match key (see
 * {@link presentRank}). Labels are the abbreviations shown in the UI; a deputy
 * ("Stellvertreter") always carries the hyphenated `-STV` suffix. Colours follow
 * the seniority rule: command ranks are red, leadership ranks are yellow, and a
 * deputy inherits its base rank's colour. The spelled-out "Feuerwehrmann" is
 * accepted as an alias for its abbreviation.
 */
const KNOWN_RANKS: Record<string, RankPresentation> = {
  KDT: { label: "KDT", color: "red" },
  KDTSTV: { label: "KDT-STV", color: "red" },
  ZKDT: { label: "ZKDT", color: "yellow" },
  ZKDTSTV: { label: "ZKDT-STV", color: "yellow" },
  GKDT: { label: "GKDT", color: "yellow" },
  GKDTSTV: { label: "GKDT-STV", color: "yellow" },
  FWM: { label: "FWM", color: "neutral" },
  FEUERWEHRMANN: { label: "FWM", color: "neutral" },
};

/**
 * Resolve a stored rank string to its display label and colour.
 *
 * Matching is tolerant: the value is upper-cased, a spelled-out
 * "Stellvertreter" is expanded to "STV", and every non-alphanumeric character is
 * dropped, so "KDT-STV", "kdt stv", "KDTSTV", and "KDT-Stellvertreter" all
 * resolve to the same rank. Unknown values stay neutral and keep their raw text,
 * except that a value ending in "STV" is still rendered as `<BASE>-STV`.
 *
 * Returns `null` for an empty or whitespace-only value so the caller can omit
 * the tag entirely.
 */
export function presentRank(rawRank: string): RankPresentation | null {
  const trimmed = rawRank.trim();
  if (trimmed === "") {
    return null;
  }

  const key = trimmed
    .toUpperCase()
    .replace(/STELLVERTRETER/g, "STV")
    .replace(/[^A-Z0-9]/g, "");

  const known = KNOWN_RANKS[key];
  if (known) {
    return known;
  }

  if (key.length > 3 && key.endsWith("STV")) {
    return { label: `${key.slice(0, -3)}-STV`, color: "neutral" };
  }

  return { label: trimmed.toUpperCase(), color: "neutral" };
}
