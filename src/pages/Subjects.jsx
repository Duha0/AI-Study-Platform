import { useState } from "react";
import SubjectCard from "../components/SubjectCard";
import CreateSubjectModal from "../components/CreateSubjectModal";

function Subjects({ subjects, onCreateSubject, onSelectSubject, onDeleteSubject }) {
  const [isModalOpen, setIsModalOpen] = useState(false);

  function handleCreate(name, description) {
    onCreateSubject(name, description);
    setIsModalOpen(false);
  }

  function handleDeleteClick(subject) {
    const confirmed = window.confirm(
      `Delete "${subject.name}"? This can't be undone.`
    );
    if (confirmed) {
      onDeleteSubject(subject.id);
    }
    // If they hit Cancel, confirmed is false and nothing happens.
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

      <section className="section">
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