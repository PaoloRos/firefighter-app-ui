import { expect, type Download, test } from "@playwright/test";
import { existsSync } from "node:fs";
import { readdir } from "node:fs/promises";
import path from "node:path";

import { E2E_SUPER_USER } from "./credentials";
import { signIn } from "./helpers";

const repositoryRoot = path.resolve(import.meta.dirname, "../..");
const fixtures = path.resolve(import.meta.dirname, "fixtures");
const exampleSchedule = path.join(
  repositoryRoot,
  "assets/examples/calendar_schedule_example.xlsx",
);

test.beforeEach(async ({ page }) => {
  await signIn(page, E2E_SUPER_USER);
});

test("converts the example XLSX and persists an explicit Italian choice", async ({
  page,
}) => {
  await page.goto("/");
  await expect(
    page.getByRole("heading", { name: "Werkzeuge für die Feuerwehr" }),
  ).toBeVisible();
  await page.getByRole("button", { name: "Italiano" }).click();
  await page.getByRole("link", { name: "Apri lo strumento" }).click();
  await page.getByLabel("Scegli un file").setInputFiles(exampleSchedule);
  await page.getByRole("button", { name: "Avvia la conversione" }).click();

  await expect(
    page.getByRole("heading", { name: "Conversione completata" }),
  ).toBeFocused();
  await expect(page.getByText("calendar_schedule_example.ics")).toBeVisible();

  const download = await downloadFrom(
    page,
    page.getByRole("button", { name: "Scarica il calendario" }),
  );
  expect(download.suggestedFilename()).toBe("calendar_schedule_example.ics");
  const calendar = (await readDownload(download)).toString("utf-8");
  expect(calendar).toContain("BEGIN:VCALENDAR");
  expect(calendar).toContain("UID:uebung-2026-08-03");

  await page.reload();
  await expect(
    page.getByRole("heading", { name: "Converti il piano dei turni" }),
  ).toBeVisible();
});

test("downloads only valid events from a partial conversion", async ({ page }) => {
  await openConverter(page);
  await page
    .getByLabel("Datei auswählen")
    .setInputFiles(path.join(fixtures, "partial.csv"));
  await page.getByRole("button", { name: "Konvertierung starten" }).click();

  await expect(
    page.getByRole("heading", { name: "Teilweise konvertiert" }),
  ).toBeFocused();
  await expect(page.getByText("Teilergebnis")).toBeVisible();
  await expect(page.getByText("invalid-1")).toBeVisible();

  const download = await downloadFrom(
    page,
    page.getByRole("button", { name: "Kalender herunterladen" }),
  );
  const calendar = (await readDownload(download)).toString("utf-8");
  expect(calendar).toContain("UID:valid-1");
  expect(calendar).not.toContain("UID:invalid-1");
});

test("shows an all-invalid result without a calendar download", async ({ page }) => {
  await openConverter(page);
  await page
    .getByLabel("Datei auswählen")
    .setInputFiles(path.join(fixtures, "all-invalid.csv"));
  await page.getByRole("button", { name: "Konvertierung starten" }).click();

  await expect(
    page.getByRole("heading", { name: "Keine Ereignisse konvertiert" }),
  ).toBeFocused();
  await expect(page.getByText("Es wurde keine Kalenderdatei erstellt.")).toBeVisible();
  await expect(
    page.getByRole("button", { name: "Kalender herunterladen" }),
  ).toHaveCount(0);
});

test("renders a safe translated error for malformed input", async ({ page }) => {
  await openConverter(page);
  await page
    .getByLabel("Datei auswählen")
    .setInputFiles(path.join(fixtures, "malformed.csv"));
  await page.getByRole("button", { name: "Konvertierung starten" }).click();

  const alert = page.getByRole("alert");
  await expect(
    alert.getByRole("heading", { name: "Konvertierung nicht möglich" }),
  ).toBeFocused();
  await expect(alert).toContainText(
    "Die CSV-Datei ist nicht lesbar oder ungültig aufgebaut.",
  );
  await expect(alert).not.toContainText("Traceback");
  await expect(alert).not.toContainText(repositoryRoot);
});

test("downloads the example from its stable application URL", async ({ page }) => {
  await openConverter(page);
  const download = await downloadFrom(
    page,
    page.getByRole("link", {
      name: "XLSX-Beispieldienstplan herunterladen",
    }),
  );
  expect(download.suggestedFilename()).toBe("calendar_schedule_example.xlsx");
  expect((await readDownload(download)).byteLength).toBeGreaterThan(1_000);
});

test("has no horizontal overflow at phone and desktop widths", async ({ page }) => {
  await openConverter(page);
  for (const viewport of [
    { width: 320, height: 720 },
    { width: 1280, height: 800 },
  ]) {
    await page.setViewportSize(viewport);
    const dimensions = await page.evaluate(() => ({
      clientWidth: document.documentElement.clientWidth,
      scrollWidth: document.documentElement.scrollWidth,
    }));
    expect(dimensions.scrollWidth).toBeLessThanOrEqual(dimensions.clientWidth);
  }
});

test.afterAll(async () => {
  expect(await findGeneratedCalendars(repositoryRoot)).toEqual([]);
  expect(existsSync(path.join(repositoryRoot, "uploads"))).toBe(false);
  expect(existsSync(path.join(repositoryRoot, "generated"))).toBe(false);
});

async function openConverter(page: import("@playwright/test").Page) {
  await page.goto("/tools/calendar-converter");
  await expect(
    page.getByRole("heading", { name: "Dienstplan konvertieren" }),
  ).toBeVisible();
}

async function downloadFrom(
  page: import("@playwright/test").Page,
  control: import("@playwright/test").Locator,
): Promise<Download> {
  const downloadPromise = page.waitForEvent("download");
  await control.click();
  return downloadPromise;
}

async function readDownload(download: Download): Promise<Buffer> {
  const stream = await download.createReadStream();
  const chunks: Buffer[] = [];
  for await (const chunk of stream) {
    chunks.push(Buffer.isBuffer(chunk) ? chunk : Buffer.from(chunk));
  }
  return Buffer.concat(chunks);
}

async function findGeneratedCalendars(directory: string): Promise<string[]> {
  const ignored = new Set([
    ".git",
    ".venv",
    "dist",
    "node_modules",
    "playwright-report",
    "test-results",
  ]);
  const calendars: string[] = [];
  for (const entry of await readdir(directory, { withFileTypes: true })) {
    if (ignored.has(entry.name)) {
      continue;
    }
    const entryPath = path.join(directory, entry.name);
    if (entry.isDirectory()) {
      calendars.push(...(await findGeneratedCalendars(entryPath)));
    } else if (entry.name.endsWith(".ics")) {
      calendars.push(entryPath);
    }
  }
  return calendars;
}
