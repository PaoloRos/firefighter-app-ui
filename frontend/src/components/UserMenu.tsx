import { useNavigate } from "react-router-dom";

import { useAuth } from "../auth/AuthProvider";
import { useI18n } from "../i18n/I18nProvider";

/** Header control showing the signed-in account and a sign-out action. */
export function UserMenu() {
  const { user, signOut } = useAuth();
  const { t } = useI18n();
  const navigate = useNavigate();

  if (user === null) {
    return null;
  }

  const displayName = user.name ?? user.username;
  const roleLabel =
    user.role === "super_user" ? t("roleSuperUser") : t("roleUser");

  async function handleSignOut() {
    await signOut();
    navigate("/login");
  }

  return (
    <div className="user-menu" role="group" aria-label={t("authAccountMenuLabel")}>
      <span className="user-menu-identity">
        <span className="user-menu-label">{t("authSignedInAs")}</span>
        <strong className="user-menu-name">{displayName}</strong>
        <span className={`role-badge role-badge-${user.role}`}>{roleLabel}</span>
      </span>
      <button
        type="button"
        className="secondary-button user-menu-signout"
        onClick={handleSignOut}
      >
        {t("authSignOut")}
      </button>
    </div>
  );
}
