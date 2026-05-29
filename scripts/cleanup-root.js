// Script de limpieza - mover archivos obsoletos a scratch/_obsolete/
const fs = require('fs')
const path = require('path')

const obsoleteDir = path.join(process.cwd(), 'scratch', '_obsolete')
if (!fs.existsSync(obsoleteDir)) {
  fs.mkdirSync(obsoleteDir, { recursive: true })
}

const filesToMove = [
  // Debug MegaTravel (638KB total)
  'debug-circuito.html', 'debug-megatravel.html', 'debug-tour.html',
  'megatravel_data.json', 'megatravel_dump.html',
  'megatravel_iframe_dump.html', 'megatravel_jquery_dump.html',
  'inspect-megatravel.js', 'inspect-megatravel-iframe.js',
  'inspect-megatravel-jquery.js', 'inspect-megatravel-json.js',
  // Scripts BD temporales
  'add-system-users.js', 'cargar-datos-prueba.js',
  'check-all-databases.js', 'check-all-schemas.js', 'check-all-tables.js',
  'check-api-config.js', 'check-db-info.js', 'check-passwords.js',
  'check-real-production.js', 'check-schema.js',
  'check-users-password.js', 'check-users-schema.js',
  'create-missing-tables.js', 'ejecutar-migraciones.js',
  'fix-all-passwords-production.js', 'fix-passwords.js',
  'generate-hash.js', 'list-all-users.js', 'load-users-fixed.js',
  'test-bcrypt.js', 'test-current-passwords.js', 'test-db-info-api.js',
  'test-hotels.js', 'update-passwords-production.js',
  'verify-all-users.js', 'verify-sergio.js',
  // SQL temporales
  'datos-prueba-completos.sql', 'schema-basico.sql',
  'update-hero-image.sql', 'usuarios-prueba.sql',
  // Scripts Windows obsoletos
  'crear-archivos-faltantes.bat', 'crear-archivos-faltantes.ps1',
  // Logs de sincronización (1.3MB)
  'resync-progress.log', 'sync-progress.log',
  // Misc
  'Researching Multi-Tenant Architecture.md', 'run-migration-010.ts',
]

let moved = 0
let totalBytes = 0

for (const file of filesToMove) {
  const src = path.join(process.cwd(), file)
  const dst = path.join(obsoleteDir, file)
  
  if (fs.existsSync(src)) {
    try {
      const stat = fs.statSync(src)
      totalBytes += stat.size
      fs.renameSync(src, dst)
      console.log(`  OK ${file} (${(stat.size/1024).toFixed(1)} KB)`)
      moved++
    } catch (err) {
      console.log(`  ERR ${file}: ${err.message}`)
    }
  }
}

console.log(`\n========================================`)
console.log(`Movidos: ${moved} archivos`)
console.log(`Espacio: ${(totalBytes/1024/1024).toFixed(2)} MB`)
console.log(`Destino: scratch/_obsolete/`)
console.log(`========================================`)
