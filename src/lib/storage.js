/* ---------------------------------------------------------------------------
   storage.js — the single source of truth for browser-persisted state.

   With the real backend in place, auth is token-based:
   - The JWT access token lives in localStorage so a refresh keeps you
     logged in. `getToken()` clears it when expired, which is how the app
     detects "session over" on first load after time away.
   - `getCurrentUser()` caches the /api/auth/me response in sessionStorage,
     saving a network round trip on refreshes within the same tab.

   What deliberately stays in localStorage: UI-only preferences (theme).
   Everything that used to live here as fake data — the registered account
   password, onboarding answers, login flag — is now owned by the backend.
   --------------------------------------------------------------------------- */

const TOKEN_KEY = "studyai-token";
const USER_CACHE_KEY = "studyai-user-cache";
const THEME_KEY = "studyai-theme";

/* The study-level choices shared by Onboarding and Profile — exported from
   here so both dropdowns can never drift apart. */
export const STUDY_LEVELS = ["High School", "University", "Self Learner"];

/* --------------------------------------------------------------------------- token */

export function getToken() {
  try {
    const token = localStorage.getItem(TOKEN_KEY);
    if (token && isTokenExpired(token)) {
      localStorage.removeItem(TOKEN_KEY);
      return null;
    }
    return token;
  } catch {
    return null;
  }
}

export function setToken(token) {
  try {
    localStorage.setItem(TOKEN_KEY, token);
  } catch {
    // Session-only login if storage is unavailable.
  }
}

export function clearToken() {
  try {
    localStorage.removeItem(TOKEN_KEY);
  } catch {
    // Ignore.
  }
}

/* --------------------------------------------------------------------------- user cache */

/** Cache the authenticated user's profile (session-scoped, never secrets). */
export function cacheUser(user) {
  try {
    sessionStorage.setItem(USER_CACHE_KEY, JSON.stringify(user));
  } catch {
    // Best effort only — the app falls back to fetching /api/auth/me.
  }
}

export function getCachedUser() {
  try {
    const raw = sessionStorage.getItem(USER_CACHE_KEY);
    return raw ? JSON.parse(raw) : null;
  } catch {
    return null;
  }
}

export function clearCachedUser() {
  try {
    sessionStorage.removeItem(USER_CACHE_KEY);
  } catch {
    // Ignore.
  }
}

/** Combined logout wipe (token + cached profile). */
export function clearAuth() {
  clearToken();
  clearCachedUser();
}

/* --------------------------------------------------------------------------- theme (UI-only) */

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

/* --------------------------------------------------------------------------- helpers */

/* Initials for an avatar, derived from a full name. Exported because both
   the Sidebar (App.jsx) and Dashboard display it and they must match. */
export function getInitials(name) {
  if (!name) return "S";
  const parts = name.trim().split(/\s+/);
  const initials = (parts[0][0] || "") + (parts[1] ? parts[1][0] : "");
  return initials.toUpperCase() || "S";
}

/* JWT expiry check without external libraries (payload is base64url). */
function isTokenExpired(token) {
  try {
    const payload = JSON.parse(atob(token.split(".")[1].replace(/-/g, "+").replace(/_/g, "/")));
    if (!payload.exp) return false;
    // Refresh-threshold: treat tokens with <60s left as expired.
    return payload.exp * 1000 < Date.now() + 60_000;
  } catch {
    return true; // malformed token = unusable
  }
}
