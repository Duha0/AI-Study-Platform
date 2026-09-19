import { useState } from "react";
import SubjectCard from "../components/SubjectCard";
import CreateSubjectModal from "../components/CreateSubjectModal";

// Colors are assigned to new subjects by cycling through this list, so each
// one gets a distinct identifying color the same way the sample subjects do.
const CARD_COLORS = ["#2E6B4F", "#7A5AA6", "#C08A2E", "#3B7C99", "#B85C5C"];

function Subjects({ subjects, onAddSubject, onSelectSubject, onDeleteSubject }) {
  const [isModalOpen, setIsModalOpen] = useState(false);

  function handleCreate(name, description) {
    const newSubject = {
      id: Date.now(), // good enough for local sample data
      name,
      description,
      initial: name.charAt(0).toUpperCase(),
      color: CARD_COLORS[subjects.length % CARD_COLORS.length],
      materialCount: 0,
      quizzesCompleted: 0,
      progress: 0,
      lastOpened: "Just created",
    };

    onAddSubject(newSubject);
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