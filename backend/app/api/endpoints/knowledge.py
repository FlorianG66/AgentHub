import uuid
from fastapi import APIRouter, Depends, HTTPException, Query
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select
from typing import List

from app.core.database import get_db
from app.models.knowledge import KnowledgeDoc
from app.schemas.knowledge import KnowledgeResponse, KnowledgeCreate

router = APIRouter()

@router.get("", response_model=List[KnowledgeResponse])
async def list_knowledge_docs(tenant_id: str = Query(...), db: AsyncSession = Depends(get_db)):
    """Documents de connaissances enregistrés pour l'entreprise."""
    stmt = select(KnowledgeDoc).where(KnowledgeDoc.tenant_id == tenant_id)
    res = await db.execute(stmt)
    return res.scalars().all()

@router.post("", response_model=KnowledgeResponse)
async def create_knowledge_doc(payload: KnowledgeCreate, db: AsyncSession = Depends(get_db)):
    """Ajout d'un document ou guide à la base de connaissances."""
    doc_id = payload.id or f"doc_{uuid.uuid4().hex[:8]}"
    doc = KnowledgeDoc(
        id=doc_id,
        tenant_id=payload.tenant_id,
        title=payload.title,
        category=payload.category or "general",
        content=payload.content
    )
    db.add(doc)
    await db.commit()
    await db.refresh(doc)
    return doc

@router.delete("/{doc_id}")
async def delete_knowledge_doc(doc_id: str, db: AsyncSession = Depends(get_db)):
    doc = await db.get(KnowledgeDoc, doc_id)
    if not doc:
        raise HTTPException(status_code=404, detail="Document introuvable.")
    await db.delete(doc)
    await db.commit()
    return {"message": "Document supprimé avec succès."}
