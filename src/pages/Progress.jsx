import { useEffect, useState } from "react";
import { progressApi } from "../lib/api";

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
          setError(apiError.message || "Could not load your progress. Please try again.");
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
          <h1 className="welcome-title">Progress</h1>
        </header>
        <p className="coming-soon">Loading your progress…</p>
      </>
    );
  }

  if (error) {
    return (
      <>
        <header className="welcome">
          <h1 className="welcome-title">Progress</h1>
        </header>
        <p className="form-error">{error}</p>
        <button type="button" className="button-secondary" onClick={() => window.location.reload()}>
          Try again
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
          <h1 className="welcome-title">Progress</h1>
          <p className="welcome-subtitle">
            How your studying is going, across every subject.
          </p>
        </div>
      </header>

      <section className="section">
        <div className="stats-grid">
          <article className="stat-card">
            <p className="stat-value">{totals?.total_subjects ?? 0}</p>
            <p className="stat-label">Subjects</p>
          </article>
          <article className="stat-card">
            <p className="stat-value">{totals?.total_materials ?? 0}</p>
            <p className="stat-label">Materials</p>
          </article>
          <article className="stat-card">
            <p className="stat-value">{totals?.completed_materials ?? 0}</p>
            <p className="stat-label">Completed</p>
          </article>
          <article className="stat-card">
            <p className="stat-value">{totals?.overall_percent ?? 0}%</p>
            <p className="stat-label">Overall Progress</p>
          </article>
          <article className="stat-card">
            <p className="stat-value">{totals?.quiz_attempts ?? 0}</p>
            <p className="stat-label">Quiz Attempts</p>
          </article>
          <article className="stat-card">
            <p className="stat-value">
              {totals?.average_score_percent != null ? `${totals.average_score_percent}%` : "—"}
            </p>
            <p className="stat-label">Avg. Quiz Score</p>
          </article>
        </div>
      </section>

      <section className="section">
        <h2 className="section-title">By Subject</h2>

        {subjectRows.length === 0 ? (
          <div className="empty-state">
            <h2 className="empty-state-title">Nothing to track yet</h2>
            <p className="empty-state-text">
              Create a subject and upload a material to start building progress.
            </p>
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
                        {row.percent}% complete
                      </span>
                    </div>
                    <p className="material-meta">
                      {row.completed_materials}/{row.total_materials} materials completed ·{" "}
                      {row.quiz_attempts} quiz {row.quiz_attempts === 1 ? "attempt" : "attempts"}
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
