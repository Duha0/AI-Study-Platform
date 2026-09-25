/* Quiz endpoints (generation, retrieval, submission). */

import { request } from "./client";

export function getQuiz(materialId) {
  return request(`/api/materials/${materialId}/quiz`);
}

export function generateQuiz(materialId, regenerate = false) {
  return request(`/api/materials/${materialId}/quiz?regenerate=${regenerate}`, { method: "POST" });
}

export function submitQuiz(quizId, answers) {
  // answers: [{ question_id, selected_option_id }]
  return request(`/api/quizzes/${quizId}/submit`, { method: "POST", body: { answers } });
}
