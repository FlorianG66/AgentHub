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

Le backend lit sa configuration depuis `backend/.env`. Copiez le modèle puis adaptez les valeurs :

```bash
cp backend/.env.example backend/.env
```

### Backend

```bash
cd backend
pip install -r requirements.txt
uvicorn app.main:app --reload --port 8000
```

La base et les données de démonstration (tenants, agents, documents, comptes utilisateurs) sont initialisées automatiquement au premier démarrage. Les migrations de schéma sont gérées par **Alembic** (`alembic upgrade head`).

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

La suite couvre l'authentification, le contrôle d'accès (isolation par tenant), les parcours fonctionnels (agents, missions, approbations) ainsi que les flux d'onboarding (inscription, invitation de collaborateurs, réinitialisation de mot de passe).

---

## Déploiement public (lien permanent pour CV / démo)

Le projet est prêt à être déployé pour obtenir une URL **permanente** : backend FastAPI sur **Render** (gratuit) + frontend Next.js sur **Vercel** (gratuit). Fichiers fournis :

- `backend/Dockerfile` + `backend/.dockerignore` — image du backend.
- `backend/render.yaml` — blueprint Render (détection automatique du service).
- `vercel.json` — indique à Vercel que le frontend est dans `frontend/`.

### Étape 1 — Backend sur Render

1. Poussez ce dépôt sur GitHub.
2. Sur [render.com](https://render.com) : **New → Blueprint**, sélectionnez le dépôt.
3. Render détecte `backend/render.yaml`, crée le service **agenthub-api** (plan free).
   - Render génère automatiquement `SECRET_KEY` (sécurisé) et lance le service via le Dockerfile.
4. Copiez l'URL du service (ex. `https://agenthub-api.onrender.com`).

> Note : SQLite est stocké sur le disque éphémère du service. Les données sont réinitialisées aux valeurs de démo (`initial_data`) à chaque redémarrage/recyclage — parfait pour une démo.

### Étape 2 — Frontend sur Vercel

1. Sur [vercel.com](https://vercel.com) : **Add New → Project**, importez le même dépôt.
2. Vercel détecte `vercel.json` et build automatiquement `frontend/`.
3. Dans **Settings → Environment Variables**, ajoutez :
   - `NEXT_PUBLIC_API_URL` = `https://<votre-backend>.onrender.com/api`
   - `NEXT_PUBLIC_SHOW_DEMO_ACCOUNTS` = `true` (affiche les liens d'accès démo sur le login)
4. **Deploy**. L'URL (ex. `https://agenthub.vercel.app`) est votre lien permanent à mettre sur le CV.

### URL démo sur le site

Page `/login` : le bloc « Accès démo rapide » offre 2 liens cliquables qui pré-remplissent les champs :

| Accès | Email | Mot de passe |
|---|---|---|
| Super Admin | `admin@agenthub.local` | `admin123` |
| Espace Client (Boulangerie) | `contact@boulangerie.com` | `client123` |

### Redéployer après une modification

Poussez sur GitHub : Render et Vercel redéploient automatiquement (branch de production).

CORS : le backend accepte les origines `*.vercel.app` et `*.trycloudflare.com` (regex `BACKEND_CORS_ORIGIN_REGEX` dans `backend/app/core/config.py`, surchargeable par variable d'environnement).

---

## Dernières mises à jour

### v0.3 — Fondations production (Sécurité, Migrations, Onboarding)

- **Secrets déportés dans `.env`** : `SECRET_KEY`, mots de passe seedés, CORS, SMTP. Fichier `backend/.env.example` versionné (`.env` réel ignoré par git).
- **Migrations de schéma avec Alembic** : `migrations/` généré à partir des modèles, appliqué automatiquement au démarrage du conteneur Docker/Render.
- **Support PostgreSQL** : l'URL `DATABASE_URL` (ex. `postgresql://...`) est normalisée automatiquement pour le driver async (`asyncpg`), avec multi-workers uvicorn en production. SQLite reste le défaut local.
- **Mode production locale** : `powershell -File scripts\run_prod.ps1` — migrations + build Next.js optimisé + backend uvicorn (1 worker si SQLite) + frontend `npm run start`.
- **Sauvegarde automatique** : `powershell -File scripts\backup_db.ps1` — copie `platform.db` avec rotation (garde N sauvegardes par défaut).
- **Onboarding self-service** : `POST /api/auth/register` crée un espace client (+ son équipe d'agents par défaut) et connecte automatiquement le nouvel administrateur. Formulaire dédié sur la page `/login`.
- **Invitation de collaborateurs** : `GET/POST /api/users` (+ `/api/users/invite`, `PATCH /api/users/{id}`), mot de passe temporaire généré et renvoyé en mode console / envoyé par e-mail en mode SMTP. Onglet « Équipe & Accès » dans le dashboard.
- **Mot de passe oublié** : `POST /api/auth/forgot-password` (jeton JWT court) + `POST /api/auth/reset-password`, UI intégrée au `/login`.
- **Notifications e-mail** : service `EMAIL_BACKEND=console|smtp` (jetons affichés en démo / envoyés réellement via SMTP).
- Tests backend portés à **21**.

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