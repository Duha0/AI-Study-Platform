// The first page a logged-out visitor sees. `onGetStarted` and `onLogIn`
// come from App.jsx's navigation function — this page doesn't know or care
// how navigation works internally, it just calls the callbacks it's given.

import { t } from "../lib/i18n";

const FEATURES = [
  {
    title: "landing.feature_summaries_title",
    description: "landing.feature_summaries_desc",
    icon: "M4 4h16M4 10h16M4 16h10",
  },
  {
    title: "landing.feature_quizzes_title",
    description: "landing.feature_quizzes_desc",
    icon: "M12 3a9 9 0 1 0 9 9M12 3v9l6-3",
  },
  {
    title: "landing.feature_flashcards_title",
    description: "landing.feature_flashcards_desc",
    icon: "M4 4h9a3 3 0 0 1 3 3v13a3 3 0 0 0-3-3H4zM20 4h-4v13h4z",
  },
  {
    title: "landing.feature_progress_title",
    description: "landing.feature_progress_desc",
    icon: "M4 20V10M10 20V4M16 20v-7M22 20H2",
  },
];

function Landing({ onGetStarted, onLogIn }) {
  return (
    <div className="landing-page">
      <header className="landing-header">
        <div className="sidebar-logo">
          <span className="sidebar-mark">S</span>
          <span className="sidebar-name">StudyAI</span>
        </div>
      </header>

      <section className="landing-hero">
        <h1 className="landing-hero-title">{t("landing.title")}</h1>
        <p className="landing-hero-subtitle">{t("landing.subtitle")}</p>

        <div className="landing-hero-actions">
          <button type="button" className="button-primary" onClick={onGetStarted}>
            {t("landing.get_started")}
          </button>
          <button type="button" className="button-secondary" onClick={onLogIn}>
            {t("landing.log_in")}
          </button>
        </div>
      </section>

      <section className="landing-features">
        {FEATURES.map((feature) => (
          <article key={feature.title} className="feature-card">
            <span className="feature-icon">
              <svg
                viewBox="0 0 24 24"
                fill="none"
                stroke="currentColor"
                strokeWidth="1.7"
                strokeLinecap="round"
                strokeLinejoin="round"
                aria-hidden="true"
              >
                <path d={feature.icon} />
              </svg>
            </span>
            <h3 className="feature-title">{t(feature.title)}</h3>
            <p className="feature-description">{t(feature.description)}</p>
          </article>
        ))}
      </section>

      <footer className="landing-footer">
        <p>{t("landing.copyright", { year: new Date().getFullYear() })}</p>
      </footer>
    </div>
  );
}

export default Landing;
