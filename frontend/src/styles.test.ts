import { readFileSync } from "node:fs";
import { resolve } from "node:path";

import { describe, expect, it } from "vitest";

const stylesheet = readFileSync(resolve(process.cwd(), "src/styles.css"), "utf8");

describe("design system stylesheet", () => {
  it("defines the shared civic palette and component tokens", () => {
    const expectedTokens = [
      "--color-canvas",
      "--color-surface",
      "--color-text",
      "--color-brand",
      "--color-success",
      "--color-warning",
      "--color-danger",
      "--space-4",
      "--font-size-body",
      "--radius-md",
      "--shadow-card",
      "--target-size",
      "--breakpoint-narrow",
      "--breakpoint-wide",
    ];

    for (const token of expectedTokens) {
      expect(stylesheet).toContain(`${token}:`);
    }
  });

  it("uses system fonts and a shared 44px minimum target size", () => {
    expect(stylesheet).toContain(
      'font-family: ui-sans-serif, system-ui, -apple-system, BlinkMacSystemFont, "Segoe UI", sans-serif;',
    );
    expect(stylesheet).not.toContain("font-family: Inter");
    expect(stylesheet).toContain("--target-size: 2.75rem;");

    for (const selector of [
      ".brand",
      "nav a",
      ".language-switch button",
      ".button-link",
      ".text-link",
      ".footer-credit",
    ]) {
      const rule = stylesheet.match(
        new RegExp(
          `${escapeRegExp(selector)}\\s*\\{[^}]*min-height:\\s*var\\(--target-size\\)`,
          "s",
        ),
      );
      expect(rule, `${selector} should use the shared target size`).not.toBeNull();
    }
  });

  it("gives success, partial, and failure states structural styling", () => {
    expect(stylesheet).toMatch(
      /\.result-panel\s*\{[^}]*border-left:[^}]*var\(--color-success\)/s,
    );
    expect(stylesheet).toMatch(
      /\.partial-result\s*\{[^}]*border-left-color:\s*var\(--color-warning\)/s,
    );
    expect(stylesheet).toMatch(
      /\.failure-result,[\s\S]*?\.fatal-result\s*\{[^}]*border-left-color:\s*var\(--color-danger\)/s,
    );
  });

  it("structures result guidance and skipped-event details", () => {
    expect(stylesheet).toMatch(
      /\.result-status-label\s*\{[^}]*text-transform:\s*uppercase/s,
    );
    expect(stylesheet).toMatch(
      /\.result-guidance\s*\{[^}]*border-left-width:/s,
    );
    expect(stylesheet).toMatch(
      /\.invalid-event-header\s*\{[^}]*flex-wrap:\s*wrap/s,
    );
    expect(stylesheet).toMatch(
      /\.skipped-event-label\s*\{[^}]*border-radius:\s*var\(--radius-pill\)/s,
    );
    expect(stylesheet).toMatch(
      /\.calendar-result\s*\{[^}]*justify-items:\s*start/s,
    );
    expect(stylesheet).toMatch(
      /\.calendar-download-button\s*\{[^}]*max-width:\s*100%/s,
    );
  });

  it("keeps explicit narrow and wide responsive layouts", () => {
    expect(stylesheet).toContain("@media (max-width: 40rem)");
    expect(stylesheet).toContain("@media (min-width: 64rem)");
    expect(stylesheet).toMatch(
      /\.converter-help\s*\{[^}]*background:\s*var\(--color-surface-muted\)/s,
    );
    expect(stylesheet).toMatch(
      /@media \(min-width: 64rem\)[\s\S]*?\.converter-workspace\s*\{[^}]*grid-template-columns:/s,
    );
  });

  it("styles skip navigation, native-picker focus, and reduced motion", () => {
    expect(stylesheet).toMatch(
      /\.skip-link:focus\s*\{[^}]*transform:\s*translateY\(0\)/s,
    );
    expect(stylesheet).toMatch(
      /\.visually-hidden:focus-visible \+ \.file-picker-button\s*\{[^}]*outline:/s,
    );
    expect(stylesheet).toMatch(
      /\.result-panel h2:focus\s*\{[^}]*outline:/s,
    );
    expect(stylesheet).toContain("@media (prefers-reduced-motion: reduce)");
    expect(stylesheet).toMatch(
      /@media \(prefers-reduced-motion: reduce\)[\s\S]*?\.skip-link,[\s\S]*?transition-duration:\s*0\.01ms/s,
    );
  });
});

function escapeRegExp(value: string): string {
  return value.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
}
