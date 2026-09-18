import re
from typing import List, Optional, Tuple
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select

from app.models.tenant import Tenant
from app.models.agent import Agent
from app.services.llm_service import llm_service

class AgentRouter:
    """
    Routeur de missions : sélectionne l'agent le plus compétent pour une demande.
    - Étape 1 : Signal mots-clés FORT et non ambigu (>= 2 termes) => routage autoritaire.
    - Étape 2 : Routage sémantique par IA (désambiguïsation des demandes faibles).
    - Étape 3 : Signal mots-clés faible (1 terme).
    - Étape 4 : Dernier recours : premier agent disponible.

    La correspondance par mots-clés donne plus de poids au rôle de l'agent qu'à ses
    compétences génériques (ex : Léa a "copywriting" mais n'est pas la Rédactrice).
    """

    # Force de correspondance : le rôle est plus discriminant que les compétences
    ROLE_STRENGTH = 2
    CAP_STRENGTH = 1

    def __init__(self):
        self._keyword_rules = [
            {
                "label": "réseaux sociaux",
                "keywords": ["réseaux sociaux", "réseau social", "post", "publi", "publication",
                             "linkedin", "instagram", "facebook", "hashtag", "community",
                             "story", "storytelling", "audience", "engagement"],
                "roles": ["community manager", "community"],
                "caps": ["social_media", "community_management"],
            },
            {
                "label": "analyse de données",
                "keywords": ["analyse", "analyser", "statistique", "stats", "performance",
                             "performances", "rapport", "chiffre", "chiffres", "métrique",
                             "métriques", "kpi", "data", "audience", "indicateur"],
                "roles": ["analyste", "analyse de données"],
                "caps": ["data_analysis", "analytics"],
            },
            {
                "label": "rédaction",
                "keywords": ["rédige", "redige", "rédaction", "redaction", "article", "newsletter",
                             "texte", "blog", "communiqué", "communique", "catalogue",
                             "présentation", "presentation", "plaquette"],
                "roles": ["rédact", "storyteller", "rédactrice"],
                "caps": ["copywriting", "storytelling"],
            },
            {
                "label": "ressources humaines",
                "keywords": ["recrut", "embauche", "fiche de poste", "poste", "contrat", "onboarding",
                             "intégration", "integration", "candidat", "planning", "congé",
                             "salaire", "équipe", "équipes", "formation", "accueil"],
                "roles": ["rh", "ressources humaines"],
                "caps": ["recruitment", "contracts"],
            },
        ]

    async def pick_best_agent(self, db: AsyncSession, tenant_id: str, prompt: str) -> Agent:
        """Sélectionne l'agent le plus adapté à la mission."""
        agents_res = await db.execute(select(Agent).where(Agent.tenant_id == tenant_id))
        agents: List[Agent] = agents_res.scalars().all()
        if not agents:
            raise ValueError(f"Aucun agent disponible pour le tenant {tenant_id}.")

        # Étape 1 : Signal mots-clés FORT et non ambigu (>= 2 termes) => routage autoritaire
        keyword_agent, keyword_hits = self._route_with_keywords(agents, prompt)
        if keyword_agent and keyword_hits >= 2:
            return keyword_agent

        # Étape 2 : Routage sémantique par IA (désambiguïsation)
        routed_id = await self._route_with_llm(db, tenant_id, agents, prompt)
        if routed_id:
            for a in agents:
                if a.id == routed_id:
                    return a

        # Étape 3 : Signal mots-clés faible (1 terme) ou repli
        if keyword_agent:
            return keyword_agent

        # Étape 4 : Dernier recours
        return agents[0]

    async def _route_with_llm(
        self,
        db: AsyncSession,
        tenant_id: str,
        agents: List[Agent],
        prompt: str
    ) -> Optional[str]:
        tenant = await db.get(Tenant, tenant_id)
        tenant_settings = tenant.settings if tenant else {}

        roster = "\n".join(
            f"- ID: {a.id} | {a.name} | {a.role} | Compétences: {', '.join(a.capabilities or [])}"
            for a in agents
        )
        system_prompt = (
            "Tu es le chef de répartition des missions d'une plateforme SaaS d'agents IA.\n"
            "Règles strictes : choisis l'agent dont le rôle correspond LE MIEUX à la demande, "
            "en priorité pour les RH (fiche de poste, recrutement) et les réseaux sociaux.\n"
            "Réponds UNIQUEMENT avec l'ID de l'agent, sans ponctuation ni texte supplémentaire.\n"
            f"Équipe disponible :\n{roster}"
        )
        try:
            reply = await llm_service.generate(
                system_prompt=system_prompt,
                user_prompt=f"Demande de l'utilisateur : « {prompt} »\nQuel agent doit la réaliser ?",
                tenant_settings=tenant_settings,
                temperature=0.2
            )
            reply_lower = (reply or "").lower()
            for a in agents:
                if a.id.lower() in reply_lower or a.name.lower() in reply_lower:
                    return a.id
        except Exception:
            return None
        return None

    def _route_with_keywords(self, agents: List[Agent], prompt: str) -> Tuple[Optional[Agent], int]:
        """Retourne (agent, nombre de termes-clés de la règle retenue)."""
        prompt_lower = prompt.lower()
        best_agent = None
        best_total = 0
        best_rule_hits = 0

        for rule in self._keyword_rules:
            hits = self._count_keyword_hits(rule["keywords"], prompt_lower)
            if hits == 0:
                continue
            for a in agents:
                strength = 0
                role_lower = (a.role or "").lower()
                if any(r in role_lower for r in rule["roles"]):
                    strength += self.ROLE_STRENGTH
                caps = [c.lower() for c in (a.capabilities or [])]
                if any(c in caps for c in rule["caps"]):
                    strength += self.CAP_STRENGTH
                if strength == 0:
                    continue
                total = hits * strength
                if total > best_total:
                    best_total = total
                    best_agent = a
                    best_rule_hits = hits
        return best_agent, best_rule_hits

    @staticmethod
    def _count_keyword_hits(keywords: List[str], text_lower: str) -> int:
        hits = 0
        for kw in keywords:
            if re.search(r"\b" + re.escape(kw) + r"\b", text_lower):
                hits += 1
        return hits

agent_router = AgentRouter()