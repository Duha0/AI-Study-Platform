import { useState } from "react";
import SubjectCard from "../components/SubjectCard";
import CreateSubjectModal from "../components/CreateSubjectModal";

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
      setError(apiError.message || "Could not create the subject. Please try again.");
      setIsModalOpen(false);
    }
  }

  async function handleDeleteClick(subject) {
    const confirmed = window.confirm(
      `Delete "${subject.name}"? This can't be undone.`
    );
    if (!confirmed) return;

    setError(null);
    try {
      await onDeleteSubject(subject.id);
    } catch (apiError) {
      setError(apiError.message || "Could not delete the subject. Please try again.");
    }
  }

  return (
    <>
      <header className="welcome">
        <div>
          <h1 className="welcome-title">Subjects</h1>
          <p className="welcome-subtitle">Everything you're studying, in one place.</p>
        </div>

        <button
          type="button"
          className="button-primary"
          onClick={() => setIsModalOpen(true)}
        >
          Create Subject
        </button>
      </header>

      {error && <p className="form-error">{error}</p>}

      <section className="section">
        {subjects.length === 0 ? (
          <div className="empty-state">
            <h2 className="empty-state-title">No subjects yet</h2>
            <p className="empty-state-text">
              Create a subject to start uploading materials and generating
              summaries, quizzes, and flashcards.
            </p>
            <button
              type="button"
              className="button-primary"
              onClick={() => setIsModalOpen(true)}
            >
              Create Subject
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
