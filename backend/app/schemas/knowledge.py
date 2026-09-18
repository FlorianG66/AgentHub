from pydantic import BaseModel, ConfigDict
from typing import Optional
from datetime import datetime

class KnowledgeBase(BaseModel):
    title: str
    category: Optional[str] = "general"
    content: str

class KnowledgeCreate(KnowledgeBase):
    id: Optional[str] = None
    tenant_id: str

class KnowledgeResponse(KnowledgeBase):
    id: str
    tenant_id: str
    created_at: datetime

    model_config = ConfigDict(from_attributes=True)
