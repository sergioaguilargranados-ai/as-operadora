// Test de envío de email real via emailHelper
require('dotenv').config({ path: '.env.local' })

async function testEmailSend() {
  console.log('═══════════════════════════════════════════════')
  console.log('📧 TEST DE ENVÍO DE EMAIL')
  console.log('═══════════════════════════════════════════════\n')

  // Verificar variables de entorno
  const resendKey = (process.env.RESEND_API_KEY || '').trim()
  const sgKey = (process.env.SENDGRID_API_KEY || '').trim()
  const smtpHost = (process.env.SMTP_HOST || '').trim()
  
  console.log('=== Configuración detectada ===')
  console.log(`  RESEND_API_KEY: ${resendKey ? resendKey.substring(0, 8) + '***' : '❌ No configurada'}`)
  console.log(`  RESEND_FROM_EMAIL: ${process.env.RESEND_FROM_EMAIL || 'No definida'}`)
  console.log(`  SENDGRID_API_KEY: ${sgKey ? sgKey.substring(0, 8) + '***' : '❌ No configurada'}`)
  console.log(`  SMTP_HOST: ${smtpHost || '❌ No configurado'}`)
  console.log(`  SMTP_USER: ${process.env.SMTP_USER || '❌ No configurado'}`)
  console.log(`  CRON_SECRET: ${process.env.CRON_SECRET ? '✅ Configurado' : '❌ No configurado'}`)

  // Determinar proveedor disponible
  let provider = 'ninguno'
  if (resendKey) provider = 'Resend'
  else if (sgKey) provider = 'SendGrid'
  else if (smtpHost) provider = 'SMTP directo'

  console.log(`\n  📫 Proveedor activo: ${provider}`)

  if (provider === 'ninguno') {
    console.log('\n⚠️  No hay proveedor de email configurado.')
    console.log('Para configurar, agregar una de estas variables en .env.local o Vercel:')
    console.log('  - RESEND_API_KEY (recomendado, gratis hasta 3k emails/mes)')
    console.log('  - SENDGRID_API_KEY')
    console.log('  - SMTP_HOST + SMTP_USER + SMTP_PASS')
    return
  }

  // Test de conexión con Resend
  if (resendKey) {
    console.log('\n=== Test de conexión Resend ===')
    try {
      const { Resend } = require('resend')
      const resend = new Resend(resendKey)
      const domains = await resend.domains.list()
      console.log('  ✅ Conexión exitosa')
      if (domains.data?.data) {
        domains.data.data.forEach(d => {
          console.log(`  📌 Dominio: ${d.name} (${d.status})`)
        })
      }
    } catch (err) {
      console.log(`  ❌ Error: ${err.message}`)
    }
  }

  console.log('\n═══════════════════════════════════════════════')
  console.log('✅ Verificación completada')
  console.log('═══════════════════════════════════════════════')
}

testEmailSend()
