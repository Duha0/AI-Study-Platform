/* Subject endpoints. */

import { request } from "./client";

export function listSubjects() {
  return request("/api/subjects");
}

export function createSubject(name, description) {
  return request("/api/subjects", { method: "POST", body: { name, description } });
}

export function getSubject(subjectId) {
  return request(`/api/subjects/${subjectId}`);
}

export function updateSubject(subjectId, patch) {
  return request(`/api/subjects/${subjectId}`, { method: "PATCH", body: patch });
}

export function deleteSubject(subjectId) {
  return request(`/api/subjects/${subjectId}`, { method: "DELETE" });
}
