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

test("hides every upload affordance from a plain user", async ({
  page,
}) => {
  await signIn(page, E2E_PLAIN_USER);
  await page.goto("/tools/calendar-converter");

  await expect(
    page.getByRole("heading", { name: "Aktueller Dienstplan" }),
  ).toBeVisible();
  await expect(
    page.getByRole("button", { name: "Kalender erstellen" }),
  ).toBeVisible();
  await expect(page.getByLabel("Datei auswählen")).toHaveCount(0);
  await expect(
    page.getByRole("button", { name: "Dienstplan hochladen" }),
  ).toHaveCount(0);

  // A plain account never supplies an XLSX, so the template is not offered.
  await expect(
    page.getByRole("link", { name: "XLSX-Beispieldienstplan herunterladen" }),
  ).toHaveCount(0);
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
