/* Central HTTP client for the StudyAI backend.
 *
 * Every API module funnels through here, so auth headers, JSON parsing,
 * error shaping, and the base URL live in exactly one place.
 *
 * Base URL resolution:
 * - VITE_API_URL set        -> e.g. "http://localhost:8000" (calls that host)
 * - VITE_API_URL empty      -> same-origin, so "/api/..." (Vite dev proxy
 *                              handles it locally; same-origin deploys work too)
 */

import { getToken, clearAuth } from "../storage";

export const API_BASE = (import.meta.env.VITE_API_URL || "").replace(/\/+$/, "");

export class ApiError extends Error {
  /**
   * @param {number} status   HTTP status code (0 for network failures)
   * @param {string} message  User-facing message
   */
  constructor(status, message) {
    super(message);
    this.name = "ApiError";
    this.status = status;
  }
}

function userMessage(status, detail) {
  if (status === 0) {
    return "Can't reach the StudyAI server. Check your connection and that the backend is running.";
  }
  if (typeof detail === "string" && detail) return detail;
  if (status === 401) return "Your session has expired. Please log in again.";
  if (status === 422) return "Some of the information you entered is invalid.";
  if (status >= 500) return "Something went wrong on our side. Please try again.";
  return "Something went wrong. Please try again.";
}

/**
 * Perform a request against the backend.
 * @param {string} path           e.g. "/api/auth/login"
 * @param {{method?: string, body?: any, formData?: FormData, auth?: boolean}} [options]
 * @returns {Promise<any>} parsed JSON (or null for 204 responses)
 */
export async function request(path, { method = "GET", body, formData, auth = true } = {}) {
  const headers = {};
  if (auth) {
    const token = getToken();
    if (token) headers.Authorization = `Bearer ${token}`;
  }

  let payload;
  if (formData) {
    payload = formData; // browser sets the multipart boundary itself
  } else if (body !== undefined) {
    headers["Content-Type"] = "application/json";
    payload = JSON.stringify(body);
  }

  let response;
  try {
    response = await fetch(`${API_BASE}${path}`, { method, headers, body: payload });
  } catch {
    throw new ApiError(0, userMessage(0));
  }

  // Expired/invalid session: wipe the stale token so the app shows logged-out
  // state instead of failing on every request.
  if (response.status === 401 && auth) {
    clearAuth();
  }

  if (response.status === 204) return null;

  let data = null;
  try {
    data = await response.json();
  } catch {
    // Non-JSON body (proxy error page, empty body, ...) — fall through.
  }

  if (!response.ok) {
    const detail = data && data.detail !== undefined ? data.detail : undefined;
    // FastAPI validation errors come back as an array of objects.
    const firstDetail = Array.isArray(detail) && detail[0]?.msg ? detail[0].msg : detail;
    throw new ApiError(response.status, userMessage(response.status, firstDetail));
  }

  return data;
}
