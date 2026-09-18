from pydantic import BaseModel, ConfigDict
from typing import Optional, Dict, Any
from datetime import datetime

class TenantBase(BaseModel):
    name: str
    slug: str
    plan: Optional[str] = "pro"
    settings: Optional[Dict[str, Any]] = {}

class TenantCreate(TenantBase):
    id: Optional[str] = None

class TenantResponse(TenantBase):
    id: str
    created_at: datetime

    model_config = ConfigDict(from_attributes=True)
