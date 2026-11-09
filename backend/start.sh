#!/bin/sh
# Production startup: validate config, run Alembic migrations, then start Uvicorn.
# Exits immediately on any failure (migrations must not be skipped).
set -eu

# Ensure commands run from the backend root (where app/, alembic.ini live).
cd /app 2>/dev/null || cd "$(dirname "$0")"

echo "[studyai] starting (env=${STUDYAI_ENV:-development})"


# In production, refuse accidental SQLite/local-storage deployments.
# Local development (default) is unaffected.
if [ "${STUDYAI_ENV:-development}" = "production" ]; then
  case "${DATABASE_URL:-}" in
    sqlite:*|"")
      echo "[studyai] FATAL: STUDYAI_ENV=production requires a non-SQLite DATABASE_URL (PostgreSQL)."
      exit 1
      ;;
  esac
  if [ "${STORAGE_BACKEND:-local}" = "local" ]; then
    echo "[studyai] FATAL: STUDYAI_ENV=production requires STORAGE_BACKEND=s3 (or other non-local backend)."
    exit 1
  fi
  if [ "${SECRET_KEY:-}" = "" ] || [ "${SECRET_KEY:-}" = "change-me-in-production" ]; then
    echo "[studyai] FATAL: STUDYAI_ENV=production requires a strong SECRET_KEY."
    exit 1
  fi
fi

echo "[studyai] running alembic migrations..."
alembic upgrade head
echo "[studyai] migrations complete"

# Bind to 0.0.0.0 and honor platform PORT (Render/Railway/Fly/Koyeb/Cloud Run compatible).
PORT="${PORT:-8000}"
echo "[studyai] starting uvicorn on 0.0.0.0:${PORT}"
exec uvicorn app.main:app --host 0.0.0.0 --port "${PORT}" --proxy-headers --forwarded-allow-ips "*"
