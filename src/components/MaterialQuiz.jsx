import { useState } from "react";

// The Quiz tab inside Material Preview. Five static sample questions — a
// real quiz generated from the material's actual content comes later.

const QUESTIONS = [
  {
    id: 1,
    prompt: 'What does "PDF" stand for?',
    options: [
      { id: "a", text: "Portable Document Format" },
      { id: "b", text: "Personal Data File" },
      { id: "c", text: "Print Document Format" },
      { id: "d", text: "Public Document Function" },
    ],
    correctOptionId: "a",
  },
  {
    id: 2,
    prompt: "Which study technique involves testing yourself on material you've learned?",
    options: [
      { id: "a", text: "Passive rereading" },
      { id: "b", text: "Active recall" },
      { id: "c", text: "Highlighting" },
      { id: "d", text: "Skimming" },
    ],
    correctOptionId: "b",
  },
  {
    id: 3,
    prompt: "What is typically the first step in the Cornell note-taking method?",
    options: [
      { id: "a", text: "Summarizing at the bottom of the page" },
      { id: "b", text: "Dividing the page into sections" },
      { id: "c", text: "Writing keywords in the margin" },
      { id: "d", text: "Reviewing the notes" },
    ],
    correctOptionId: "b",
  },
  {
    id: 4,
    prompt: "Which of these best describes spaced repetition?",
    options: [
      { id: "a", text: "Reviewing material once and never again" },
      { id: "b", text: "Reviewing material at increasing intervals over time" },
      { id: "c", text: "Repeating the same page several times in one sitting" },
      { id: "d", text: "Studying only right before an exam" },
    ],
    correctOptionId: "b",
  },
  {
    id: 5,
    prompt: "What's a common benefit of using flashcards?",
    options: [
      { id: "a", text: "They eliminate the need to understand concepts" },
      { id: "b", text: "They help with quick recall of key facts" },
      { id: "c", text: "They replace textbooks entirely" },
      { id: "d", text: "They only work for visual learners" },
    ],
    correctOptionId: "b",
  },
];

// `latestScore` is the persisted score from the material itself (App.jsx
// state), e.g. { correct: 4, total: 5 } or null if never completed. It's
// what makes the score survive switching to Summary/Flashcards and back —
// this component gets unmounted when its tab isn't active, so anything
// only kept in its own local state would be lost on that switch.
// `onComplete(score)` reports a finished attempt back up so it can be saved.
function MaterialQuiz({ latestScore, onComplete }) {
  const [currentIndex, setCurrentIndex] = useState(0);
  const [selectedOptionId, setSelectedOptionId] = useState(null);
  const [score, setScore] = useState(0);
  const [isFinished, setIsFinished] = useState(false);

  const currentQuestion = QUESTIONS[currentIndex];
  const isLastQuestion = currentIndex === QUESTIONS.length - 1;

  function handleNext() {
    // Computed directly instead of read back from state, since setScore
    // is async — reading `score` here on the last question could still
    // see last render's value and report the wrong total.
    const isCorrect = selectedOptionId === currentQuestion.correctOptionId;
    const updatedScore = isCorrect ? score + 1 : score;
    setScore(updatedScore);

    if (isLastQuestion) {
      setIsFinished(true);
      onComplete({ correct: updatedScore, total: QUESTIONS.length });
    } else {
      setCurrentIndex((current) => current + 1);
      setSelectedOptionId(null);
    }
  }

  function handleTryAgain() {
    // This only resets the current attempt — it doesn't clear latestScore,
    // so the previous result stays visible until a new attempt finishes.
    setCurrentIndex(0);
    setSelectedOptionId(null);
    setScore(0);
    setIsFinished(false);
  }

  if (isFinished) {
    return (
      <div className="quiz-result">
        <p className="quiz-score">
          {score}/{QUESTIONS.length}
        </p>
        <p className="quiz-score-label">
          Nice work — review the material and try again anytime.
        </p>
        <button type="button" className="button-secondary" onClick={handleTryAgain}>
          Try Again
        </button>
      </div>
    );
  }

  return (
    <div>
      {latestScore && (
        <p className="quiz-latest-score">
          Latest Score: {latestScore.correct}/{latestScore.total}
        </p>
      )}

      <p className="quiz-progress">
        Question {currentIndex + 1} of {QUESTIONS.length}
      </p>
      <p className="quiz-question">{currentQuestion.prompt}</p>

      <div className="quiz-options">
        {currentQuestion.options.map((option) => (
          <button
            key={option.id}
            type="button"
            className={
              option.id === selectedOptionId
                ? "quiz-option quiz-option-selected"
                : "quiz-option"
            }
            onClick={() => setSelectedOptionId(option.id)}
          >
            {option.text}
          </button>
        ))}
      </div>

      <button
        type="button"
        className="button-primary"
        onClick={handleNext}
        disabled={selectedOptionId === null}
      >
        {isLastQuestion ? "Finish" : "Next"}
      </button>
    </div>
  );
}

export default MaterialQuiz;