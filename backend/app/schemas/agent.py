from pydantic import BaseModel, ConfigDict
from typing import List, Optional
from datetime import datetime

class AgentBase(BaseModel):
    name: str
    role: str
    avatar: str
    bio: Optional[str] = ""
    system_prompt: str
    capabilities: List[str] = []
    status: Optional[str] = "available"

class AgentCreate(AgentBase):
    id: Optional[str] = None
    tenant_id: str

class AgentUpdate(BaseModel):
    name: Optional[str] = None
    role: Optional[str] = None
    avatar: Optional[str] = None
    bio: Optional[str] = None
    system_prompt: Optional[str] = None
    capabilities: Optional[List[str]] = None
    status: Optional[str] = None

class AgentResponse(AgentBase):
    id: str
    tenant_id: str
    created_at: datetime

    model_config = ConfigDict(from_attributes=True)
