import { useState } from "react";
import { authApi } from "../lib/api";
import { setToken, cacheUser } from "../lib/storage";

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
      return "Please fill in every field.";
    }
    if (!EMAIL_PATTERN.test(email.trim())) {
      return "Please enter a valid email address.";
    }
    if (password.length < 8) {
      return "Password must be at least 8 characters.";
    }
    if (password !== confirmPassword) {
      return "Password and Confirm Password don't match.";
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
      setError(apiError.message || "Could not create your account. Please try again.");
    } finally {
      setIsSubmitting(false);
    }
  }

  return (
    <div className="auth-page">
      <div className="auth-card">
        <h1 className="auth-heading">Create your account</h1>
        <p className="auth-subtitle">Start turning your materials into study tools.</p>

        {error && <p className="form-error">{error}</p>}

        <form onSubmit={handleSubmit}>
          <div className="field">
            <label htmlFor="register-name">Full Name</label>
            <input
              id="register-name"
              type="text"
              value={fullName}
              onChange={(event) => setFullName(event.target.value)}
            />
          </div>

          <div className="field">
            <label htmlFor="register-email">Email</label>
            <input
              id="register-email"
              type="email"
              value={email}
              onChange={(event) => setEmail(event.target.value)}
            />
          </div>

          <div className="field">
            <label htmlFor="register-password">Password</label>
            <input
              id="register-password"
              type="password"
              value={password}
              onChange={(event) => setPassword(event.target.value)}
            />
          </div>

          <div className="field">
            <label htmlFor="register-confirm-password">Confirm Password</label>
            <input
              id="register-confirm-password"
              type="password"
              value={confirmPassword}
              onChange={(event) => setConfirmPassword(event.target.value)}
            />
          </div>

          <button type="submit" className="button-primary auth-submit" disabled={isSubmitting}>
            {isSubmitting ? "Creating account…" : "Create Account"}
          </button>
        </form>

        <p className="auth-switch">
          Already have an account?{" "}
          <button type="button" className="link-button" onClick={onNavigateLogin}>
            Log in
          </button>
        </p>
      </div>
    </div>
  );
}

export default Register;
