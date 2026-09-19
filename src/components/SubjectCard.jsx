// One subject card. Used on both the Dashboard (a short preview) and the
// Subjects page (the full list), so it lives here instead of inside a page.
//
// `subject.description` is optional — sample subjects don't have one and
// show `lastOpened` instead; subjects created through the modal always have
// a description, so that takes priority when present.

function SubjectCard({ subject }) {
  const metaText = subject.description ? subject.description : subject.lastOpened;

  return (
    <article className="subject-card">
      <div className="subject-top">
        <span className="subject-tile" style={{ backgroundColor: subject.color }}>
          {subject.initial}
        </span>
        <span className="subject-count">{subject.materialCount} materials</span>
      </div>

      <h3 className="subject-name">{subject.name}</h3>
      <p className="subject-meta">{metaText}</p>

      <div className="subject-bar">
        <div
          className="subject-bar-fill"
          style={{
            width: subject.progress + "%",
            backgroundColor: subject.color,
          }}
        />
      </div>
      <p className="subject-percent">{subject.progress}% complete</p>
    </article>
  );
}

export default SubjectCard;
