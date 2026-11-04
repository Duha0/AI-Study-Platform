import { useState } from "react";
import { authApi, ApiError } from "../lib/api";
import { setToken, cacheUser } from "../lib/storage";
import { t } from "../lib/i18n";

// Backend-backed login. On success the JWT and user profile are stored via
// lib/storage and handed to App.jsx, which loads the dashboard. UI unchanged.

function Login({ onLoginSuccess, onNavigateRegister }) {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState(null);
  const [isSubmitting, setIsSubmitting] = useState(false);

  async function handleSubmit(event) {
    event.preventDefault();

    if (!email.trim() || !password) {
      setError(t("auth.please_fill_every_field"));
      return;
    }

    setIsSubmitting(true);
    setError(null);
    try {
      const response = await authApi.login(email.trim(), password);
      if (!response || !response.access_token) {
        throw new Error(t("auth.could_not_log_in"));
      }
      setToken(response.access_token);

      // The login endpoint returns only a token — fetch the profile so the
      // sidebar/dashboard have the user's real name immediately.
      const me = await authApi.fetchMe();
      cacheUser(me);
      onLoginSuccess(response.access_token, me);
    } catch (apiError) {
      if (apiError instanceof ApiError && apiError.status === 0) {
        setError(apiError.message);
      } else {
        setError(apiError.message || t("auth.could_not_log_in"));
      }
    } finally {
      setIsSubmitting(false);
    }
  }

  return (
    <div className="auth-page">
      <div className="auth-card">
        <h1 className="auth-heading">{t("auth.log_in")}</h1>
        <p className="auth-subtitle">{t("auth.welcome_back")}</p>

        {error && <p className="form-error">{error}</p>}

        <form onSubmit={handleSubmit}>
          <div className="field">
            <label htmlFor="login-email">{t("auth.email")}</label>
            <input
              id="login-email"
              type="email"
              value={email}
              onChange={(event) => setEmail(event.target.value)}
            />
          </div>

          <div className="field">
            <label htmlFor="login-password">{t("auth.password")}</label>
            <input
              id="login-password"
              type="password"
              value={password}
              onChange={(event) => setPassword(event.target.value)}
            />
          </div>

          <button type="submit" className="button-primary auth-submit" disabled={isSubmitting}>
            {isSubmitting ? t("auth.logging_in") : t("auth.log_in_btn")}
          </button>
        </form>

        <p className="auth-switch">
          {t("auth.dont_have_account")}{" "}
          <button type="button" className="link-button" onClick={onNavigateRegister}>
            {t("auth.create_one")}
          </button>
        </p>
      </div>
    </div>
  );
}

export default Login;
