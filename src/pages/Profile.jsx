import { useState } from "react";
import { usersApi } from "../lib/api";
import { STUDY_LEVELS } from "../lib/storage";

// Profile & Settings. Account fields (name, study info) are read from and
// written to the backend via the API layer. Theme is a UI-only preference
// owned by App.jsx state (persisted in lib/storage). Logout flows through
// App.jsx so both the sidebar and this page behave identically.

function Profile({ user, theme, onSetTheme, onLogout, onProfileUpdated }) {
  const [fullName, setFullName] = useState(user?.full_name || "");
  const [studying, setStudying] = useState(user?.studying || "");
  const [level, setLevel] = useState(user?.study_level || STUDY_LEVELS[0]);
  const [feedback, setFeedback] = useState(null); // { type: "error" | "success", text }
  const [isSubmitting, setIsSubmitting] = useState(false);

  const email = user?.email || "";

  async function handleSubmit(event) {
    event.preventDefault();

    if (!fullName.trim()) {
      setFeedback({ type: "error", text: "Full Name can't be empty." });
      return;
    }

    setIsSubmitting(true);
    setFeedback(null);
    try {
      const updatedUser = await usersApi.updateProfile(fullName.trim(), studying.trim(), level);
      onProfileUpdated(updatedUser);
      setFeedback({ type: "success", text: "Changes saved." });
    } catch (apiError) {
      setFeedback({
        type: "error",
        text: apiError.message || "Could not save your changes. Please try again.",
      });
    } finally {
      setIsSubmitting(false);
    }
  }

  return (
    <>
      <header className="welcome">
        <div>
          <h1 className="welcome-title">Profile &amp; Settings</h1>
          <p className="welcome-subtitle">Manage your account and how StudyAI looks.</p>
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

          <button type="submit" className="button-primary" disabled={isSubmitting}>
            {isSubmitting ? "Saving…" : "Save Changes"}
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
