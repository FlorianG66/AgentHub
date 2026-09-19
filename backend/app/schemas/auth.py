from typing import Optional

from pydantic import BaseModel, ConfigDict


class LoginRequest(BaseModel):
    email: str
    password: str


class UserResponse(BaseModel):
    model_config = ConfigDict(from_attributes=True)

    id: str
    tenant_id: Optional[str] = None
    email: str
    full_name: str
    role: str


class TenantBrief(BaseModel):
    id: str
    name: str
    slug: Optional[str] = None
    plan: Optional[str] = None
    settings: Optional[dict] = None


class LoginResponse(BaseModel):
    access_token: str
    token_type: str = "bearer"
    user: UserResponse
    tenant: Optional[TenantBrief] = None


class MeResponse(BaseModel):
    user: UserResponse
    tenant: Optional[TenantBrief] = None