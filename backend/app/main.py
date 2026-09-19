from contextlib import asynccontextmanager
from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware

from app.core.config import settings
from app.core.database import engine, Base, AsyncSessionLocal
from app.initial_data import init_db_data
from app.api.router import api_router

@asynccontextmanager
async def lifespan(app: FastAPI):
    """Cycle de vie de l'application : création des tables SQLite et insertion des données initiales."""
    async with engine.begin() as conn:
        await conn.run_sync(Base.metadata.create_all)

    async with AsyncSessionLocal() as session:
        await init_db_data(session)

    yield

app = FastAPI(
    title=settings.PROJECT_NAME,
    description="Plateforme SaaS d'hébergement et d'orchestration d'Agents IA pour TPE/PME.",
    version="1.0.0",
    lifespan=lifespan
)

# Configuration CORS pour autoriser le frontend Next.js
app.add_middleware(
    CORSMiddleware,
    allow_origins=settings.BACKEND_CORS_ORIGINS,
    allow_origin_regex=settings.BACKEND_CORS_ORIGIN_REGEX,
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

app.include_router(api_router, prefix=settings.API_V1_STR)

@app.get("/health")
async def health_check():
    return {"status": "healthy", "service": settings.PROJECT_NAME}

if __name__ == "__main__":
    import uvicorn
    uvicorn.run("app.main:app", host="127.0.0.1", port=8000, reload=True)
