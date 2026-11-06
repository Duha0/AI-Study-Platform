import { useEffect, useState } from "react";
import { quizzesApi } from "../lib/api";
import VoiceControls from "./VoiceControls";
import { t } from "../lib/i18n";

/* Quiz tab — real quizzes generated from the material, scored on the backend.
 *
 * The server never sends correct answers until an attempt is submitted, so
 * there is nothing to cheat with in the network tab. UX preserved: one
 * question at a time, select, next, final score, try again.
 *
 * `latestScore` (from the material's subject data) seeds the "Latest Score"
 * banner before this quiz's own attempts load.
 */

function MaterialQuiz({ materialId, latestScore, onComplete, language = "en" }) {
  const [phase, setPhase] = useState("loading"); // loading | idle | generating | taking | finished | error
  const [quiz, setQuiz] = useState(null);
  const [attempt, setAttempt] = useState(null);
  const [error, setError] = useState(null);

  const [currentIndex, setCurrentIndex] = useState(0);
  const [selectedOptionId, setSelectedOptionId] = useState(null);
  const [answers, setAnswers] = useState([]);

  // On mount, show an already-generated quiz instead of asking to regenerate.
  useEffect(() => {
    let cancelled = false;

    async function checkExisting() {
      try {
        const existing = await quizzesApi.getQuiz(materialId);
        if (!cancelled && existing) {
          setQuiz(existing);
          if (existing.latest_attempt) setAttempt(existing.latest_attempt);
          setPhase("taking");
          return;
        }
        if (!cancelled) {
          setPhase("idle");
        }
      } catch {
        // 404 = no quiz yet — normal first-visit path.
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
      const data = await quizzesApi.generateQuiz(materialId, regenerate, language);
      setQuiz(data);
      setAttempt(data.latest_attempt || null);
      setCurrentIndex(0);
      setSelectedOptionId(null);
      setAnswers([]);
      setPhase("taking");
    } catch (apiError) {
      setError(apiError.message || t("quiz.could_not_submit"));
      setPhase("idle");
    }
  }

  const currentQuestion = quiz?.questions?.[currentIndex];
  const isLastQuestion = quiz ? currentIndex === quiz.questions.length - 1 : false;

  function handleSelect(optionId) {
    setSelectedOptionId(optionId);
    // Record the choice for this question immediately (revisiting later in
    // the flow isn't possible — the UI is strictly forward — but this keeps
    // the answers array aligned with the questions list).
    setAnswers((current) => {
      const next = current.filter((a) => a.question_id !== currentQuestion?.id);
      return [...next, { question_id: currentQuestion?.id, selected_option_id: optionId }];
    });
  }

  function handleNext() {
    if (!currentQuestion || selectedOptionId === null) return;

    if (isLastQuestion) {
      submitAnswers();
    } else {
      setCurrentIndex((current) => current + 1);
      // Preselect this question's previously recorded answer if any.
      const existing = answers.find(
        (a) => a.question_id === quiz.questions[currentIndex + 1]?.id
      );
      setSelectedOptionId(existing ? existing.selected_option_id : null);
    }
  }

  async function submitAnswers() {
    setPhase("submitting");
    setError(null);
    try {
      const result = await quizzesApi.submitQuiz(quiz.id, answers);
      setAttempt(result);
      setPhase("finished");
      // Notify App so the subject's stats refresh (progress/completion).
      if (onComplete) onComplete(result);
    } catch (apiError) {
      setError(apiError.message || t("quiz.could_not_submit"));
      setPhase("taking");
    }
  }

  function handleTryAgain() {
    // Reset the attempt flow but keep the fetched quiz and past result.
    setCurrentIndex(0);
    setSelectedOptionId(null);
    setAnswers([]);
    setPhase("taking");
  }

  if (phase === "loading") {
    return (
      <div>
        <h3 className="summary-heading">{t("quiz.quiz")}</h3>
        <p className="resource-placeholder">{t("quiz.checking_for_saved_quiz")}</p>
      </div>
    );
  }

  if (phase === "idle" || phase === "generating") {
    return (
      <div>
        <h3 className="summary-heading">{t("quiz.quiz")}</h3>
        {latestScore && (
          <p className="quiz-latest-score">
            {t("quiz.latest_score", { score: latestScore.last_score ?? 0, total: latestScore.last_total ?? 0 })}
          </p>
        )}
        {error && <p className="form-error">{error}</p>}
        {phase === "generating" ? (
          <p className="resource-placeholder">{t("quiz.generating_your_quiz")}</p>
        ) : (
          <p className="resource-placeholder">{t("quiz.click_generate_quiz")}</p>
        )}
        <button
          type="button"
          className="button-primary"
          onClick={() => handleGenerate(false)}
          disabled={phase === "generating"}
        >
          {t("quiz.generate_quiz")}
        </button>
      </div>
    );
  }

  if (phase === "finished" && attempt) {
    return (
      <div className="quiz-result">
        <p className="quiz-score">
          {attempt.score}/{attempt.total}
        </p>
        <p className="quiz-score-label">{t("quiz.nice_work")}</p>

        <div className="quiz-review">
          {(attempt.details || []).map((detail, index) => (
            <div key={detail.questionId} className="quiz-review-row">
              <p className="quiz-review-prompt">
                {index + 1}. {detail.correct ? "✓" : "✗"} {quiz?.questions?.find((q) => q.id === detail.questionId)?.prompt || ""}
              </p>
              <p className="quiz-review-detail">
                {t("quiz.you_chose")} <strong>{detail.selectedId}</strong>
                {!detail.correct && (
                  <>
                    {" "}
                    — {t("quiz.correct_answer")}: <strong>{detail.correctOptionId}</strong>
                  </>
                )}
                {detail.explanation ? ` — ${detail.explanation}` : ""}
              </p>
            </div>
          ))}
        </div>

        <button type="button" className="button-secondary" onClick={handleTryAgain}>
          {t("quiz.try_again")}
        </button>
      </div>
    );
  }

  // phase === "taking" (or "submitting")
  return (
    <div>
      {attempt && (
        <p className="quiz-latest-score">
          {t("quiz.latest_score", { score: attempt.score, total: attempt.total })}
        </p>
      )}
      {!attempt && latestScore && (
        <p className="quiz-latest-score">
          {t("quiz.latest_score", { score: latestScore.last_score ?? 0, total: latestScore.last_total ?? 0 })}
        </p>
      )}
      {error && <p className="form-error">{error}</p>}

      <p className="quiz-progress">
        {t("quiz.question_{n}_of_{total}", { n: currentIndex + 1, total: quiz.questions.length })}
      </p>
      <p className="quiz-question">{currentQuestion?.prompt}</p>
      {currentQuestion?.prompt && (
        <VoiceControls label="this quiz question" text={currentQuestion.prompt} />
      )}

      <div className="quiz-options">
        {(currentQuestion?.options || []).map((option) => (
          <button
            key={option.id}
            type="button"
            className={
              option.id === selectedOptionId
                ? "quiz-option quiz-option-selected"
                : "quiz-option"
            }
            onClick={() => handleSelect(option.id)}
            disabled={phase === "submitting"}
          >
            {option.text}
          </button>
        ))}
      </div>

      <button
        type="button"
        className="button-primary"
        onClick={handleNext}
        disabled={selectedOptionId === null || phase === "submitting"}
      >
        {phase === "submitting"
          ? t("quiz.scoring")
          : isLastQuestion
            ? t("quiz.finish")
            : t("quiz.next")}
      </button>
    </div>
  );
}

export default MaterialQuiz;
