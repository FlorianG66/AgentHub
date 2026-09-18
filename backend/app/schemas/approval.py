from pydantic import BaseModel, ConfigDict
from typing import Optional, Any, Dict
from datetime import datetime

class ApprovalResponse(BaseModel):
    id: str
    tenant_id: str
    task_id: Optional[str] = None
    agent_id: str
    title: str
    description: str
    action_type: str
    payload: Dict[str, Any] = {}
    agent_rationale: Optional[str] = ""
    status: str
    rejection_reason: Optional[str] = None
    created_at: datetime
    resolved_at: Optional[datetime] = None

    model_config = ConfigDict(from_attributes=True)

class ApprovalDecision(BaseModel):
    action: str  # "approve" ou "reject"
    reason: Optional[str] = None
