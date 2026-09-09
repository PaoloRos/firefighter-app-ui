import { expect, test } from "@playwright/test";

import { E2E_PLAIN_USER, E2E_SUPER_USER } from "./credentials";
import { signIn } from "./helpers";

test("redirects an anonymous visitor to the login screen", async ({ page }) => {
  await page.goto("/tools/calendar-converter");

  await expect(
    page.getByRole("heading", { name: "Bei Feuerwehr Tools anmelden" }),
  ).toBeVisible();
  await expect(page.getByLabel("Benutzername")).toBeVisible();
});

test("rejects invalid credentials with a translated message", async ({
  page,
}) => {
  await page.goto("/login");
  await page.getByLabel("Benutzername").fill(E2E_SUPER_USER.username);
  await page.getByLabel("Passwort").fill("wrong-password");
  await page.getByRole("button", { name: "Anmelden" }).click();

  await expect(page.getByRole("alert")).toHaveText(
    "Benutzername oder Passwort ist falsch.",
  );
  await expect(page).toHaveURL(/\/login$/);
});

test("hides the upload form from a plain user but keeps the example download", async ({
  page,
}) => {
  await signIn(page, E2E_PLAIN_USER);
  await page.goto("/tools/calendar-converter");

  await expect(
    page.getByRole("heading", { name: "Upload ist eingeschränkt" }),
  ).toBeVisible();
  await expect(page.getByLabel("Datei auswählen")).toHaveCount(0);
  await expect(
    page.getByRole("button", { name: "Konvertierung starten" }),
  ).toHaveCount(0);

  const downloadPromise = page.waitForEvent("download");
  await page
    .getByRole("link", { name: "XLSX-Beispieldienstplan herunterladen" })
    .click();
  const download = await downloadPromise;
  expect(download.suggestedFilename()).toBe("calendar_schedule_example.xlsx");
});

test("shows the account menu with a role badge and signs out", async ({
  page,
}) => {
  await signIn(page, E2E_SUPER_USER);
  await page.goto("/");

  const accountMenu = page.getByRole("group", { name: "Konto" });
  await expect(accountMenu).toContainText("e2e-chief");
  await expect(accountMenu).toContainText("Super-User");

  await page.getByRole("button", { name: "Abmelden" }).click();

  await expect(
    page.getByRole("heading", { name: "Bei Feuerwehr Tools anmelden" }),
  ).toBeVisible();
});
