// The Subject Details page. It's opened by clicking a card on the Subjects
// page and shows one subject's stats plus its materials.
//
// Materials are static sample data for now — the same short list is shown
// for every subject, since there's no backend yet to store real uploads.

const sampleMaterials = [
  {
    id: 1,
    filename: "Lecture Notes - Week 1.pdf",
    pages: 8,
    size: "1.2 MB",
    uploaded: "Uploaded 3 days ago",
  },
  {
    id: 2,
    filename: "Chapter Summary.pdf",
    pages: 4,
    size: "640 KB",
    uploaded: "Uploaded 5 days ago",
  },
  {
    id: 3,
    filename: "Practice Problem Set.pdf",
    pages: 12,
    size: "2.1 MB",
    uploaded: "Uploaded 1 week ago",
  },
];

function SubjectDetails({ subject, onBack }) {
  function handleUploadClick() {
    // No backend yet — this is where the real upload flow will go.
    alert("Uploading isn't wired up yet.");
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
            <li key={material.id} className="material-row">
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
            </li>
          ))}
        </ul>
      </section>
    </>
  );
}

export default SubjectDetails;