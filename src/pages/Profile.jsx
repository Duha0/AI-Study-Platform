import { useState } from "react";

// Same keys Register.jsx, Login.jsx, and Onboarding.jsx already use — this
// page reads and writes the exact same stored objects, it doesn't create a
// second copy of the user or onboarding data anywhere.
const USER_KEY = "studyai-user";
const ONBOARDING_KEY = "studyai-onboarding";

const STUDY_LEVELS = ["High School", "University", "Self Learner"];

function readStoredUser() {
  try {
    const raw = localStorage.getItem(USER_KEY);
    return raw ? JSON.parse(raw) : {};
  } catch (error) {
    return {};
  }
}

function readStoredOnboarding() {
  try {
    const raw = localStorage.getItem(ONBOARDING_KEY);
    return raw ? JSON.parse(raw) : {};
  } catch (error) {
    return {};
  }
}

// `theme`/`onSetTheme` and `onLogout` come straight from App.jsx — this
// page reuses the exact same theme state and logout logic the Sidebar
// uses, rather than having its own.
function Profile({ theme, onSetTheme, onLogout, onProfileUpdated }) {
  // Read once, on mount, the same way Register/Login/Onboarding read their
  // own saved values.
  const [email] = useState(() => readStoredUser().email || "");
  const [fullName, setFullName] = useState(() => readStoredUser().fullName || "");
  const [studying, setStudying] = useState(() => readStoredOnboarding().subject || "");
  const [level, setLevel] = useState(() => readStoredOnboarding().level || STUDY_LEVELS[0]);
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
    const updatedUser = { ...readStoredUser(), fullName: fullName.trim() };
    const updatedOnboarding = { subject: studying.trim(), level };

    try {
      localStorage.setItem(USER_KEY, JSON.stringify(updatedUser));
      localStorage.setItem(ONBOARDING_KEY, JSON.stringify(updatedOnboarding));
    } catch (storageError) {
      // The fields on screen still reflect the edit for this session even
      // if it couldn't be saved.
    }

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