import datetime
from sqlalchemy import Column, String, Text, DateTime, JSON, ForeignKey
from app.core.database import Base

class Agent(Base):
    """
    Modèle d'un Agent IA humanisé.
    Chaque agent a une identité propre, un rôle, des compétences et un prompt système.
    """
    __tablename__ = "agents"

    id = Column(String, primary_key=True, index=True)
    tenant_id = Column(String, ForeignKey("tenants.id"), nullable=False, index=True)
    name = Column(String, nullable=False)  # ex: Léa, Marc, Sophie, Thomas
    role = Column(String, nullable=False)  # ex: Community Manager
    avatar = Column(String, nullable=False)  # url ou identifiant d'avatar
    bio = Column(Text, default="")
    system_prompt = Column(Text, nullable=False)
    capabilities = Column(JSON, default=list)  # ex: ["social_media", "planning", "copywriting"]
    status = Column(String, default="available")  # available, busy, offline
    created_at = Column(DateTime, default=datetime.datetime.utcnow)
