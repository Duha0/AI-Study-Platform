import { useEffect, useId, useSyncExternalStore } from "react";
import { speechController } from "../lib/speechSynthesis";

function SpeakerIcon() {
  return (
    <svg
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="1.8"
      strokeLinecap="round"
      strokeLinejoin="round"
      aria-hidden="true"
    >
      <path d="M4 10v4h4l5 4V6l-5 4H4z" />
      <path d="M17 9a5 5 0 0 1 0 6M19.5 6.5a9 9 0 0 1 0 11" />
    </svg>
  );
}

function VoiceControls({ text, label = "study content" }) {
  const reactId = useId();
  const ownerId = `voice-${reactId}`;
  const status = useSyncExternalStore(
    speechController.subscribe,
    () => speechController.statusFor(ownerId),
    () => "idle"
  );
  const isAvailable = speechController.isAvailable();
  const canPause = speechController.canPause(ownerId);

  useEffect(
    () => () => speechController.stop(ownerId),
    [ownerId, text]
  );

  if (!isAvailable) {
    return (
      <span className="voice-unavailable" role="status">
        Voice playback isn’t available on this device.
      </span>
    );
  }

  return (
    <div className="voice-controls" aria-label={`Listen to ${label}`}>
      {status === "idle" ? (
        <button
          type="button"
          className="voice-button"
          onClick={() => speechController.speak(ownerId, text)}
          disabled={!String(text ?? "").trim()}
        >
          <SpeakerIcon />
          Listen
        </button>
      ) : (
        <>
          <span className="voice-status" role="status" aria-live="polite">
            {status === "paused" ? "Paused" : "Speaking"}
          </span>
          {canPause && status === "paused" ? (
            <button
              type="button"
              className="voice-button"
              onClick={() => speechController.resume(ownerId)}
            >
              Resume
            </button>
          ) : canPause ? (
            <button
              type="button"
              className="voice-button"
              onClick={() => speechController.pause(ownerId)}
            >
              Pause
            </button>
          ) : null}
          <button
            type="button"
            className="voice-button"
            onClick={() => speechController.stop(ownerId)}
          >
            Stop
          </button>
        </>
      )}
    </div>
  );
}

export default VoiceControls;