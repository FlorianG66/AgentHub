from fastapi import APIRouter
from app.api.endpoints import tenants, agents, tasks, approvals, knowledge, settings

api_router = APIRouter()

api_router.include_router(tenants.router, prefix="/tenants", tags=["Tenants"])
api_router.include_router(agents.router, prefix="/agents", tags=["Agents"])
api_router.include_router(tasks.router, prefix="/tasks", tags=["Tasks"])
api_router.include_router(approvals.router, prefix="/approvals", tags=["Approvals"])
api_router.include_router(knowledge.router, prefix="/knowledge", tags=["Knowledge"])
api_router.include_router(settings.router, prefix="/settings", tags=["Settings"])
