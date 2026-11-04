import { useCallback, useEffect, useRef, useState } from "react";
import MaterialSummary from "../components/MaterialSummary";
import MaterialQuiz from "../components/MaterialQuiz";
import MaterialFlashcards from "../components/MaterialFlashcards";
import StudyVideos from "../components/StudyVideos";
import { materialsApi, subjectsApi } from "../lib/api";
import { t } from "../lib/i18n";

/* The Subject Details page.
 *
 * App.jsx hands us the list-shaped subject (no materials on it), so this
 * page owns the SubjectDetail fetch — GET /api/subjects/{id} returns the
 * full material list with per-material completion status. Every mutation
 * (upload / delete / open) goes through the backend and then refreshes
 * this page's detail AND the subject list above it (onDataChanged), so
 * the two can never drift apart.
 */

// Mirrors the backend's MAX_UPLOAD_BYTES default (20 MB) so obviously too
// large files are rejected before the upload even starts. The backend is
// still the authority — it re-checks and returns a 413 with its own message.
const MAX_FILE_MB = 20;

const COMPLETION_LABELS_KEYS = {
  "not-started": "stats.in_progress",
  "in-progress": "stats.in_progress",
  completed: "stats.materials_completed",
};

const STATUS_LABELS_KEYS = {
  processing: "details.processing",
  ready: "details.processed_and_ready",
  failed: "details.this_pdf_could_not_be_processed",
};

// Turns a raw byte count into something readable.
function formatFileSize(bytes) {
  if (!Number.isFinite(bytes)) return "—";
  if (bytes < 1024) return `${bytes} B`;
  if (bytes < 1024 * 1024) return `${Math.round(bytes / 1024)} KB`;
  return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
}

// "Uploaded just now" on upload day, otherwise a short date.
function formatUploadedLabel(isoDate) {
  const date = new Date(isoDate);
  if (Number.isNaN(date.getTime())) return "";
  const now = new Date();
  const sameDay =
    date.getFullYear() === now.getFullYear() &&
    date.getMonth() === now.getMonth() &&
    date.getDate() === now.getDate();
  if (sameDay) return t("details.uploading");
  return `${t("details.uploaded_on")} ${date.toLocaleDateString(undefined, {
    month: "short",
    day: "numeric",
  })}`;
}

