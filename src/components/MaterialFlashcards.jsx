import { useEffect, useState } from "react";
import { resourcesApi } from "../lib/api";

/* Flashcards tab — real AI-generated flashcards via the backend.
 * Flip/previous/next UX preserved.
 */

function MaterialFlashcards({ materialId }) {
  const [phase, setPhase] = useState("loading"); // loading | idle | generating | ready
  const [cards, setCards] = useState([]);
  const [error, setError] = useState(null);

  const [currentIndex, setCurrentIndex] = useState(0);
  const [isFlipped, setIsFlipped] = useState(false);

  // On mount: load existing cards if they were already generated.
  useEffect(() => {
    let cancelled = false;

    async function checkExisting() {
      try {
        const existing = await resourcesApi.getFlashcards(materialId);
        if (!cancelled && Array.isArray(existing) && existing.length > 0) {
          setCards(existing);
          setPhase("ready");
        }
      } catch {
        // 404 = none yet.
      }
    }

    checkExisting();
    return () => {
      cancelled = true;
    };
  }, [materialId]);

  async function handleGenerate(regenerate = false) {
    setPhase("generating");
    setError(null);
    try {
      const data = await resourcesApi.generateFlashcards(materialId, regenerate);
      setCards(data);
      setCurrentIndex(0);
      setIsFlipped(false);
      setPhase("ready");
    } catch (apiError) {
      setError(apiError.message || "Flashcard generation failed. Please try again.");
      setPhase(cards.length > 0 ? "ready" : "idle");
    }
  }

  const card = cards[currentIndex];
  const isFirstCard = currentIndex === 0;
  const isLastCard = currentIndex === cards.length - 1;

  function handlePrevious() {
    setCurrentIndex((current) => Math.max(current - 1, 0));
    setIsFlipped(false);
  }

  function handleNext() {
    setCurrentIndex((current) => Math.min(current + 1, cards.length - 1));
    setIsFlipped(false);
  }

  if (phase === "loading") {
    return (
      <div>
        <h3 className="summary-heading">Flashcards</h3>
        <p className="resource-placeholder">Checking for saved flashcards…</p>
      </div>
    );
  }

  if (phase === "idle" || phase === "generating") {
    return (
      <div>
        <h3 className="summary-heading">Flashcards</h3>
        {error && <p className="form-error">{error}</p>}
        {phase === "generating" ? (
          <p className="resource-placeholder">Creating your flashcards…</p>
        ) : (
          <p className="resource-placeholder">
            Click Generate Flashcards to create a set from this material.
          </p>
        )}
        <button
          type="button"
          className="button-secondary"
          onClick={() => handleGenerate(false)}
          disabled={phase === "generating"}
        >
          Generate Flashcards
        </button>
      </div>
    );
  }

  return (
    <div>
      <p className="flashcard-progress">
        Card {currentIndex + 1} of {cards.length}
      </p>

      <button
        type="button"
        className="flashcard"
        onClick={() => setIsFlipped((flipped) => !flipped)}
      >
        <span className="flashcard-label">{isFlipped ? "Answer" : "Question"}</span>
        <p className="flashcard-text">{isFlipped ? card?.back : card?.front}</p>
        <span className="flashcard-hint">Click to flip</span>
      </button>

      <div className="flashcard-controls">
        <button
          type="button"
          className="button-secondary"
          onClick={handlePrevious}
          disabled={isFirstCard}
        >
          Previous
        </button>
        <button
          type="button"
          className="button-secondary"
          onClick={handleNext}
          disabled={isLastCard}
        >
          Next
        </button>
      </div>

      <div className="flashcard-controls">
        <button
          type="button"
          className="link-button"
          onClick={() => handleGenerate(true)}
        >
          Regenerate flashcards
        </button>
      </div>
    </div>
  );
}

export default MaterialFlashcards;
