"""Application settings, loaded from environment variables and backend/.env."""

import secrets

from pydantic_settings import BaseSettings


class Settings(BaseSettings):
    """Application settings loaded from environment variables."""
    api_host: str = "0.0.0.0"
    api_port: int = 8000
    cors_origins: str = "http://localhost:5173"
    database_path: str = "backend/underwriting.db"

    # Signing key for login tokens. If SECRET_KEY is not set, a random key is
    # generated at start-up, which means every restart logs everyone out.
    secret_key: str = secrets.token_urlsafe(48)
    access_token_minutes: int = 60

    class Config:
        env_file = "backend/.env"
        env_file_encoding = "utf-8"


settings = Settings()
