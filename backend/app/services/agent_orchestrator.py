import uuid
import datetime
from typing import Dict, Any, List, Optional
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select

from app.models.tenant import Tenant
from app.models.agent import Agent
from app.models.task import Task
from app.models.approval import ApprovalRequest
from app.services.llm_service import llm_service
from app.services.knowledge_service import knowledge_service
from app.services.tools.mock_tools import LinkedInTool, AnalyticsTool

class AgentOrchestrator:
    """
    Moteur de collaboration multi-agents dynamique et autonome.
    Chaque agent a conscience de ses collègues disponibles dans l'entreprise (tenant)
    et peut les solliciter pour accomplir une mission complexe selon sa spécialité.
    """

    async def execute_task(
        self,
        db: AsyncSession,
        tenant_id: str,
        primary_agent_id: str,
        prompt: str,
        title: str = "Mission collaborative"
    ) -> Task:
        # Récupération du tenant (pour la configuration IA personnalisée)
        tenant = await db.get(Tenant, tenant_id)
        tenant_settings = tenant.settings if tenant else {}

        # 1. Création de la tâche
        task_id = f"task_{uuid.uuid4().hex[:10]}"
        task = Task(
            id=task_id,
            tenant_id=tenant_id,
            primary_agent_id=primary_agent_id,
            title=title,
            prompt=prompt,
            status="running",
            logs=[]
        )
        db.add(task)
        await db.flush()

        logs = []
        def add_log(agent_name: str, avatar: str, role: str, message: str, event_type: str = "message", data: Any = None):
            logs.append({
                "id": str(uuid.uuid4())[:8],
                "timestamp": datetime.datetime.now(datetime.timezone.utc).isoformat(),
                "agent_name": agent_name,
                "avatar": avatar,
                "role": role,
                "event_type": event_type,
                "message": message,
                "data": data
            })

        # 2. Récupération de l'agent principal et des collègues
        agent_stmt = select(Agent).where(Agent.id == primary_agent_id, Agent.tenant_id == tenant_id)
        res = await db.execute(agent_stmt)
        primary_agent = res.scalar_one_or_none()

        if not primary_agent:
            task.status = "failed"
            task.result = f"Agent principal {primary_agent_id} introuvable."
            task.logs = logs
            await db.commit()
            return task

        peers_stmt = select(Agent).where(Agent.tenant_id == tenant_id, Agent.id != primary_agent.id)
        peers_res = await db.execute(peers_stmt)
        peer_agents: List[Agent] = peers_res.scalars().all()

        add_log(
            agent_name=primary_agent.name,
            avatar=primary_agent.avatar,
            role=primary_agent.role,
            message=f"Prise en charge de la mission : « {prompt} »",
            event_type="start"
        )

        # 3. Récupération du contexte documentaire d'entreprise (RAG)
        company_knowledge = await knowledge_service.get_relevant_context(db, tenant_id, prompt)
        add_log(
            agent_name=primary_agent.name,
            avatar=primary_agent.avatar,
            role=primary_agent.role,
            message="Consultation de la base de connaissances de l'entreprise...",
            event_type="tool_call",
            data={"contexte_extrait": company_knowledge[:180] + "..."}
        )

        prompt_lower = prompt.lower()
        role_lower = primary_agent.role.lower()
        peer_insights = []

        # 4. Collaboration dynamique spécifique selon les compétences requises
        # CAS A : L'agent principal a besoin d'analyses chiffrées (et Marc ou un analyste est disponible)
        if ("community manager" in role_lower or "social" in role_lower) and any(kw in prompt_lower for kw in ["stat", "chiffre", "analyse", "performance", "retour", "marc", "métrique"]):
            analyst_agent = next(
                (p for p in peer_agents if any(cap in ["data_analysis", "analytics", "reporting"] for cap in (p.capabilities or [])) or "analyste" in p.role.lower()),
                None
            )
            if analyst_agent:
                raw_metrics = LinkedInTool.get_last_post_metrics()
                add_log(
                    agent_name=primary_agent.name,
                    avatar=primary_agent.avatar,
                    role=primary_agent.role,
                    message=f"Extraction des statistiques récentes via l'API LinkedIn et transmission à {analyst_agent.name} ({analyst_agent.role})...",
                    event_type="tool_call",
                    data=raw_metrics
                )
                add_log(
                    agent_name=primary_agent.name,
                    avatar=primary_agent.avatar,
                    role=primary_agent.role,
                    message=f"« {analyst_agent.name}, peux-tu analyser les performances de notre dernière publication et me donner tes recommandations pour le prochain contenu ? »",
                    event_type="peer_consultation"
                )
                analyst_prompt = (
                    f"Tu es {analyst_agent.name}, {analyst_agent.role}.\n"
                    f"Ton collègue {primary_agent.name} te demande d'analyser ces métriques brutes : {raw_metrics}\n"
                    f"Contexte entreprise : {company_knowledge}\n"
                    f"Fournis une analyse synthétique des forces/faiblesses et 2 ou 3 recommandations actionnables."
                )
                analyst_reply = await llm_service.generate(
                    system_prompt=analyst_agent.system_prompt,
                    user_prompt=analyst_prompt,
                    tenant_settings=tenant_settings
                )
                peer_insights.append(f"Analyse de {analyst_agent.name} ({analyst_agent.role}) :\n{analyst_reply}")
                add_log(
                    agent_name=analyst_agent.name,
                    avatar=analyst_agent.avatar,
                    role=analyst_agent.role,
                    message=analyst_reply,
                    event_type="peer_reply"
                )

        # CAS B : L'agent principal sollicite la Rédactrice pour la marque / storytelling
        elif ("rh" in role_lower or "ressources humaines" in role_lower) and any(kw in prompt_lower for kw in ["valeur", "charte", "storytelling", "ton", "sophie", "attractivité"]):
            copywriter_agent = next(
                (p for p in peer_agents if any(cap in ["storytelling", "copywriting"] for cap in (p.capabilities or [])) or "rédact" in p.role.lower()),
                None
            )
            if copywriter_agent:
                add_log(
                    agent_name=primary_agent.name,
                    avatar=primary_agent.avatar,
                    role=primary_agent.role,
                    message=f"« {copywriter_agent.name}, peux-tu m'aider à valoriser nos valeurs d'artisanat local dans cette offre d'emploi ? »",
                    event_type="peer_consultation"
                )
                cw_prompt = (
                    f"Tu es {copywriter_agent.name}, {copywriter_agent.role}.\n"
                    f"Ton collègue {primary_agent.name} prépare une annonce RH et souhaite y intégrer les valeurs de l'entreprise.\n"
                    f"Contexte d'entreprise : {company_knowledge}\n"
                    f"Rédige un court paragraphe inspirant sur notre savoir-faire et l'ambiance d'équipe."
                )
                cw_reply = await llm_service.generate(
                    system_prompt=copywriter_agent.system_prompt,
                    user_prompt=cw_prompt,
                    tenant_settings=tenant_settings
                )
                peer_insights.append(f"Contribution de {copywriter_agent.name} :\n{cw_reply}")
                add_log(
                    agent_name=copywriter_agent.name,
                    avatar=copywriter_agent.avatar,
                    role=copywriter_agent.role,
                    message=cw_reply,
                    event_type="peer_reply"
                )

        # 5. Synthèse et exécution finale par l'agent principal
        agent_system = (
            f"Tu es {primary_agent.name}, {primary_agent.role} pour l'entreprise '{tenant.name if tenant else 'notre entreprise'}'.\n"
            f"Ta mission et personnalité : {primary_agent.system_prompt}\n"
            f"Tes compétences : {', '.join(primary_agent.capabilities or [])}.\n"
            f"RÈGLE IMPORTANTE : Réponds avec rigueur et pertinence à la demande exacte de l'utilisateur. "
            f"Ne dévie pas de ton rôle de {primary_agent.role}. Ne génère pas de publication LinkedIn ou réseaux sociaux "
            f"si la demande concerne des RH, de la gestion interne ou de la comptabilité."
        )

        final_prompt = (
            f"Demande de l'utilisateur : « {prompt} »\n\n"
            f"Base de connaissances de l'entreprise (à respecter) :\n{company_knowledge}\n\n"
            + (f"Apports et échanges avec tes collègues :\n" + "\n\n".join(peer_insights) + "\n\n" if peer_insights else "")
            + f"Rédige ta réponse complète et soignée en tant que {primary_agent.name} ({primary_agent.role})."
        )

        final_deliverable = await llm_service.generate(
            system_prompt=agent_system,
            user_prompt=final_prompt,
            tenant_settings=tenant_settings
        )

        add_log(
            agent_name=primary_agent.name,
            avatar=primary_agent.avatar,
            role=primary_agent.role,
            message="Finalisation du livrable et vérification de la conformité avec la mission.",
            event_type="decision"
        )

        # 6. Gestion du Human-in-the-Loop : création d'approbation SEULEMENT si action externe requise
        approval = None

        # Publication réseaux sociaux (si Community Manager ou si le prompt concerne un post / publication)
        if ("community manager" in role_lower or "social" in role_lower) and any(w in prompt_lower for w in ["post", "publi", "linkedin", "instagram", "facebook", "réseaux"]):
            scheduled_date = (datetime.datetime.now(datetime.timezone.utc) + datetime.timedelta(days=1)).strftime("%Y-%m-%d 09:00:00")
            action_payload = LinkedInTool.format_for_publishing(
                content=final_deliverable,
                hashtags=["#Artisanat", "#BoulangerieTraditionnelle", "#SavoirFaire", "#Local"],
                scheduled_time=scheduled_date
            )
            approval = ApprovalRequest(
                id=f"appr_{uuid.uuid4().hex[:10]}",
                tenant_id=tenant_id,
                task_id=task.id,
                agent_id=primary_agent.id,
                title=f"Programmation publication ({primary_agent.name})",
                description=f"Publication rédigée par {primary_agent.name}.",
                action_type="publish_linkedin_post",
                payload=action_payload,
                agent_rationale="Contenu prêt pour programmation. En attente de validation avant mise en ligne.",
                status="pending"
            )

        # Diffusion d'offre de recrutement (si annonce / offre d'emploi ou recrutement formulé)
        elif ("rh" in role_lower or "ressources humaines" in role_lower) and any(w in prompt_lower for w in ["recrut", "embauch", "offre", "annonce", "candidat", "poste"]):
            action_payload = {
                "document_type": "Offre de recrutement",
                "canaux_proposés": ["CFA Régional", "France Travail", "Vitrine boutique"],
                "content": final_deliverable
            }
            approval = ApprovalRequest(
                id=f"appr_{uuid.uuid4().hex[:10]}",
                tenant_id=tenant_id,
                task_id=task.id,
                agent_id=primary_agent.id,
                title=f"Validation Offre de Recrutement ({primary_agent.name})",
                description=f"Annonce de recrutement préparée par {primary_agent.name}.",
                action_type="publish_job_offer",
                payload=action_payload,
                agent_rationale="Offre rédigée selon les critères de l'entreprise. À valider avant diffusion aux candidats.",
                status="pending"
            )

        if approval:
            db.add(approval)
            add_log(
                agent_name=primary_agent.name,
                avatar=primary_agent.avatar,
                role=primary_agent.role,
                message=f"Action soumise à validation humaine dans la File d'Approbation (ID: {approval.id}, Action: {approval.action_type}).",
                event_type="approval_created",
                data={"approval_id": approval.id, "action": approval.action_type}
            )
            task.status = "awaiting_approval"
        else:
            task.status = "completed"

        task.result = final_deliverable
        task.logs = logs
        task.updated_at = datetime.datetime.now(datetime.timezone.utc)

        await db.commit()
        await db.refresh(task)
        return task

agent_orchestrator = AgentOrchestrator()
