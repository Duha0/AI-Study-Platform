// One subject card.
// - Dashboard preview: neither prop is passed, renders as a plain, static card.
// - Subjects page: both props are passed — `onOpen` opens Subject Details,
//   `onDelete` removes the subject (after the caller confirms).
//
// `subject.description` is optional — sample subjects don't have one and
// show `lastOpened` instead; subjects created through the modal always have
// a description, so that takes priority when present.

function SubjectCard({ subject, onOpen, onDelete }) {
  const metaText = subject.description ? subject.description : subject.lastOpened;

  // Progress is derived from the materials themselves — not a stored
  // number — so it can never drift out of sync with what's actually
  // marked Completed on the Materials list.
  const totalMaterials = subject.materials.length;
  const completedMaterials = subject.materials.filter(
    (material) => material.completionStatus === "completed"
  ).length;
  const completionPercent =
    totalMaterials === 0 ? 0 : Math.round((completedMaterials / totalMaterials) * 100);

  const cardBody = (
    <>
      <div className="subject-top">
        <span className="subject-tile" style={{ backgroundColor: subject.color }}>
          {subject.initial}
        </span>
        <span className="subject-count">{totalMaterials} materials</span>
      </div>

      <h3 className="subject-name">{subject.name}</h3>
      <p className="subject-meta">{metaText}</p>

      <div className="subject-bar">
        <div
          className="subject-bar-fill"
          style={{
            width: completionPercent + "%",
            backgroundColor: subject.color,
          }}
        />
      </div>
      <p className="subject-percent">
        {completedMaterials}/{totalMaterials} materials completed
      </p>
    </>
  );

  // Dashboard preview: no interaction, same markup as before.
  if (!onOpen && !onDelete) {
    return <article className="subject-card">{cardBody}</article>;
  }

  // Subjects page: the card itself is a button (opens details), and the
  // delete button is a separate element layered on top of it. They're
  // siblings, not one nested inside the other — browsers don't allow a
  // <button> inside a <button>, and nesting them would also make a click
  // on Delete accidentally open the card underneath it too.
  return (
    <div className="subject-card-shell">
      <button
        type="button"
        className="subject-card subject-card-clickable"
        onClick={onOpen}
      >
        {cardBody}
      </button>

      {onDelete && (
        <button
          type="button"
          className="subject-delete-button"
          onClick={onDelete}
          aria-label={`Delete ${subject.name}`}
          title="Delete subject"
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
      )}
    </div>
  );
}

export default SubjectCard;