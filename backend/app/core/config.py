"""Application configuration via environment variables (.env supported)."""

from functools import lru_cache

from pydantic_settings import BaseSettings, SettingsConfigDict


class Settings(BaseSettings):
    model_config = SettingsConfigDict(env_file=".env", env_file_encoding="utf-8", extra="ignore")

    # --- App ---
    app_name: str = "StudyAI API"
    # Comma-separated origins for Vite development and the Capacitor WebView.
    cors_origins: str = "http://localhost:5173,http://127.0.0.1:5173,https://localhost"

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

    # --- Storage backend ---
    # "local" (default) stores files on the local filesystem.
    # "s3" stores files in an S3-compatible bucket (S3, MinIO, R2, etc.).
    storage_backend: str = "local"
    s3_endpoint_url: str = ""
    s3_bucket_name: str = ""
    s3_access_key_id: str = ""
    s3_secret_access_key: str = ""
    s3_region: str = "us-east-1"

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
