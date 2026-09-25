/* Progress endpoints.
 *
 * The backend computes all progress math; the frontend only renders it, so
 * the calculation lives in exactly one place (see requirement 11).
 */

import { request } from "./client";

export function getProgress() {
  return request("/api/progress");
}
