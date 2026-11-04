import { useState } from "react";
import SubjectCard from "../components/SubjectCard";
import CreateSubjectModal from "../components/CreateSubjectModal";
import { t } from "../lib/i18n";

/* Subjects page. All data comes from the backend via App.jsx; creation and
   deletion go through the API handlers passed down, which this page awaits
   so failures can be shown instead of silently doing nothing. */

function Subjects({ subjects, onCreateSubject, onSelectSubject, onDeleteSubject }) {
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [error, setError] = useState(null);

  async function handleCreate(name, description) {
    setError(null);
    try {
      await onCreateSubject(name, description);
      setIsModalOpen(false);
    } catch (apiError) {
      setError(apiError.message || t("subjects.could_not_delete_subject"));
      setIsModalOpen(false);
    }
  }

  async function handleDeleteClick(subject) {
    const confirmed = window.confirm(
      t("subjects.delete_confirm", { name: subject.name })
    );
    if (!confirmed) return;

    setError(null);
    try {
      await onDeleteSubject(subject.id);
    } catch (apiError) {
      setError(apiError.message || t("subjects.could_not_delete_subject"));
    }
  }

  return (
    <>
      <header className="welcome">
        <div>
          <h1 className="welcome-title">{t("subjects.title")}</h1>
          <p className="welcome-subtitle">{t("subjects.subtitle")}</p>
        </div>

        <button
          type="button"
          className="button-primary"
          onClick={() => setIsModalOpen(true)}
        >
          {t("subjects.create_subject")}
        </button>
      </header>

      {error && <p className="form-error">{error}</p>}

      <section className="section">
        {subjects.length === 0 ? (
          <div className="empty-state">
            <h2 className="empty-state-title">{t("subjects.no_subjects_yet")}</h2>
            <p className="empty-state-text">{t("subjects.empty_desc")}</p>
            <button
              type="button"
              className="button-primary"
              onClick={() => setIsModalOpen(true)}
            >
              {t("subjects.create_subject")}
            </button>
          </div>
        ) : (
          <div className="subject-grid">
            {subjects.map((subject) => (
              <SubjectCard
                key={subject.id}
                subject={subject}
                onOpen={() => onSelectSubject(subject.id)}
                onDelete={() => handleDeleteClick(subject)}
              />
            ))}
          </div>
        )}
      </section>

      {isModalOpen && (
        <CreateSubjectModal
          onClose={() => setIsModalOpen(false)}
          onCreate={handleCreate}
        />
      )}
    </>
  );
}

export default Subjects;
