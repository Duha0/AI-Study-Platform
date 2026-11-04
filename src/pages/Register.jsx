import { useState } from "react";
import { authApi } from "../lib/api";
import { setToken, cacheUser } from "../lib/storage";
import { t } from "../lib/i18n";

// Backend-backed registration. On success the server returns the user plus
// a JWT, which is stored via lib/storage and handed up to App.jsx, which
// routes into Onboarding. The UI is unchanged from the original design.

const EMAIL_PATTERN = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

function Register({ onRegistered, onNavigateLogin }) {
  const [fullName, setFullName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [error, setError] = useState(null);
  const [isSubmitting, setIsSubmitting] = useState(false);

  function validate() {
    if (!fullName.trim() || !email.trim() || !password || !confirmPassword) {
      return t("auth.please_fill_every_field");
    }
    if (!EMAIL_PATTERN.test(email.trim())) {
      return t("auth.please_enter_valid_email");
    }
    if (password.length < 8) {
      return t("auth.password_must_be_at_least_8");
    }
    if (password !== confirmPassword) {
      return t("auth.password_and_confirm_dont_match");
    }
    return null;
  }

  async function handleSubmit(event) {
    event.preventDefault();

    const validationError = validate();
    if (validationError) {
      setError(validationError);
      return;
    }

    setIsSubmitting(true);
    setError(null);
    try {
      const response = await authApi.register(fullName.trim(), email.trim(), password);
      setToken(response.access_token);
      cacheUser(response.user);
      onRegistered(response.access_token, response.user);
    } catch (apiError) {
      setError(apiError.message || t("auth.could_not_create_account"));
    } finally {
      setIsSubmitting(false);
    }
  }

  return (
    <div className="auth-page">
      <div className="auth-card">
        <h1 className="auth-heading">{t("auth.create_account")}</h1>
        <p className="auth-subtitle">{t("auth.start_turning")}</p>

        {error && <p className="form-error">{error}</p>}

        <form onSubmit={handleSubmit}>
          <div className="field">
            <label htmlFor="register-name">{t("auth.full_name")}</label>
            <input
              id="register-name"
              type="text"
              value={fullName}
              onChange={(event) => setFullName(event.target.value)}
            />
          </div>

          <div className="field">
            <label htmlFor="register-email">{t("auth.email")}</label>
            <input
              id="register-email"
              type="email"
              value={email}
              onChange={(event) => setEmail(event.target.value)}
            />
          </div>

          <div className="field">
            <label htmlFor="register-password">{t("auth.password")}</label>
            <input
              id="register-password"
              type="password"
              value={password}
              onChange={(event) => setPassword(event.target.value)}
            />
          </div>

          <div className="field">
            <label htmlFor="register-confirm-password">{t("auth.confirm_password")}</label>
            <input
              id="register-confirm-password"
              type="password"
              value={confirmPassword}
              onChange={(event) => setConfirmPassword(event.target.value)}
            />
          </div>

          <button type="submit" className="button-primary auth-submit" disabled={isSubmitting}>
            {isSubmitting ? t("auth.creating_account") : t("auth.create_account_btn")}
          </button>
        </form>

        <p className="auth-switch">
          {t("auth.already_have_account")}{" "}
          <button type="button" className="link-button" onClick={onNavigateLogin}>
            {t("auth.log_in_short")}
          </button>
        </p>
      </div>
    </div>
  );
}

export default Register;
