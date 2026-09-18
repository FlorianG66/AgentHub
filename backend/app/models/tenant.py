import datetime
from sqlalchemy import Column, String, DateTime, JSON
from app.core.database import Base

class Tenant(Base):
    """
    Modèle Entreprise (Tenant) pour le multi-tenant.
    Chaque client TPE/PME dispose de son propre tenant_id isolé.
    """
    __tablename__ = "tenants"

    id = Column(String, primary_key=True, index=True)
    name = Column(String, nullable=False)
    slug = Column(String, unique=True, index=True)
    plan = Column(String, default="pro")  # starter, pro, enterprise
    created_at = Column(DateTime, default=datetime.datetime.utcnow)
    settings = Column(JSON, default=dict)
