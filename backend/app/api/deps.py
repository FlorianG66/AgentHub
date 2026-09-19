from typing import Optional

from fastapi import Depends, HTTPException, Query, status
from fastapi.security import HTTPAuthorizationCredentials, HTTPBearer
from sqlalchemy.ext.asyncio import AsyncSession

from app.core.database import get_db
from app.core.security import decode_access_token
from app.models.user import User

bearer_scheme = HTTPBearer(auto_error=False)


async def get_current_user(
    credentials: Optional[HTTPAuthorizationCredentials] = Depends(bearer_scheme),
    db: AsyncSession = Depends(get_db),
) -> User:
    """Dépendance : récupère l'utilisateur authentifié à partir du jeton Bearer."""
    if credentials is None:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Authentification requise. Ajoutez un jeton d'accès.",
        )
    try:
        payload = decode_access_token(credentials.credentials)
    except Exception:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Jeton invalide ou expiré.",
        )

    user = await db.get(User, payload.get("sub"))
    if user is None or not user.is_active:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Utilisateur introuvable ou désactivé.",
        )
    return user


async def require_super_admin(user: User = Depends(get_current_user)) -> User:
    """Dépendance : n'autorise que les super-admins."""
    if user.role != "super_admin":
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Accès réservé à l'administrateur de la plateforme.",
        )
    return user


def authorize_tenant(user: User, tenant_id: str) -> None:
    """Lève une 403 si l'utilisateur n'appartient pas au tenant demandé (sauf super-admin)."""
    if user.role != "super_admin" and user.tenant_id != tenant_id:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Accès refusé à cet espace.",
        )


def authorize_resource(user: User, resource_tenant_id: Optional[str]) -> None:
    """Vérifie la possession d'une ressource (agent, tâche, approbation, doc...) par le tenant."""
    if user.role == "super_admin":
        return
    if not resource_tenant_id or resource_tenant_id != user.tenant_id:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Accès refusé à cette ressource.",
        )