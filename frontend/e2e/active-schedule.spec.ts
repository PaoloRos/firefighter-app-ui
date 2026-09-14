import { expect, test } from "@playwright/test";
import path from "node:path";

import { E2E_PLAIN_USER, E2E_SUPER_USER } from "./credentials";
import { signIn, storeSchedule } from "./helpers";

const repositoryRoot = path.resolve(import.meta.dirname, "../..");
const fixtures = path.resolve(import.meta.dirname, "fixtures");
const exampleSchedule = path.join(
  repositoryRoot,
  "assets/examples/calendar_schedule_example.xlsx",
);

async function openConverter(page: import("@playwright/test").Page) {
  await page.goto("/tools/calendar-converter");
  await expect(
    page.getByRole("heading", { name: "Dienstplan konvertieren" }),
  ).toBeVisible();
}

test("a super-user publishes a schedule that a plain user converts", async ({
  page,
}) => {
  await signIn(page, E2E_SUPER_USER);
  await openConverter(page);
  await storeSchedule(page, path.join(fixtures, "partial.csv"));

  await page.getByRole("button", { name: "Abmelden" }).click();
  await signIn(page, E2E_PLAIN_USER);
  await openConverter(page);

  const card = page.getByRole("region", { name: "Aktueller Dienstplan" });
  await expect(card.getByText("partial.csv")).toBeVisible();
  await expect(card.getByText(E2E_SUPER_USER.username)).toBeVisible();

  await page.getByRole("button", { name: "Kalender erstellen" }).click();
  await expect(
    page.getByRole("heading", { name: "Teilweise konvertiert" }),
  ).toBeFocused();

  // The download works, but the authoring diagnostics stay hidden.
  await expect(
    page.getByRole("button", { name: "Kalender herunterladen" }),
  ).toBeEnabled();
  await expect(
    page.getByRole("heading", { name: "Probleme im Dienstplan" }),
  ).toHaveCount(0);
  await expect(page.getByText("invalid-1")).toHaveCount(0);

  const downloadPromise = page.waitForEvent("download");
  await page.getByRole("button", { name: "Kalender herunterladen" }).click();
  const download = await downloadPromise;
  expect(download.suggestedFilename()).toBe("partial.ics");
});

test("replacing the schedule changes what every account sees", async ({
  page,
}) => {
  await signIn(page, E2E_SUPER_USER);
  await openConverter(page);
  await storeSchedule(page, path.join(fixtures, "valid.csv"));
  await storeSchedule(page, exampleSchedule);

  await page.getByRole("button", { name: "Abmelden" }).click();
  await signIn(page, E2E_PLAIN_USER);
  await openConverter(page);

  const card = page.getByRole("region", { name: "Aktueller Dienstplan" });
  await expect(card.getByText("calendar_schedule_example.xlsx")).toBeVisible();
  await expect(card.getByText("valid.csv")).toHaveCount(0);
});
