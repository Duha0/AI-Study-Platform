/* ---------------------------------------------------------------------------
   storage.js — the single source of truth for every localStorage key the
   app uses, plus the safe read/write helpers for each one.

   Why this file exists: the same keys were previously declared independently
   in App.jsx, Register.jsx, Login.jsx, Onboarding.jsx, and Profile.jsx.
   That meant a rename or a shape change (say, storing the user's email
   lowercased) had to be replicated in five files, and a typo in any one of
   them would silently split the app's data in two. Every page now imports
   from here instead, so there is exactly one definition of each key and of
   how its value is parsed.

   Note that no session/auth data lives here — LOGIN_KEY is still owned by
   App.jsx state, this file only centralizes the storage access.
   --------------------------------------------------------------------------- */

/* Every localStorage key used anywhere in the app. Nothing else should
   hardcode these strings. */
export const USER_KEY = "studyai-user"; // the registered account { fullName, email, password }
export const ONBOARDING_KEY = "studyai-onboarding"; // { subject, level }
export const THEME_KEY = "studyai-theme"; // "light" | "dark"
export const LOGIN_KEY = "studyai-logged-in"; // "true" once logged in

/* The study-level choices shared by Onboarding and Profile — exported from
   here so both dropdowns can never drift apart. */
export const STUDY_LEVELS = ["High School", "University", "Self Learner"];

/* Default user shape — callers can rely on .fullName/.email always existing. */
const EMPTY_USER = { fullName: "", email: "", password: "" };
const EMPTY_ONBOARDING = { subject: "", level: STUDY_LEVELS[0] };

/* JSON can throw in some private-browsing modes, storage can be full, and a
   value written by an older version of the app may not parse. Every reader
   wraps localStorage in try/catch and falls back to a safe default, and the
   shape of what's returned is validated so callers never see `undefined`
   fields where they expect strings. */

export function readUser() {
  try {
    const raw = localStorage.getItem(USER_KEY);
    const user = raw ? JSON.parse(raw) : null;
    return user && typeof user === "object" ? { ...EMPTY_USER, ...user } : { ...EMPTY_USER };
  } catch {
    return { ...EMPTY_USER };
  }
}

export function writeUser(user) {
  try {
    localStorage.setItem(USER_KEY, JSON.stringify(user));
  } catch {
    // Callers keep working this session even if the write failed.
  }
}

export function readOnboarding() {
  try {
    const raw = localStorage.getItem(ONBOARDING_KEY);
    const onboarding = raw ? JSON.parse(raw) : null;
    return onboarding && typeof onboarding === "object"
      ? { ...EMPTY_ONBOARDING, ...onboarding }
      : { ...EMPTY_ONBOARDING };
  } catch {
    return { ...EMPTY_ONBOARDING };
  }
}

export function writeOnboarding(onboarding) {
  try {
    localStorage.setItem(ONBOARDING_KEY, JSON.stringify(onboarding));
  } catch {
    // Same story as writeUser.
  }
}

export function readTheme() {
  try {
    const saved = localStorage.getItem(THEME_KEY);
    if (saved === "light" || saved === "dark") return saved;
  } catch {
    // Ignore and use the default below.
  }
  return "light"; // Light mode is the default.
}

export function writeTheme(theme) {
  try {
    localStorage.setItem(THEME_KEY, theme);
  } catch {
    // The theme still applies for this session.
  }
}

export function readLoggedIn() {
  try {
    return localStorage.getItem(LOGIN_KEY) === "true";
  } catch {
    return false;
  }
}

export function writeLoggedIn() {
  try {
    localStorage.setItem(LOGIN_KEY, "true");
  } catch {
    // The session still works even if this couldn't be saved — it just
    // won't be remembered across a refresh.
  }
}

export function clearLoggedIn() {
  try {
    localStorage.removeItem(LOGIN_KEY);
  } catch {
    // Not critical — the caller already flipped logged-in state to false.
  }
}

/* Initials for an avatar, derived from a full name. Exported because both
   the Sidebar (App.jsx) and Dashboard display it and they must match. */
export function getInitials(name) {
  if (!name) return "S";
  const parts = name.trim().split(/\s+/);
  const initials = (parts[0][0] || "") + (parts[1] ? parts[1][0] : "");
  return initials.toUpperCase() || "S";
}
