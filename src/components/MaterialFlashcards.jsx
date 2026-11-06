import { useEffect, useState } from "react";
import { resourcesApi } from "../lib/api";
import VoiceControls from "./VoiceControls";
import { t } from "../lib/i18n";

/* Flashcards tab — real AI-generated flashcards via the backend.
 * Flip/previous/next UX preserved.
 */

function MaterialFlashcards({ materialId, language = "en" }) {
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
          return;
        }
        if (!cancelled) {
          setPhase("idle");
        }
      } catch {
        // 404 = none yet.
        if (!cancelled) {
          setPhase("idle");
        }
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
      const data = await resourcesApi.generateFlashcards(materialId, regenerate, language);
      setCards(data);
      setCurrentIndex(0);
      setIsFlipped(false);
      setPhase("ready");
    } catch (apiError) {
      setError(apiError.message || t("flashcards.flashcard_generation_failed"));
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
        <h3 className="summary-heading">{t("flashcards.flashcards")}</h3>
        <p className="resource-placeholder">{t("flashcards.checking_for_saved_flashcards")}</p>
      </div>
    );
  }

  if (phase === "idle" || phase === "generating") {
    return (
      <div>
        <h3 className="summary-heading">{t("flashcards.flashcards")}</h3>
        {error && <p className="form-error">{error}</p>}
        {phase === "generating" ? (
          <p className="resource-placeholder">{t("flashcards.creating_your_flashcards")}</p>
        ) : (
          <p className="resource-placeholder">{t("flashcards.click_generate_flashcards")}</p>
        )}
        <button
          type="button"
          className="button-secondary"
          onClick={() => handleGenerate(false)}
          disabled={phase === "generating"}
        >
          {t("flashcards.generate_flashcards")}
        </button>
      </div>
    );
  }

  return (
    <div>
      <p className="flashcard-progress">
        {t("flashcards.card_{n}_of_{total}", { n: currentIndex + 1, total: cards.length })}
      </p>

      <button
        type="button"
        className="flashcard"
        onClick={() => setIsFlipped((flipped) => !flipped)}
      >
        <span className="flashcard-label">{isFlipped ? t("flashcards.answer") : t("flashcards.question")}</span>
        <p className="flashcard-text">{isFlipped ? card?.back : card?.front}</p>
        <span className="flashcard-hint">{t("flashcards.click_to_flip")}</span>
      </button>

      {card && (
        <VoiceControls
          label={isFlipped ? "flashcard answer" : "flashcard question"}
          text={isFlipped ? card.back : card.front}
        />
      )}

      <div className="flashcard-controls">
        <button
          type="button"
          className="button-secondary"
          onClick={handlePrevious}
          disabled={isFirstCard}
        >
          {t("flashcards.previous")}
        </button>
        <button
          type="button"
          className="button-secondary"
          onClick={handleNext}
          disabled={isLastCard}
        >
          {t("flashcards.next")}
        </button>
      </div>

      <div className="flashcard-controls">
        <button
          type="button"
          className="link-button"
          onClick={() => handleGenerate(true)}
        >
          {t("flashcards.regenerate_flashcards")}
        </button>
      </div>
    </div>
  );
}

export default MaterialFlashcards;
