from fastapi import APIRouter, Depends, HTTPException, Query
from sqlalchemy.ext.asyncio import AsyncSession
from pydantic import BaseModel
from typing import Optional, Dict, Any

from app.core.database import get_db
from app.models.tenant import Tenant
from app.models.user import User
from app.services.llm_service import llm_service
from app.api.deps import get_current_user, authorize_tenant

router = APIRouter()

class LLMSettingsPayload(BaseModel):
    provider: str = "free"  # "free", "openai", "groq", "ollama", "custom"
    api_key: Optional[str] = ""
    base_url: Optional[str] = ""
    model: Optional[str] = ""

class TestLLMPayload(BaseModel):
    provider: str
    api_key: Optional[str] = ""
    base_url: Optional[str] = ""
    model: Optional[str] = ""

@router.get("")
async def get_settings(
    tenant_id: str = Query(...),
    user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db)
):
    """Récupère la configuration IA du tenant."""
    authorize_tenant(user, tenant_id)
    tenant = await db.get(Tenant, tenant_id)
    if not tenant:
        raise HTTPException(status_code=404, detail="Tenant introuvable.")

    current_settings = tenant.settings or {}
    llm_conf = current_settings.get("llm", {
        "provider": "free",
        "model": "openai (gratuit)",
        "api_key": "",
        "base_url": ""
    })

    # Masquer partiellement la clé API si renseignée
    masked_key = ""
    raw_key = llm_conf.get("api_key", "")
    if raw_key and len(raw_key) > 8:
        masked_key = raw_key[:4] + "..." + raw_key[-4:]
    elif raw_key:
        masked_key = "***"

    return {
        "tenant_id": tenant.id,
        "tenant_name": tenant.name,
        "llm": {
            "provider": llm_conf.get("provider", "free"),
            "model": llm_conf.get("model", "openai (gratuit)"),
            "base_url": llm_conf.get("base_url", ""),
            "api_key_masked": masked_key,
            "has_custom_key": bool(raw_key)
        }
    }

@router.post("")
async def update_settings(
    payload: LLMSettingsPayload,
    tenant_id: str = Query(...),
    user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db)
):
    """Enregistre la configuration IA de l'entreprise."""
    authorize_tenant(user, tenant_id)
    tenant = await db.get(Tenant, tenant_id)
    if not tenant:
        raise HTTPException(status_code=404, detail="Tenant introuvable.")

    settings_dict = dict(tenant.settings or {})
    current_llm = settings_dict.get("llm", {})

    # Si l'utilisateur n'a pas réécrit sa clé (ex: masked), garder l'ancienne
    new_api_key = payload.api_key.strip() if payload.api_key else ""
    if not new_api_key and current_llm.get("api_key") and payload.provider == current_llm.get("provider"):
        new_api_key = current_llm.get("api_key", "")

    settings_dict["llm"] = {
        "provider": payload.provider,
        "api_key": new_api_key,
        "base_url": payload.base_url.strip() if payload.base_url else "",
        "model": payload.model.strip() if payload.model else ""
    }

    tenant.settings = settings_dict
    await db.commit()
    await db.refresh(tenant)

    return {"message": "Paramètres IA enregistrés avec succès.", "provider": payload.provider}

@router.post("/test-llm")
async def test_llm_connection(payload: TestLLMPayload):
    """Teste la connexion avec le modèle d'IA sélectionné."""
    result = await llm_service.test_connection(
        provider=payload.provider,
        api_key=payload.api_key or "",
        base_url=payload.base_url or "",
        model=payload.model or ""
    )
    return result
