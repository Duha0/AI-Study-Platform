"""AI resource tests with the provider mocked — no network, no API key.

Also verifies the answer-leak protection and the not-configured failure mode.
"""

import pytest

from app.services.ai import provider
from app.services.ai import service as ai_service
from app.services.ai.provider import AIServiceError


class _FakeResponse:
    def __init__(self, payload):
        self._payload = payload
        self.status_code = 200
        self.text = ""

    def json(self):
        return self._payload


def _openai_style(content_json: str) -> _FakeResponse:
    return _FakeResponse(
        {"choices": [{"message": {"content": content_json}}]}
    )


def _mock_generate_json(monkeypatch, payload: dict):
    import json

    def fake(system_prompt, user_prompt):
        return payload

    monkeypatch.setattr(provider, "generate_json", fake)


def _create_ready_material(client, auth_headers):
    """Subject + uploaded material with real extracted text."""
    from tests.test_subjects_materials import _pdf_with_text, _upload_pdf

    subject = client.post(
        "/api/subjects", json={"name": "Chem", "description": ""}, headers=auth_headers
    ).json()
    pdf = _pdf_with_text(
        "Enzymes are biological catalysts.\nThey lower activation energy of reactions."
    )
    upload = _upload_pdf(client, auth_headers, subject["id"], "enzymes.pdf", pdf)
    assert upload.json()["material"]["status"] == "ready"
    return subject, upload.json()["material"]


def test_summary_generation_persists(client, auth_headers, monkeypatch):
    _mock_generate_json(
        monkeypatch,
        {"intro": "Enzymes speed up reactions.", "points": ["Lower activation energy", "Highly specific"]},
    )
    _, material = _create_ready_material(client, auth_headers)

    created = client.post(f"/api/materials/{material['id']}/summary", headers=auth_headers)
    assert created.status_code == 200, created.text
    body = created.json()
    assert body["intro"].startswith("Enzymes")
    assert len(body["points"]) == 2

    # Second call without regenerate must NOT call the AI again — returns stored.
    calls = {"n": 0}

    def counting(system, user):
        calls["n"] += 1
        return {"intro": "changed", "points": ["x"]}

    monkeypatch.setattr(provider, "generate_json", counting)
    again = client.post(f"/api/materials/{material['id']}/summary", headers=auth_headers)
    assert again.status_code == 200
    assert again.json()["intro"].startswith("Enzymes")  # unchanged
    assert calls["n"] == 0

    # GET returns the stored one too.
    fetched = client.get(f"/api/materials/{material['id']}/summary", headers=auth_headers)
    assert fetched.status_code == 200
    assert fetched.json()["points"] == ["Lower activation energy", "Highly specific"]


def test_summary_malformed_ai_output_rejected(client, auth_headers, monkeypatch):
    _mock_generate_json(monkeypatch, {"oops": "wrong shape"})
    _, material = _create_ready_material(client, auth_headers)
    response = client.post(f"/api/materials/{material['id']}/summary", headers=auth_headers)
    assert response.status_code == 502
    assert "unexpected format" in response.json()["detail"]


def test_quiz_flow_scores_and_saves(client, auth_headers, monkeypatch):
    payload = {
        "questions": [
            {
                "prompt": "What do enzymes lower?",
                "options": ["Activation energy", "Temperature", "pH", "Mass"],
                "correct_index": 0,
                "explanation": "Catalysts lower activation energy.",
            },
            {
                "prompt": "Enzymes are…",
                "options": ["Lipids", "Catalysts", "Sugars", "Salts"],
                "correct_index": 1,
                "explanation": "Enzymes are biological catalysts.",
            },
        ]
    }
    _mock_generate_json(monkeypatch, payload)
    _, material = _create_ready_material(client, auth_headers)

    generated = client.post(f"/api/materials/{material['id']}/quiz", headers=auth_headers)
    assert generated.status_code == 200, generated.text
    quiz = generated.json()
    assert len(quiz["questions"]) == 2
    # Answers must NOT be present in the taking view:
    for q in quiz["questions"]:
        assert q.get("correctOptionId") is None
        assert q.get("explanation") is None

    qids = [q["id"] for q in quiz["questions"]]
    answers = [
        {"question_id": qids[0], "selected_option_id": "a"},  # correct
        {"question_id": qids[1], "selected_option_id": "a"},  # wrong
    ]
    submitted = client.post(
        f"/api/quizzes/{quiz['id']}/submit", json={"answers": answers}, headers=auth_headers
    )
    assert submitted.status_code == 200, submitted.text
    attempt = submitted.json()
    assert attempt["score"] == 1
    assert attempt["total"] == 2
    detail_by_q = {d["questionId"]: d for d in attempt["details"]}
    assert detail_by_q[qids[0]]["correct"] is True
    assert detail_by_q[qids[1]]["correctOptionId"] == "b"  # answers revealed only after submit

    # Latest attempt is attached to subsequent quiz fetches.
    fetched = client.get(f"/api/materials/{material['id']}/quiz", headers=auth_headers)
    assert fetched.json()["latest_attempt"]["score"] == 1


