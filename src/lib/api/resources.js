/* Summary and flashcard endpoints. */

import { request } from "./client";

export function getSummary(materialId) {
  return request(`/api/materials/${materialId}/summary`);
}

export function generateSummary(materialId, regenerate = false) {
  return request(`/api/materials/${materialId}/summary?regenerate=${regenerate}`, { method: "POST" });
}

export function getFlashcards(materialId) {
  return request(`/api/materials/${materialId}/flashcards`);
}

export function generateFlashcards(materialId, regenerate = false) {
  return request(`/api/materials/${materialId}/flashcards?regenerate=${regenerate}`, { method: "POST" });
}
