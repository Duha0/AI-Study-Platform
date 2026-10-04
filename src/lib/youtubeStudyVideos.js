function cleanTopic(value) {
  return String(value ?? "")
    .replace(/\.pdf$/i, "")
    .replace(/[._-]+/g, " ")
    .replace(/\s+/g, " ")
    .trim();
}

export function buildStudyVideoQueries({
  materialTitle,
  subjectTitle,
  subjectDescription,
  summary,
}) {
  const materialTopic = cleanTopic(materialTitle);
  const subjectTopic = cleanTopic(subjectTitle);
  const subjectContext = cleanTopic(subjectDescription);
  const summaryPoints = [summary?.intro, ...(summary?.points ?? [])]
    .map(cleanTopic)
    .filter(Boolean);

  const candidates = [
    [materialTopic, subjectTopic, "explained"].filter(Boolean).join(" "),
    [materialTopic, subjectContext, "lesson"].filter(Boolean).join(" "),
    summaryPoints[0] ? `${summaryPoints[0]} explained` : "",
  ];

  return [...new Set(candidates.map((query) => query.trim()).filter(Boolean))].slice(0, 3);
}

export function getYouTubeSearchUrl(query) {
  const params = new URLSearchParams({ search_query: query });
  return `https://www.youtube.com/results?${params.toString()}`;
}

export function normalizeYouTubeVideoResults(results = []) {
  if (!Array.isArray(results)) return [];

  return results.flatMap((result) => {
    const videoId =
      result?.videoId ?? result?.id?.videoId ?? (typeof result?.id === "string" ? result.id : "");
    const title = String(result?.title ?? "").trim();
    if (!/^[A-Za-z0-9_-]{11}$/.test(videoId) || !title) return [];

    return [
      {
        id: videoId,
        title,
        channelName: String(result?.channelName ?? result?.channelTitle ?? "").trim(),
        description: String(result?.description ?? "").trim(),
        thumbnailUrl: `https://i.ytimg.com/vi/${videoId}/hqdefault.jpg`,
        watchUrl: `https://www.youtube.com/watch?v=${videoId}`,
      },
    ];
  });
}