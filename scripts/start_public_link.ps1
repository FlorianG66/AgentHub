# Création d'un lien public temporaire (Cloudflare Quick Tunnel)
#
# Usage :
#   powershell -File scripts\start_public_link.ps1              # expiration par défaut : 2 h
#   powershell -File scripts\start_public_link.ps1 -Hours 1     # expiration sur mesure
#
# Ce que fait le script :
#   1. Vérifie que le backend (8000) et le frontend (3000) tournent.
#   2. Coupe tout lien public précédent (cloudflared).
#   3. Ouvre un tunnel Cloudflare vers le backend  -> URL API (random)
#   4. Redémarre le frontend avec NEXT_PUBLIC_API_URL pointant vers ce tunnel
#      et NEXT_PUBLIC_SHOW_DEMO_ACCOUNTS=false (comptes de démo masqués).
#   5. Ouvre un tunnel Cloudflare vers le frontend -> URL publique (random)
#   6. Programme l'expiration automatique (kill cloudflared + retour du dev local).

param(
    [int]$Hours = 2
)

$ErrorActionPreference = "Stop"
$Root = (Resolve-Path "$PSScriptRoot\..").Path
$CF = Join-Path $env:LOCALAPPDATA "cloudflared\cloudflared.exe"
$LogDir = Join-Path $env:TEMP "agenthub_tunnels"

if (-not (Test-Path $CF)) {
    Write-Host "cloudflared introuvable : $CF" -ForegroundColor Red
    Write-Host "Installe-le : winget install Cloudflare.cloudflared" -ForegroundColor Yellow
    return
}

function Test-Port([int]$Port) {
    [bool](Get-NetTCPConnection -LocalPort $Port -State Listen -ErrorAction SilentlyContinue)
}

function Get-TunnelUrl([string]$LogFile, [int]$TimeoutSec = 60) {
    $deadline = (Get-Date).AddSeconds($TimeoutSec)
    while ((Get-Date) -lt $deadline) {
        $m = [regex]::Match((Get-Content $LogFile -Raw -ErrorAction SilentlyContinue), "https://[a-z0-9-]+\.trycloudflare\.com")
        if ($m.Success) { return $m.Value }
        Start-Sleep -Seconds 2
    }
    return $null
}

function Get-ShortUrl([string]$LongUrl) {
    $enc = [uri]::EscapeDataString($LongUrl)
    try {
        $short = (Invoke-RestMethod -Uri "https://tinyurl.com/api-create.php?url=$enc" -TimeoutSec 25 -ErrorAction Stop).ToString().Trim()
        if ($short -match '^https?://') { return $short }
    } catch { }
    try {
        $short = (Invoke-RestMethod -Uri "https://is.gd/create.php?format=simple&url=$enc" -TimeoutSec 25 -ErrorAction Stop).ToString().Trim()
        if ($short -match '^https?://') { return $short }
    } catch { }
    return $LongUrl
}

# --- Préconditions ---
if (-not (Test-Port 8000)) { Write-Host "Backend (8000) KO - lance run_dev.ps1 ou le backend d'abord." -ForegroundColor Yellow; return }
if (-not (Test-Port 3000)) { Write-Host "Frontend (3000) KO - lance run_dev.ps1 ou le frontend d'abord." -ForegroundColor Yellow; return }

Write-Host "==========================================================" -ForegroundColor Cyan
Write-Host "  LIEN PUBLIC TEMPORAIRE (expiration : $Hours h)" -ForegroundColor Green
Write-Host "==========================================================" -ForegroundColor Cyan

# --- Nettoyage d'un éventuel lien précédent ---
Get-Process -Name cloudflared -ErrorAction SilentlyContinue | ForEach-Object { Write-Host "Lien précédent coupé (PID $($_.Id))." -ForegroundColor DarkGray; Stop-Process -Id $_.Id -Force }
Start-Sleep -Seconds 2

New-Item -ItemType Directory -Path $LogDir -Force | Out-Null

