import { useState } from "react";
import SubjectCard from "../components/SubjectCard";
import CreateSubjectModal from "../components/CreateSubjectModal";
import { t } from "../lib/i18n";

/* ---------------------------------------------------------------------------
   The Dashboard page.
   `subjects` comes from the backend via App.jsx. Material counts and
   completion numbers are computed by the API (see SubjectOut), so nothing
   here duplicates progress math — the frontend only renders it.
   --------------------------------------------------------------------------- */

function Dashboard({ subjects, onCreateSubject, userName }) {
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [error, setError] = useState(null);

  const hasSubjects = subjects.length > 0;
  const totalMaterials = subjects.reduce((sum, s) => sum + (s.material_count || 0), 0);
  const completedMaterials = subjects.reduce((sum, s) => sum + (s.completed_materials || 0), 0);
  const overallProgressPercent =
    totalMaterials === 0 ? 0 : Math.round((completedMaterials / totalMaterials) * 100);

  // A short preview, not the full list — the Subjects page is where every
  // subject lives.
  const recentSubjects = subjects.slice(0, 3);

  async function handleCreate(name, description) {
    setError(null);
    try {
      await onCreateSubject(name, description);
      setIsModalOpen(false);
    } catch (apiError) {
      setError(apiError.message || t("dashboard.could_not_create_subject"));
      setIsModalOpen(false);
    }
  }

  return (
    <>
      <header className="welcome">
        <div>
          <h1 className="welcome-title">
            {t("dashboard.welcome_back", { name: userName ? `, ${userName}` : "" })}
          </h1>
          <p className="welcome-subtitle">{t("dashboard.your_study_space")}</p>
        </div>

        <button
          type="button"
          className="button-primary"
          onClick={() => setIsModalOpen(true)}
        >
          {t("dashboard.create_subject")}
        </button>
      </header>

      {error && <p className="form-error">{error}</p>}

      {hasSubjects ? (
        <>
          <section className="section">
            <div className="stats-grid">
              <article className="stat-card">
                <p className="stat-value">{subjects.length}</p>
                <p className="stat-label">{t("stats.total_subjects")}</p>
              </article>

              <article className="stat-card">
                <p className="stat-value">{totalMaterials}</p>
                <p className="stat-label">{t("stats.total_materials")}</p>
              </article>

              <article className="stat-card">
                <p className="stat-value">{completedMaterials}</p>
                <p className="stat-label">{t("stats.completed_materials")}</p>
              </article>

              <article className="stat-card">
                <p className="stat-value">{overallProgressPercent}%</p>
                <p className="stat-label">{t("stats.overall_progress")}</p>
              </article>
            </div>
          </section>

          <section className="section">
            <h2 className="section-title">{t("dashboard.recent_subjects")}</h2>

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
            <h2 className="empty-state-title">{t("dashboard.create_first_subject")}</h2>
            <p className="empty-state-text">{t("dashboard.empty_desc")}</p>
            <button
              type="button"
              className="button-primary"
              onClick={() => setIsModalOpen(true)}
            >
              {t("dashboard.create_subject")}
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
