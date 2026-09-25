// One subject card.
// - Dashboard preview: no props beyond `subject`, renders as a plain card.
// - Subjects page: `onOpen`/`onDelete` make it interactive.
//
// Data comes from the backend (SubjectOut): material_count and
// completed_materials are computed server-side, so this component only
// renders numbers — no progress math lives here anymore.

function SubjectCard({ subject, onOpen, onDelete }) {
  const metaText = subject.description || "Tap to open this subject";

  const totalMaterials = subject.material_count ?? 0;
  const completedMaterials = subject.completed_materials ?? 0;
  const completionPercent =
    totalMaterials === 0
      ? 0
      : Math.round((completedMaterials / totalMaterials) * 100);

  const cardBody = (
    <>
      <div className="subject-top">
        <span className="subject-tile" style={{ backgroundColor: subject.color }}>
          {subject.name?.charAt(0).toUpperCase() || "?"}
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

  // Dashboard preview: no interaction.
  if (!onOpen && !onDelete) {
    return <article className="subject-card">{cardBody}</article>;
  }

  // Subjects page: the card itself is a button (opens details); the delete
  // button is a sibling overlay, never nested (browsers forbid button-in-button).
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
