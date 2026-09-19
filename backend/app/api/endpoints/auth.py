from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy import select
from sqlalchemy.ext.asyncio import AsyncSession

from app.api.deps import get_current_user
from app.core.database import get_db
from app.core.security import create_access_token, verify_password
from app.models.tenant import Tenant
from app.models.user import User
from app.schemas.auth import LoginRequest, LoginResponse, MeResponse, UserResponse

router = APIRouter()


@router.post("/login", response_model=LoginResponse)
async def login(payload: LoginRequest, db: AsyncSession = Depends(get_db)):
    """Authentifie un utilisateur et retourne son jeton d'accès + son espace."""
    email = payload.email.strip().lower()
    res = await db.execute(select(User).where(User.email == email))
    user = res.scalar_one_or_none()

    if user is None or not verify_password(payload.password, user.hashed_password):
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Email ou mot de passe incorrect.",
        )
    if not user.is_active:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Compte désactivé. Contactez l'administrateur.",
        )

    tenant = None
    if user.tenant_id:
        tenant = await db.get(Tenant, user.tenant_id)

    return {
        "access_token": create_access_token(user.id),
        "token_type": "bearer",
        "user": UserResponse.model_validate(user).model_dump(),
        "tenant": {
            "id": tenant.id,
            "name": tenant.name,
            "slug": tenant.slug,
            "plan": tenant.plan,
            "settings": tenant.settings,
        } if tenant else None,
    }


@router.get("/me", response_model=MeResponse)
async def me(user: User = Depends(get_current_user), db: AsyncSession = Depends(get_db)):
    """Retourne l'utilisateur courant + son espace (restauration de session côté frontend)."""
    tenant = None
    if user.tenant_id:
        t = await db.get(Tenant, user.tenant_id)
        if t:
            tenant = {
                "id": t.id,
                "name": t.name,
                "slug": t.slug,
                "plan": t.plan,
                "settings": t.settings,
            }
    return {"user": UserResponse.model_validate(user).model_dump(), "tenant": tenant}