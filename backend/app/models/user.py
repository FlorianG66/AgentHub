import datetime
from sqlalchemy import Column, String, DateTime, Boolean, ForeignKey
from app.core.database import Base

class User(Base):
    """
    Utilisateur de la plateforme.
    - super_admin : administrateur plateforme (accès à tous les tenants)
    - client_admin : administrateur d'un espace client (tenant)
    - user : membre simple d'un espace client
    """
    __tablename__ = "users"

    id = Column(String, primary_key=True, index=True)
    tenant_id = Column(String, ForeignKey("tenants.id"), nullable=True, index=True)
    email = Column(String, unique=True, index=True, nullable=False)
    full_name = Column(String, nullable=False)
    hashed_password = Column(String, nullable=False)
    role = Column(String, default="user")  # super_admin, client_admin, user
    is_active = Column(Boolean, default=True)
    created_at = Column(DateTime, default=datetime.datetime.utcnow)