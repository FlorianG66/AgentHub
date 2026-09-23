from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy import select
from sqlalchemy.ext.asyncio import AsyncSession

from app.api.deps import get_current_user
from app.core.database import get_db
from app.core.security import (
    create_access_token,
    create_password_reset_token,
    decode_access_token,
    hash_password,
    verify_password,
)
from app.core.utils import slugify, unique_slug
from app.initial_data import default_agents
from app.models.tenant import Tenant
from app.models.user import User
from app.schemas.auth import (
    ForgotPasswordRequest,
    LoginRequest,
    LoginResponse,
    MeResponse,
    RegisterRequest,
    ResetPasswordRequest,
    ResetPasswordResponse,
    UserResponse,
)
from app.services.emails import send_password_reset_email
from app.core.config import settings

router = APIRouter()


async def _login_payload(db: AsyncSession, user: User) -> dict:
    """Construit la réponse de connexion (user + tenant + jeton)."""
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

    return await _login_payload(db, user)


@router.post("/register", response_model=LoginResponse, status_code=status.HTTP_201_CREATED)
async def register(payload: RegisterRequest, db: AsyncSession = Depends(get_db)):
    """Onboarding self-service : crée un nouvel espace client (tenant) + son administrateur.

    L'utilisateur est connecté automatiquement après l'inscription.
    """
    email = payload.email.strip().lower()
    existing = (await db.execute(select(User).where(User.email == email))).scalar_one_or_none()
    if existing:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Un compte existe déjà avec cet e-mail.",
        )

    base_slug = slugify(payload.tenant_slug or payload.company_name)
    tenant_slug = await unique_slug(db, Tenant, base_slug)
    tenant_id = f"tenant_{tenant_slug}"

    tenant = Tenant(
        id=tenant_id,
        name=payload.company_name.strip(),
        slug=tenant_slug,
        plan="starter",
        settings={"primary_color": "#6366F1", "sector": ""},
    )
    db.add(tenant)
    await db.flush()

    user = User(
        id=f"user_{tenant_slug}",
        tenant_id=tenant_id,
        email=email,
        full_name=payload.full_name.strip(),
        hashed_password=hash_password(payload.password),
        role="client_admin",
    )
    db.add(user)
    db.add_all(default_agents(tenant_id))

    await db.commit()
    await db.refresh(user)
    return await _login_payload(db, user)


@router.post("/forgot-password", response_model=ResetPasswordResponse)
async def forgot_password(payload: ForgotPasswordRequest, db: AsyncSession = Depends(get_db)):
    """Demande une réinitialisation de mot de passe.

    En mode ``EMAIL_BACKEND=console`` (démo/dev), le jeton et l'URL de reset
    sont renvoyés directement dans la réponse. En ``smtp``, ils sont envoyés
    par e-mail et la réponse reste générique.
    """
    email = payload.email.strip().lower()
    user = (await db.execute(select(User).where(User.email == email))).scalar_one_or_none()

    # Ne jamais divulguer l'existence d'un compte
    if user is None or not user.is_active:
        return {"message": "Si un compte existe, un e-mail de réinitialisation a été envoyé."}

    token = create_password_reset_token(user.id)
    reset_url = f"{settings.FRONTEND_URL}/login?reset_token={token}"
    send_password_reset_email(user.email, user.full_name, reset_url)

    if settings.EMAIL_BACKEND != "smtp":
        return {
            "message": "Lien de réinitialisation généré (mode console).",
            "reset_url": reset_url,
            "reset_token": token,
        }

    return {"message": "Si un compte existe, un e-mail de réinitialisation a été envoyé."}


@router.post("/reset-password")
async def reset_password(payload: ResetPasswordRequest, db: AsyncSession = Depends(get_db)):
    """Applique un nouveau mot de passe à partir d'un jeton de réinitialisation valide."""
    try:
        claims = decode_access_token(payload.token)
    except Exception:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Jeton de réinitialisation invalide ou expiré.",
        )
    if claims.get("type") != "password_reset":
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Jeton de réinitialisation invalide.",
        )

    user = await db.get(User, claims.get("sub"))
    if user is None or not user.is_active:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Utilisateur introuvable ou désactivé.",
        )

    user.hashed_password = hash_password(payload.new_password)
    await db.commit()
    return {"message": "Mot de passe réinitialisé avec succès. Vous pouvez vous connecter."}


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