import { expect, type Download, type Page, test } from "@playwright/test";
import { readFile } from "node:fs/promises";
import path from "node:path";

import {
  E2E_PLAIN_USER,
  E2E_SUPER_USER,
  E2E_UNNUMBERED_USER,
} from "./credentials";
import { signIn, storeSchedule } from "./helpers";

const participantsSchedule = path.resolve(
  import.meta.dirname,
  "fixtures/participants.csv",
);

async function openConverter(page: Page) {
  await page.goto("/tools/calendar-converter");
  await expect(
    page.getByRole("heading", { name: "Dienstplan konvertieren" }),
  ).toBeVisible();
}

async function convertAndDownload(page: Page): Promise<Download> {
  await page.getByRole("button", { name: "Kalender erstellen" }).click();
  const downloadPromise = page.waitForEvent("download");
  await page.getByRole("button", { name: "Kalender herunterladen" }).click();
  return downloadPromise;
}

async function eventIds(download: Download): Promise<string[]> {
  const calendar = await readFile(await download.path(), "utf-8");
  return [...calendar.matchAll(/^UID:(.+?)\r?$/gm)]
    .map((match) => match[1] ?? "")
    .sort();
}

test.beforeEach(async ({ page }) => {
  await signIn(page, E2E_SUPER_USER);
  await openConverter(page);
  await storeSchedule(page, participantsSchedule);
});

test("a super-user downloads the full schedule or only their own events", async ({
  page,
}) => {
  const full = await convertAndDownload(page);
  expect(full.suggestedFilename()).toBe("participants.ics");
  expect(await eventIds(full)).toEqual([
    "chief-only",
    "everyone",
    "member-only",
    "shared",
  ]);

  await page.getByRole("checkbox", { name: "Nur meine Termine" }).check();
  const own = await convertAndDownload(page);
  expect(own.suggestedFilename()).toBe(
    `participants-${E2E_SUPER_USER.personnelNumber}.ics`,
  );
  expect(await eventIds(own)).toEqual(["chief-only", "everyone", "shared"]);
});

test("a plain user downloads only their own and everyone's events", async ({
  page,
}) => {
  await page.getByRole("button", { name: "Abmelden" }).click();
  await signIn(page, E2E_PLAIN_USER);
  await openConverter(page);

  await expect(page.getByRole("checkbox")).toHaveCount(0);
  const download = await convertAndDownload(page);

  expect(download.suggestedFilename()).toBe(
    `participants-${E2E_PLAIN_USER.personnelNumber}.ics`,
  );
  expect(await eventIds(download)).toEqual([
    "everyone",
    "member-only",
    "shared",
  ]);
});

test("an account without a personnel number is told why it cannot convert", async ({
  page,
}) => {
  await page.getByRole("button", { name: "Abmelden" }).click();
  await signIn(page, E2E_UNNUMBERED_USER);
  await openConverter(page);

  await expect(
    page.getByText(/Ihrem Konto ist keine Personalnummer zugeordnet\./),
  ).toBeVisible();
  await expect(
    page.getByRole("button", { name: "Kalender erstellen" }),
  ).toBeDisabled();
});
