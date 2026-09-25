import { useEffect, useState } from "react";
import { resourcesApi } from "../lib/api";

/* Summary tab inside Material Preview — real AI summaries via the backend.
 *
 * States: loading (checking for an existing summary) -> idle (none yet) ->
 * generating -> ready. Failures (AI not configured, AI error, no extracted
 * text) surface a clear message and keep the retry button available.
 */

function MaterialSummary({ materialId }) {
  const [status, setStatus] = useState("loading"); // loading | idle | generating | ready
  const [summary, setSummary] = useState(null);
  const [error, setError] = useState(null);

  // On mount: show an existing summary immediately if one was already
  // generated (the backend stores it per material).
  useEffect(() => {
    let cancelled = false;

    async function checkExisting() {
      try {
        const existing = await resourcesApi.getSummary(materialId);
        if (!cancelled && existing) {
          setSummary(existing);
          setStatus("ready");
        }
      } catch {
        // 404 = none yet — the normal first-visit path.
      }
    }

    checkExisting();
    return () => {
      cancelled = true;
    };
  }, [materialId]);

  function handleGenerate(regenerate = false) {
    setStatus("generating");
    setError(null);

    // Generation can take a while (the AI is reading the whole document).
    const generationPromise = resourcesApi.generateSummary(materialId, regenerate);
    const minDelay = new Promise((resolve) => setTimeout(resolve, 800));

    Promise.all([generationPromise, minDelay])
      .then(([data]) => {
        setSummary(data);
        setStatus("ready");
      })
      .catch((apiError) => {
        setError(apiError.message || "Summary generation failed. Please try again.");
        setStatus("idle");
      });
  }

  return (
    <div>
      <h3 className="summary-heading">Summary</h3>

      {status === "loading" && <p className="resource-placeholder">Checking for a saved summary…</p>}

      {status === "idle" && (
        <p className="resource-placeholder">
          Click Generate Summary to create a summary of this material.
        </p>
      )}

      {status === "generating" && <p className="resource-placeholder">Generating…</p>}

      {error && <p className="form-error">{error}</p>}

      {status === "ready" && summary && (
        <>
          <p className="summary-text">{summary.intro}</p>
          <ul className="summary-list">
            {(summary.points || []).map((point) => (
              <li key={point}>{point}</li>
            ))}
          </ul>
        </>
      )}

      <div className="summary-actions">
        <button
          type="button"
          className="button-secondary"
          onClick={() => handleGenerate(status === "ready")}
          disabled={status === "generating" || status === "loading"}
        >
          {status === "ready" ? "Regenerate Summary" : "Generate Summary"}
        </button>
      </div>
    </div>
  );
}

export default MaterialSummary;
