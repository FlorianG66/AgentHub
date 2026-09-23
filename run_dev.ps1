param(
    [int]$PortBackend = 8000,
    [int]$PortFrontend = 3000
)

# Script de démarrage en local de la plateforme Multi-Agents SaaS
$Host.UI.RawUI.WindowTitle = "Plateforme SaaS Multi-Agents (Dev)"

Write-Host "==========================================================" -ForegroundColor Cyan
Write-Host "  LANCEMENT DE LA PLATEFORME SAAS MULTI-AGENTS (MVP)" -ForegroundColor Green
Write-Host "==========================================================" -ForegroundColor Cyan

# Détection de collision de ports si non spécifiés explicitement
if (-not $PSBoundParameters.ContainsKey('PortBackend')) {
    if (Get-NetTCPConnection -LocalPort 8000 -State Listen -ErrorAction SilentlyContinue) {
        Write-Host "Port 8000 déjà utilisé. Bascule automatique du backend sur le port 8001." -ForegroundColor Yellow
        $PortBackend = 8001
    }
}

if (-not $PSBoundParameters.ContainsKey('PortFrontend')) {
    if (Get-NetTCPConnection -LocalPort 3000 -State Listen -ErrorAction SilentlyContinue) {
        Write-Host "Port 3000 déjà utilisé. Bascule automatique du frontend sur le port 3001." -ForegroundColor Yellow
        $PortFrontend = 3001
    }
}

# 1. Mise à jour du PATH avec Python et Node.js
$env:Path = [System.Environment]::GetEnvironmentVariable("Path","Machine") + ";" + [System.Environment]::GetEnvironmentVariable("Path","User")

# 2. Lancement du Backend FastAPI dans un terminal dédié
Write-Host "[1/2] Lancement du Backend FastAPI sur http://127.0.0.1:$PortBackend..." -ForegroundColor Yellow
$backendCmd = "`$env:Path = [System.Environment]::GetEnvironmentVariable('Path','Machine') + ';' + [System.Environment]::GetEnvironmentVariable('Path','User'); Set-Location '$PSScriptRoot\backend'; .\.venv\Scripts\python.exe -m uvicorn app.main:app --reload --port $PortBackend"
Start-Process powershell -ArgumentList "-NoExit", "-Command", $backendCmd

Start-Sleep -Seconds 2

# 3. Lancement du Frontend Next.js dans un terminal dédié
Write-Host "[2/2] Lancement du Frontend Next.js sur http://localhost:$PortFrontend..." -ForegroundColor Yellow
$frontendCmd = "`$env:Path = [System.Environment]::GetEnvironmentVariable('Path','Machine') + ';' + [System.Environment]::GetEnvironmentVariable('Path','User'); `$env:NEXT_PUBLIC_API_URL = 'http://127.0.0.1:$PortBackend/api'; Set-Location '$PSScriptRoot\frontend'; npm run dev -- -p $PortFrontend"
Start-Process powershell -ArgumentList "-NoExit", "-Command", $frontendCmd

Write-Host ""
Write-Host "-> Application accessible sur : http://localhost:$PortFrontend" -ForegroundColor Green
Write-Host "-> Documentation API Swagger  : http://127.0.0.1:$PortBackend/docs" -ForegroundColor Green
Write-Host "==========================================================" -ForegroundColor Cyan
