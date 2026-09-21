// The first page a logged-out visitor sees. `onGetStarted` and `onLogIn`
// come from App.jsx's navigation function — this page doesn't know or care
// how navigation works internally, it just calls the callbacks it's given.

const FEATURES = [
  {
    title: "AI Summaries",
    description: "Turn long readings into clear, focused summaries you can review in minutes.",
    icon: "M4 4h16M4 10h16M4 16h10",
  },
  {
    title: "Interactive Quizzes",
    description: "Test what you know with multiple-choice questions built from your materials.",
    icon: "M12 3a9 9 0 1 0 9 9M12 3v9l6-3",
  },
  {
    title: "Smart Flashcards",
    description: "Flip through question-and-answer cards to lock in the key facts.",
    icon: "M4 4h9a3 3 0 0 1 3 3v13a3 3 0 0 0-3-3H4zM20 4h-4v13h4z",
  },
  {
    title: "Progress Tracking",
    description: "See how far along each subject is, at a glance, across every material.",
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
        <h1 className="landing-hero-title">
          Turn Your Study Materials Into Smarter Learning
        </h1>
        <p className="landing-hero-subtitle">
          StudyAI turns the PDFs you already have into summaries, quizzes, and
          flashcards — so you spend less time organizing and more time
          actually studying.
        </p>

        <div className="landing-hero-actions">
          <button type="button" className="button-primary" onClick={onGetStarted}>
            Get Started
          </button>
          <button type="button" className="button-secondary" onClick={onLogIn}>
            Log In
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
            <h3 className="feature-title">{feature.title}</h3>
            <p className="feature-description">{feature.description}</p>
          </article>
        ))}
      </section>

      <footer className="landing-footer">
        <p>© 2026 StudyAI. Made for students who'd rather be studying.</p>
      </footer>
    </div>
  );
}

export default Landing;