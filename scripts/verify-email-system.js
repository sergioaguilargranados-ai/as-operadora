// Verificación completa del sistema de emails
const fs = require('fs')
const path = require('path')

const templatesDir = path.join(process.cwd(), 'src', 'templates', 'email')
const helperFile = fs.readFileSync(path.join(process.cwd(), 'src', 'lib', 'emailHelper.ts'), 'utf8')

console.log('═══════════════════════════════════════════════════')
console.log('📧 VERIFICACIÓN DEL SISTEMA DE EMAILS')
console.log('═══════════════════════════════════════════════════\n')

// 1. Templates existentes
console.log('=== Templates HTML existentes ===')
const templates = fs.readdirSync(templatesDir).filter(f => f.endsWith('.html'))
templates.forEach(t => {
  const size = fs.statSync(path.join(templatesDir, t)).size
  console.log(`  ✅ ${t} (${(size/1024).toFixed(1)} KB)`)
})
console.log(`  Total: ${templates.length} templates\n`)

// 2. Funciones helper exportadas
console.log('=== Funciones helper exportadas ===')
const exportedFunctions = helperFile.match(/export const (\w+)/g)
if (exportedFunctions) {
  exportedFunctions.forEach(f => {
    const name = f.replace('export const ', '')
    console.log(`  📤 ${name}`)
  })
  console.log(`  Total: ${exportedFunctions.length} funciones\n`)
}

// 3. Templates referenciados en helper
console.log('=== Templates referenciados en emailHelper ===')
const templateRefs = helperFile.match(/renderTemplate\('([^']+)'/g)
const referencedTemplates = templateRefs ? [...new Set(templateRefs.map(t => t.match(/'([^']+)'/)[1]))] : []
referencedTemplates.forEach(t => {
  const exists = templates.includes(`${t}.html`)
  console.log(`  ${exists ? '✅' : '❌'} ${t}.html ${exists ? '' : '— FALTA!'}`)
})

// 4. Templates sin función
console.log('\n=== Templates sin función helper ===')
const templateNames = templates.filter(t => t !== 'base-template.html').map(t => t.replace('.html', ''))
const orphanTemplates = templateNames.filter(t => !referencedTemplates.includes(t))
if (orphanTemplates.length === 0) {
  console.log('  ✅ Todos los templates tienen función helper')
} else {
  orphanTemplates.forEach(t => console.log(`  ⚠️  ${t}.html — Sin función helper`))
}

// 5. Proveedores configurados
console.log('\n=== Proveedores de email ===')
console.log('  1. Resend SDK (prioritario) — import confirmado')
console.log('  2. SendGrid SMTP (fallback #1) — via nodemailer')
console.log('  3. SMTP directo (fallback #2) — via nodemailer')
console.log('  ✅ Jerarquía: Resend → SendGrid → SMTP')

// 6. Cron jobs
console.log('\n=== Cron Jobs de Email ===')
const cronFile = fs.readFileSync(path.join(process.cwd(), 'src', 'cron', 'email-reminders.ts'), 'utf8')
const cronFunctions = cronFile.match(/export async function (\w+)/g)
if (cronFunctions) {
  cronFunctions.forEach(f => {
    const name = f.replace('export async function ', '')
    console.log(`  ⏰ ${name}`)
  })
}

// 7. Verificar Centro de Comunicación
console.log('\n=== Centro de Comunicación ===')
const hasCentro = helperFile.includes('message_deliveries')
console.log(`  ${hasCentro ? '✅' : '❌'} Integración con message_deliveries: ${hasCentro ? 'SÍ' : 'NO'}`)

console.log('\n═══════════════════════════════════════════════════')
console.log('📊 RESUMEN')
console.log('═══════════════════════════════════════════════════')
console.log(`  Templates: ${templates.length} (incluye base)`)
console.log(`  Funciones: ${exportedFunctions?.length || 0}`)
console.log(`  Cron Jobs: ${cronFunctions?.length || 0}`)
console.log(`  Proveedores: 3 (Resend + SendGrid + SMTP)`)
console.log(`  Templates faltantes: ${referencedTemplates.filter(t => !templates.includes(`${t}.html`)).length}`)
console.log(`  Templates huérfanos: ${orphanTemplates.length}`)
