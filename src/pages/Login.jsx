import { useState } from "react";
import { authApi, ApiError } from "../lib/api";
import { setToken, cacheUser } from "../lib/storage";

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
      setError("Please enter your email and password.");
      return;
    }

    setIsSubmitting(true);
    setError(null);
    try {
      const response = await authApi.login(email.trim(), password);
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
        setError(apiError.message || "Could not log you in. Please try again.");
      }
    } finally {
      setIsSubmitting(false);
    }
  }

  return (
    <div className="auth-page">
      <div className="auth-card">
        <h1 className="auth-heading">Log in</h1>
        <p className="auth-subtitle">Welcome back — pick up where you left off.</p>

        {error && <p className="form-error">{error}</p>}

        <form onSubmit={handleSubmit}>
          <div className="field">
            <label htmlFor="login-email">Email</label>
            <input
              id="login-email"
              type="email"
              value={email}
              onChange={(event) => setEmail(event.target.value)}
            />
          </div>

          <div className="field">
            <label htmlFor="login-password">Password</label>
            <input
              id="login-password"
              type="password"
              value={password}
              onChange={(event) => setPassword(event.target.value)}
            />
          </div>

          <button type="submit" className="button-primary auth-submit" disabled={isSubmitting}>
            {isSubmitting ? "Logging in…" : "Log In"}
          </button>
        </form>

        <p className="auth-switch">
          Don't have an account?{" "}
          <button type="button" className="link-button" onClick={onNavigateRegister}>
            Create one
          </button>
        </p>
      </div>
    </div>
  );
}

export default Login;
