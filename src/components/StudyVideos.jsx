import { useEffect, useMemo, useState } from "react";
import { resourcesApi } from "../lib/api";
import {
  buildStudyVideoQueries,
  getYouTubeSearchUrl,
  normalizeYouTubeVideoResults,
} from "../lib/youtubeStudyVideos";

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
        Study Videos
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
                  Watch on YouTube
                  <span aria-hidden="true">↗</span>
                </a>
              </div>
            </article>
          ))}
        </div>
      ) : (
        <>
          <div className="study-video-empty-state">
            <h4>No verified video results yet</h4>
            <p>
              Search YouTube for lessons related to this material. StudyAI
              doesn’t invent video results or IDs.
            </p>
          </div>
          {queries.length > 0 ? (
            <div className="study-video-search-list" aria-label="Suggested searches">
              {queries.map((query) => (
                <article className="study-video-search-card" key={query}>
                  <div>
                    <p className="study-video-search-label">Search suggestion</p>
                    <h4 className="study-video-title">{query}</h4>
                  </div>
                  <a
                    className="button-secondary study-video-link"
                    href={getYouTubeSearchUrl(query)}
                    target="_blank"
                    rel="noreferrer"
                  >
                    Search YouTube
                    <span aria-hidden="true">↗</span>
                  </a>
                </article>
              ))}
            </div>
          ) : (
            <p className="resource-placeholder">
              Add a material title to create a useful YouTube search.
            </p>
          )}
        </>
      )}
    </section>
  );
}

export default StudyVideos;