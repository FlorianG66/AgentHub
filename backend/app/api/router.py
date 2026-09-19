from fastapi import APIRouter, Depends
from app.api.deps import get_current_user, require_super_admin
from app.api.endpoints import tenants, agents, tasks, approvals, knowledge, settings, auth

api_router = APIRouter()

api_router.include_router(auth.router, prefix="/auth", tags=["Auth"])
api_router.include_router(
    tenants.router,
    prefix="/tenants",
    tags=["Tenants"],
    dependencies=[Depends(require_super_admin)],
)
api_router.include_router(
    agents.router,
    prefix="/agents",
    tags=["Agents"],
    dependencies=[Depends(get_current_user)],
)
api_router.include_router(
    tasks.router,
    prefix="/tasks",
    tags=["Tasks"],
    dependencies=[Depends(get_current_user)],
)
api_router.include_router(
    approvals.router,
    prefix="/approvals",
    tags=["Approvals"],
    dependencies=[Depends(get_current_user)],
)
api_router.include_router(
    knowledge.router,
    prefix="/knowledge",
    tags=["Knowledge"],
    dependencies=[Depends(get_current_user)],
)
api_router.include_router(
    settings.router,
    prefix="/settings",
    tags=["Settings"],
    dependencies=[Depends(get_current_user)],
)