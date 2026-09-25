"""Application configuration via environment variables (.env supported)."""

from functools import lru_cache

from pydantic_settings import BaseSettings, SettingsConfigDict


class Settings(BaseSettings):
    model_config = SettingsConfigDict(env_file=".env", env_file_encoding="utf-8", extra="ignore")

    # --- App ---
    app_name: str = "StudyAI API"
    # Comma-separated list of allowed CORS origins (the Vite dev server).
    cors_origins: str = "http://localhost:5173,http://127.0.0.1:5173"

    # --- Database ---
    # Swap to a PostgreSQL URL in production; the models stay the same.
    database_url: str = "sqlite:///./studyai.db"

    # --- Auth / JWT ---
    secret_key: str = "change-me-in-production"
    jwt_algorithm: str = "HS256"
    # Minutes until an access token expires.
    access_token_expire_minutes: int = 60 * 24 * 7  # 7 days for the MVP

    # --- Uploads ---
    uploads_dir: str = "./uploads"
    max_upload_bytes: int = 20 * 1024 * 1024  # 20 MB

    # --- AI provider ---
    # Leave ai_api_key empty to run without AI generation; endpoints then
    # return a clear "not configured" error instead of crashing.
    ai_api_key: str = ""
    ai_provider: str = "openai"  # "openai" | "anthropic"
    ai_model: str = ""  # provider default is used when empty
    ai_base_url: str = ""  # override for OpenAI-compatible endpoints


@lru_cache
def get_settings() -> Settings:
    return Settings()


settings = get_settings()
