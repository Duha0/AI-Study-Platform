import { useEffect, useState } from "react";

// The Summary tab inside Material Preview. There's no AI backend yet, so
// clicking Generate just waits a moment and then shows a static, sample
// summary — this is what a real generated summary will slot into later.

const GENERATING_DELAY_MS = 1200;

const SAMPLE_SUMMARY = {
  intro:
    "This material covers the core ideas needed to build a working understanding of the topic, moving from foundational definitions to more advanced applications.",
  points: [
    "Key definitions and terminology, introduced early to establish a shared vocabulary.",
    "Step-by-step walkthroughs of the main processes or mechanisms involved.",
    "Common mistakes and misconceptions, with guidance on how to avoid them.",
    "A few worked examples that mirror the kinds of problems you'll see in the quiz.",
    "A short recap connecting this material back to what came before it.",
  ],
};

function MaterialSummary() {
  // "idle" | "generating" | "ready"
  const [status, setStatus] = useState("idle");

  // The generation delay is a timer, and this component unmounts whenever
  // its tab is switched or a different material is opened (the panel is
  // keyed by material id). Running the timer through an effect with a
  // cleanup means React cancels it on unmount instead of a "setState on an
  // unmounted component" firing afterward.
  useEffect(() => {
    if (status !== "generating") {
      return;
    }

    const timer = setTimeout(() => setStatus("ready"), GENERATING_DELAY_MS);
    return () => clearTimeout(timer);
  }, [status]);

  function handleGenerateClick() {
    setStatus("generating");
  }

  return (
    <div>
      <h3 className="summary-heading">Summary</h3>

      {status === "idle" && (
        <p className="resource-placeholder">
          Click Generate Summary to create a summary of this material.
        </p>
      )}

      {status === "generating" && (
        <p className="resource-placeholder">Generating…</p>
      )}

      {status === "ready" && (
        <>
          <p className="summary-text">{SAMPLE_SUMMARY.intro}</p>
          <ul className="summary-list">
            {SAMPLE_SUMMARY.points.map((point) => (
              <li key={point}>{point}</li>
            ))}
          </ul>
        </>
      )}

      <div className="summary-actions">
        <button
          type="button"
          className="button-secondary"
          onClick={handleGenerateClick}
          disabled={status === "generating"}
        >
          {status === "ready" ? "Regenerate Summary" : "Generate Summary"}
        </button>
      </div>
    </div>
  );
}

export default MaterialSummary;