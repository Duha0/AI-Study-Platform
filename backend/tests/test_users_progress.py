"""Onboarding/profile and progress aggregation tests."""

from tests.test_ai_resources import _mock_generate_json
from tests.test_subjects_materials import _create_subject, _pdf_with_text, _upload_pdf


def test_onboarding_and_profile_update(client, auth_headers):
    me0 = client.get("/api/auth/me", headers=auth_headers).json()
    assert me0["onboarding_completed"] is False

    onboarded = client.post(
        "/api/users/onboarding",
        json={"studying": "Biology", "study_level": "University"},
        headers=auth_headers,
    )
    assert onboarded.status_code == 200
    assert onboarded.json()["onboarding_completed"] is True
    assert onboarded.json()["studying"] == "Biology"

    updated = client.patch(
        "/api/users/me",
        json={"full_name": "New Name", "studying": "Chemistry", "study_level": "High School"},
        headers=auth_headers,
    )
    assert updated.status_code == 200
    assert updated.json()["full_name"] == "New Name"


def test_progress_empty_state(client, auth_headers):
    response = client.get("/api/progress", headers=auth_headers)
    assert response.status_code == 200
    body = response.json()
    assert body["totals"]["total_subjects"] == 0
    assert body["totals"]["overall_percent"] == 0


def test_progress_updates_after_quiz(client, auth_headers, monkeypatch):
    payload = {
        "questions": [
            {"prompt": "Q1?", "options": ["A", "B", "C", "D"], "correct_index": 0, "explanation": ""},
            {"prompt": "Q2?", "options": ["A", "B", "C", "D"], "correct_index": 1, "explanation": ""},
        ]
    }
    _mock_generate_json(monkeypatch, payload)
    subject, material = _create_ready(client, auth_headers)

    # Opening the material marks it in-progress...
    started = client.post(f"/api/materials/{material['id']}/start", headers=auth_headers)
    assert started.status_code == 200

    progress1 = client.get("/api/progress", headers=auth_headers).json()
    assert progress1["totals"]["started_materials"] == 1
    assert progress1["totals"]["completed_materials"] == 0

    # ...finishing the quiz completes it and stores the score.
    quiz = client.post(f"/api/materials/{material['id']}/quiz", headers=auth_headers).json()
    answers = [
        {"question_id": quiz["questions"][0]["id"], "selected_option_id": "a"},  # correct
        {"question_id": quiz["questions"][1]["id"], "selected_option_id": "b"},  # correct
    ]
    submit = client.post(
        f"/api/quizzes/{quiz['id']}/submit", json={"answers": answers}, headers=auth_headers
    )
    assert submit.status_code == 200

    progress2 = client.get("/api/progress", headers=auth_headers).json()
    assert progress2["totals"]["completed_materials"] == 1
    assert progress2["totals"]["quiz_attempts"] == 1
    assert progress2["totals"]["average_score_percent"] == 100
    assert progress2["subjects"][0]["percent"] == 100
    # Details survive refetching (i.e., they're really in the DB).
    again = client.get("/api/progress", headers=auth_headers).json()
    assert again == progress2


def _create_ready(client, headers):
    subject = _create_subject(client, headers, name="Physics").json()
    pdf = _pdf_with_text("Newton's laws describe motion.\nForces cause acceleration.")
    upload = _upload_pdf(client, headers, subject["id"], "motion.pdf", pdf)
    assert upload.json()["material"]["status"] == "ready"
    return subject, upload.json()["material"]