# --- Tunnel backend ---
Write-Host "[1/4] Tunnel backend (port 8000)..." -ForegroundColor Yellow
$errB = Join-Path $LogDir "backend.err.log"
Remove-Item (Join-Path $LogDir "backend.log"), $errB -ErrorAction SilentlyContinue
Start-Process -WindowStyle Hidden -FilePath $CF -ArgumentList "tunnel", "--url", "http://127.0.0.1:8000", "--no-autoupdate" -RedirectStandardOutput (Join-Path $LogDir "backend.log") -RedirectStandardError $errB
$urlB = Get-TunnelUrl $errB
if (-not $urlB) { Write-Host "Echec du tunnel backend." -ForegroundColor Red; return }
Write-Host "  > API backend : $urlB" -ForegroundColor Gray

# --- Redémarrage du frontend branché sur ce tunnel ---
Write-Host "[2/4] Redémarrage du frontend (API tunnel + démo masquée)..." -ForegroundColor Yellow
Get-NetTCPConnection -LocalPort 3000 -State Listen -ErrorAction SilentlyContinue | ForEach-Object {
    $p = Get-Process -Id $_.OwningProcess -ErrorAction SilentlyContinue
    if ($p) { Stop-Process -Id $p.Id -Force }
}
Start-Sleep -Seconds 2
$env:NEXT_PUBLIC_API_URL = "$urlB/api"
$env:NEXT_PUBLIC_SHOW_DEMO_ACCOUNTS = "false"
Start-Process -WindowStyle Hidden -FilePath "npm.cmd" -ArgumentList "run", "dev" -WorkingDirectory (Join-Path $Root "frontend")
Start-Sleep -Seconds 5

# --- Tunnel frontend ---
Write-Host "[3/4] Tunnel frontend (port 3000)..." -ForegroundColor Yellow
$errF = Join-Path $LogDir "frontend.err.log"
Remove-Item (Join-Path $LogDir "frontend.log"), $errF -ErrorAction SilentlyContinue
Start-Process -WindowStyle Hidden -FilePath $CF -ArgumentList "tunnel", "--url", "http://localhost:3000", "--no-autoupdate" -RedirectStandardOutput (Join-Path $LogDir "frontend.log") -RedirectStandardError $errF
$urlF = Get-TunnelUrl $errF
if (-not $urlF) { Write-Host "Echec du tunnel frontend." -ForegroundColor Red; return }

# --- Expiration automatique ---
$secs = $Hours * 3600
Start-Process powershell -WindowStyle Hidden -ArgumentList "-NoProfile", "-File", (Join-Path $PSScriptRoot "expire_public_link.ps1"), "-Seconds", $secs

# --- Raccourcissement du lien public ---
Write-Host "[4/4] Raccourcissement du lien..." -ForegroundColor Yellow
$shortUrl = Get-ShortUrl $urlF

# --- Récapitulatif ---
$expires = (Get-Date).AddSeconds($secs)
Write-Host "Lien public actif." -ForegroundColor Green
Write-Host ""
Write-Host "  >>>  Vitrine publique (court) : $shortUrl" -ForegroundColor Cyan
Write-Host "  >>>  Vitrine publique (complet): $urlF" -ForegroundColor DarkGray
Write-Host "  >>>  API / Swagger              : $urlB/docs" -ForegroundColor Cyan
Write-Host ""
Write-Host "  Expiration automatique : $($expires.ToString('dd/MM/yyyy HH:mm')) (dans $Hours h)" -ForegroundColor Yellow
Write-Host "  Pour couper avant : powershell -File scripts\expire_public_link.ps1 -Seconds 0" -ForegroundColor DarkGray

# --- Résumé partagé avec le script appelant (poll par fichier) ---
@("VITRINE=$urlF", "SHORT=$shortUrl", "API=$urlB", "EXPIRES=$($expires.ToString('yyyy-MM-dd HH:mm:ss'))") | Set-Content -Path (Join-Path $LogDir "summary.txt")