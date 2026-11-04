import { useEffect, useMemo, useState } from "react";
import { resourcesApi } from "../lib/api";
import {
  buildStudyVideoQueries,
  getYouTubeSearchUrl,
  normalizeYouTubeVideoResults,
} from "../lib/youtubeStudyVideos";
import { t } from "../lib/i18n";

function StudyVideos({
  materialId,
  materialTitle,
  subjectTitle,
  subjectDescription,
  videoResults = [],
}) {
  const [summary, setSummary] = useState(null);
  const videos = useMemo(
    () => normalizeYouTubeVideoResults(videoResults),
    [videoResults]
  );

  useEffect(() => {
    let cancelled = false;

    resourcesApi
      .getSummary(materialId)
      .then((savedSummary) => {
        if (!cancelled) setSummary(savedSummary);
      })
      .catch(() => {
        if (!cancelled) setSummary(null);
      });

    return () => {
      cancelled = true;
    };
  }, [materialId]);

  const queries = buildStudyVideoQueries({
    materialTitle,
    subjectTitle,
    subjectDescription,
    summary,
  });

  return (
    <section className="study-videos" aria-labelledby="study-videos-heading">
      <h3 id="study-videos-heading" className="summary-heading">
        {t("study_videos.heading")}
      </h3>

      {videos.length > 0 ? (
        <div className="study-video-grid">
          {videos.map((video) => (
            <article className="study-video-card" key={video.id}>
              <img
                className="study-video-thumbnail"
                src={video.thumbnailUrl}
                alt=""
                loading="lazy"
                onError={(event) => {
                  event.currentTarget.hidden = true;
                }}
              />
              <div className="study-video-card-content">
                <h4 className="study-video-title">{video.title}</h4>
                {video.channelName && (
                  <p className="study-video-channel">{video.channelName}</p>
                )}
                {video.description && (
                  <p className="study-video-description">{video.description}</p>
                )}
                <a
                  className="button-secondary study-video-link"
                  href={video.watchUrl}
                  target="_blank"
                  rel="noreferrer"
                >
                  {t("study_videos.watch_on_youtube")}
                  <span aria-hidden="true">↗</span>
                </a>
              </div>
            </article>
          ))}
        </div>
      ) : (
        <>
          <div className="study-video-empty-state">
            <h4>{t("study_videos.no_results")}</h4>
            <p>{t("study_videos.no_results_desc")}</p>
          </div>
          {queries.length > 0 ? (
            <div className="study-video-search-list" aria-label="Suggested searches">
              {queries.map((query) => (
                <article className="study-video-search-card" key={query}>
                  <div>
                    <p className="study-video-search-label">{t("study_videos.search_suggestion_label")}</p>
                    <h4 className="study-video-title">{query}</h4>
                  </div>
                  <a
                    className="button-secondary study-video-link"
                    href={getYouTubeSearchUrl(query)}
                    target="_blank"
                    rel="noreferrer"
                  >
                    {t("common.search_youtube")}
                    <span aria-hidden="true">↗</span>
                  </a>
                </article>
              ))}
            </div>
          ) : (
            <p className="resource-placeholder">
              {t("study_videos.add_title")}
            </p>
          )}
        </>
      )}
    </section>
  );
}

export default StudyVideos;
