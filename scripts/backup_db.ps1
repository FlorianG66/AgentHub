# Sauvegarde automatisée de la base SQLite avec rotation
#
# Usage :
#   powershell -File scripts\backup_db.ps1                  # sauvegarde + rotation (garder 10)
#   powershell -File scripts\backup_db.ps1 -Keep 20         # rotation sur mesure
#   powershell -File scripts\backup_db.ps1 -NoRotate        # sans suppression
#
# Le script copie backend\platform.db vers backend\backups\platform_<horodatage>.db.

param(
    [int]$Keep = 10,
    [switch]$NoRotate
)

$ErrorActionPreference = "Stop"
$Root = (Resolve-Path "$PSScriptRoot\..").Path
$Db = Join-Path $Root "backend\platform.db"
$BackupDir = Join-Path $Root "backend\backups"

if (-not (Test-Path $Db)) {
    Write-Host "Base introuvable (rien à sauvegarder) : $Db" -ForegroundColor Yellow
    return
}

New-Item -ItemType Directory -Force -Path $BackupDir | Out-Null

$Stamp = Get-Date -Format "yyyyMMdd_HHmmss"
$Target = Join-Path $BackupDir "platform_$Stamp.db"

# Copie la base même si elle est en cours d'écriture (SQLite WAL) :
# on tente une copie simple, sinon un backup SQLite via la commande .backup.
try {
    Copy-Item -LiteralPath $Db -Destination $Target -Force -ErrorAction Stop
} catch {
    $Sql = "VACUUM INTO '$Target';"
    & (Join-Path $Root "backend\.venv\Scripts\python.exe") -c "import sqlite3; con=sqlite3.connect(r'$Db'); con.execute(\"VACUUM INTO '$Target'\"); con.close()"
    if (-not (Test-Path $Target)) {
        Write-Host "Echec de la sauvegarde de $Db" -ForegroundColor Red
        exit 1
    }
}

Write-Host "Sauvegarde OK : $Target" -ForegroundColor Green

# --- Rotation : ne conserver que les $Keep plus récentes ---
if (-not $NoRotate) {
    $all = Get-ChildItem -LiteralPath $BackupDir -Filter "platform_*.db" | Sort-Object LastWriteTime -Descending
    $toDelete = $all | Select-Object -Skip $Keep
    foreach ($f in $toDelete) {
        Remove-Item -LiteralPath $f.FullName -Force
        Write-Host "Rotation : suppression de $($f.Name)" -ForegroundColor Gray
    }
    Write-Host "Rotation effectuée (garde $Keep sauvegardes)." -ForegroundColor Cyan
}