import { useState } from "react";
import {
  readUser,
  writeUser,
  readOnboarding,
  writeOnboarding,
  STUDY_LEVELS,
} from "../lib/storage";

// All keys and safe storage access live in lib/storage.js — this page reads
// and writes the exact same user/onboarding objects as Register, Login, and
// Onboarding, through the same helpers. STUDY_LEVELS is shared with
// Onboarding's dropdown so the two selects can never drift apart.

// `theme`/`onSetTheme` and `onLogout` come straight from App.jsx — this
// page reuses the exact same theme state and logout logic the Sidebar
// uses, rather than having its own.
function Profile({ theme, onSetTheme, onLogout, onProfileUpdated }) {
  // Read once, on mount, the same way Register/Login/Onboarding read their
  // own saved values.
  const [email] = useState(() => readUser().email || "");
  const [fullName, setFullName] = useState(() => readUser().fullName || "");
  const [studying, setStudying] = useState(() => readOnboarding().subject || "");
  const [level, setLevel] = useState(() => readOnboarding().level || STUDY_LEVELS[0]);
  const [feedback, setFeedback] = useState(null); // { type: "error" | "success", text }

  function handleSubmit(event) {
    event.preventDefault();

    if (!fullName.trim()) {
      setFeedback({ type: "error", text: "Full Name can't be empty." });
      return;
    }

    // Spread the existing stored user so email/password are carried over
    // untouched — this updates the one account object, it doesn't replace
    // it with a new one.
    writeUser({ ...readUser(), fullName: fullName.trim() });
    writeOnboarding({ subject: studying.trim(), level });

    onProfileUpdated(); // tells App.jsx to re-read the name for the sidebar/Dashboard
    setFeedback({ type: "success", text: "Changes saved." });
  }

  return (
    <>
      <header className="welcome">
        <div>
          <h1 className="welcome-title">Profile &amp; Settings</h1>
          <p className="welcome-subtitle">
            Manage your account and how StudyAI looks.
          </p>
        </div>
      </header>

      <section className="section" id="profile-section">
        <h2 className="section-title">Profile</h2>

        {feedback && (
          <p className={feedback.type === "error" ? "form-error" : "form-success"}>
            {feedback.text}
          </p>
        )}

        <form onSubmit={handleSubmit} className="profile-form">
          <div className="field">
            <label htmlFor="profile-name">Full Name</label>
            <input
              id="profile-name"
              type="text"
              value={fullName}
              onChange={(event) => setFullName(event.target.value)}
            />
          </div>

          <div className="field">
            <label htmlFor="profile-email">Email</label>
            <input id="profile-email" type="email" value={email} disabled />
          </div>

          <div className="field">
            <label htmlFor="profile-level">Study Level</label>
            <select
              id="profile-level"
              value={level}
              onChange={(event) => setLevel(event.target.value)}
            >
              {STUDY_LEVELS.map((studyLevel) => (
                <option key={studyLevel} value={studyLevel}>
                  {studyLevel}
                </option>
              ))}
            </select>
          </div>

          <div className="field">
            <label htmlFor="profile-studying">What are you studying?</label>
            <input
              id="profile-studying"
              type="text"
              value={studying}
              onChange={(event) => setStudying(event.target.value)}
              placeholder="e.g. Biology, Web Development, French"
            />
          </div>

          <button type="submit" className="button-primary">
            Save Changes
          </button>
        </form>
      </section>

      <section className="section">
        <h2 className="section-title">Settings</h2>

        <h3 className="settings-subheading">Appearance</h3>
        <div className="settings-actions">
          <button
            type="button"
            className={theme === "light" ? "button-primary" : "button-secondary"}
            onClick={() => onSetTheme("light")}
          >
            Light Mode
          </button>
          <button
            type="button"
            className={theme === "dark" ? "button-primary" : "button-secondary"}
            onClick={() => onSetTheme("dark")}
          >
            Dark Mode
          </button>
        </div>

        <h3 className="settings-subheading">Account</h3>
        <div className="settings-actions">
          <a href="#profile-section" className="link-button">
            Profile
          </a>
          <button type="button" className="button-secondary" onClick={onLogout}>
            Logout
          </button>
        </div>
      </section>
    </>
  );
}

export default Profile;