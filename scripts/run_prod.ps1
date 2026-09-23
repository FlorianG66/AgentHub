# Démarrage en mode "production locale"
#
# Usage :
#   powershell -File scripts\run_prod.ps1
#   powershell -File scripts\run_prod.ps1 -BackendPort 8000 -FrontendPort 3000 -Workers 2 -SkipFrontendBuild
#
# Ce que fait le script :
#   1. Applique les migrations Alembic (`alembic upgrade head`).
#   2. Sauvegarde la base SQLite avant démarrage (rotation 10).
#   3. Démarre le backend FastAPI (1 worker si SQLite, sinon `-Workers`).
#   4. Build Next.js optimisé (`npm run build`) puis `npm run start`.
#   5. Affiche les URLs publiques (backend / frontend).

param(
    [int]$BackendPort = 8000,
    [int]$FrontendPort = 3000,
    [int]$Workers = 0,          # 0 = auto (1 si SQLite, sinon min(2, cpu))
    [switch]$SkipFrontendBuild,
    [switch]$SkipBackend
)

$ErrorActionPreference = "Stop"
$Root = (Resolve-Path "$PSScriptRoot\..").Path
$Backend = Join-Path $Root "backend"
$Frontend = Join-Path $Root "frontend"
$Py = Join-Path $Backend ".venv\Scripts\python.exe"
$VenvActivate = Join-Path $Backend ".venv\Scripts\Activate.ps1"

function Read-Env([string]$Name, [string]$Path) {
    if (Test-Path $Path) {
        $line = Get-Content $Path | Where-Object { $_ -match "^$Name\s*=" } | Select-Object -First 1
        if ($line) {
            return ($line -split "=", 2)[1].Trim().Trim('"')
        }
    }
    return $null
}

function Test-Port([int]$Port) {
    [bool](Get-NetTCPConnection -LocalPort $Port -State Listen -ErrorAction SilentlyContinue)
}

if (-not (Test-Path $Py)) {
    Write-Host "Venv backend introuvable : $Py" -ForegroundColor Red
    Write-Host "Lancez : `n  cd backend`n  python -m venv .venv`n  .\.venv\Scripts\pip install -r requirements.txt" -ForegroundColor Yellow
    return
}
if (-not (Test-Path (Join-Path $Frontend "package.json"))) {
    Write-Host "Frontend introuvable : $Frontend" -ForegroundColor Red
    return
}

# 1) Détection de l'URL de base de données (postgres => workers multiples)
$DbUrl = Read-Env "DATABASE_URL" (Join-Path $Backend ".env")
if (-not $DbUrl) { $DbUrl = "sqlite+aiosqlite:///./platform.db" }
$IsSqlite = $DbUrl -match "sqlite"
if ($Workers -le 0) {
    if ($IsSqlite) { $Workers = 1 } else { $Workers = [Math]::Min(2, $env:NUMBER_OF_PROCESSORS) }
}

Write-Host "=== SynergyAI / AgentHub : mode production locale ===" -ForegroundColor Cyan
Write-Host "  Backend ($($BackendPort)) : workers=$Workers | DB=$DbUrl" -ForegroundColor Gray

Push-Location $Backend
try {
    # 2) Migrations
    Write-Host "[1/4] Application des migrations Alembic..." -ForegroundColor Yellow
    & $Py -m alembic upgrade head
    if ($LASTEXITCODE -ne 0) { throw "Echec des migrations Alembic." }

    # 3) Sauvegarde de la base avant démarrage
    Write-Host "[2/4] Sauvegarde de la base..." -ForegroundColor Yellow
    & powershell -File (Join-Path $Root "scripts\backup_db.ps1") | Out-Host
} finally {
    Pop-Location
}

# 4) Démarrage du backend en tâche de fond
if (-not $SkipBackend) {
    if (Test-Port $BackendPort) {
        Write-Host "[3/4] Backend déjà à l'écoute sur $BackendPort (pas de relance)." -ForegroundColor Yellow
    } else {
        Write-Host "[3/4] Démarrage du backend (uvicorn, workers=$Workers)..." -ForegroundColor Yellow
        $BackendLog = Join-Path $env:TEMP "agenthub_prod_backend.log"
        if ($IsSqlite) {
            $start = Start-Process -FilePath $Py -ArgumentList "-m", "uvicorn", "app.main:app", "--host", "0.0.0.0", "--port", "$BackendPort" -WorkingDirectory $Backend -RedirectStandardOutput $BackendLog -RedirectStandardError $BackendLog -WindowStyle Hidden -PassThru
        } else {
            $start = Start-Process -FilePath $Py -ArgumentList "-m", "uvicorn", "app.main:app", "--host", "0.0.0.0", "--port", "$BackendPort", "--workers", "$Workers" -WorkingDirectory $Backend -RedirectStandardOutput $BackendLog -RedirectStandardError $BackendLog -WindowStyle Hidden -PassThru
        }
        Write-Host "      PID=$($start.Id) | log: $BackendLog" -ForegroundColor Gray
    }
}

# 5) Build + démarrage du frontend
if (-not $SkipFrontendBuild) {
    Write-Host "[4/4] Build Next.js optimisé..." -ForegroundColor Yellow
    Push-Location $Frontend
    try {
        $env:NEXT_PUBLIC_API_URL = "http://127.0.0.1:$BackendPort/api"
        npm run build
        if ($LASTEXITCODE -ne 0) { throw "Echec du build Next.js." }
    } finally {
        Pop-Location
    }
}

if (Test-Port $FrontendPort) {
    Write-Host "      Frontend déjà à l'écoute sur $FrontendPort (pas de relance)." -ForegroundColor Yellow
} else {
    Write-Host "      Démarrage du frontend (npm run start $FrontendPort)..." -ForegroundColor Yellow
    Push-Location $Frontend
    try {
        $env:NEXT_PUBLIC_API_URL = "http://127.0.0.1:$BackendPort/api"
        $FrontendLog = Join-Path $env:TEMP "agenthub_prod_frontend.log"
        $sf = Start-Process -FilePath "npm" -ArgumentList "run", "start", "--", "-p", "$FrontendPort" -WorkingDirectory $Frontend -RedirectStandardOutput $FrontendLog -RedirectStandardError $FrontendLog -WindowStyle Hidden -PassThru
        Write-Host "      PID=$($sf.Id) | log: $FrontendLog" -ForegroundColor Gray
    } finally {
        Pop-Location
    }
}

Write-Host "`n=== Prêt en production locale ===" -ForegroundColor Green
Write-Host "  Frontend : http://localhost:$FrontendPort" -ForegroundColor Green
Write-Host "  Backend  : http://127.0.0.1:$BackendPort (docs: /docs)" -ForegroundColor Green
Write-Host "  Pour un lien public : powershell -File scripts\start_public_link.ps1" -ForegroundColor Gray