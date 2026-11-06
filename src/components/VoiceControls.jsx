import { useEffect, useId, useSyncExternalStore } from "react";
import { speechController } from "../lib/speechSynthesis";
import { t } from "../lib/i18n";

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

function VoiceControls({ text, label = "study content", language = "en" }) {
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

  // English-only TTS for this release. Arabic and other languages are
  // postponed — hide controls entirely for Arabic content.
  //
  // Normalize the language value: null/undefined (existing users whose
  // preference was never saved), "en", "en-US", "en-GB", etc. all count as
  // English. Only "ar" / "ar-*" hides the controls — never enables Arabic.
  const isArabic = typeof language === "string" && language.toLowerCase().startsWith("ar");

  if (!isAvailable || isArabic) {
    return null;
  }

  return (
    <div className="voice-controls" aria-label={`Listen to ${label}`}>
      {status === "idle" ? (
        <button
          type="button"
          className="voice-button"
          onClick={() => speechController.speak(ownerId, text, language)}
          disabled={!String(text ?? "").trim()}
        >
          <SpeakerIcon />
          {t("voice.listen")}
        </button>
      ) : (
        <>
          <span className="voice-status" role="status" aria-live="polite">
            {status === "paused" ? t("voice.paused") : t("voice.speaking")}
          </span>
          {canPause && status === "paused" ? (
            <button
              type="button"
              className="voice-button"
              onClick={() => speechController.resume(ownerId)}
            >
              {t("voice.resume")}
            </button>
          ) : canPause ? (
            <button
              type="button"
              className="voice-button"
              onClick={() => speechController.pause(ownerId)}
            >
              {t("voice.pause")}
            </button>
          ) : null}
          <button
            type="button"
            className="voice-button"
            onClick={() => speechController.stop(ownerId)}
          >
            {t("voice.stop")}
          </button>
        </>
      )}
    </div>
  );
}

export default VoiceControls;
