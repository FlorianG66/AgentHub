import pytest
import pytest_asyncio
from httpx import AsyncClient, ASGITransport
from app.main import app, lifespan
from app.core.database import Base, engine
from app.models.agent import Agent
from app.services.agent_router import agent_router

@pytest_asyncio.fixture(scope="session", autouse=True)
async def init_db():
    async with lifespan(app):
        yield

@pytest.mark.asyncio
async def test_health():
    transport = ASGITransport(app=app)
    async with AsyncClient(transport=transport, base_url="http://test") as client:
        response = await client.get("/health")
        assert response.status_code == 200
        assert response.json()["status"] == "healthy"

@pytest.mark.asyncio
async def test_list_tenants():
    transport = ASGITransport(app=app)
    async with AsyncClient(transport=transport, base_url="http://test") as client:
        response = await client.get("/api/tenants")
        assert response.status_code == 200
        data = response.json()
        assert len(data) >= 1
        tenant_ids = [t["id"] for t in data]
        assert "tenant-boulangerie" in tenant_ids

@pytest.mark.asyncio
async def test_list_agents():
    transport = ASGITransport(app=app)
    async with AsyncClient(transport=transport, base_url="http://test") as client:
        response = await client.get("/api/agents?tenant_id=tenant-boulangerie")
        assert response.status_code == 200
        agents = response.json()
        assert len(agents) >= 4
        names = [a["name"] for a in agents]
        assert "Léa" in names
        assert "Marc" in names

@pytest.mark.asyncio
async def test_run_task_with_collaboration():
    transport = ASGITransport(app=app)
    async with AsyncClient(transport=transport, base_url="http://test") as client:
        # Déclenche une mission auprès de Léa nécessitant l'analyse de Marc
        payload = {
            "primary_agent_id": "agent-lea",
            "prompt": "Prépare le post de mardi en demandant à Marc d'analyser les stats du post précédent."
        }
        response = await client.post("/api/tasks/run?tenant_id=tenant-boulangerie", json=payload)
        assert response.status_code == 200
        task_data = response.json()
        assert task_data["status"] == "awaiting_approval"
        assert len(task_data["logs"]) >= 4

        # Vérifier que les logs contiennent bien l'échange entre Léa et Marc
        event_types = [log["event_type"] for log in task_data["logs"]]
        assert "peer_consultation" in event_types
        assert "peer_reply" in event_types

        # Vérifier la présence dans la file d'approbation
        appr_resp = await client.get("/api/approvals?tenant_id=tenant-boulangerie")
        assert appr_resp.status_code == 200
        approvals = appr_resp.json()
        assert len(approvals) >= 1
        pending = [a for a in approvals if a["status"] == "pending"]
        assert len(pending) >= 1

        # Tester la décision d'approbation (Validation humaine)
        target_id = pending[0]["id"]
        decision_resp = await client.post(
            f"/api/approvals/{target_id}/decision",
            json={"action": "approve"}
        )
        assert decision_resp.status_code == 200
        assert decision_resp.json()["status"] == "approved"

@pytest.mark.asyncio
async def test_thomas_hr_task_does_not_generate_linkedin():
    transport = ASGITransport(app=app)
    async with AsyncClient(transport=transport, base_url="http://test") as client:
        payload = {
            "primary_agent_id": "agent-thomas",
            "prompt": "Rédige une fiche de poste pour recruter un apprenti au fournil."
        }
        response = await client.post("/api/tasks/run?tenant_id=tenant-boulangerie", json=payload)
        assert response.status_code == 200
        task_data = response.json()
        assert "fiche de poste" in task_data["result"].lower()
        assert "linkedin" not in task_data["result"].lower()
        
        # Vérifier que l'approbation est bien RH (publish_job_offer)
        appr_resp = await client.get("/api/approvals?tenant_id=tenant-boulangerie")
        assert appr_resp.status_code == 200
        approvals = appr_resp.json()
        hr_appr = next((a for a in approvals if a["task_id"] == task_data["id"]), None)
        assert hr_appr is not None
        assert hr_appr["action_type"] == "publish_job_offer"
        assert "LinkedIn" not in hr_appr["title"]

def test_router_keyword_fallback_routes_to_hr():
    """Le routeur attribue une fiche de poste à l'agent RH (sans appel réseau)."""
    agents = [
        Agent(id="agent-lea", tenant_id="t", name="Léa", role="Community Manager",
              avatar="", system_prompt="", capabilities=["social_media", "community_management"]),
        Agent(id="agent-marc", tenant_id="t", name="Marc", role="Analyste de Données",
              avatar="", system_prompt="", capabilities=["data_analysis", "analytics"]),
        Agent(id="agent-sophie", tenant_id="t", name="Sophie", role="Rédactrice & Storyteller",
              avatar="", system_prompt="", capabilities=["copywriting", "storytelling"]),
        Agent(id="agent-thomas", tenant_id="t", name="Thomas", role="Assistant RH & Organisation",
              avatar="", system_prompt="", capabilities=["recruitment", "contracts"]),
    ]
    picked, score = agent_router._route_with_keywords(agents, "Rédige une fiche de poste pour recruter un apprenti au fournil.")
    assert picked is not None
    assert picked.id == "agent-thomas"
    assert score >= 2
