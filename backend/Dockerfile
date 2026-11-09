# syntax=docker/dockerfile:1
# StudyAI FastAPI — production container
# Local dev is unaffected; this image is for container hosting platforms.
# Build context: backend/

FROM python:3.13-slim

ENV PYTHONDONTWRITEBYTECODE=1 \
    PYTHONUNBUFFERED=1 \
    PIP_NO_CACHE_DIR=1 \
    PIP_DISABLE_PIP_VERSION_CHECK=1

WORKDIR /app

# System deps kept minimal (psycopg2-binary ships libs; add build deps only if needed)
RUN apt-get update && apt-get install -y --no-install-recommends \
      ca-certificates \
    && rm -rf /var/lib/apt/lists/*

COPY requirements.txt ./
RUN pip install --no-cache-dir -r requirements.txt

COPY . .

# Non-root user for runtime safety
RUN useradd -m -u 10001 appuser && chown -R appuser:appuser /app
USER appuser

# Platform provides PORT (Render/Fly/Railway/etc.). Default 8000 for local container runs.
ENV PORT=8000

EXPOSE 8000

# Runs migrations then starts server; exits non-zero if migrations/config fail.
ENTRYPOINT ["/bin/sh", "/app/start.sh"]
