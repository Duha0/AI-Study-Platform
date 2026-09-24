import { useState } from "react";
import { writeOnboarding, STUDY_LEVELS } from "../lib/storage";

// STUDY_LEVELS is shared with Profile's dropdown (imported above) so the
// two selects can never drift apart.

function Onboarding({ onComplete }) {
  const [subject, setSubject] = useState("");
  const [level, setLevel] = useState(STUDY_LEVELS[0]);

  function handleSubmit(event) {
    event.preventDefault();

    const onboardingInfo = { subject: subject.trim(), level };

    writeOnboarding(onboardingInfo);

    onComplete();
  }

  return (
    <div className="auth-page">
      <div className="auth-card">
        <h1 className="auth-heading">Let's personalize your StudyAI experience</h1>
        <p className="auth-subtitle">Just a couple of quick questions to get started.</p>

        <form onSubmit={handleSubmit}>
          <div className="field">
            <label htmlFor="onboarding-subject">What are you studying?</label>
            <input
              id="onboarding-subject"
              type="text"
              value={subject}
              onChange={(event) => setSubject(event.target.value)}
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

          <button type="submit" className="button-primary auth-submit">
            Continue to StudyAI
          </button>
        </form>
      </div>
    </div>
  );
}

export default Onboarding;