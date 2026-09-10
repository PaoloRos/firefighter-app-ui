import { useAuth } from "../auth/AuthProvider";
import { useI18n } from "../i18n/I18nProvider";
import { presentRank } from "./rankPresentation";

/**
 * Home-page panel that shows the signed-in firefighter: the account name, the
 * full name in capitals, and the rank / Zug / Gruppe as soft-background tags.
 * The rank tag is colour-coded by seniority (see {@link presentRank}).
 */
export function IdentityPanel() {
  const { user } = useAuth();
  const { t } = useI18n();

  if (user === null) {
    return null;
  }

  const fullName = [user.name, user.surname]
    .map((part) => part?.trim())
    .filter((part): part is string => Boolean(part))
    .join(" ");
  const rank = user.rank ? presentRank(user.rank) : null;
  const zug = user.zug?.trim() ?? "";
  const gruppe = user.gruppe?.trim() ?? "";
  const hasTags = rank !== null || zug !== "" || gruppe !== "";

  return (
    <section className="panel identity-panel" aria-labelledby="identity-heading">
      <h2 id="identity-heading" className="identity-heading">
        {t("identityHeading")}
      </h2>

      <p className="identity-account">
        <span className="identity-account-label">{t("authSignedInAs")}</span>
        <span className="identity-username">{user.username}</span>
      </p>

      {fullName !== "" ? (
        <p className="identity-fullname">{fullName}</p>
      ) : null}

      {hasTags ? (
        <ul className="identity-tags" aria-label={t("identityProfileLabel")}>
          {rank !== null ? (
            <li
              className={
                rank.color === "neutral"
                  ? "identity-tag"
                  : `identity-tag identity-tag-rank-${rank.color}`
              }
            >
              <span className="visually-hidden">{t("identityRankLabel")}: </span>
              {rank.label}
            </li>
          ) : null}
          {zug !== "" ? (
            <li className="identity-tag">
              {t("identityZugLabel")} {zug}
            </li>
          ) : null}
          {gruppe !== "" ? (
            <li className="identity-tag">
              {t("identityGruppeLabel")} {gruppe}
            </li>
          ) : null}
        </ul>
      ) : null}
    </section>
  );
}
