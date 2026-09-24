import { useEffect, useRef, useState } from "react";
import MaterialSummary from "../components/MaterialSummary";
import MaterialQuiz from "../components/MaterialQuiz";
import MaterialFlashcards from "../components/MaterialFlashcards";

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

// Display labels for each material's completionStatus.
const COMPLETION_LABELS = {
  "not-started": "Not Started",
  "in-progress": "In Progress",
  completed: "Completed",
};

function SubjectDetails({
  subject,
  onBack,
  onAddMaterial,
  onDeleteMaterial,
  onUpdateMaterialStatus,
  onMarkMaterialInProgress,
  onCompleteMaterialQuiz,
}) {
  const [selectedMaterialId, setSelectedMaterialId] = useState(null);
  const [activeResourceTab, setActiveResourceTab] = useState("summary");
  const fileInputRef = useRef(null);

  // Derived before any early return: the processing effect below and the
  // JSX further down both read these, and the effect must see variables
  // declared above it. Plain derivations are safe here — `subject &&`
  // short-circuits, so a missing subject just yields empty values.
  const materials = (subject && subject.materials) || [];
  const selectedMaterial = materials.find(
    (material) => material.id === selectedMaterialId
  );

  // Simulates "processing" a newly uploaded file. While the selected
  // material is still marked "processing", wait a moment and then flip it
  // to "ready". This is the only faked part of upload — the file itself,
  // its name, and its size are all real, just not sent anywhere.
  //
  // Hooks must run in the same order on every render, so this effect sits
  // ABOVE the `if (!subject)` early return below — calling hooks after a
  // conditional return is a React error even when the guard rarely trips.
  useEffect(() => {
    if (subject && selectedMaterial && selectedMaterial.status === "processing") {
      const timer = setTimeout(() => {
        onUpdateMaterialStatus(subject.id, selectedMaterial.id, "ready");
      }, PROCESSING_DELAY_MS);

      return () => clearTimeout(timer);
    }
  }, [subject, selectedMaterial, onUpdateMaterialStatus]);

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

  // Drives the "Materials completed" stat below — calculated fresh on every
  // render from the materials themselves, never stored as its own number.
  const completedCount = materials.filter(
    (material) => material.completionStatus === "completed"
  ).length;

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
      completionStatus: "not-started",
      quizScore: null,
    };

    onAddMaterial(subject.id, newMaterial);
    setSelectedMaterialId(newMaterial.id);
    setActiveResourceTab("summary");
  }

  function handleSelectMaterial(material) {
    setSelectedMaterialId(material.id);
    setActiveResourceTab("summary"); // always start a newly opened material on Summary
    onMarkMaterialInProgress(subject.id, material.id);
  }

  function handleDeleteMaterial(material) {
    const confirmed = window.confirm(
      `Delete "${material.filename}"? This can't be undone.`
    );
    if (!confirmed) {
      return; // Cancel — nothing changes
    }

    onDeleteMaterial(subject.id, material.id);

    // Clear the selection if the deleted material was the one open, so the
    // preview below doesn't keep referencing a material that no longer
    // exists.
    if (material.id === selectedMaterialId) {
      setSelectedMaterialId(null);
    }
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
            <p className="stat-value">
              {completedCount}/{materials.length}
            </p>
            <p className="stat-label">Materials completed</p>
          </article>
        </div>
      </section>

      <section className="section">
        <h2 className="section-title">Materials</h2>

        {materials.length === 0 ? (
          <div className="empty-state">
            <h2 className="empty-state-title">No study materials yet</h2>
            <p className="empty-state-text">Upload a PDF to start learning.</p>
            <button type="button" className="button-primary" onClick={handleUploadClick}>
              Upload Material
            </button>
          </div>
        ) : (
          <ul className="material-list">
            {materials.map((material) => (
              <li key={material.id} className="material-row-shell">
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
                    <div className="material-title-row">
                      <p className="material-title">{material.filename}</p>
                      <span
                        className={
                          material.status === "processing"
                            ? "material-status-badge material-status-processing"
                            : "material-status-badge material-status-ready"
                        }
                      >
                        {material.status === "processing" ? "Processing" : "Ready"}
                      </span>
                      <span
                        className={`completion-badge completion-${material.completionStatus || "not-started"}`}
                      >
                        {COMPLETION_LABELS[material.completionStatus] || COMPLETION_LABELS["not-started"]}
                      </span>
                    </div>
                    <p className="material-meta">
                      {material.fileType} · {material.size}
                    </p>
                  </div>

                  <span className="material-when">{material.uploaded}</span>
                </button>

                <button
                  type="button"
                  className="material-delete-button"
                  onClick={() => handleDeleteMaterial(material)}
                  aria-label={`Delete ${material.filename}`}
                  title="Delete material"
                >
                  <svg
                    viewBox="0 0 24 24"
                    fill="none"
                    stroke="currentColor"
                    strokeWidth="1.7"
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    aria-hidden="true"
                  >
                    <path d="M3 6h18M8 6V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2m-1 0v14a2 2 0 0 1-2 2H8a2 2 0 0 1-2-2V6h12z" />
                  </svg>
                </button>
              </li>
            ))}
          </ul>
        )}
      </section>

      {!selectedMaterial && materials.length > 0 && (
        <section className="section">
          <div className="empty-state">
            <h2 className="empty-state-title">Select a material</h2>
            <p className="empty-state-text">
              Choose a material from the list above to see its preview and
              open its Summary, Quiz, or Flashcards.
            </p>
          </div>
        </section>
      )}

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

            {/* These three buttons double as tabs: the active one is styled
                as the primary button, the other two as secondary. Clicking
                one just switches which resource panel is shown below —
                nothing here calls an AI API. */}
            <div className="material-preview-actions">
              <button
                type="button"
                className={
                  activeResourceTab === "summary" ? "button-primary" : "button-secondary"
                }
                onClick={() => setActiveResourceTab("summary")}
              >
                Generate Summary
              </button>
              <button
                type="button"
                className={
                  activeResourceTab === "quiz" ? "button-primary" : "button-secondary"
                }
                onClick={() => setActiveResourceTab("quiz")}
              >
                Generate Quiz
              </button>
              <button
                type="button"
                className={
                  activeResourceTab === "flashcards" ? "button-primary" : "button-secondary"
                }
                onClick={() => setActiveResourceTab("flashcards")}
              >
                Flashcards
              </button>
            </div>

            {/* Keyed by the material's id so switching to a different
                material remounts whichever panel is showing — that resets
                its internal state (quiz progress, flipped card, etc.)
                instead of carrying it over from the previous material. */}
            <div className="resource-panel">
              {activeResourceTab === "summary" && (
                <MaterialSummary key={selectedMaterial.id} />
              )}
              {activeResourceTab === "quiz" && (
                <MaterialQuiz
                  key={selectedMaterial.id}
                  latestScore={selectedMaterial.quizScore}
                  onComplete={(score) =>
                    onCompleteMaterialQuiz(subject.id, selectedMaterial.id, score)
                  }
                />
              )}
              {activeResourceTab === "flashcards" && (
                <MaterialFlashcards key={selectedMaterial.id} />
              )}
            </div>
          </article>
        </section>
      )}
    </>
  );
}

export default SubjectDetails;