def test_quiz_submit_rejects_wrong_answers_count(client, auth_headers, monkeypatch):
    payload = {
        "questions": [
            {
                "prompt": "Q?",
                "options": ["A", "B", "C", "D"],
                "correct_index": 0,
                "explanation": "",
            }
        ]
    }
    _mock_generate_json(monkeypatch, payload)
    _, material = _create_ready_material(client, auth_headers)
    quiz = client.post(f"/api/materials/{material['id']}/quiz", headers=auth_headers).json()

    # Missing answer for the only question
    bad = client.post(
        f"/api/quizzes/{quiz['id']}/submit",
        json={"answers": [{"question_id": quiz["questions"][0]["id"] + 5, "selected_option_id": "a"}]},
        headers=auth_headers,
    )
    assert bad.status_code == 400

    # Invalid option id
    bad2 = client.post(
        f"/api/quizzes/{quiz['id']}/submit",
        json={"answers": [{"question_id": quiz["questions"][0]["id"], "selected_option_id": "z"}]},
        headers=auth_headers,
    )
    assert bad2.status_code == 400


def test_quiz_ownership_isolation(client, auth_headers, monkeypatch):
    payload = {
        "questions": [{"prompt": "Q?", "options": ["A", "B", "C", "D"], "correct_index": 0, "explanation": ""}]
    }
    _mock_generate_json(monkeypatch, payload)
    _, material = _create_ready_material(client, auth_headers)
    quiz = client.post(f"/api/materials/{material['id']}/quiz", headers=auth_headers).json()

    from tests.test_subjects_materials import _second_user_headers

    other = _second_user_headers(client)
    submission = {
        "answers": [{"question_id": quiz["questions"][0]["id"], "selected_option_id": "a"}]
    }
    assert client.post(f"/api/quizzes/{quiz['id']}/submit", json=submission, headers=other).status_code == 404
    assert client.get(f"/api/materials/{material['id']}/quiz", headers=other).status_code == 404


def test_flashcards_generation(client, auth_headers, monkeypatch):
    _mock_generate_json(
        monkeypatch,
        {"cards": [{"front": "What is an enzyme?", "back": "A biological catalyst."}]},
    )
    _, material = _create_ready_material(client, auth_headers)
    created = client.post(f"/api/materials/{material['id']}/flashcards", headers=auth_headers)
    assert created.status_code == 200, created.text
    assert created.json()[0]["front"] == "What is an enzyme?"

    fetched = client.get(f"/api/materials/{material['id']}/flashcards", headers=auth_headers)
    assert fetched.status_code == 200
    assert len(fetched.json()) == 1


def test_generation_requires_ready_material(client, auth_headers, sample_pdf_bytes):
    """Failed (scanned) materials can't generate resources."""
    from tests.test_subjects_materials import _create_subject, _upload_pdf

    subject = _create_subject(client, auth_headers).json()
    upload = _upload_pdf(client, auth_headers, subject["id"], "scan.pdf", sample_pdf_bytes)
    material_id = upload.json()["material"]["id"]
    assert upload.json()["material"]["status"] == "failed"

    assert client.post(f"/api/materials/{material_id}/summary", headers=auth_headers).status_code == 409
    assert client.post(f"/api/materials/{material_id}/quiz", headers=auth_headers).status_code == 409
    assert client.post(f"/api/materials/{material_id}/flashcards", headers=auth_headers).status_code == 409


def test_not_configured_ai_returns_clear_error(client, auth_headers, fake_ai):
    _, material = _create_ready_material(client, auth_headers)
    for path in ("summary", "quiz", "flashcards"):
        response = client.post(f"/api/materials/{material['id']}/{path}", headers=auth_headers)
        assert response.status_code == 503
        assert "not configured" in response.json()["detail"].lower()
