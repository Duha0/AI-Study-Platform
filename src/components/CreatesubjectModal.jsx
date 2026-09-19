import { useEffect, useRef, useState } from "react";

// A simple modal for creating a subject. It only collects data and hands it
// back to whoever opened it — `onCreate(name, description)` — the caller
// decides how to turn that into a full subject object.
//
// Closes on: the Cancel button, clicking the backdrop, or pressing Escape.

function CreateSubjectModal({ onClose, onCreate }) {
  const [name, setName] = useState("");
  const [description, setDescription] = useState("");
  const nameInputRef = useRef(null);

  // Put the cursor in the Name field as soon as the modal opens.
  useEffect(() => {
    nameInputRef.current?.focus();
  }, []);

  // Let Escape close the modal, same as the Cancel button.
  useEffect(() => {
    function handleKeyDown(event) {
      if (event.key === "Escape") {
        onClose();
      }
    }
    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [onClose]);

  function handleSubmit(event) {
    event.preventDefault();

    const trimmedName = name.trim();
    if (!trimmedName) {
      return; // The "required" attribute on the input covers the message.
    }

    onCreate(trimmedName, description.trim());
  }

  function handleBackdropClick(event) {
    // Only close if the backdrop itself was clicked, not the card inside it.
    if (event.target === event.currentTarget) {
      onClose();
    }
  }

  return (
    <div className="modal-backdrop" onClick={handleBackdropClick}>
      <div
        className="modal-card"
        role="dialog"
        aria-modal="true"
        aria-labelledby="create-subject-title"
      >
        <h2 id="create-subject-title" className="modal-title">
          Create Subject
        </h2>

        <form onSubmit={handleSubmit}>
          <div className="field">
            <label htmlFor="subject-name">Subject name</label>
            <input
              id="subject-name"
              type="text"
              value={name}
              onChange={(event) => setName(event.target.value)}
              placeholder="e.g. Cell Biology"
              ref={nameInputRef}
              required
            />
          </div>

          <div className="field">
            <label htmlFor="subject-description">Short description</label>
            <textarea
              id="subject-description"
              value={description}
              onChange={(event) => setDescription(event.target.value)}
              placeholder="What is this subject about?"
              rows={3}
            />
          </div>

          <div className="modal-actions">
            <button type="button" className="button-secondary" onClick={onClose}>
              Cancel
            </button>
            <button type="submit" className="button-primary">
              Create
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}

export default CreateSubjectModal;
