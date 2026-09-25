# StudyAI

An AI-powered study platform. Upload a PDF, and StudyAI turns it into a
summary, a multiple-choice quiz, and flashcards — with progress tracking
across all your subjects. The frontend is a React + Vite single-page app;
the backend is a FastAPI + SQLAlchemy API with JWT authentication and
SQLite storage.

---

## Architecture

```
frontend (React 19 + Vite, plain CSS, light/dark theme)
  src/App.jsx                app shell: session restore, page guard, nav
  src/pages/*                Landing, Register, Login, Onboarding, Dashboard,
                             Subjects, SubjectDetails, Progress, Profile
  src/components/*           SubjectCard, CreateSubjectModal,
                             MaterialSummary, MaterialQuiz, MaterialFlashcards
  src/lib/api/*              the ONLY place fetch() is called:
                             client.js (base URL, auth header, error mapping)
                             auth.js users.js subjects.js materials.js
                             quizzes.js resources.js progress.js
  src/lib/storage.js         token + user cache + theme (UI-only) helpers

backend (FastAPI + SQLAlchemy 2 + Pydantic v2)
  app/main.py                app assembly, CORS, startup table creation
  app/core/                  config (pydantic-settings), database, security
                             (bcrypt hashing, PyJWT tokens)
  app/models/models.py       User, Subject, Material, Summary, Quiz, Question,
                             QuizAttempt, Flashcard, MaterialProgress
  app/schemas/schemas.py     request/response validation
  app/api/                   auth, users, subjects, materials, quizzes,
                             ai_resources, progress, deps (ownership checks)
  app/services/              local_file_storage, pdf_extraction, progress,
                             ai/ (provider.py, prompts.py, service.py)
  tests/                     pytest suite (25 tests)
```

Key decisions:

- **Ownership everywhere.** Every table that holds user content carries a
  `user_id` foreign key, and every query filters on it. Accessing another
  user's subject/material/quiz by changing an ID returns `404`, not a leak.
- **Quiz answers stay server-side.** The quiz-taking response contains no
  `correctOptionId`/`explanation`; scoring happens in
  `POST /api/quizzes/{id}/submit` and only the submitted-attempt response
  reveals the answers.
- **PDFs are files, not DB blobs.** Uploads are stored on disk under
  `backend/uploads/` with UUID filenames; the database keeps metadata and
  the extracted text.
- **One storage abstraction.** `services/local_file_storage.py` is the
  seam to swap in S3/GCS later; `services/ai/provider.py` is the seam to
  swap or add AI providers.

## Quick start

Prerequisites: Python 3.10+, Node 18+, npm.

### 1. Backend

Linux / macOS (bash):

```bash
cd backend
python3 -m venv .venv && source .venv/bin/activate
pip install -r requirements.txt
cp env.example .env          # then edit .env (see Environment variables)
python3 -m uvicorn app.main:app --port 8000
```

Windows (PowerShell):

```powershell
cd backend
python -m venv .venv
.\.venv\Scripts\Activate.ps1   # if scripts are blocked: Set-ExecutionPolicy -Scope Process Bypass
pip install -r requirements.txt
Copy-Item env.example .env     # then edit .env (see Environment variables)
python -m uvicorn app.main:app --port 8000
```

The API is now at http://localhost:8000 — interactive docs at
http://localhost:8000/docs, health check at `/api/health`.

### 2. Frontend

Linux / macOS (bash):

```bash
# back at the repo root
cp env.example .env          # sets VITE_API_URL=http://localhost:8000
npm install
npm run dev
```

Windows (PowerShell):

```powershell
# back at the repo root
Copy-Item env.example .env   # sets VITE_API_URL=http://localhost:8000
npm install
npm run dev
```

Open http://localhost:5173, register an account, create a subject, upload
a text-based PDF.

### 3. Tests

Linux / macOS (bash):

```bash
cd backend && python3 -m pytest tests/ -q      # backend API tests
npm run lint                                   # frontend ESLint
npm run build                                  # frontend production build
```

Windows (PowerShell):

