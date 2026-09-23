from datetime import datetime
from typing import Optional

from pydantic import BaseModel, ConfigDict, EmailStr, Field


class LoginRequest(BaseModel):
    email: str
    password: str


class RegisterRequest(BaseModel):
    company_name: str = Field(min_length=1, max_length=120)
    full_name: str = Field(min_length=1, max_length=120)
    email: EmailStr
    password: str = Field(min_length=8, max_length=128)
    tenant_slug: Optional[str] = Field(default=None, max_length=80)


class ForgotPasswordRequest(BaseModel):
    email: EmailStr


class ResetPasswordRequest(BaseModel):
    token: str
    new_password: str = Field(min_length=8, max_length=128)


class ResetPasswordResponse(BaseModel):
    message: str
    reset_url: Optional[str] = None
    reset_token: Optional[str] = None  # renvoyé uniquement en mode console (démo/dev)


class UserResponse(BaseModel):
    model_config = ConfigDict(from_attributes=True)

    id: str
    tenant_id: Optional[str] = None
    email: str
    full_name: str
    role: str
    is_active: bool = True
    created_at: Optional[datetime] = None


class InviteUserRequest(BaseModel):
    email: EmailStr
    full_name: str = Field(min_length=1, max_length=120)
    role: str = "user"  # "user" | "client_admin"


class InviteUserResponse(BaseModel):
    user: UserResponse
    temporary_password: str  # renvoyé une seule fois (mode console / sans SMTP)


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