import { useEffect, useState } from "react";
import { resourcesApi } from "../lib/api";
import VoiceControls from "./VoiceControls";
import { t } from "../lib/i18n";

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
          return;
        }
        if (!cancelled) {
          setStatus("idle");
        }
      } catch {
        // 404 = none yet — the normal first-visit path.
        if (!cancelled) {
          setStatus("idle");
        }
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
        setError(apiError.message || t("summary.summary_generation_failed"));
        setStatus("idle");
      });
  }

  return (
    <div>
      <h3 className="summary-heading">{t("summary.summary")}</h3>

      {status === "loading" && <p className="resource-placeholder">{t("summary.checking_for_saved_summary")}</p>}

      {status === "idle" && (
        <p className="resource-placeholder">
          {t("summary.click_generate_summary")}
        </p>
      )}

      {status === "generating" && <p className="resource-placeholder">{t("summary.generating")}</p>}

      {error && <p className="form-error">{error}</p>}

      {status === "ready" && summary && (
        <>
          <VoiceControls
            label="summary"
            text={[summary.intro, ...(summary.points || [])].filter(Boolean).join(". ")}
          />
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
          {status === "ready" ? t("summary.regenerate_summary") : t("summary.generate_summary")}
        </button>
      </div>
    </div>
  );
}

export default MaterialSummary;