```powershell
Set-Location backend; python -m pytest tests\ -q   # backend API tests
Set-Location ..; npm run lint                      # frontend ESLint
npm run build                                      # frontend production build
```

## Environment variables

Never commit real `.env` files — only the `*.env.example` templates are in
git. Locally, copy the template and fill values in: `cp env.example .env`
(Linux/macOS) or `Copy-Item env.example .env` (Windows PowerShell).

### Backend (`backend/.env`, from `backend/env.example`)

| Variable | Default | Purpose |
| --- | --- | --- |
| `DATABASE_URL` | `sqlite:///./studyai.db` | SQLAlchemy URL. Use a `postgres://` URL in production. |
| `SECRET_KEY` | `change-me-in-production` | JWT signing key. **Set a real one in production** (`python3 -c "import secrets; print(secrets.token_hex(32))"`). |
| `ACCESS_TOKEN_EXPIRE_MINUTES` | `10080` (7 days) | JWT lifetime. |
| `CORS_ORIGINS` | `http://localhost:5173,http://127.0.0.1:5173` | Comma-separated browser origins allowed to call the API. |
| `UPLOADS_DIR` | `./uploads` | Where uploaded PDFs are written. |
| `MAX_UPLOAD_BYTES` | `20971520` (20 MB) | Upload size limit. |
| `AI_PROVIDER` | `openai` | `openai` (any OpenAI-compatible endpoint) or `anthropic`. |
| `AI_API_KEY` | *(empty)* | Provider API key. **Empty = AI generation disabled**, endpoints return a clear 503 "not configured" message; everything else still works. |
| `AI_MODEL` | *(provider default)* | e.g. `gpt-4o-mini` or `claude-3-5-haiku-latest`. |
| `AI_BASE_URL` | *(provider default)* | Point at OpenRouter/Ollama/LM Studio or a proxy. |

### Frontend (`.env` at the repo root, from `env.example`)

| Variable | Purpose |
| --- | --- |
| `VITE_API_URL` | Base URL of the backend. `http://localhost:8000` for local dev. Empty means same-origin `/api` (production setups that serve the frontend and API from one host). |

`VITE_*` values are bundled into the shipped JavaScript — they are public
by design, so secrets must never go there.

## How PDF processing works

`POST /api/subjects/{id}/materials` (multipart `file`):

1. Validate the request: content type/filename must be PDF, size capped at
   `MAX_UPLOAD_BYTES` (413 otherwise, 400 for empty files).
2. Save the bytes to `UPLOADS_DIR` under a UUID filename (original name is
   kept as metadata only) — safe storage paths, no client-controlled paths.
3. Create the `Material` row with `status="processing"`.
4. Extract text synchronously with **pypdf**
   (`app/services/pdf_extraction.py`), normalize whitespace, store it on
   the material row.
