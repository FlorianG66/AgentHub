import os
from pydantic_settings import BaseSettings, SettingsConfigDict
from typing import List

class Settings(BaseSettings):
    PROJECT_NAME: str = "AIAgents SaaS Platform"
    API_V1_STR: str = "/api"
    DATABASE_URL: str = "sqlite+aiosqlite:///./platform.db"

    # Authentification JWT
    SECRET_KEY: str = "dev-secret-key-change-moi-en-production"
    JWT_ALGORITHM: str = "HS256"
    ACCESS_TOKEN_EXPIRE_MINUTES: int = 60 * 12  # 12 heures
    
    # Configuration LLM (Optionnelle - un moteur de simulation intelligent prend le relais si non renseigné)
    OPENAI_API_KEY: str = ""
    OPENAI_BASE_URL: str = "https://api.openai.com/v1"
    OPENAI_MODEL: str = "gpt-4o-mini"
    
    # CORS (frontend Next.js en local + tunnels de démonstration Cloudflare)
    BACKEND_CORS_ORIGINS: List[str] = [
        "http://localhost:3000",
        "http://127.0.0.1:3000",
        "http://localhost:3001",
    ]
    BACKEND_CORS_ORIGIN_REGEX: str = r"https://.*\.trycloudflare\.com"

    model_config = SettingsConfigDict(env_file=".env", extra="ignore")

settings = Settings()
