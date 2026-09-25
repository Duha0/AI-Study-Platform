/* Material endpoints (upload, detail, delete, open/started). */

import { request } from "./client";

export function uploadMaterial(subjectId, file) {
  const formData = new FormData();
  formData.append("file", file);
  return request(`/api/subjects/${subjectId}/materials`, { method: "POST", formData });
}

export function getMaterial(materialId) {
  return request(`/api/materials/${materialId}`);
}

export function deleteMaterial(materialId) {
  return request(`/api/materials/${materialId}`, { method: "DELETE" });
}

export function startMaterial(materialId) {
  return request(`/api/materials/${materialId}/start`, { method: "POST" });
}
