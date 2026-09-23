import secrets
from typing import List, Optional

from fastapi import APIRouter, Depends, HTTPException, Query, status
from pydantic import BaseModel
from sqlalchemy import select
from sqlalchemy.ext.asyncio import AsyncSession

from app.api.deps import authorize_tenant, get_current_user
from app.core.database import get_db
from app.core.security import hash_password
from app.models.tenant import Tenant
from app.models.user import User
from app.schemas.auth import InviteUserRequest, InviteUserResponse, UserResponse
from app.services.emails import send_invitation_email

router = APIRouter()

ALLOWED_ROLES = {"user", "client_admin"}


class UpdateUserPayload(BaseModel):
    role: Optional[str] = None  # "user" | "client_admin"
    is_active: Optional[bool] = None


def _require_tenant_admin(user: User, tenant_id: str) -> None:
    """Seul un super_admin ou un client_admin du tenant peut gérer les utilisateurs."""
    if user.role == "super_admin":
        return
    if user.role != "client_admin" or user.tenant_id != tenant_id:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Réservé à l'administrateur de l'espace.",
        )


@router.get("", response_model=List[UserResponse])
async def list_users(
    tenant_id: str = Query(...),
    user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db),
):
    """Liste les collaborateurs d'un espace client (client_admin ou super_admin)."""
    authorize_tenant(user, tenant_id)
    res = await db.execute(
        select(User).where(User.tenant_id == tenant_id).order_by(User.created_at)
    )
    return res.scalars().all()


@router.post("/invite", response_model=InviteUserResponse, status_code=status.HTTP_201_CREATED)
async def invite_user(
    payload: InviteUserRequest,
    tenant_id: str = Query(...),
    user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db),
):
    """Invite un collaborateur dans l'espace client.

    Un mot de passe temporaire est généré (et renvoyé en mode console / envoyé
    par e-mail en mode SMTP). Le collaborateur pourra ensuite le modifier via
    la réinitialisation de mot de passe.
    """
    _require_tenant_admin(user, tenant_id)
    tenant = await db.get(Tenant, tenant_id)
    if not tenant:
        raise HTTPException(status_code=404, detail="Tenant introuvable.")

    if payload.role not in ALLOWED_ROLES:
        raise HTTPException(status_code=400, detail="Rôle invalide (user ou client_admin).")

    email = payload.email.strip().lower()
    existing = (await db.execute(select(User).where(User.email == email))).scalar_one_or_none()
    if existing:
        raise HTTPException(status_code=400, detail="Un compte existe déjà avec cet e-mail.")

    temporary_password = secrets.token_urlsafe(9)
    suffix = secrets.token_urlsafe(4).lower()
    new_user = User(
        id=f"user_{tenant.slug}_{suffix}",
        tenant_id=tenant_id,
        email=email,
        full_name=payload.full_name.strip(),
        hashed_password=hash_password(temporary_password),
        role=payload.role,
        is_active=True,
    )
    db.add(new_user)
    await db.commit()
    await db.refresh(new_user)

    send_invitation_email(new_user.email, new_user.full_name, temporary_password)

    return {
        "user": UserResponse.model_validate(new_user).model_dump(),
        "temporary_password": temporary_password,
    }


@router.patch("/{user_id}", response_model=UserResponse)
async def update_user(
    user_id: str,
    payload: UpdateUserPayload,
    tenant_id: str = Query(...),
    user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db),
):
    """Modifie le rôle ou l'activation d'un collaborateur (client_admin ou super_admin)."""
    _require_tenant_admin(user, tenant_id)
    target = await db.get(User, user_id)
    if not target or target.tenant_id != tenant_id:
        raise HTTPException(status_code=404, detail="Utilisateur introuvable.")

    if payload.role is not None:
        if target.role == "super_admin":
            raise HTTPException(status_code=400, detail="Impossible de modifier un super-admin.")
        if payload.role not in ALLOWED_ROLES:
            raise HTTPException(status_code=400, detail="Rôle invalide (user ou client_admin).")
        target.role = payload.role
    if payload.is_active is not None:
        if target.role == "super_admin":
            raise HTTPException(status_code=400, detail="Impossible de désactiver un super-admin.")
        target.is_active = payload.is_active

    await db.commit()
    await db.refresh(target)
    return target