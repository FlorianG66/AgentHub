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

async def get_access_token(client, email="admin@agenthub.local", password="admin123"):
    resp = await client.post("/api/auth/login", json={"email": email, "password": password})
    assert resp.status_code == 200, resp.text
    return resp.json()["access_token"]

def auth_headers(token):
    return {"Authorization": f"Bearer {token}"}

AB = {
    "admin": ("admin@agenthub.local", "admin123"),
    "client": ("contact@boulangerie.com", "client123"),
}

async def make_client():
    transport = ASGITransport(app=app)
    return AsyncClient(transport=transport, base_url="http://test")

@pytest.mark.asyncio
async def test_health():
    async with await make_client() as client:
        response = await client.get("/health")
        assert response.status_code == 200
        assert response.json()["status"] == "healthy"

# ---------------------------------------------------------------- Authentification

@pytest.mark.asyncio
async def test_login_super_admin():
    async with await make_client() as client:
        resp = await client.post("/api/auth/login", json={
            "email": "admin@agenthub.local", "password": "admin123"
        })
        assert resp.status_code == 200
        data = resp.json()
        assert data["token_type"] == "bearer"
        assert data["access_token"]
        assert data["user"]["role"] == "super_admin"
        assert data["tenant"] is None

@pytest.mark.asyncio
async def test_login_client_returns_tenant():
    async with await make_client() as client:
        resp = await client.post("/api/auth/login", json={
            "email": "contact@boulangerie.com", "password": "client123"
        })
        assert resp.status_code == 200
        data = resp.json()
        assert data["user"]["role"] == "client_admin"
        assert data["user"]["tenant_id"] == "tenant-boulangerie"
        assert data["tenant"]["id"] == "tenant-boulangerie"
        assert data["tenant"]["name"] == "Boulangerie Artisanale & Co"

@pytest.mark.asyncio
async def test_login_wrong_password():
    async with await make_client() as client:
        resp = await client.post("/api/auth/login", json={
            "email": "admin@agenthub.local", "password": "mauvais"
        })
        assert resp.status_code == 401

@pytest.mark.asyncio
async def test_me_requires_token():
    async with await make_client() as client:
        assert (await client.get("/api/auth/me")).status_code == 401

@pytest.mark.asyncio
async def test_me_with_token():
    async with await make_client() as client:
        tok = await get_access_token(client, *AB["admin"])
        resp = await client.get("/api/auth/me", headers=auth_headers(tok))
        assert resp.status_code == 200
        assert resp.json()["user"]["email"] == "admin@agenthub.local"
        assert resp.json()["tenant"] is None

# ---------------------------------------------------------------- Contrôle d'accès

@pytest.mark.asyncio
async def test_tenants_super_admin_only():
    async with await make_client() as client:
        admin_tok = await get_access_token(client, *AB["admin"])
        client_tok = await get_access_token(client, *AB["client"])

        resp = await client.get("/api/tenants", headers=auth_headers(client_tok))
        assert resp.status_code == 403

        resp = await client.get("/api/tenants", headers=auth_headers(admin_tok))
        assert resp.status_code == 200
        assert len(resp.json()) >= 1

@pytest.mark.asyncio
async def test_tenant_scoping_for_client_user():
    async with await make_client() as client:
        tok = await get_access_token(client, *AB["client"])

        # Accès à son propre tenant : OK
        resp = await client.get(
            "/api/agents?tenant_id=tenant-boulangerie", headers=auth_headers(tok)
        )
        assert resp.status_code == 200

        # Accès à un autre tenant : refusé
        resp = await client.get(
            "/api/agents?tenant_id=tenant-autre", headers=auth_headers(tok)
        )
        assert resp.status_code == 403

# ---------------------------------------------------------------- Tests fonctionnels

@pytest.mark.asyncio
async def test_list_tenants():
    async with await make_client() as client:
        tok = await get_access_token(client, *AB["admin"])
        response = await client.get("/api/tenants", headers=auth_headers(tok))
        assert response.status_code == 200
        data = response.json()
        assert len(data) >= 1
        tenant_ids = [t["id"] for t in data]
        assert "tenant-boulangerie" in tenant_ids

@pytest.mark.asyncio
async def test_list_agents():
    async with await make_client() as client:
        tok = await get_access_token(client, *AB["admin"])
        response = await client.get(
            "/api/agents?tenant_id=tenant-boulangerie", headers=auth_headers(tok)
        )
        assert response.status_code == 200
        agents = response.json()
        assert len(agents) >= 4
        names = [a["name"] for a in agents]
        assert "Léa" in names
        assert "Marc" in names

@pytest.mark.asyncio
async def test_run_task_with_collaboration():
    async with await make_client() as client:
        tok = await get_access_token(client, *AB["admin"])
        h = auth_headers(tok)
        # Déclenche une mission auprès de Léa nécessitant l'analyse de Marc
        payload = {
            "primary_agent_id": "agent-lea",
            "prompt": "Prépare le post de mardi en demandant à Marc d'analyser les stats du post précédent."
        }
        response = await client.post("/api/tasks/run?tenant_id=tenant-boulangerie", json=payload, headers=h)
        assert response.status_code == 200
        task_data = response.json()
        assert task_data["status"] == "awaiting_approval"
        assert len(task_data["logs"]) >= 4

        # Vérifier que les logs contiennent bien l'échange entre Léa et Marc
        event_types = [log["event_type"] for log in task_data["logs"]]
        assert "peer_consultation" in event_types
        assert "peer_reply" in event_types

        # Vérifier la présence dans la file d'approbation
        appr_resp = await client.get("/api/approvals?tenant_id=tenant-boulangerie", headers=h)
        assert appr_resp.status_code == 200
        approvals = appr_resp.json()
        assert len(approvals) >= 1
        pending = [a for a in approvals if a["status"] == "pending"]
        assert len(pending) >= 1

        # Tester la décision d'approbation (Validation humaine)
        target_id = pending[0]["id"]
        decision_resp = await client.post(
            f"/api/approvals/{target_id}/decision",
            json={"action": "approve"},
            headers=h
        )
        assert decision_resp.status_code == 200
        assert decision_resp.json()["status"] == "approved"

@pytest.mark.asyncio
async def test_thomas_hr_task_does_not_generate_linkedin():
    async with await make_client() as client:
        tok = await get_access_token(client, *AB["admin"])
        h = auth_headers(tok)
        payload = {
            "primary_agent_id": "agent-thomas",
            "prompt": "Rédige une fiche de poste pour recruter un apprenti au fournil."
        }
        response = await client.post("/api/tasks/run?tenant_id=tenant-boulangerie", json=payload, headers=h)
        assert response.status_code == 200
        task_data = response.json()
        assert "fiche de poste" in task_data["result"].lower()
        assert "linkedin" not in task_data["result"].lower()
        
        # Vérifier que l'approbation est bien RH (publish_job_offer)
        appr_resp = await client.get("/api/approvals?tenant_id=tenant-boulangerie", headers=h)
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