function SubjectDetails({ subject, onBack, onDataChanged }) {
  const [detail, setDetail] = useState(null); // SubjectDetail (subject + materials)
  const [isLoading, setIsLoading] = useState(true); // true until the first load resolves
  const [loadError, setLoadError] = useState(null);

  const [isUploading, setIsUploading] = useState(false);
  const [uploadError, setUploadError] = useState(null);

  const [selectedMaterialId, setSelectedMaterialId] = useState(null);
  const [activeResourceTab, setActiveResourceTab] = useState("summary");
  const fileInputRef = useRef(null);

  const subjectId = subject ? subject.id : null;

  // Fetches the subject detail. `showLoading` re-shows the full-page loading
  // state (used by the retry button — an event handler); the mount effect
  // deliberately doesn't set state synchronously, so `isLoading` starts
  // true and flips false once the fetch resolves.
  const loadDetail = useCallback(
    async (showLoading = false) => {
      if (showLoading) {
        setIsLoading(true);
        setLoadError(null);
      }
      try {
        const data = await subjectsApi.getSubject(subjectId);
        setDetail(data);
        setLoadError(null);
      } catch (apiError) {
        setLoadError(
          apiError.message || t("details.could_not_load_subject")
        );
        throw apiError;
      } finally {
        setIsLoading(false);
      }
    },
    [subjectId]
  );

  // Reload this page's detail AND tell App to re-fetch the subjects list
  // (cards + dashboard stats), so the two levels can never drift apart.
  async function refreshEverything() {
    await Promise.all([loadDetail(), onDataChanged ? onDataChanged() : null]);
  }

  // Initial load of the subject detail. setState runs inside promise
  // callbacks only (never synchronously in the effect body), and `isLoading`
  // simply starts as true until the first result lands.
  useEffect(() => {
    if (!subjectId) return undefined;

    let cancelled = false;

    subjectsApi
      .getSubject(subjectId)
      .then((data) => {
        if (cancelled) return;
        setDetail(data);
        setLoadError(null);
        setIsLoading(false);
      })
      .catch((apiError) => {
        if (cancelled) return;
        setLoadError(
          apiError.message || t("details.could_not_load_subject")
        );
        setIsLoading(false);
      });

    return () => {
      cancelled = true;
    };
  }, [subjectId]);

  // Derived before any early return so hooks stay unconditionally ordered.
  const materials = (detail && detail.materials) || [];
  const selectedMaterial = materials.find(
    (material) => material.id === selectedMaterialId
  );

  // Defensive guard: App only renders this page with a matching subject,
  // but a stale id (subject deleted in another tab, etc.) should fail
  // safely rather than crash on subject.name below.
  if (!subject) {
    return (
      <>
        <button
          type="button"
          className="button-secondary details-back-button"
          onClick={onBack}
        >
          {t("details.back_to_subjects")}
        </button>
        <p className="coming-soon">{t("details.this_subject_could_not_be_found")}</p>
      </>
    );
  }

  function handleUploadClick() {
    // The actual file picker is the hidden <input> below — this opens it.
    fileInputRef.current.click();
  }

  function handleFileChange(event) {
    const file = event.target.files[0];
    event.target.value = ""; // lets the same file be chosen again later

    if (!file) return; // the picker was closed without choosing anything

    setUploadError(null);

    if (
      file.type !== "application/pdf" &&
      !file.name.toLowerCase().endsWith(".pdf")
    ) {
      setUploadError(t("details.only_pdf_files"));
      return;
    }
    if (file.size > MAX_FILE_MB * 1024 * 1024) {
      setUploadError(t("details.file_is_too_large", { max: MAX_FILE_MB }));
      return;
    }

    setIsUploading(true);
    materialsApi
      .uploadMaterial(subject.id, file)
      .then((result) => {
        // Select what was just uploaded so the processing/failed state and
        // the resource tabs are immediately visible.
        setSelectedMaterialId(result.material.id);
        setActiveResourceTab("summary");
        if (result.material.status === "failed") {
          setUploadError(
            result.material.status_message ||
              t("details.this_pdf_could_not_be_processed")
          );
        }
        return refreshEverything();
      })
      .catch((apiError) => {
        setUploadError(
          apiError.message || t("details.upload_failed")
        );
      })
      .finally(() => {
        setIsUploading(false);
      });
  }

  function handleSelectMaterial(material) {
    setSelectedMaterialId(material.id);
    setActiveResourceTab("summary"); // a newly opened material starts on Summary

    // Opening a material marks it in-progress on the backend (first open
    // only — the server keeps it idempotent). Refresh quietly afterwards;
    // a failure here shouldn't block studying, so it's best-effort.
    materialsApi
      .startMaterial(material.id)
      .then(() => refreshEverything())
      .catch(() => {});
  }

  function handleDeleteMaterial(material) {
    const confirmed = window.confirm(
      t("details.delete_material_confirm", { filename: material.filename })
    );
    if (!confirmed) return; // Cancel — nothing changes

    setUploadError(null);
    materialsApi
      .deleteMaterial(material.id)
      .then(() => {
        // Clear the selection if the deleted material was open, so the
        // preview doesn't keep referencing a material that no longer exists.
        setSelectedMaterialId((current) =>
          current === material.id ? null : current
        );
        return refreshEverything();
      })
      .catch((apiError) => {
        setUploadError(
          apiError.message || t("details.could_not_delete_material")
        );
      });
  }

  // Called when a quiz attempt finishes: the server has already recorded
  // the score and completion status — we just re-render both levels.
  function handleQuizCompleted() {
    refreshEverything().catch(() => {});
  }

  return (
    <>
      <button
        type="button"
        className="button-secondary details-back-button"
        onClick={onBack}
      >
        {t("details.back_to_subjects")}
      </button>

      <header className="welcome">
        <div>
          <div className="details-title-row">
            <span
              className="subject-tile"
              style={{ backgroundColor: subject.color }}
            >
              {subject.name?.charAt(0).toUpperCase() || "?"}
            </span>
            <h1 className="welcome-title">{subject.name}</h1>
          </div>
          <p className="welcome-subtitle">
            {subject.description || t("details.no_description_yet")}
          </p>
        </div>

        <button
          type="button"
          className="button-primary"
          onClick={handleUploadClick}
          disabled={isUploading || Boolean(loadError)}
        >
          {isUploading ? t("details.uploading") : t("details.upload_material")}
        </button>

        {/* Hidden — the button above opens it. Restricted to PDFs, per the
            requirement that only PDF materials are supported for now. */}
        <input
          type="file"
          accept="application/pdf,.pdf"
          ref={fileInputRef}
          onChange={handleFileChange}
          style={{ display: "none" }}
        />
      </header>

      {uploadError && <p className="form-error">{uploadError}</p>}

      {isLoading && <p className="coming-soon">{t("details.loading_materials")}</p>}

      {loadError && !isLoading && (
        <>
          <p className="form-error">{loadError}</p>
          <button
            type="button"
            className="button-secondary"
            onClick={() => loadDetail(true).catch(() => {})}
          >
            {t("details.try_again")}
          </button>
        </>
      )}

      {!isLoading && !loadError && (
        <>
          <section className="section">
            <div className="stats-grid">
              <article className="stat-card">
                <p className="stat-value">{materials.length}</p>
                <p className="stat-label">{t("stats.materials")}</p>
              </article>

              <article className="stat-card">
                <p className="stat-value">
                  {
                    materials.filter(
                      (material) => material.completion_status === "in-progress"
                    ).length
                  }
                </p>
                <p className="stat-label">{t("stats.in_progress")}</p>
              </article>

              <article className="stat-card">
                <p className="stat-value">
                  {
                    materials.filter(
                      (material) => material.completion_status === "completed"
                    ).length
                  }
                </p>
                <p className="stat-label">{t("stats.materials_completed")}</p>
              </article>
            </div>
          </section>

          <section className="section">
            <h2 className="section-title">{t("details.materials")}</h2>

            {materials.length === 0 ? (
              <div className="empty-state">
                <h2 className="empty-state-title">{t("details.no_study_materials_yet")}</h2>
                <p className="empty-state-text">{t("details.upload_a_pdf")}</p>
                <button
                  type="button"
                  className="button-primary"
                  onClick={handleUploadClick}
                  disabled={isUploading}
                >
                  {t("details.upload_material")}
                </button>
              </div>
            ) : (
              <ul className="material-list">
                {materials.map((material) => (
                  <li key={material.id} className="material-row-shell">
                    <button
                      type="button"
                      className={
                        material.id === selectedMaterialId
                          ? "material-row material-row-button material-row-active"
                          : "material-row material-row-button"
                      }
                      onClick={() => handleSelectMaterial(material)}
                    >
                      <span
                        className="material-dot"
                        style={{ backgroundColor: subject.color }}
                      />

                      <div className="material-text">
                        <div className="material-title-row">
                          <p className="material-title">{material.filename}</p>
                          <span
                            className={`material-status-badge material-status-${material.status}`}
                          >
                            {t(STATUS_LABELS_KEYS[material.status] || material.status)}
                          </span>
                          <span
                            className={`completion-badge completion-${
                              material.completion_status || "not-started"
                            }`}
                          >
                            {
                              t(COMPLETION_LABELS_KEYS[material.completion_status || "not-started"])
                            }
                          </span>
                        </div>
                        <p className="material-meta">
                          {t("details.pdf")} · {formatFileSize(material.size_bytes)}
                          {material.status === "failed" &&
                            material.status_message
                              ? ` · ${material.status_message}`
                              : ""}
                        </p>
                      </div>

                      <span className="material-when">
                        {formatUploadedLabel(material.created_at)}
                      </span>
                    </button>

                    <button
                      type="button"
                      className="material-delete-button"
                      onClick={() => handleDeleteMaterial(material)}
                      aria-label={`Delete ${material.filename}`}
                      title={t("common.delete")}
                    >
                      <svg
                        viewBox="0 0 24 24"
                        fill="none"
                        stroke="currentColor"
                        strokeWidth="1.7"
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        aria-hidden="true"
                      >
                        <path d="M3 6h18M8 6V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2m-1 0v14a2 2 0 0 1-2 2H8a2 2 0 0 1-2-2V6h12z" />
                      </svg>
                    </button>
                  </li>
                ))}
              </ul>
            )}
          </section>

          {!selectedMaterial && materials.length > 0 && (
            <section className="section">
              <div className="empty-state">
                <h2 className="empty-state-title">{t("details.select_a_material")}</h2>
                <p className="empty-state-text">{t("details.select_a_material_desc")}</p>
              </div>
            </section>
          )}

          {selectedMaterial && (
            <section className="section">
              <h2 className="section-title">{t("details.material_preview")}</h2>

              <article className="material-preview">
                <p className="material-preview-filename">
                  {selectedMaterial.filename}
                </p>

                <div className="material-preview-badges">
                  <span className="material-preview-type">{t("details.pdf")}</span>
                  <span
                    className={`material-status-badge material-status-${selectedMaterial.status}`}
                  >
                    {selectedMaterial.status === "processing"
                      ? t("details.processing")
                      : t(STATUS_LABELS_KEYS[selectedMaterial.status] || selectedMaterial.status)}
                  </span>
                </div>

                <p className="material-preview-description">
                  {selectedMaterial.status === "failed"
                    ? selectedMaterial.status_message ||
                      t("details.this_pdf_could_not_be_processed")
                    : selectedMaterial.status === "ready"
                      ? t("details.processed_and_ready")
                      : t("details.processing")}
                </p>

                {/* These three buttons double as tabs: the active one is
                    styled as the primary button, the other two as secondary.
                    Clicking one switches the resource panel below. */}
                <div className="material-preview-actions">
                  <button
                    type="button"
                    className={
                      activeResourceTab === "summary"
                        ? "button-primary"
                        : "button-secondary"
                    }
                    onClick={() => setActiveResourceTab("summary")}
                  >
                    {t("details.generate_summary")}
                  </button>
                  <button
                    type="button"
                    className={
                      activeResourceTab === "quiz"
                        ? "button-primary"
                        : "button-secondary"
                    }
                    onClick={() => setActiveResourceTab("quiz")}
                  >
                    {t("details.generate_quiz")}
                  </button>
                  <button
                    type="button"
                    className={
                      activeResourceTab === "flashcards"
                        ? "button-primary"
                        : "button-secondary"
                    }
                    onClick={() => setActiveResourceTab("flashcards")}
                  >
                    {t("details.flashcards")}
                  </button>
                  <button
                    type="button"
                    className={
                      activeResourceTab === "videos"
                        ? "button-primary"
                        : "button-secondary"
                    }
                    onClick={() => setActiveResourceTab("videos")}
                  >
                    {t("details.study_videos")}
                  </button>
                </div>

                {/* Keyed by the material's id so switching materials
                    remounts the panel — resetting quiz progress, the flipped
                    card, etc., instead of carrying state over. */}
                <div className="resource-panel">
                  {selectedMaterial.status !== "ready" ? (
                    <p className="resource-placeholder">
                      {selectedMaterial.status === "failed"
                        ? t("details.this_material_couldnt_be_processed")
                        : t("details.processing")}
                    </p>
                  ) : (
                    <>
                      {activeResourceTab === "summary" && (
                        <MaterialSummary
                          key={selectedMaterial.id}
                          materialId={selectedMaterial.id}
                        />
                      )}
                      {activeResourceTab === "quiz" && (
                        <MaterialQuiz
                          key={selectedMaterial.id}
                          materialId={selectedMaterial.id}
                          onComplete={handleQuizCompleted}
                        />
                      )}
                      {activeResourceTab === "flashcards" && (
                        <MaterialFlashcards
                          key={selectedMaterial.id}
                          materialId={selectedMaterial.id}
                        />
                      )}
                      {activeResourceTab === "videos" && (
                        <StudyVideos
                          key={selectedMaterial.id}
                          materialId={selectedMaterial.id}
                          materialTitle={selectedMaterial.filename}
                          subjectTitle={subject.name}
                          subjectDescription={subject.description}
                        />
                      )}
                    </>
                  )}
                </div>
              </article>
            </section>
          )}
        </>
      )}
    </>
  );
}

export default SubjectDetails;
