/* User profile endpoints. */

import { request } from "./client";

export function completeOnboarding(studying, studyLevel) {
  return request("/api/users/onboarding", {
    method: "POST",
    body: { studying, study_level: studyLevel },
  });
}

export function updateProfile(fullName, studying, studyLevel) {
  return request("/api/users/me", {
    method: "PATCH",
    body: { full_name: fullName, studying, study_level: studyLevel },
  });
}
