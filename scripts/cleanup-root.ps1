# Script de limpieza de archivos obsoletos de la raíz
# Los mueve a una carpeta scratch/_obsolete/ para revisión antes de eliminar

$obsoleteDir = "scratch\_obsolete"
if (-not (Test-Path $obsoleteDir)) {
    New-Item -ItemType Directory -Path $obsoleteDir -Force | Out-Null
}

# Archivos de debug de MegaTravel (obsoletos)
$debugFiles = @(
    "debug-circuito.html",        # 28KB debug HTML
    "debug-megatravel.html",      # 442KB debug HTML
    "debug-tour.html",            # 168KB debug HTML
    "megatravel_data.json",       # 11KB datos temp
    "megatravel_dump.html",       # 12KB dump
    "megatravel_iframe_dump.html", # 67KB dump
    "megatravel_jquery_dump.html", # 5KB dump
    "inspect-megatravel.js",      # Inspección temp
    "inspect-megatravel-iframe.js",
    "inspect-megatravel-jquery.js",
    "inspect-megatravel-json.js"
)

# Scripts de BD temporales (ya ejecutados, no se necesitan en raíz)
$dbScripts = @(
    "add-system-users.js",
    "cargar-datos-prueba.js",
    "check-all-databases.js",
    "check-all-schemas.js",
    "check-all-tables.js",
    "check-api-config.js",
    "check-db-info.js",
    "check-passwords.js",
    "check-real-production.js",
    "check-schema.js",
    "check-users-password.js",
    "check-users-schema.js",
    "create-missing-tables.js",
    "ejecutar-migraciones.js",
    "fix-all-passwords-production.js",
    "fix-passwords.js",
    "generate-hash.js",
    "list-all-users.js",
    "load-users-fixed.js",
    "test-bcrypt.js",
    "test-current-passwords.js",
    "test-db-info-api.js",
    "test-hotels.js",
    "update-passwords-production.js",
    "verify-all-users.js",
    "verify-sergio.js"
)

# SQL de prueba temporales
$sqlFiles = @(
    "datos-prueba-completos.sql",
    "schema-basico.sql",
    "update-hero-image.sql",
    "usuarios-prueba.sql"
)

# Scripts Windows obsoletos
$batFiles = @(
    "crear-archivos-faltantes.bat",
    "crear-archivos-faltantes.ps1"
)

# Logs de sincronización 
$logFiles = @(
    "resync-progress.log",        # 140KB
    "sync-progress.log"           # 1.2MB
)

# Otros archivos misceláneos
$miscFiles = @(
    "Researching Multi-Tenant Architecture.md",  # Investigación temp
    "run-migration-010.ts"                        # Migración específica temp
)

$allFiles = $debugFiles + $dbScripts + $sqlFiles + $batFiles + $logFiles + $miscFiles

$moved = 0
$notFound = 0
$errors = 0

foreach ($file in $allFiles) {
    if (Test-Path $file) {
        try {
            $size = (Get-Item $file).Length
            $sizeKB = [math]::Round($size / 1024, 1)
            Move-Item $file "$obsoleteDir\$file" -Force
            Write-Host "  Movido: $file ($sizeKB KB)" -ForegroundColor Green
            $moved++
        } catch {
            Write-Host "  Error: $file — $_" -ForegroundColor Red
            $errors++
        }
    } else {
        $notFound++
    }
}

$savedKB = 0
Get-ChildItem $obsoleteDir -File | ForEach-Object { $savedKB += $_.Length }
$savedMB = [math]::Round($savedKB / 1024 / 1024, 2)

Write-Host ""
Write-Host "========================================"
Write-Host "Resultado:"
Write-Host "  Movidos: $moved archivos"
Write-Host "  No encontrados: $notFound"
Write-Host "  Errores: $errors"
Write-Host "  Espacio recuperado: $savedMB MB"
Write-Host "  Destino: $obsoleteDir\"
Write-Host "========================================"
Write-Host ""
Write-Host "Los archivos fueron MOVIDOS, no eliminados." -ForegroundColor Yellow
Write-Host "Revisa scratch\_obsolete\ antes de eliminar definitivamente." -ForegroundColor Yellow
