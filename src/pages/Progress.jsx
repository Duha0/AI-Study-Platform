import { useEffect, useState } from "react";
import { progressApi } from "../lib/api";
import { t } from "../lib/i18n";

/* Progress page — real, backend-computed stats.
 *
 * All math lives on the server; this page renders the ProgressOut response
 * and handles loading/error states. Refreshing, logging out, and closing
 * the browser don't affect it: it's stored in the database.
 */

function Progress() {
  const [progress, setProgress] = useState(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    let cancelled = false;

    async function load() {
      setIsLoading(true);
      setError(null);
      try {
        const data = await progressApi.getProgress();
        if (!cancelled) setProgress(data);
      } catch (apiError) {
        if (!cancelled) {
          setError(apiError.message || t("progress.loading_your_progress"));
        }
      } finally {
        if (!cancelled) setIsLoading(false);
      }
    }

    load();
    return () => {
      cancelled = true;
    };
  }, []);

  if (isLoading) {
    return (
      <>
        <header className="welcome">
          <h1 className="welcome-title">{t("progress.progress")}</h1>
        </header>
        <p className="coming-soon">{t("progress.loading_your_progress")}</p>
      </>
    );
  }

  if (error) {
    return (
      <>
        <header className="welcome">
          <h1 className="welcome-title">{t("progress.progress")}</h1>
        </header>
        <p className="form-error">{error}</p>
        <button type="button" className="button-secondary" onClick={() => window.location.reload()}>
          {t("common.try_again")}
        </button>
      </>
    );
  }

  const totals = progress?.totals;
  const subjectRows = progress?.subjects || [];

  return (
    <>
      <header className="welcome">
        <div>
          <h1 className="welcome-title">{t("progress.progress")}</h1>
          <p className="welcome-subtitle">
            {t("progress.how_your_studying_is_going")}
          </p>
        </div>
      </header>

      <section className="section">
        <div className="stats-grid">
          <article className="stat-card">
            <p className="stat-value">{totals?.total_subjects ?? 0}</p>
            <p className="stat-label">{t("progress.subjects")}</p>
          </article>
          <article className="stat-card">
            <p className="stat-value">{totals?.total_materials ?? 0}</p>
            <p className="stat-label">{t("progress.materials")}</p>
          </article>
          <article className="stat-card">
            <p className="stat-value">{totals?.completed_materials ?? 0}</p>
            <p className="stat-label">{t("progress.completed")}</p>
          </article>
          <article className="stat-card">
            <p className="stat-value">{totals?.overall_percent ?? 0}%</p>
            <p className="stat-label">{t("stats.overall_progress")}</p>
          </article>
          <article className="stat-card">
            <p className="stat-value">{totals?.quiz_attempts ?? 0}</p>
            <p className="stat-label">{t("progress.quiz_attempts")}</p>
          </article>
          <article className="stat-card">
            <p className="stat-value">
              {totals?.average_score_percent != null ? `${totals.average_score_percent}%` : "—"}
            </p>
            <p className="stat-label">{t("progress.avg_quiz_score")}</p>
          </article>
        </div>
      </section>

      <section className="section">
        <h2 className="section-title">{t("progress.by_subject")}</h2>

        {subjectRows.length === 0 ? (
          <div className="empty-state">
            <h2 className="empty-state-title">{t("progress.nothing_to_track_yet")}</h2>
            <p className="empty-state-text">{t("progress.empty_desc")}</p>
          </div>
        ) : (
          <ul className="material-list">
            {subjectRows.map((row) => (
              <li key={row.subject_id} className="material-row-shell">
                <div className="material-row">
                  <span className="material-dot" />
                  <div className="material-text">
                    <div className="material-title-row">
                      <p className="material-title">{row.subject_name}</p>
                      <span className="completion-badge completion-in-progress">
                        {row.percent}% {t("progress.complete")}
                      </span>
                    </div>
                    <p className="material-meta">
                      {row.completed_materials}/{row.total_materials} {t("stats.materials_completed")} ·{" "}
                      {row.quiz_attempts} {t(row.quiz_attempts === 1 ? "progress.attempt" : "progress.attempts")}
                      {row.average_score_percent != null
                        ? ` · avg score ${row.average_score_percent}%`
                        : ""}
                    </p>
                  </div>
                </div>
              </li>
            ))}
          </ul>
        )}
      </section>
    </>
  );
}

export default Progress;
