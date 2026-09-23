import json
from typing import Annotated, List

from pydantic import field_validator
from pydantic_settings import BaseSettings, NoDecode, SettingsConfigDict

class Settings(BaseSettings):
    PROJECT_NAME: str = "AIAgents SaaS Platform"
    API_V1_STR: str = "/api"
    APP_ENV: str = "development"  # development | production
    DATABASE_URL: str = "sqlite+aiosqlite:///./platform.db"
    FRONTEND_URL: str = "http://localhost:3000"

    # Authentification JWT
    SECRET_KEY: str = "dev-secret-key-change-moi-en-production"
    JWT_ALGORITHM: str = "HS256"
    ACCESS_TOKEN_EXPIRE_MINUTES: int = 60 * 12  # 12 heures
    PASSWORD_RESET_EXPIRE_MINUTES: int = 30

    # Comptes seedés de démonstration (à surcharger / masquer en production)
    SEED_ADMIN_EMAIL: str = "admin@agenthub.local"
    SEED_ADMIN_PASSWORD: str = "admin123"
    SEED_CLIENT_EMAIL: str = "contact@boulangerie.com"
    SEED_CLIENT_PASSWORD: str = "client123"

    # Notifications e-mail
    # "console" = le jeton de réinitialisation est renvoyé dans la réponse (dev/démo)
    # "smtp" = envoi via un serveur SMTP
    EMAIL_BACKEND: str = "console"
    SMTP_HOST: str = ""
    SMTP_PORT: int = 587
    SMTP_USERNAME: str = ""
    SMTP_PASSWORD: str = ""
    SMTP_FROM: str = "noreply@agenthub.local"
    SMTP_USE_TLS: bool = True

    # Configuration LLM (Optionnelle - un moteur de simulation intelligent prend le relais si non renseigné)
    OPENAI_API_KEY: str = ""
    OPENAI_BASE_URL: str = "https://api.openai.com/v1"
    OPENAI_MODEL: str = "gpt-4o-mini"
    
    # CORS (frontend Next.js en local + tunnels Cloudflare de partage public)
    BACKEND_CORS_ORIGINS: Annotated[List[str], NoDecode] = [
        "http://localhost:3000",
        "http://127.0.0.1:3000",
        "http://localhost:3001",
        "http://127.0.0.1:3001",
    ]
    BACKEND_CORS_ORIGIN_REGEX: str = r"https://.*\.trycloudflare\.com"

    @property
    def is_production(self) -> bool:
        return self.APP_ENV.lower() == "production"

    @field_validator("BACKEND_CORS_ORIGINS", mode="before")
    @classmethod
    def _split_cors_origins(cls, v):
        """Accepte une liste JSON ou une chaîne séparée par des virgules dans .env."""
        if isinstance(v, str):
            v = v.strip()
            if v.startswith("["):
                parsed = json.loads(v)
                return [item.strip() for item in parsed if item.strip()]
            return [item.strip() for item in v.split(",") if item.strip()]
        return v

    model_config = SettingsConfigDict(env_file=".env", extra="ignore")

settings = Settings()