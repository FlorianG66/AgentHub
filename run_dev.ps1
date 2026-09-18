# Script de démarrage en local de la plateforme Multi-Agents SaaS
$Host.UI.RawUI.WindowTitle = "Plateforme SaaS Multi-Agents (Dev)"

Write-Host "==========================================================" -ForegroundColor Cyan
Write-Host "  LANCEMENT DE LA PLATEFORME SAAS MULTI-AGENTS (MVP)" -ForegroundColor Green
Write-Host "==========================================================" -ForegroundColor Cyan

# 1. Mise à jour du PATH avec Python et Node.js
$env:Path = [System.Environment]::GetEnvironmentVariable("Path","Machine") + ";" + [System.Environment]::GetEnvironmentVariable("Path","User")

# 2. Lancement du Backend FastAPI dans un terminal dédié
Write-Host "[1/2] Lancement du Backend FastAPI sur http://127.0.0.1:8000..." -ForegroundColor Yellow
Start-Process powershell -ArgumentList "-NoExit", "-Command", "`$env:Path = [System.Environment]::GetEnvironmentVariable('Path','Machine') + ';' + [System.Environment]::GetEnvironmentVariable('Path','User'); Set-Location 'backend'; .\.venv\Scripts\python.exe -m uvicorn app.main:app --reload --port 8000"

Start-Sleep -Seconds 2

# 3. Lancement du Frontend Next.js dans un terminal dédié
Write-Host "[2/2] Lancement du Frontend Next.js sur http://localhost:3000..." -ForegroundColor Yellow
Start-Process powershell -ArgumentList "-NoExit", "-Command", "`$env:Path = [System.Environment]::GetEnvironmentVariable('Path','Machine') + ';' + [System.Environment]::GetEnvironmentVariable('Path','User'); Set-Location 'frontend'; npm run dev"

Write-Host ""
Write-Host "-> Application accessible sur : http://localhost:3000" -ForegroundColor Green
Write-Host "-> Documentation API Swagger  : http://127.0.0.1:8000/docs" -ForegroundColor Green
Write-Host "==========================================================" -ForegroundColor Cyan
