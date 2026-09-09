import type { ReactNode } from "react";
import { Navigate, useLocation } from "react-router-dom";

import { useAuth } from "../auth/AuthProvider";
import { useI18n } from "../i18n/I18nProvider";

type RequireSuperUserProps = {
  children: ReactNode;
  /**
   * Rendered when a signed-in account is not a super-user. When omitted the
   * component redirects to the dashboard, so it also works as a route guard.
   */
  fallback?: ReactNode;
};

/** Gate content behind the `super_user` role. */
export function RequireSuperUser({ children, fallback }: RequireSuperUserProps) {
  const { status, user } = useAuth();
  const location = useLocation();
  const { t } = useI18n();

  if (status === "loading") {
    return (
      <p className="auth-checking" role="status" aria-live="polite">
        {t("authCheckingSession")}
      </p>
    );
  }

  if (status === "anonymous") {
    return <Navigate to="/login" state={{ from: location }} replace />;
  }

  if (user?.role !== "super_user") {
    return fallback === undefined ? <Navigate to="/" replace /> : <>{fallback}</>;
  }

  return <>{children}</>;
}