5. Set the final status:
   - `ready` — text extracted; AI features are unlocked.
   - `failed` + `status_message` — one of: malformed PDF, empty document,
     **scanned/image-only PDF** ("No text layer found. This PDF is likely
     scanned or image-only."), or an unexpected reader error. Failed
     materials never pretend to be ready and can't generate resources
     (the endpoints return 409 until a valid text PDF is uploaded).

Processing is synchronous in the MVP, so the upload response already
carries the final status. `status` remains a first-class column
(`uploading → processing → ready | failed`) and the extraction call is
isolated in one service, so moving to a background queue or adding OCR is
a local change.

## How AI integration works

```
app/services/ai/
  provider.py   one function: generate_json(system, user) -> dict
                OpenAI-compatible chat completions or the Anthropic messages
                API over httpx; raises AIServiceError(not_configured=…)
                when no key is set; tolerates markdown-fenced JSON.
  prompts.py    all prompt text lives here, pinned to an exact JSON shape.
  service.py    orchestration: prompt -> provider -> Pydantic validation
                (SummaryResult / QuizResult / FlashcardsResult) -> DB rows.
```

- `POST /api/materials/{id}/summary` — generates and stores a summary
  (`intro` + `points`). If a valid summary already exists it is returned
  as-is; add `?regenerate=true` to force a new one.
- `POST /api/materials/{id}/quiz` — generates a 5-question quiz with a
  correct answer + explanation per question (kept server-side).
- `POST /api/materials/{id}/flashcards` — generates Q/A flashcards.
- Matching `GET` endpoints return the stored resources.

Failures are surfaced to the UI with actionable messages: missing key →
503 "AI features are not configured…", provider down → 502 with the
provider error, malformed output → 502 "unexpected format", no extracted
text → 502 with a re-upload hint.

**Where to put the API key:** `AI_API_KEY` in `backend/.env` (or the
platform's environment settings). Never in the frontend, never in git.

## Progress tracking

Progress is computed by the backend (`app/services/progress.py`,
`GET /api/progress`) — the frontend renders it and duplicates no math.

- Opening a material marks it **in-progress** (`POST /api/materials/{id}/start`).
- Submitting a quiz records the attempt and, at 100%, marks the material
  **completed**.
- `GET /api/progress` returns totals (subjects, materials, started,
  completed, overall %, quiz attempts, average score) plus per-subject rows.
- The dashboard/subject cards use counts computed in the same module, so
  the numbers agree everywhere.

Because it lives in SQLite, progress survives refreshes, logouts, and
restarts.

## API overview

| Method & path | Notes |
| --- | --- |
| `POST /api/auth/register` | 201; duplicate email → 409; weak/short password → 422. |
| `POST /api/auth/login` | `{access_token}`; bad credentials → 401. |
| `GET /api/auth/me` | Current user (requires `Authorization: Bearer`). |
| `POST /api/users/onboarding` / `PATCH /api/users/me` | Study profile. |
| `GET/POST /api/subjects` | List (with counts) / create. |
| `GET/PATCH/DELETE /api/subjects/{id}` | Detail includes `materials[]`. |
| `POST /api/subjects/{id}/materials` | PDF upload + extraction. |
| `GET/DELETE /api/materials/{id}`, `POST /api/materials/{id}/start` | Detail includes a text preview. |
| `GET/POST /api/materials/{id}/summary` | `?regenerate=true` on POST. |
| `GET/POST /api/materials/{id}/quiz` | Taking view hides answers. |
| `POST /api/quizzes/{id}/submit` | Server-side scoring; returns per-question review. |
| `GET/POST /api/materials/{id}/flashcards` | `?regenerate=true` on POST. |
| `GET /api/progress` | Totals + per-subject rows. |
| `GET /api/health` | Liveness probe. |

## MVP limitations

- SQLite + synchronous PDF extraction: single-process local dev, not a
  multi-worker production setup.
- Extraction is text-layer only — scanned PDFs need OCR (deliberately not
  faked; they fail with a clear message).
- Quiz/summary/flashcard regeneration replaces the stored version; past
  quiz attempts keep their own copies of questions/results.
- Token revocation: JWTs are valid until expiry; logout is client-side
  token deletion (add a denylist for true server-side logout).
- Uploaded files stay on local disk; the storage interface is the swap
  point for object storage.

## Production deployment considerations

- **Database:** switch `DATABASE_URL` to PostgreSQL; the models are
  compatible. Add Alembic for real migrations (startup currently runs
  `create_all`, which adds missing tables but never alters existing ones).
- **Secrets:** generate a strong `SECRET_KEY`, configure `AI_API_KEY`
  through the platform's environment settings, restrict `CORS_ORIGINS` to
  the real frontend origin.
- **Serving:** run uvicorn behind a reverse proxy with TLS; serve the
  built frontend (`npm run build` → `dist/`) from the same origin or set
  `VITE_API_URL` to the API host at build time. HTTPS-only, and consider
  moving the token to an httpOnly cookie.
- **Files:** point `UPLOADS_DIR` at a persistent volume or replace
  `local_file_storage` with S3/GCS.
- **Scale:** move PDF extraction (and AI calls) to a background worker;
  the `status` column already models the async lifecycle.
