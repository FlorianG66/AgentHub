import datetime
from sqlalchemy import Column, String, Text, DateTime, ForeignKey
from app.core.database import Base

class KnowledgeDoc(Base):
    """
    Documents de la base de connaissances (charte, guides, FAQ, tarifs).
    Les agents y accèdent pour personnaliser leurs réponses au contexte de l'entreprise.
    """
    __tablename__ = "knowledge_docs"

    id = Column(String, primary_key=True, index=True)
    tenant_id = Column(String, ForeignKey("tenants.id"), nullable=False, index=True)
    title = Column(String, nullable=False)
    category = Column(String, default="general")  # charte_editoriale, offres, faq, regles_rh
    content = Column(Text, nullable=False)
    created_at = Column(DateTime, default=datetime.datetime.utcnow)
