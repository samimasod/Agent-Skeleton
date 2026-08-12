"""Configuration settings for the SuperAdmin Monitoring API microservice."""

from pathlib import Path
from typing import List, Optional
from pydantic import Field, field_validator
from pydantic_settings import BaseSettings


class AdminSettings(BaseSettings):
    """SuperAdmin API settings loaded from environment variables."""

    environment: str = Field(default="local", alias="DATABASE_ENV")
    debug: bool = Field(default=True, alias="API_DEBUG")
    api_host: str = Field(default="0.0.0.0", alias="ADMIN_API_HOST")
    api_port: int = Field(default=8001, alias="ADMIN_API_PORT")

    database_env: str = Field(default="local", alias="DATABASE_ENV")
    database_url: Optional[str] = Field(default=None, alias="DATABASE_URL")

    super_admin_api_key: str = Field(default="sk_admin_secret_key_12345", alias="SUPER_ADMIN_API_KEY")
    super_admin_emails_raw: str = Field(default="", alias="SUPER_ADMIN_EMAILS")

    llm_provider: str = Field(default="openrouter", alias="LLM_PROVIDER")
    storage_provider: str = Field(default="local", alias="STORAGE_PROVIDER")
    cache_backend: str = Field(default="redis", alias="CACHE_BACKEND")
    redis_url: Optional[str] = Field(default="redis://localhost:6379/0", alias="REDIS_URL")

    cors_origins: List[str] = Field(default=["http://localhost:3002", "http://localhost:5173"])

    class Config:
        env_file = (".env", ".env.local")
        env_file_encoding = "utf-8"
        case_sensitive = False
        extra = "ignore"

    @field_validator("cors_origins", mode="before")
    @classmethod
    def parse_cors_origins(cls, v):
        if isinstance(v, str):
            if v.startswith("[") and v.endswith("]"):
                import json
                try:
                    return json.loads(v)
                except Exception:
                    pass
            return [item.strip() for item in v.split(",") if item.strip()]
        return v

    @property
    def super_admin_emails(self) -> List[str]:
        return [
            email.strip().lower()
            for email in self.super_admin_emails_raw.split(",")
            if email.strip()
        ]


admin_settings = AdminSettings()
