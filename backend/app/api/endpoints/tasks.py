from fastapi import APIRouter, Depends, HTTPException, Query
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select
from typing import List

from app.core.database import get_db
from app.models.task import Task
from app.models.user import User
from app.schemas.task import TaskResponse, TaskRunRequest, TaskChatRequest, TaskChatResponse
from app.services.agent_orchestrator import agent_orchestrator
from app.services.agent_router import agent_router
from app.api.deps import get_current_user, authorize_tenant, authorize_resource

router = APIRouter()

@router.get("", response_model=List[TaskResponse])
async def list_tasks(
    tenant_id: str = Query(...),
    user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db)
):
    """Historique des missions pour le tenant sélectionné."""
    authorize_tenant(user, tenant_id)
    stmt = select(Task).where(Task.tenant_id == tenant_id).order_by(Task.created_at.desc())
    res = await db.execute(stmt)
    return res.scalars().all()

@router.post("/run", response_model=TaskResponse)
async def run_mission(
    payload: TaskRunRequest,
    tenant_id: str = Query(...),
    user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db)
):
    """
    Déclenche une mission auprès d'un agent.
    Le moteur orchestre la collaboration entre agents, consulte les outils et la base de connaissances.
    """
    authorize_tenant(user, tenant_id)
    task = await agent_orchestrator.execute_task(
        db=db,
        tenant_id=tenant_id,
        primary_agent_id=payload.primary_agent_id,
        prompt=payload.prompt,
        title=payload.prompt[:50] + ("..." if len(payload.prompt) > 50 else "")
    )
    return task

@router.post("/chat", response_model=TaskChatResponse)
async def chat_mission(
    payload: TaskChatRequest,
    tenant_id: str = Query(...),
    user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db)
):
    """
    Chat de groupe : sélectionne automatiquement l'agent le plus compétent
    pour la mission, puis déclenche son exécution complète.
    """
    authorize_tenant(user, tenant_id)
    agent = await agent_router.pick_best_agent(db, tenant_id, payload.prompt, history=payload.history)
    task = await agent_orchestrator.execute_task(
        db=db,
        tenant_id=tenant_id,
        primary_agent_id=agent.id,
        prompt=payload.prompt,
        title=payload.prompt[:50] + ("..." if len(payload.prompt) > 50 else ""),
        history=payload.history
    )
    return TaskChatResponse(task=task, agent=agent)

@router.get("/{task_id}", response_model=TaskResponse)
async def get_task(
    task_id: str,
    user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db)
):
    """Détail complet d'une tâche avec logs d'échanges inter-agents."""
    task = await db.get(Task, task_id)
    if not task:
        raise HTTPException(status_code=404, detail="Tâche introuvable.")
    authorize_resource(user, task.tenant_id)
    return task
