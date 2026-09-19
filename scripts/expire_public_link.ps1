# Coupure du lien public temporaire (appelé automatiquement à l'expiration,
# ou à la main via : powershell -File scripts\expire_public_link.ps1 -Seconds 0)

param(
    [int]$Seconds = 7200
)

$Root = (Resolve-Path "$PSScriptRoot\..").Path

if ($Seconds -gt 0) {
    Start-Sleep -Seconds $Seconds
}

# --- Coupe tous les tunnels Cloudflare ---
$killed = Get-Process -Name cloudflared -ErrorAction SilentlyContinue
if ($killed) {
    $killed | ForEach-Object { Stop-Process -Id $_.Id -Force -ErrorAction SilentlyContinue }
    Write-Host "Lien public coupé ($($killed.Count) tunnel(s) arrêté(s))." -ForegroundColor Green
} else {
    Write-Host "Aucun tunnel actif." -ForegroundColor DarkGray
}

# --- Nettoie le résumé partagé ---
$summary = Join-Path $env:TEMP "agenthub_tunnels\summary.txt"
if (Test-Path $summary) { Remove-Item $summary -Force }

# --- Restaure le dev local (sans env tunnel, démo visible) ---
Get-NetTCPConnection -LocalPort 3000 -State Listen -ErrorAction SilentlyContinue | ForEach-Object {
    $p = Get-Process -Id $_.OwningProcess -ErrorAction SilentlyContinue
    if ($p) { Stop-Process -Id $p.Id -Force }
}
Start-Sleep -Seconds 2
Start-Process -WindowStyle Hidden -FilePath "npm.cmd" -ArgumentList "run", "dev" -WorkingDirectory (Join-Path $Root "frontend")
Write-Host "Dev local restauré sur http://localhost:3000" -ForegroundColor Green