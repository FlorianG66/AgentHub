from typing import List
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select
from app.models.knowledge import KnowledgeDoc

class KnowledgeService:
    @staticmethod
    async def get_relevant_context(db: AsyncSession, tenant_id: str, query: str = "") -> str:
        """
        Récupère les documents de connaissances de l'entreprise pour enrichir le prompt de l'agent (RAG).
        """
        stmt = select(KnowledgeDoc).where(KnowledgeDoc.tenant_id == tenant_id)
        result = await db.execute(stmt)
        docs = result.scalars().all()

        if not docs:
            return "Aucun document d'entreprise renseigné pour le moment."

        context_parts = []
        for doc in docs:
            context_parts.append(f"--- Document: {doc.title} ({doc.category}) ---\n{doc.content}\n")

        return "\n".join(context_parts)

knowledge_service = KnowledgeService()
