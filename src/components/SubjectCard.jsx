// One subject card. Used on the Dashboard (a short preview, not clickable)
// and the Subjects page (the full list, clickable — opens Subject Details).
//
// `subject.description` is optional — sample subjects don't have one and
// show `lastOpened` instead; subjects created through the modal always have
// a description, so that takes priority when present.

function SubjectCard({ subject, onClick }) {
  const metaText = subject.description ? subject.description : subject.lastOpened;

  const cardContent = (
    <>
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
    </>
  );

  // With an onClick, render a real <button> so it's clickable and usable
  // from the keyboard. Without one (the Dashboard preview), render a plain
  // <article> — the card is just for display there.
  if (onClick) {
    return (
      <button
        type="button"
        className="subject-card subject-card-clickable"
        onClick={onClick}
      >
        {cardContent}
      </button>
    );
  }

  return <article className="subject-card">{cardContent}</article>;
}

export default SubjectCard;