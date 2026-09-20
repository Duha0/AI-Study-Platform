import { useEffect, useRef, useState } from "react";

// The Subject Details page. It's opened by clicking a card on the Subjects
// page and shows one subject's stats, its materials, and — once a material
// is clicked — a preview of that material with three placeholder actions.
//
// `subject.materials` comes from App.jsx, since materials need to persist
// on the subject itself (for the session) rather than live only in this
// component's own state. Adding a new one goes through `onAddMaterial`,
// and the processing → ready simulation goes through `onUpdateMaterialStatus`
// — both already defined in App.jsx alongside the subject-editing handlers.

const PROCESSING_DELAY_MS = 1500;

// Turns a raw byte count from the File object into something readable.
function formatFileSize(bytes) {
  if (bytes < 1024) return `${bytes} B`;
  if (bytes < 1024 * 1024) return `${Math.round(bytes / 1024)} KB`;
  return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
}

function SubjectDetails({ subject, onBack, onAddMaterial, onUpdateMaterialStatus }) {
  const [selectedMaterialId, setSelectedMaterialId] = useState(null);
  const [actionMessage, setActionMessage] = useState(null);
  const fileInputRef = useRef(null);

  // Defensive guard: App.jsx only renders this page when it has found a
  // matching subject, so this shouldn't normally happen — but if it ever
  // does (a stale id, a subject removed elsewhere), fail safely instead of
  // crashing on subject.color/name/etc. below.
  if (!subject) {
    return (
      <>
        <button
          type="button"
          className="button-secondary details-back-button"
          onClick={onBack}
        >
          ← Back to Subjects
        </button>
        <p className="coming-soon">This subject could not be found.</p>
      </>
    );
  }

  // Defensive guard: fall back to an empty list if a subject somehow has
  // no materials array yet, instead of crashing on materials.find/.length.
  const materials = subject.materials || [];

  const selectedMaterial = materials.find(
    (material) => material.id === selectedMaterialId
  );

  // Simulates "processing" a newly uploaded file. While the selected
  // material is still marked "processing", wait a moment and then flip it
  // to "ready". This is the only faked part of upload — the file itself,
  // its name, and its size are all real, just not sent anywhere.
  useEffect(() => {
    if (selectedMaterial && selectedMaterial.status === "processing") {
      const timer = setTimeout(() => {
        onUpdateMaterialStatus(subject.id, selectedMaterial.id, "ready");
      }, PROCESSING_DELAY_MS);

      return () => clearTimeout(timer);
    }
  }, [selectedMaterial, subject.id, onUpdateMaterialStatus]);

  function handleUploadClick() {
    // The actual file picker is the hidden <input> below this button —
    // this just opens it.
    fileInputRef.current.click();
  }

  function handleFileChange(event) {
    const file = event.target.files[0];
    event.target.value = ""; // lets the same file be chosen again later

    if (!file) {
      return; // the person closed the picker without choosing anything
    }

    if (!file.name.toLowerCase().endsWith(".pdf")) {
      alert("Please choose a PDF file.");
      return;
    }

    const newMaterial = {
      id: Date.now(), // good enough for local sample data
      filename: file.name,
      fileType: "PDF",
      size: formatFileSize(file.size),
      uploaded: "Uploaded just now",
      description: "",
      status: "processing",
    };

    onAddMaterial(subject.id, newMaterial);
    setSelectedMaterialId(newMaterial.id);
    setActionMessage(null);
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

        {/* Hidden — the button above opens it. Restricted to PDFs, per the
            requirement that only PDF materials are supported for now. */}
        <input
          type="file"
          accept="application/pdf,.pdf"
          ref={fileInputRef}
          onChange={handleFileChange}
          style={{ display: "none" }}
        />
      </header>

      <section className="section">
        <div className="stats-grid">
          <article className="stat-card">
            <p className="stat-value">{materials.length}</p>
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

        {materials.length === 0 ? (
          <p className="coming-soon">No materials yet.</p>
        ) : (
          <ul className="material-list">
            {materials.map((material) => (
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
                      {material.fileType} · {material.size}
                    </p>
                  </div>

                  <span className="material-when">{material.uploaded}</span>
                </button>
              </li>
            ))}
          </ul>
        )}
      </section>

      {selectedMaterial && (
        <section className="section">
          <h2 className="section-title">Material Preview</h2>

          <article className="material-preview">
            <p className="material-preview-filename">{selectedMaterial.filename}</p>

            <div className="material-preview-badges">
              <span className="material-preview-type">{selectedMaterial.fileType}</span>
              <span
                className={
                  selectedMaterial.status === "processing"
                    ? "material-status-badge material-status-processing"
                    : "material-status-badge material-status-ready"
                }
              >
                {selectedMaterial.status === "processing"
                  ? "Processing material…"
                  : "Ready"}
              </span>
            </div>

            <p className="material-preview-description">
              {selectedMaterial.description || "No description added yet."}
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