import type { ReactNode } from "react";
import { Navigate, useLocation } from "react-router-dom";

import { useAuth } from "../auth/AuthProvider";
import { useI18n } from "../i18n/I18nProvider";

type RequireAuthProps = {
  children: ReactNode;
};

/** Gate a route behind an authenticated session, redirecting to `/login`. */
export function RequireAuth({ children }: RequireAuthProps) {
  const { status } = useAuth();
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

  return <>{children}</>;
}
