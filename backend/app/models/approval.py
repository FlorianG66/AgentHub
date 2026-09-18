import datetime
from sqlalchemy import Column, String, Text, DateTime, JSON, ForeignKey
from app.core.database import Base

class ApprovalRequest(Base):
    """
    File de validation 'Human-in-the-Loop'.
    Toute action à impact externe (ex: publier sur LinkedIn, envoyer un contrat)
    est soumise à validation humaine avant d'être exécutée.
    """
    __tablename__ = "approval_requests"

    id = Column(String, primary_key=True, index=True)
    tenant_id = Column(String, ForeignKey("tenants.id"), nullable=False, index=True)
    task_id = Column(String, ForeignKey("tasks.id"), nullable=True)
    agent_id = Column(String, ForeignKey("agents.id"), nullable=False)
    title = Column(String, nullable=False)
    description = Column(Text, nullable=False)
    action_type = Column(String, nullable=False)  # ex: "publish_linkedin_post", "send_email", "export_report"
    payload = Column(JSON, default=dict)  # Contenu exact de l'action (ex: texte du post, date, tags)
    agent_rationale = Column(Text, default="")  # Pourquoi l'agent propose cette action
    status = Column(String, default="pending")  # pending, approved, rejected
    rejection_reason = Column(Text, nullable=True)
    created_at = Column(DateTime, default=datetime.datetime.utcnow)
    resolved_at = Column(DateTime, nullable=True)
