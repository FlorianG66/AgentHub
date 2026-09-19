# Conventions du projet SynergyAI

## Démarrage
- Tout démarrer : `powershell -File run_dev.ps1` (backend FastAPI sur http://127.0.0.1:8000 + frontend Next.js sur http://localhost:3000).
- Backend : `backend\.venv\Scripts\python.exe -m uvicorn app.main:app --port 8000` (venv dans `backend\.venv`).
- Base SQLite : `backend\platform.db` (créée automatiquement au démarrage). Comptes seedés par `backend\app\initial_data.py` : `admin@agenthub.local/admin123` (super_admin) et `contact@boulangerie.com/client123` (client_admin tenant-boulangerie).

## Lien public de visualisation (convention OBLIGATOIRE)
Quand l'utilisateur demande un « lien de visu » :
1. Lancer `powershell -File scripts\start_public_link.ps1` (TTL par défaut **2 heures**).
2. **Ne pas modifier** ce comportement : le script programme lui-même l'expiration automatique via `scripts\expire_public_link.ps1` (kill des cloudflared + restauration du dev local).
3. Donner l'URL « Vitrine publique » **raccourcie** (ligne `SHORT=` de `%TEMP%\agenthub_tunnels\summary.txt`) ; l'URL complète en secours si le raccourcissement (TinyURL, repli is.gd) a échoué.
4. Rappeler qu'il expire automatiquement à l'heure affichée ; le coupure manuelle : `powershell -File scripts\expire_public_link.ps1 -Seconds 0`.
- Le script masque les comptes de démo (`NEXT_PUBLIC_SHOW_DEMO_ACCOUNTS=false`) et branche le frontend sur l'API tunnel (`NEXT_PUBLIC_API_URL`).
- cloudflared : `C:\Users\<user>\AppData\Local\cloudflared\cloudflared.exe`. CORS backend autorise `https://*.trycloudflare.com` via `BACKEND_CORS_ORIGIN_REGEX` (`frontend` peut donc appeler l'API tunnel).

## Vérifications avant de conclure
- Backend : `cd backend; .\.venv\Scripts\python.exe -m pytest -q` (13 tests, ~2 min).
- Frontend : `npm run build` dans `frontend` (vérifie types + lint).