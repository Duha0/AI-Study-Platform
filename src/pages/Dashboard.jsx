import SubjectCard from "../components/SubjectCard";

/* ---------------------------------------------------------------------------
   Sample data used only on this page.
   Subjects live in App.jsx now, since the Subjects page needs them too.
   --------------------------------------------------------------------------- */

const recentMaterials = [
  {
    id: 1,
    title: "Alkene reaction mechanisms",
    subject: "Organic Chemistry",
    color: "#2E6B4F",
    kind: "Summary",
    when: "2 hours ago",
  },
  {
    id: 2,
    title: "Eigenvalues practice set",
    subject: "Linear Algebra",
    color: "#7A5AA6",
    kind: "Quiz",
    when: "Yesterday",
  },
  {
    id: 3,
    title: "Lecture 7 — matrix transformations",
    subject: "Linear Algebra",
    color: "#7A5AA6",
    kind: "Notes",
    when: "2 days ago",
  },
  {
    id: 4,
    title: "Causes of the First World War",
    subject: "World History",
    color: "#C08A2E",
    kind: "Flashcards",
    when: "5 days ago",
  },
];

const weeklyProgress = {
  hoursStudied: 12,
  hoursGoal: 18,
  streakDays: 5,
};

function RecentMaterials({ materials }) {
  return (
    <section className="section">
      <h2 className="section-title">Recent Materials</h2>

      <ul className="material-list">
        {materials.map((material) => (
          <li key={material.id} className="material-row">
            <span
              className="material-dot"
              style={{ backgroundColor: material.color }}
            />

            <div className="material-text">
              <p className="material-title">{material.title}</p>
              <p className="material-meta">
                {material.subject} · {material.kind}
              </p>
            </div>

            <span className="material-when">{material.when}</span>
          </li>
        ))}
      </ul>
    </section>
  );
}

function ProgressCard({ progress }) {
  const percent = Math.min(
    Math.round((progress.hoursStudied / progress.hoursGoal) * 100),
    100
  );

  return (
    <section className="section">
      <h2 className="section-title">This Week</h2>

      <article className="progress-card">
        <p className="progress-number">
          {progress.hoursStudied}
          <span className="progress-goal"> / {progress.hoursGoal} hrs</span>
        </p>
        <p className="progress-label">studied toward your weekly goal</p>

        <div className="progress-track">
          <div className="progress-fill" style={{ width: percent + "%" }} />
        </div>

        <p className="progress-streak">
          {progress.streakDays} day streak — keep it going
        </p>
      </article>
    </section>
  );
}

/* ---------------------------------------------------------------------------
   The Dashboard page
   `subjects` comes from App.jsx so the preview here always matches the full
   Subjects page. Only the first three are shown — this is a preview, the
   Subjects page is where the complete list lives.
   --------------------------------------------------------------------------- */

function Dashboard({ subjects, onCreateSubject }) {
  const previewSubjects = subjects.slice(0, 3);

  return (
    <>
      <header className="welcome">
        <div>
          <h1 className="welcome-title">Welcome back 👋</h1>
          <p className="welcome-subtitle">Your study space, powered by AI.</p>
        </div>

        <button type="button" className="button-primary" onClick={onCreateSubject}>
          Create Subject
        </button>
      </header>

      <section className="section">
        <h2 className="section-title">Your Subjects</h2>

        <div className="subject-grid">
          {previewSubjects.map((subject) => (
            <SubjectCard key={subject.id} subject={subject} />
          ))}
        </div>
      </section>

      <div className="lower-grid">
        <RecentMaterials materials={recentMaterials} />
        <ProgressCard progress={weeklyProgress} />
      </div>
    </>
  );
}

export default Dashboard;