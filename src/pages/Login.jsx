import { useState } from "react";
import { readUser } from "../lib/storage";

function Login({ onLoginSuccess, onNavigateRegister }) {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState(null);

  function handleSubmit(event) {
    event.preventDefault();

    // lib/storage.js owns the "studyai-user" key and guarantees a well-
    // shaped object comes back ({ fullName, email, password } all strings),
    // so no JSON parsing or field-guarding is needed here.
    const storedUser = readUser();

    if (!storedUser.email) {
      setError("No account found. Please create one first.");
      return;
    }

    const emailMatches =
      storedUser.email.trim().toLowerCase() === email.trim().toLowerCase();
    const passwordMatches = storedUser.password === password;

    if (!emailMatches || !passwordMatches) {
      setError("Incorrect email or password.");
      return;
    }

    setError(null);
    onLoginSuccess();
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

          <button type="submit" className="button-primary auth-submit">
            Log In
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