import { useState } from "react";

// The Subject Details page. It's opened by clicking a card on the Subjects
// page and shows one subject's stats, its materials, and — once a material
// is clicked — a preview of that material with three placeholder actions.
//
// Materials are static sample data for now — the same short list is shown
// for every subject, since there's no backend yet to store real uploads.

const sampleMaterials = [
  {
    id: 1,
    filename: "Lecture Notes - Week 1.pdf",
    fileType: "PDF",
    pages: 8,
    size: "1.2 MB",
    uploaded: "Uploaded 3 days ago",
    description:
      "An overview of the topics covered in the first week, including key definitions and diagrams.",
  },
  {
    id: 2,
    filename: "Chapter Summary.pdf",
    fileType: "PDF",
    pages: 4,
    size: "640 KB",
    uploaded: "Uploaded 5 days ago",
    description:
      "A condensed summary of the chapter's main ideas — useful for a quick review before a quiz.",
  },
  {
    id: 3,
    filename: "Practice Problem Set.pdf",
    fileType: "PDF",
    pages: 12,
    size: "2.1 MB",
    uploaded: "Uploaded 1 week ago",
    description:
      "A set of practice problems with varying difficulty, for testing how well the material has landed.",
  },
];

function SubjectDetails({ subject, onBack }) {
  const [selectedMaterialId, setSelectedMaterialId] = useState(null);
  const [actionMessage, setActionMessage] = useState(null);

  const selectedMaterial = sampleMaterials.find(
    (material) => material.id === selectedMaterialId
  );

  function handleUploadClick() {
    // No backend yet — this is where the real upload flow will go.
    alert("Uploading isn't wired up yet.");
  }

  function handleSelectMaterial(material) {
    setSelectedMaterialId(material.id);
    setActionMessage(null); // clear any leftover message from a different material
  }

  function handleActionClick(actionLabel) {
    // No AI integration yet — these three buttons just show that they were
    // clicked. The real generation logic comes later.
    setActionMessage(`${actionLabel} is coming soon.`);
  }

  return (
    <>
      <button
        type="button"
        className="button-secondary details-back-button"
        onClick={onBack}
      >
        ← Back to Subjects
      </button>

      <header className="welcome">
        <div>
          <div className="details-title-row">
            <span
              className="subject-tile"
              style={{ backgroundColor: subject.color }}
            >
              {subject.initial}
            </span>
            <h1 className="welcome-title">{subject.name}</h1>
          </div>
          <p className="welcome-subtitle">
            {subject.description || "No description yet."}
          </p>
        </div>

        <button type="button" className="button-primary" onClick={handleUploadClick}>
          Upload Material
        </button>
      </header>

      <section className="section">
        <div className="stats-grid">
          <article className="stat-card">
            <p className="stat-value">{subject.materialCount}</p>
            <p className="stat-label">Materials</p>
          </article>

          <article className="stat-card">
            <p className="stat-value">{subject.quizzesCompleted || 0}</p>
            <p className="stat-label">Quizzes completed</p>
          </article>

          <article className="stat-card">
            <p className="stat-value">{subject.progress}%</p>
            <p className="stat-label">Study progress</p>
          </article>
        </div>
      </section>

      <section className="section">
        <h2 className="section-title">Materials</h2>

        <ul className="material-list">
          {sampleMaterials.map((material) => (
            <li key={material.id}>
              <button
                type="button"
                className={
                  material.id === selectedMaterialId
                    ? "material-row material-row-button material-row-active"
                    : "material-row material-row-button"
                }
                onClick={() => handleSelectMaterial(material)}
              >
                <span
                  className="material-dot"
                  style={{ backgroundColor: subject.color }}
                />

                <div className="material-text">
                  <p className="material-title">{material.filename}</p>
                  <p className="material-meta">
                    {material.pages} pages · {material.size}
                  </p>
                </div>

                <span className="material-when">{material.uploaded}</span>
              </button>
            </li>
          ))}
        </ul>
      </section>

      {selectedMaterial && (
        <section className="section">
          <h2 className="section-title">Material Preview</h2>

          <article className="material-preview">
            <p className="material-preview-filename">{selectedMaterial.filename}</p>
            <span className="material-preview-type">{selectedMaterial.fileType}</span>

            <p className="material-preview-description">
              {selectedMaterial.description}
            </p>

            <div className="material-preview-actions">
              <button
                type="button"
                className="button-secondary"
                onClick={() => handleActionClick("Summary generation")}
              >
                Generate Summary
              </button>
              <button
                type="button"
                className="button-secondary"
                onClick={() => handleActionClick("Quiz generation")}
              >
                Generate Quiz
              </button>
              <button
                type="button"
                className="button-secondary"
                onClick={() => handleActionClick("Flashcards")}
              >
                Flashcards
              </button>
            </div>

            {actionMessage && <p className="material-preview-status">{actionMessage}</p>}
          </article>
        </section>
      )}
    </>
  );
}

export default SubjectDetails;