import { useState } from "react";

// Very small, frontend-only "account" storage. There's no backend yet, so
// this is just enough to let Login later check "does this match what was
// registered" — it's not secure and isn't meant to be; real auth comes
// when a backend exists.
const USER_KEY = "studyai-user";

const EMAIL_PATTERN = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

function Register({ onRegistered, onNavigateLogin }) {
  const [fullName, setFullName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [error, setError] = useState(null);

  function handleSubmit(event) {
    event.preventDefault();

    if (!fullName.trim() || !email.trim() || !password || !confirmPassword) {
      setError("Please fill in every field.");
      return;
    }

    if (!EMAIL_PATTERN.test(email.trim())) {
      setError("Please enter a valid email address.");
      return;
    }

    if (password !== confirmPassword) {
      setError("Password and Confirm Password don't match.");
      return;
    }

    const user = { fullName: fullName.trim(), email: email.trim(), password };

    try {
      localStorage.setItem(USER_KEY, JSON.stringify(user));
    } catch (storageError) {
      // If storage fails (private browsing, full storage), there's nothing
      // useful to save — but the person can still continue this session.
    }

    setError(null);
    onRegistered();
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

          <button type="submit" className="button-primary auth-submit">
            Create Account
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