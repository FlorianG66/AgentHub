import uuid
from fastapi import APIRouter, Depends, HTTPException, Query
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select
from typing import List

from app.core.database import get_db
from app.models.agent import Agent
from app.schemas.agent import AgentResponse, AgentCreate

router = APIRouter()

@router.get("", response_model=List[AgentResponse])
async def list_agents(tenant_id: str = Query(...), db: AsyncSession = Depends(get_db)):
    """Liste tous les agents virtuels d'une entreprise donnée."""
    stmt = select(Agent).where(Agent.tenant_id == tenant_id)
    res = await db.execute(stmt)
    return res.scalars().all()

@router.post("", response_model=AgentResponse)
async def create_agent(payload: AgentCreate, db: AsyncSession = Depends(get_db)):
    """Recruter / Créer un nouvel agent IA dans l'équipe."""
    agent_id = payload.id or f"agent_{uuid.uuid4().hex[:8]}"
    agent = Agent(
        id=agent_id,
        tenant_id=payload.tenant_id,
        name=payload.name,
        role=payload.role,
        avatar=payload.avatar,
        bio=payload.bio or "",
        system_prompt=payload.system_prompt,
        capabilities=payload.capabilities or [],
        status=payload.status or "available"
    )
    db.add(agent)
    await db.commit()
    await db.refresh(agent)
    return agent

@router.get("/{agent_id}", response_model=AgentResponse)
async def get_agent(agent_id: str, db: AsyncSession = Depends(get_db)):
    agent = await db.get(Agent, agent_id)
    if not agent:
        raise HTTPException(status_code=404, detail="Agent introuvable.")
    return agent
