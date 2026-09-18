import datetime
from sqlalchemy import Column, String, Text, DateTime, JSON, ForeignKey
from app.core.database import Base

class Task(Base):
    """
    Tâche ou mission exécutée par un agent (ou une équipe d'agents en collaboration).
    Conserve les logs de discussion inter-agents et le résultat final.
    """
    __tablename__ = "tasks"

    id = Column(String, primary_key=True, index=True)
    tenant_id = Column(String, ForeignKey("tenants.id"), nullable=False, index=True)
    primary_agent_id = Column(String, ForeignKey("agents.id"), nullable=False)
    title = Column(String, nullable=False)
    prompt = Column(Text, nullable=False)
    status = Column(String, default="pending")  # pending, running, completed, failed, awaiting_approval
    result = Column(Text, nullable=True)
    
    # Historique structuré des échanges et des étapes (ex: Léa consulte Marc, etc.)
    logs = Column(JSON, default=list)
    
    created_at = Column(DateTime, default=datetime.datetime.utcnow)
    updated_at = Column(DateTime, default=datetime.datetime.utcnow, onupdate=datetime.datetime.utcnow)
