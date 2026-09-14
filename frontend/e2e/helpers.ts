import { expect, type Page } from "@playwright/test";

type Account = {
  username: string;
  password: string;
};

/** Sign in through the login screen and wait for the authenticated shell. */
export async function signIn(page: Page, account: Account): Promise<void> {
  await page.goto("/login");
  await page.getByLabel("Benutzername").fill(account.username);
  await page.getByLabel("Passwort").fill(account.password);
  await page.getByRole("button", { name: "Anmelden" }).click();
  await expect(page.getByRole("group", { name: "Konto" })).toBeVisible();
}

/**
 * Replace the server-held active schedule as the signed-in super-user and
 * wait until the schedule card reports the new file.
 */
export async function storeSchedule(
  page: Page,
  fixturePath: string,
): Promise<void> {
  const filename = fixturePath.split("/").pop() ?? fixturePath;
  await page.getByLabel("Datei auswählen").setInputFiles(fixturePath);
  await page.getByRole("button", { name: "Dienstplan hochladen" }).click();
  await expect(
    page.getByRole("region", { name: "Aktueller Dienstplan" }).getByText(filename),
  ).toBeVisible();
}
