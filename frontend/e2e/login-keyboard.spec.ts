import { expect, test } from "@playwright/test";

import { E2E_SUPER_USER } from "./credentials";

/**
 * Enter submits a form only while focus sits inside one of its fields, so
 * these cover the two ways focus used to end up somewhere else: arriving on
 * the page, and clicking a language button in the header.
 */

test("signs in with Enter without ever using the mouse", async ({ page }) => {
  await page.goto("/login");

  // No click first: typing lands in the username field only if it is focused.
  // Waiting for that focus keeps keystrokes from racing the React mount.
  await expect(page.getByLabel("Benutzername")).toBeFocused();
  await page.keyboard.type(E2E_SUPER_USER.username);
  await page.keyboard.press("Tab");
  await page.keyboard.type(E2E_SUPER_USER.password);
  await page.keyboard.press("Enter");

  await expect(page.getByRole("group", { name: "Konto" })).toBeVisible();
});

test("signs in with Enter after switching to Italian", async ({ page }) => {
  await page.goto("/login");
  await page.getByLabel("Benutzername").fill(E2E_SUPER_USER.username);
  await page.getByLabel("Passwort").fill(E2E_SUPER_USER.password);

  await page.getByRole("button", { name: "Italiano" }).click();
  await page.keyboard.press("Enter");

  await expect(page.getByRole("group", { name: "Account" })).toBeVisible();
});

test("signs in with Enter after switching back to German", async ({ page }) => {
  await page.goto("/login");
  await page.getByRole("button", { name: "Italiano" }).click();
  await page.getByLabel("Nome utente").fill(E2E_SUPER_USER.username);
  await page.getByLabel("Password").fill(E2E_SUPER_USER.password);

  await page.getByRole("button", { name: "Deutsch" }).click();
  await page.keyboard.press("Enter");

  await expect(page.getByRole("group", { name: "Konto" })).toBeVisible();
});
