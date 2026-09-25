"""Subject and material tests: CRUD, ownership boundaries, upload flow."""

import io

from pypdf import PdfWriter


def _create_subject(client, headers, name="Biology", description="Cells and stuff"):
    return client.post("/api/subjects", json={"name": name, "description": description}, headers=headers)


def _second_user_headers(client):
    client.post(
        "/api/auth/register",
        json={"full_name": "Other", "email": "other@example.com", "password": "longpassword1"},
    )
    login = client.post(
        "/api/auth/login", json={"email": "other@example.com", "password": "longpassword1"}
    )
    return {"Authorization": f"Bearer {login.json()['access_token']}"}


def _pdf_with_text(text: str) -> bytes:
    """Build a real text-extractable PDF in memory using pypdf."""
    from reportlab.pdfgen import canvas

    buffer = io.BytesIO()
    c = canvas.Canvas(buffer)
    for i, line in enumerate(text.splitlines()):
        c.drawString(72, 720 - i * 16, line)
    c.save()
    return buffer.getvalue()


def _upload_pdf(client, headers, subject_id: int, filename: str, content: bytes, content_type="application/pdf"):
    return client.post(
        f"/api/subjects/{subject_id}/materials",
        files={"file": (filename, content, content_type)},
        headers=headers,
    )


def test_subject_crud_and_list_scoping(client, auth_headers):
    created = _create_subject(client, auth_headers)
    assert created.status_code == 201, created.text
    subject = created.json()
    assert subject["material_count"] == 0

    listed = client.get("/api/subjects", headers=auth_headers)
    assert listed.status_code == 200
    assert [s["name"] for s in listed.json()] == ["Biology"]

    fetched = client.get(f"/api/subjects/{subject['id']}", headers=auth_headers)
    assert fetched.status_code == 200
    assert fetched.json()["description"] == "Cells and stuff"

    updated = client.patch(
        f"/api/subjects/{subject['id']}",
        json={"description": "Updated description"},
        headers=auth_headers,
    )
    assert updated.status_code == 200
    assert updated.json()["description"] == "Updated description"

    deleted = client.delete(f"/api/subjects/{subject['id']}", headers=auth_headers)
    assert deleted.status_code == 204
    assert client.get(f"/api/subjects/{subject['id']}", headers=auth_headers).status_code == 404


def test_subject_ownership_isolation(client, auth_headers):
    subject = _create_subject(client, auth_headers).json()
    other = _second_user_headers(client)

    # Another user's list must not contain it...
    other_list = client.get("/api/subjects", headers=other)
    assert other_list.status_code == 200
    assert all(s["id"] != subject["id"] for s in other_list.json())
    # ...and direct access must 404 (not leak existence).
    assert client.get(f"/api/subjects/{subject['id']}", headers=other).status_code == 404
    assert client.delete(f"/api/subjects/{subject['id']}", headers=other).status_code == 404
    # Unauthenticated access is 401.
    assert client.get(f"/api/subjects/{subject['id']}").status_code == 401


def test_subject_validation(client, auth_headers):
    assert client.post("/api/subjects", json={"name": ""}, headers=auth_headers).status_code == 422
    assert client.get("/api/subjects/999999", headers=auth_headers).status_code == 404


def test_upload_and_delete_material(client, auth_headers):
    subject = _create_subject(client, auth_headers).json()
    pdf = _pdf_with_text("Photosynthesis converts light energy into chemical energy.\nChloroplasts are the organelles involved.")

    uploaded = _upload_pdf(client, auth_headers, subject["id"], "photosynthesis.pdf", pdf)
    assert uploaded.status_code == 201, uploaded.text
    material = uploaded.json()["material"]
    assert material["status"] == "ready"  # real extraction ran
    assert material["filename"] == "photosynthesis.pdf"
    assert material["size_bytes"] > 0

    detail = client.get(f"/api/materials/{material['id']}", headers=auth_headers)
    assert detail.status_code == 200
    assert "Photosynthesis" in detail.json()["extracted_text_preview"]

    deleted = client.delete(f"/api/materials/{material['id']}", headers=auth_headers)
    assert deleted.status_code == 204
    assert client.get(f"/api/materials/{material['id']}", headers=auth_headers).status_code == 404


def test_upload_validates_type_size_and_emptiness(client, auth_headers):
    subject = _create_subject(client, auth_headers).json()

    not_pdf = _upload_pdf(
        client,
        auth_headers,
        subject["id"],
        "notes.txt",
        b"plain text, not a pdf",
        content_type="text/plain",
    )
    assert not_pdf.status_code == 400
    assert "PDF" in not_pdf.json()["detail"]

    empty = _upload_pdf(client, auth_headers, subject["id"], "empty.pdf", b"")
    assert empty.status_code == 400

    big = _upload_pdf(
        client, auth_headers, subject["id"], "big.pdf", b"%PDF-1.4 " + b"x" * (21 * 1024 * 1024)
    )
    assert big.status_code == 413


def test_material_ownership_isolation(client, auth_headers, sample_pdf_bytes):
    subject = _create_subject(client, auth_headers).json()
    uploaded = _upload_pdf(client, auth_headers, subject["id"], "secret.pdf", sample_pdf_bytes)
    material_id = uploaded.json()["material"]["id"]

    other = _second_user_headers(client)
    assert client.get(f"/api/materials/{material_id}", headers=other).status_code == 404
    assert client.delete(f"/api/materials/{material_id}", headers=other).status_code == 404


def test_scanned_pdf_fails_gracefully(client, auth_headers, sample_pdf_bytes):
    """A valid PDF with no text layer (blank page) reports failure, not fake success."""
    subject = _create_subject(client, auth_headers).json()
    uploaded = _upload_pdf(client, auth_headers, subject["id"], "scanned.pdf", sample_pdf_bytes)
    assert uploaded.status_code == 201
    material = uploaded.json()["material"]
    assert material["status"] == "failed"
    assert "scanned" in material["status_message"].lower() or "no text" in material["status_message"].lower()


def test_malformed_pdf_fails_gracefully(client, auth_headers):
    subject = _create_subject(client, auth_headers).json()
    uploaded = _upload_pdf(
        client, auth_headers, subject["id"], "corrupt.pdf", b"%PDF-1.4 this is not really a pdf"
    )
    assert uploaded.status_code == 201
    material = uploaded.json()["material"]
    assert material["status"] == "failed"
    assert material["status_message"]
