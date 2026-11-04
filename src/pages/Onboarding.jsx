import { useState } from "react";
import { usersApi } from "../lib/api";
import { STUDY_LEVELS } from "../lib/storage";
import { t } from "../lib/i18n";

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
      setError(apiError.message || t("onboarding.could_not_save"));
    } finally {
      setIsSubmitting(false);
    }
  }

  return (
    <div className="auth-page">
      <div className="auth-card">
        <h1 className="auth-heading">{t("onboarding.title")}</h1>
        <p className="auth-subtitle">{t("onboarding.subtitle")}</p>

        {error && <p className="form-error">{error}</p>}

        <form onSubmit={handleSubmit}>
          <div className="field">
            <label htmlFor="onboarding-subject">{t("onboarding.what_are_you_studying")}</label>
            <input
              id="onboarding-subject"
              type="text"
              value={studying}
              onChange={(event) => setStudying(event.target.value)}
              placeholder={t("onboarding.subject_placeholder")}
            />
          </div>

          <div className="field">
            <label htmlFor="onboarding-level">{t("onboarding.what_is_your_study_level")}</label>
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
            {isSubmitting ? t("onboarding.saving") : t("onboarding.continue")}
          </button>
        </form>
      </div>
    </div>
  );
}

export default Onboarding;
