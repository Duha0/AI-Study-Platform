"""Auth flow tests: registration, duplication, login, /me, bad tokens."""

from app.core.security import create_access_token


def test_register_success(client):
    response = client.post(
        "/api/auth/register",
        json={"full_name": "Ada Lovelace", "email": "Ada@Example.com", "password": "longpassword1"},
    )
    assert response.status_code == 201, response.text
    body = response.json()
    assert body["user"]["email"] == "ada@example.com"  # normalized to lowercase
    assert "password" not in body["user"]
    assert "password_hash" not in body["user"]


def test_register_duplicate_email(client):
    payload = {"full_name": "A", "email": "dupe@example.com", "password": "longpassword1"}
    first = client.post("/api/auth/register", json=payload)
    assert first.status_code == 201
    second = client.post("/api/auth/register", json=payload)
    assert second.status_code == 409
    assert "already exists" in second.json()["detail"]


def test_register_validation_errors(client):
    # Bad email
    r1 = client.post(
        "/api/auth/register", json={"full_name": "A", "email": "not-an-email", "password": "longpassword1"}
    )
    assert r1.status_code == 422
    # Short password
    r2 = client.post(
        "/api/auth/register", json={"full_name": "A", "email": "a@example.com", "password": "short"}
    )
    assert r2.status_code == 422
    # Empty name
    r3 = client.post(
        "/api/auth/register", json={"full_name": "", "email": "a@example.com", "password": "longpassword1"}
    )
    assert r3.status_code == 422


def test_login_success_and_wrong_password(client):
    client.post(
        "/api/auth/register",
        json={"full_name": "Grace Hopper", "email": "grace@example.com", "password": "longpassword1"},
    )
    ok = client.post(
        "/api/auth/login", json={"email": "grace@example.com", "password": "longpassword1"}
    )
    assert ok.status_code == 200
    assert ok.json()["token_type"] == "bearer"
    assert ok.json()["access_token"]

    bad = client.post(
        "/api/auth/login", json={"email": "grace@example.com", "password": "wrongpassword1"}
    )
    assert bad.status_code == 401

    unknown = client.post(
        "/api/auth/login", json={"email": "ghost@example.com", "password": "longpassword1"}
    )
    assert unknown.status_code == 401


def test_me_returns_current_user(client, auth_headers):
    response = client.get("/api/auth/me", headers=auth_headers)
    assert response.status_code == 200
    body = response.json()
    assert body["email"] == "student@example.com"
    assert "password_hash" not in body


def test_me_rejects_missing_and_bad_tokens(client):
    assert client.get("/api/auth/me").status_code == 401
    forged = create_access_token("99999")  # valid signature, nonexistent user
    r = client.get("/api/auth/me", headers={"Authorization": f"Bearer {forged}"})
    assert r.status_code == 401
    garbage = client.get("/api/auth/me", headers={"Authorization": "Bearer not.a.token"})
    assert garbage.status_code == 401
