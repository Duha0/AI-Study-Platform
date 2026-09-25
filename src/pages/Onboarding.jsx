import { useState } from "react";
import { usersApi } from "../lib/api";
import { STUDY_LEVELS } from "../lib/storage";

// Onboarding saves study preferences to the user's backend profile. Shown
// once after Register (App.jsx routes here before the Dashboard). The
// backend response is the updated user, handed up to App.jsx.

function Onboarding({ onComplete }) {
  const [studying, setStudying] = useState("");
  const [level, setLevel] = useState(STUDY_LEVELS[0]);
  const [error, setError] = useState(null);
  const [isSubmitting, setIsSubmitting] = useState(false);

  async function handleSubmit(event) {
    event.preventDefault();

    setIsSubmitting(true);
    setError(null);
    try {
      const updatedUser = await usersApi.completeOnboarding(studying.trim(), level);
      onComplete(updatedUser);
    } catch (apiError) {
      setError(apiError.message || "Could not save your preferences. Please try again.");
    } finally {
      setIsSubmitting(false);
    }
  }

  return (
    <div className="auth-page">
      <div className="auth-card">
        <h1 className="auth-heading">Let's personalize your StudyAI experience</h1>
        <p className="auth-subtitle">Just a couple of quick questions to get started.</p>

        {error && <p className="form-error">{error}</p>}

        <form onSubmit={handleSubmit}>
          <div className="field">
            <label htmlFor="onboarding-subject">What are you studying?</label>
            <input
              id="onboarding-subject"
              type="text"
              value={studying}
              onChange={(event) => setStudying(event.target.value)}
              placeholder="e.g. Biology, Web Development, French"
            />
          </div>

          <div className="field">
            <label htmlFor="onboarding-level">What is your study level?</label>
            <select
              id="onboarding-level"
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

          <button type="submit" className="button-primary auth-submit" disabled={isSubmitting}>
            {isSubmitting ? "Saving…" : "Continue to StudyAI"}
          </button>
        </form>
      </div>
    </div>
  );
}

export default Onboarding;
