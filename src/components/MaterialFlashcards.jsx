import { useState } from "react";

// The Flashcards tab inside Material Preview. Five static sample cards —
// a real set generated from the material's actual content comes later.

const FLASHCARDS = [
  {
    id: 1,
    question: "What does active recall mean?",
    answer: "Testing yourself on material instead of just rereading it, which strengthens memory.",
  },
  {
    id: 2,
    question: "What is spaced repetition?",
    answer: "Reviewing information at gradually increasing intervals to improve long-term retention.",
  },
  {
    id: 3,
    question: "Why are summaries useful before a quiz?",
    answer: "They reinforce the key ideas so you can focus your study time on what matters most.",
  },
  {
    id: 4,
    question: "What's one advantage of flashcards?",
    answer: "They make it easy to quickly test your recall of individual facts or terms.",
  },
  {
    id: 5,
    question: "What should you do if you get a quiz question wrong?",
    answer: "Review that topic in the summary or material, then try the quiz again.",
  },
];

function MaterialFlashcards() {
  const [currentIndex, setCurrentIndex] = useState(0);
  const [isFlipped, setIsFlipped] = useState(false);

  const card = FLASHCARDS[currentIndex];
  const isFirstCard = currentIndex === 0;
  const isLastCard = currentIndex === FLASHCARDS.length - 1;

  function handlePrevious() {
    setCurrentIndex((current) => Math.max(current - 1, 0));
    setIsFlipped(false);
  }

  function handleNext() {
    setCurrentIndex((current) => Math.min(current + 1, FLASHCARDS.length - 1));
    setIsFlipped(false);
  }

  return (
    <div>
      <p className="flashcard-progress">
        Card {currentIndex + 1} of {FLASHCARDS.length}
      </p>

      <button
        type="button"
        className="flashcard"
        onClick={() => setIsFlipped((flipped) => !flipped)}
      >
        <span className="flashcard-label">{isFlipped ? "Answer" : "Question"}</span>
        <p className="flashcard-text">{isFlipped ? card.answer : card.question}</p>
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
    </div>
  );
}

export default MaterialFlashcards;