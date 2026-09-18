from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select
from typing import List

from app.core.database import get_db
from app.models.tenant import Tenant
from app.schemas.tenant import TenantResponse, TenantCreate

router = APIRouter()

@router.get("", response_model=List[TenantResponse])
async def list_tenants(db: AsyncSession = Depends(get_db)):
    """Super Admin : Liste toutes les entreprises (tenants) inscrites sur la plateforme."""
    stmt = select(Tenant)
    res = await db.execute(stmt)
    return res.scalars().all()

@router.post("", response_model=TenantResponse)
async def create_tenant(payload: TenantCreate, db: AsyncSession = Depends(get_db)):
    """Création d'un nouvel espace client."""
    tenant_id = payload.id or f"tenant_{payload.slug}"
    existing = await db.get(Tenant, tenant_id)
    if existing:
        raise HTTPException(status_code=400, detail="Ce tenant existe déjà.")

    tenant = Tenant(
        id=tenant_id,
        name=payload.name,
        slug=payload.slug,
        plan=payload.plan or "pro",
        settings=payload.settings or {}
    )
    db.add(tenant)
    await db.commit()
    await db.refresh(tenant)
    return tenant

@router.get("/{tenant_id}", response_model=TenantResponse)
async def get_tenant(tenant_id: str, db: AsyncSession = Depends(get_db)):
    tenant = await db.get(Tenant, tenant_id)
    if not tenant:
        raise HTTPException(status_code=404, detail="Tenant introuvable.")
    return tenant
