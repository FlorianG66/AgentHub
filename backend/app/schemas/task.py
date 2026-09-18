from pydantic import BaseModel, ConfigDict
from typing import List, Optional, Any, Dict
from datetime import datetime

from app.schemas.agent import AgentResponse

class TaskCreate(BaseModel):
    tenant_id: str
    primary_agent_id: str
    title: str
    prompt: str

class TaskResponse(BaseModel):
    id: str
    tenant_id: str
    primary_agent_id: str
    title: str
    prompt: str
    status: str
    result: Optional[str] = None
    logs: List[Dict[str, Any]] = []
    created_at: datetime
    updated_at: datetime

    model_config = ConfigDict(from_attributes=True)

class TaskRunRequest(BaseModel):
    prompt: str
    primary_agent_id: str

class TaskChatRequest(BaseModel):
    prompt: str

class TaskChatResponse(BaseModel):
    task: TaskResponse
    agent: AgentResponse
