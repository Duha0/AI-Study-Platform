function readRuntime(getRuntime) {
  try {
    return getRuntime();
  } catch {
    return null;
  }
}

export function createSpeechController(getRuntime = () => globalThis) {
  let activeSession = null;
  const listeners = new Set();

  function publish() {
    const state = activeSession
      ? { ownerId: activeSession.ownerId, status: activeSession.status }
      : null;
    listeners.forEach((listener) => listener(state));
  }

  function isAvailable() {
    try {
      const runtime = readRuntime(getRuntime);
      return (
        typeof runtime?.speechSynthesis?.speak === "function" &&
        typeof runtime?.SpeechSynthesisUtterance === "function"
      );
    } catch {
      return false;
    }
  }

  function statusFor(ownerId) {
    return activeSession?.ownerId === ownerId ? activeSession.status : "idle";
  }

  function canPause(ownerId) {
    return (
      activeSession?.ownerId === ownerId &&
      typeof activeSession.synthesis.pause === "function" &&
      typeof activeSession.synthesis.resume === "function"
    );
  }

  function subscribe(listener) {
    listeners.add(listener);
    return () => listeners.delete(listener);
  }

  function stop(ownerId) {
    if (!activeSession || (ownerId && activeSession.ownerId !== ownerId)) return;

    const stoppedSession = activeSession;
    activeSession = null;
    publish();
    try {
      stoppedSession.synthesis.cancel();
    } catch {
      // Some WebViews may lose their TTS service while the app is running.
    }
  }

  function speak(ownerId, value) {
    const text = String(value ?? "").trim();
    stop();
    if (!text) return false;

    let synthesis;
    let Utterance;
    try {
      const runtime = readRuntime(getRuntime);
      synthesis = runtime?.speechSynthesis;
      Utterance = runtime?.SpeechSynthesisUtterance;
    } catch {
      return false;
    }
    if (typeof synthesis?.speak !== "function" || typeof Utterance !== "function") {
      return false;
    }

    let utterance;
    try {
      utterance = new Utterance(text);
    } catch {
      return false;
    }

    const session = { ownerId, synthesis, status: "speaking" };
    const finish = () => {
      if (activeSession !== session) return;
      activeSession = null;
      publish();
    };

    utterance.onend = finish;
    utterance.onerror = finish;
    activeSession = session;
    publish();

    try {
      synthesis.speak(utterance);
      return true;
    } catch {
      finish();
      return false;
    }
  }

  function pause(ownerId) {
    if (
      !activeSession ||
      activeSession.ownerId !== ownerId ||
      typeof activeSession.synthesis.pause !== "function"
    ) {
      return false;
    }

    try {
      activeSession.synthesis.pause();
      activeSession.status = "paused";
      publish();
      return true;
    } catch {
      return false;
    }
  }

  function resume(ownerId) {
    if (
      !activeSession ||
      activeSession.ownerId !== ownerId ||
      typeof activeSession.synthesis.resume !== "function"
    ) {
      return false;
    }

    try {
      activeSession.synthesis.resume();
      activeSession.status = "speaking";
      publish();
      return true;
    } catch {
      return false;
    }
  }

  return {
    isAvailable,
    statusFor,
    canPause,
    subscribe,
    speak,
    pause,
    resume,
    stop,
  };
}

export const speechController = createSpeechController();