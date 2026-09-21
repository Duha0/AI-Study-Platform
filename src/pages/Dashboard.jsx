import { useState } from "react";
import SubjectCard from "../components/SubjectCard";
import CreateSubjectModal from "../components/CreateSubjectModal";

/* ---------------------------------------------------------------------------
   The Dashboard page
   `subjects` comes from App.jsx — the same array the Subjects page and
   Subject Details use, so every number here is computed fresh from it on
   each render rather than tracked separately. Nothing on this page is
   hard-coded.
   --------------------------------------------------------------------------- */

function Dashboard({ subjects, onCreateSubject, userName }) {
  const [isModalOpen, setIsModalOpen] = useState(false);

  const hasSubjects = subjects.length > 0;
  const allMaterials = subjects.flatMap((subject) => subject.materials);
  const totalMaterials = allMaterials.length;
  const completedMaterials = allMaterials.filter(
    (material) => material.completionStatus === "completed"
  ).length;
  const overallProgressPercent =
    totalMaterials === 0 ? 0 : Math.round((completedMaterials / totalMaterials) * 100);

  // A short preview, not the full list — the Subjects page is where every
  // subject lives.
  const recentSubjects = subjects.slice(0, 3);

  function handleCreate(name, description) {
    onCreateSubject(name, description);
    setIsModalOpen(false);
  }

  return (
    <>
      <header className="welcome">
        <div>
          <h1 className="welcome-title">
            Welcome back{userName ? `, ${userName}` : ""} 👋
          </h1>
          <p className="welcome-subtitle">Your study space, powered by AI.</p>
        </div>

        <button
          type="button"
          className="button-primary"
          onClick={() => setIsModalOpen(true)}
        >
          Create Subject
        </button>
      </header>

      {hasSubjects ? (
        <>
          <section className="section">
            <div className="stats-grid">
              <article className="stat-card">
                <p className="stat-value">{subjects.length}</p>
                <p className="stat-label">Total Subjects</p>
              </article>

              <article className="stat-card">
                <p className="stat-value">{totalMaterials}</p>
                <p className="stat-label">Total Materials</p>
              </article>

              <article className="stat-card">
                <p className="stat-value">{completedMaterials}</p>
                <p className="stat-label">Completed Materials</p>
              </article>

              <article className="stat-card">
                <p className="stat-value">{overallProgressPercent}%</p>
                <p className="stat-label">Overall Progress</p>
              </article>
            </div>
          </section>

          <section className="section">
            <h2 className="section-title">Recent Subjects</h2>

            <div className="subject-grid">
              {recentSubjects.map((subject) => (
                <SubjectCard key={subject.id} subject={subject} />
              ))}
            </div>
          </section>
        </>
      ) : (
        <section className="section">
          <div className="empty-state">
            <h2 className="empty-state-title">Create your first subject</h2>
            <p className="empty-state-text">
              Subjects are where your materials, summaries, quizzes, and
              flashcards will live. Create one to get started.
            </p>
            <button
              type="button"
              className="button-primary"
              onClick={() => setIsModalOpen(true)}
            >
              Create Subject
            </button>
          </div>
        </section>
      )}

      {isModalOpen && (
        <CreateSubjectModal
          onClose={() => setIsModalOpen(false)}
          onCreate={handleCreate}
        />
      )}
    </>
  );
}

export default Dashboard;