import datetime
from fastapi import APIRouter, Depends, HTTPException, Query
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select
from typing import List

from app.core.database import get_db
from app.models.approval import ApprovalRequest
from app.schemas.approval import ApprovalResponse, ApprovalDecision

router = APIRouter()

@router.get("", response_model=List[ApprovalResponse])
async def list_approvals(tenant_id: str = Query(...), db: AsyncSession = Depends(get_db)):
    """File d'attente de validation humaine (Human-in-the-Loop)."""
    stmt = (
        select(ApprovalRequest)
        .where(ApprovalRequest.tenant_id == tenant_id)
        .order_by(ApprovalRequest.created_at.desc())
    )
    res = await db.execute(stmt)
    return res.scalars().all()

@router.post("/{approval_id}/decision", response_model=ApprovalResponse)
async def process_decision(
    approval_id: str,
    decision: ApprovalDecision,
    db: AsyncSession = Depends(get_db)
):
    """
    Approbation ou rejet d'une action proposée par un agent.
    Si approuvée, l'action est réputée transmise à l'outil final (ex: publication LinkedIn).
    """
    approval = await db.get(ApprovalRequest, approval_id)
    if not approval:
        raise HTTPException(status_code=404, detail="Demande d'approbation introuvable.")

    if decision.action == "approve":
        approval.status = "approved"
    elif decision.action == "reject":
        approval.status = "rejected"
        approval.rejection_reason = decision.reason or "Refusé par l'administrateur"
    else:
        raise HTTPException(status_code=400, detail="Action invalide. Utilisez 'approve' ou 'reject'.")

    approval.resolved_at = datetime.datetime.utcnow()
    await db.commit()
    await db.refresh(approval)
    return approval
