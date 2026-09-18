import asyncio
import os
import time
import httpx
from typing import Optional, Dict, Any
from openai import AsyncOpenAI
from app.core.config import settings

ERR_RATE_LIMITED = (
    "L'IA gratuite est momentanément saturée (trop de requêtes simultanées). "
    "Veuillez réessayer dans quelques secondes, ou configurez votre propre clé API "
    "dans Paramètres IA & Modèles pour des réponses plus rapides et stables."
)

# L'IA gratuite (Pollinations) n'accepte qu'une requête en file par IP.
# On sérialise donc les appels gratuits au niveau du backend pour éviter le code 429.
_free_semaphore = asyncio.Semaphore(1)


class LLMService:
    """
    Service d'accès aux modèles de langage (LLM).
    - Par défaut : Utilise une IA gratuite sans clé API (Pollinations.ai / OpenAI protocol).
    - Personnalisable : L'utilisateur peut renseigner sa propre clé (OpenAI, Groq, Ollama, etc.)
      directement dans les paramètres de la plateforme.
    """

    def _get_client(self, tenant_settings: Optional[Dict[str, Any]] = None) -> tuple[AsyncOpenAI, str]:
        llm_config = (tenant_settings or {}).get("llm", {})

        provider = llm_config.get("provider", "free")
        api_key = llm_config.get("api_key", "").strip()
        base_url = llm_config.get("base_url", "").strip()
        model = llm_config.get("model", "").strip()

        # 1. Fournisseur personnalisé configuré dans le Tenant
        if provider == "openai" and api_key:
            return AsyncOpenAI(api_key=api_key), model or "gpt-4o-mini"

        if provider == "groq" and api_key:
            return AsyncOpenAI(
                api_key=api_key,
                base_url="https://api.groq.com/openai/v1"
            ), model or "llama-3.3-70b-versatile"

        if provider == "ollama":
            return AsyncOpenAI(
                api_key="ollama",
                base_url=base_url or "http://localhost:11434/v1"
            ), model or "llama3"

        if provider == "custom" and api_key and base_url:
            return AsyncOpenAI(api_key=api_key, base_url=base_url), model or "default"

        # 2. Clé globale .env si définie
        if settings.OPENAI_API_KEY:
            return AsyncOpenAI(
                api_key=settings.OPENAI_API_KEY,
                base_url=settings.OPENAI_BASE_URL
            ), settings.OPENAI_MODEL

        # 3. Par défaut : IA réelle gratuite sans clé API requise
        return AsyncOpenAI(
            api_key="free_community_key",
            base_url="https://text.pollinations.ai/openai"
        ), "openai"

    def _is_rate_limited(self, error: Exception) -> bool:
        message = str(error).lower()
        return "429" in message or "queue full" in message or "rate limit" in message

    async def _chat_completion(
        self,
        client: AsyncOpenAI,
        model: str,
        system_prompt: str,
        user_prompt: str,
        temperature: float
    ) -> Optional[str]:
        """Effectue l'appel LLM avec relances automatiques en cas de saturation (429)."""
        max_retries = 3
        for attempt in range(1, max_retries + 1):
            try:
                response = await client.chat.completions.create(
                    model=model,
                    messages=[
                        {"role": "system", "content": system_prompt},
                        {"role": "user", "content": user_prompt}
                    ],
                    temperature=temperature,
                    timeout=35.0
                )
                content = response.choices[0].message.content or ""
                return content.strip()
            except Exception as e:
                print(f"[LLMService] Erreur lors de l'appel LLM ({model}): {e}")
                if self._is_rate_limited(e) and attempt < max_retries:
                    wait = 2 ** attempt
                    print(f"[LLMService] Saturation détectée, nouvelle tentative dans {wait}s "
                          f"({attempt}/{max_retries})...")
                    await asyncio.sleep(wait)
                    continue
                raise

    async def generate(
        self,
        system_prompt: str,
        user_prompt: str,
        tenant_settings: Optional[Dict[str, Any]] = None,
        temperature: float = 0.7
    ) -> str:
        client, model = self._get_client(tenant_settings)
        # L'IA gratuite est limitée : on sérialise les requêtes pour éviter la file pleine
        base_url_str = str(client.base_url) or ""
        use_semaphore = "text.pollinations.ai" in base_url_str
        try:
            if use_semaphore:
                async with _free_semaphore:
                    content = await self._chat_completion(
                        client, model, system_prompt, user_prompt, temperature
                    )
            else:
                content = await self._chat_completion(
                    client, model, system_prompt, user_prompt, temperature
                )
            return content or ""
        except Exception as e:
            print(f"[LLMService] Échec définitif de l'appel LLM ({model}): {e}")
            # Si échec sur le modèle personnalisé, tenter un fallback gracieux vers l'IA gratuite
            if "text.pollinations.ai" not in base_url_str:
                try:
                    fallback_client = AsyncOpenAI(
                        api_key="free_community_key",
                        base_url="https://text.pollinations.ai/openai"
                    )
                    async with _free_semaphore:
                        fallback = await self._chat_completion(
                            fallback_client, "openai", system_prompt, user_prompt, temperature
                        )
                    return fallback or ""
                except Exception as fb_err:
                    print(f"[LLMService] Fallback également en échec: {fb_err}")

            return ERR_RATE_LIMITED

    async def test_connection(self, provider: str, api_key: str, base_url: str, model: str) -> Dict[str, Any]:
        """Permet à l'utilisateur de tester sa clé API en direct depuis l'interface."""
        try:
            if provider == "free":
                client = AsyncOpenAI(api_key="free", base_url="https://text.pollinations.ai/openai")
                test_model = "openai"
                async with _free_semaphore:
                    resp = await client.chat.completions.create(
                        model=test_model,
                        messages=[{"role": "user", "content": "Dis 'OK'"}],
                        max_tokens=10,
                        timeout=15.0
                    )
            elif provider == "openai":
                client = AsyncOpenAI(api_key=api_key)
                test_model = model or "gpt-4o-mini"
                resp = await client.chat.completions.create(
                    model=test_model,
                    messages=[{"role": "user", "content": "Dis 'OK'"}],
                    max_tokens=10,
                    timeout=15.0
                )
            elif provider == "groq":
                client = AsyncOpenAI(api_key=api_key, base_url="https://api.groq.com/openai/v1")
                test_model = model or "llama-3.3-70b-versatile"
                resp = await client.chat.completions.create(
                    model=test_model,
                    messages=[{"role": "user", "content": "Dis 'OK'"}],
                    max_tokens=10,
                    timeout=15.0
                )
            elif provider == "ollama":
                client = AsyncOpenAI(api_key="ollama", base_url=base_url or "http://localhost:11434/v1")
                test_model = model or "llama3"
                resp = await client.chat.completions.create(
                    model=test_model,
                    messages=[{"role": "user", "content": "Dis 'OK'"}],
                    max_tokens=10,
                    timeout=15.0
                )
            elif provider == "custom":
                client = AsyncOpenAI(api_key=api_key, base_url=base_url)
                test_model = model or "default"
                resp = await client.chat.completions.create(
                    model=test_model,
                    messages=[{"role": "user", "content": "Dis 'OK'"}],
                    max_tokens=10,
                    timeout=15.0
                )
            else:
                return {"success": False, "message": f"Fournisseur inconnu: {provider}"}

            reply = resp.choices[0].message.content or ""
            return {
                "success": True,
                "message": f"Connexion réussie avec le modèle {test_model} !",
                "sample_reply": reply.strip()
            }
        except Exception as e:
            return {
                "success": False,
                "message": f"Échec de la connexion : {str(e)}"
            }

llm_service = LLMService()