import { screen, within } from "@testing-library/react";
import { beforeEach, describe, expect, it } from "vitest";

import type { SessionUser } from "../api/auth";
import { LANGUAGE_STORAGE_KEY } from "../i18n/I18nProvider";
import { renderApp, SUPER_USER } from "../test/renderApp";

function userWith(profile: Partial<SessionUser>): SessionUser {
  return { ...SUPER_USER, ...profile };
}

describe("home identity panel", () => {
  beforeEach(() => {
    window.localStorage.clear();
  });

  it("shows the account, capitalised name, and profile tags", () => {
    renderApp("/", {
      user: userWith({
        username: "rossi",
        name: "Mario",
        surname: "Rossi",
        rank: "KDT",
        zug: "1",
        gruppe: "2",
      }),
    });

    const panel = screen.getByRole("region", { name: "Wer bist du" });
    expect(within(panel).getByText("Angemeldet als")).toBeVisible();
    expect(within(panel).getByText("rossi")).toBeVisible();
    expect(panel.querySelector(".identity-fullname")?.textContent).toBe(
      "Mario Rossi",
    );

    const rankTag = panel.querySelector(".identity-tag-rank-red");
    expect(rankTag?.textContent).toContain("Dienstgrad");
    expect(rankTag?.textContent).toContain("KDT");

    expect(within(panel).getByText("Zug 1")).toBeVisible();
    expect(within(panel).getByText("Gruppe 2")).toBeVisible();
  });

  it("colours a deputy leadership rank amber and keeps the -STV suffix", () => {
    renderApp("/", { user: userWith({ rank: "gkdt-stv" }) });

    const panel = screen.getByRole("region", { name: "Wer bist du" });
    const rankTag = panel.querySelector(".identity-tag-rank-yellow");
    expect(rankTag?.textContent).toContain("GKDT-STV");
    expect(panel.querySelector(".identity-tag-rank-red")).toBeNull();
  });

  it("leaves an ordinary rank without a colour modifier", () => {
    renderApp("/", { user: userWith({ rank: "FWM" }) });

    const panel = screen.getByRole("region", { name: "Wer bist du" });
    expect(
      panel.querySelector(".identity-tag-rank-red, .identity-tag-rank-yellow"),
    ).toBeNull();
    const tags = within(panel).getAllByRole("listitem");
    expect(tags).toHaveLength(1);
    expect(tags[0]?.textContent).toContain("FWM");
  });

  it("omits the name line and tag list when no profile is set", () => {
    renderApp("/", {
      user: userWith({
        username: "member",
        name: null,
        surname: null,
        rank: null,
        zug: null,
        gruppe: null,
      }),
    });

    const panel = screen.getByRole("region", { name: "Wer bist du" });
    expect(within(panel).getByText("member")).toBeVisible();
    expect(panel.querySelector(".identity-fullname")).toBeNull();
    expect(panel.querySelector(".identity-tags")).toBeNull();
  });

  it("translates the panel into Italian", () => {
    window.localStorage.setItem(LANGUAGE_STORAGE_KEY, "it");
    renderApp("/", { user: userWith({ rank: "KDT", zug: "1", gruppe: "2" }) });

    const panel = screen.getByRole("region", { name: "Chi sei" });
    expect(within(panel).getByText("Connesso come")).toBeVisible();
    // "Zug" and "Gruppe" stay German in the Italian UI (organisational names).
    expect(within(panel).getByText("Zug 1")).toBeVisible();
    expect(within(panel).getByText("Gruppe 2")).toBeVisible();
  });
});
