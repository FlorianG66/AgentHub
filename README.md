# AgentHub — Plateforme SaaS Multi-Agents (SynergyAI)

Plateforme SaaS permettant aux TPE & PME de recruter et piloter une **équipe virtuelle d'agents IA** : chaque agent a une identité, un rôle, des compétences et un prompt système propres. La plateforme orchestre leur collaboration, consulte une base de connaissances d'entreprise (RAG) et intègre une validation humaine (Human-in-the-Loop).

## Architecture

| Composant | Technologie | Port |
|---|---|---|
| Backend API | FastAPI (Python) + SQLAlchemy async + SQLite | `8000` |
| Frontend | Next.js (App Router) + Tailwind CSS + TypeScript | `3000` |

### Fonctionnalités clés

- **Agents IA virtuels** : recrutement, édition (identité, rôle, compétences, prompt système).
- **Orchestration multi-agents** : missions collaboratives, routage automatique de l'agent le plus compétent (mots-clés + routage sémantique par IA).
- **Base de connaissances (RAG)** : documents d'entreprise, contexte récupéré automatiquement selon la mission.
- **Chat de groupe** : discussion avec l'équipe d'agents, avec **mémoire de conversation** (historique injecté dans le routage, le RAG et le prompt final).
- **Validations humaines** : file d'attente d'approbation (Human-in-the-Loop) avant exécution d'actions sensibles.
- **Multi-espaces (tenants)** : isolation complète des données par entreprise cliente.
- **Authentification JWT** : connexion, restauration de session, rôles (`super_admin`, `client_admin`, `user`).

## Démarrage rapide

### Backend

```bash
cd backend
pip install -r requirements.txt
uvicorn app.main:app --reload --port 8000
```

La base et les données de démonstration (tenants, agents, documents, comptes utilisateurs) sont initialisées automatiquement au premier démarrage.

### Frontend

```bash
cd frontend
npm install
npm run dev
```

Ouvrir http://localhost:3000.

### Comptes de démonstration

| Rôle | Email | Mot de passe |
|---|---|---|
| Super admin plateforme | `admin@agenthub.local` | `admin123` |
| Admin espace client (Boulangerie) | `contact@boulangerie.com` | `client123` |

## Configuration IA

Si aucune clé d'API LLM n'est renseignée (variable `OPENAI_API_KEY` ou paramétrage par tenant dans `/api/settings`), **un moteur de simulation intelligent prend le relais** pour permettre de tester la plateforme hors ligne.

## Tests

```bash
cd backend
pytest
```

La suite couvre l'authentification, le contrôle d'accès (isolation par tenant) et les parcours fonctionnels (agents, missions, approbations).

---

## Dernières mises à jour

### v0.2 — Authentification, sécurité & mémoire de conversation

- **Authentification JWT complète**
  - Nouveau modèle `User` avec rôles `super_admin`, `client_admin`, `user`.
  - Endpoints `/api/auth/login` et `/api/auth/me` (restauration de session).
  - Mots de passe hachés avec **bcrypt**, jetons signés **JWT** (expiration 12 h).
- **Contrôle d'accès sur toute l'API**
  - Tous les endpoints exigent désormais un jeton Bearer (`get_current_user`).
  - Isolation par tenant : un client n'accède qu'à son espace (`authorize_tenant`, `authorize_resource`).
  - `/api/tenants` réservé aux super-admins (`require_super_admin`).
- **Gestion des agents enrichie**
  - Nouvel endpoint `PUT /api/agents/{id}` pour modifier un agent existant.
- **Mémoire de conversation (chat multi-agents)**
  - L'historique de la discussion est pris en compte pour le choix de l'agent le plus compétent, la recherche RAG et la réponse finale.
- **Frontend**
  - Écran de connexion (login), restauration automatique de session JWT, déconnexion.
  - Édition des agents via une modale.
  - Thème sombre (frontend rebaptisé SynergyAI).
- **Données & tests**
  - Comptes de démonstration seedés automatiquement (`initial_data`).
  - Tests API étendus : authentification, contrôle d'accès par tenant et parcours fonctionnels mis à jour avec headers d'authentification.