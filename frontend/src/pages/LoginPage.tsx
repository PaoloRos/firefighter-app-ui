import { type FormEvent, useEffect, useRef, useState } from "react";
import { useLocation, useNavigate } from "react-router-dom";

import { useAuth } from "../auth/AuthProvider";
import { useI18n } from "../i18n/I18nProvider";
import type { TranslationKey } from "../i18n/translations";

type LocationState = {
  from?: { pathname?: string };
};

export function LoginPage() {
  const { language, t } = useI18n();
  const { status, signIn } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();

  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [errorKey, setErrorKey] = useState<TranslationKey | null>(null);
  const usernameRef = useRef<HTMLInputElement>(null);
  const passwordRef = useRef<HTMLInputElement>(null);

  const redirectTo =
    (location.state as LocationState | null)?.from?.pathname ?? "/";

  useEffect(() => {
    if (status === "authenticated") {
      navigate(redirectTo, { replace: true });
    }
  }, [status, redirectTo, navigate]);

  // Enter only submits a form while focus sits inside one of its own fields.
  // Put the caret in a field on arrival, and again after a header language
  // switch, which otherwise leaves focus on the language button where Enter
  // silently re-activates that button instead of signing in. The field values
  // are read from the DOM so typing does not re-trigger this effect.
  useEffect(() => {
    if (status === "authenticated") {
      return;
    }

    const target =
      usernameRef.current?.value === ""
        ? usernameRef.current
        : passwordRef.current;
    target?.focus();
  }, [language, status]);

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (isSubmitting) {
      return;
    }

    setIsSubmitting(true);
    setErrorKey(null);

    try {
      const result = await signIn(username, password);
      if (result.ok) {
        navigate(redirectTo, { replace: true });
        return;
      }
      setErrorKey(
        result.code === "invalid_credentials"
          ? "authInvalidCredentials"
          : "authSessionExpired",
      );
    } catch {
      setErrorKey("authUnexpectedError");
    }

    setIsSubmitting(false);
  }

  return (
    <section className="panel login-panel" aria-labelledby="login-title">
      <p className="eyebrow">{t("authSignInEyebrow")}</p>
      <h1 id="login-title">{t("authSignInTitle")}</h1>
      <p>{t("authSignInIntro")}</p>

      <form className="login-form" onSubmit={handleSubmit} noValidate>
        {errorKey !== null ? (
          <p className="form-message error-message" role="alert">
            {t(errorKey)}
          </p>
        ) : null}

        <div className="login-field">
          <label htmlFor="login-username">{t("authUsername")}</label>
          <input
            ref={usernameRef}
            id="login-username"
            name="username"
            type="text"
            autoComplete="username"
            autoCapitalize="none"
            autoCorrect="off"
            spellCheck={false}
            required
            value={username}
            onChange={(event) => setUsername(event.target.value)}
          />
        </div>

        <div className="login-field">
          <label htmlFor="login-password">{t("authPassword")}</label>
          <input
            ref={passwordRef}
            id="login-password"
            name="password"
            type="password"
            autoComplete="current-password"
            required
            value={password}
            onChange={(event) => setPassword(event.target.value)}
          />
        </div>

        <button
          className="primary-button"
          type="submit"
          disabled={isSubmitting}
        >
          {isSubmitting ? t("authSigningIn") : t("authSignIn")}
        </button>
      </form>
    </section>
  );
}
