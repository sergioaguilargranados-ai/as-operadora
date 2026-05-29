// Test end-to-end White-Label — verifica todo el flujo
require('dotenv').config({ path: '.env.local' })
const { Pool } = require('pg')

const pool = new Pool({
  connectionString: process.env.DATABASE_URL,
  ssl: { rejectUnauthorized: false }
})

async function testE2E() {
  let passed = 0
  let failed = 0

  function assert(condition, message) {
    if (condition) {
      console.log(`  ✅ ${message}`)
      passed++
    } else {
      console.log(`  ❌ ${message}`)
      failed++
    }
  }

  try {
    // ═══ Test 1: Tenant principal (AS Operadora) ═══
    console.log('\n═══ Test 1: Tenant AS Operadora (ID=1) ═══')
    const t1 = await pool.query('SELECT * FROM tenants WHERE id = 1')
    assert(t1.rows.length === 1, 'Tenant AS Operadora existe')
    assert(t1.rows[0].tenant_type === 'corporate', 'Es tipo corporate')
    assert(t1.rows[0].is_active === true, 'Está activo')
    assert(t1.rows[0].slogan === 'AS Viajando', 'Slogan correcto')

    // ═══ Test 2: Tenant agencia (M&M) ═══
    console.log('\n═══ Test 2: Tenant M&M Travel (ID=2) ═══')
    const t2 = await pool.query('SELECT * FROM tenants WHERE id = 2')
    assert(t2.rows.length === 1, 'Tenant M&M existe')
    assert(t2.rows[0].tenant_type === 'agency', 'Es tipo agency')
    assert(t2.rows[0].is_active === true, 'Está activo')
    assert(t2.rows[0].custom_domain === 'mmta.app.asoperadora.com', 'Custom domain correcto')
    assert(t2.rows[0].primary_color === '#FF6B00', 'Color primario correcto')
    assert(t2.rows[0].slogan === 'Haz el viaje de tus sueños', 'Slogan correcto')

    // ═══ Test 3: White-Label Config de M&M ═══
    console.log('\n═══ Test 3: White-Label Config M&M ═══')
    const wl = await pool.query('SELECT * FROM white_label_config WHERE tenant_id = 2')
    assert(wl.rows.length === 1, 'Existe white_label_config')
    assert(wl.rows[0].support_email === 'ventas@mmta.com.mx', 'Support email correcto')
    assert(wl.rows[0].meta_title !== null, 'Meta title definido')
    assert(wl.rows[0].markup_type === 'percentage', 'Markup type correcto')
    assert(typeof wl.rows[0].markup_percentage !== 'undefined', 'markup_percentage existe')
    assert(typeof wl.rows[0].markup_fixed !== 'undefined', 'markup_fixed existe')

    // ═══ Test 4: Detección por custom_domain ═══
    console.log('\n═══ Test 4: Detección por custom_domain ═══')
    const detect = await pool.query(
      "SELECT * FROM tenants WHERE custom_domain = 'mmta.app.asoperadora.com' AND is_active = true"
    )
    assert(detect.rows.length === 1, 'Detecta tenant por custom_domain')
    assert(detect.rows[0].company_name === 'M&MTravelAgency', 'Nombre correcto')

    // ═══ Test 5: Detección por slug del company_name ═══
    console.log('\n═══ Test 5: Detección por slug ═══')
    const slugDetect = await pool.query(
      "SELECT * FROM tenants WHERE LOWER(REPLACE(company_name, ' ', '-')) = LOWER('m&mtravelagency') AND is_active = true"
    )
    assert(slugDetect.rows.length === 1, 'Detecta por slug de company_name')

    // ═══ Test 6: tenant_users ═══
    console.log('\n═══ Test 6: Relación tenant_users ═══')
    const users = await pool.query('SELECT COUNT(*) as count FROM tenant_users WHERE tenant_id = 2 AND is_active = true')
    const userCount = parseInt(users.rows[0].count)
    assert(userCount > 0, `Hay ${userCount} usuarios asignados al tenant M&M`)

    // ═══ Test 7: Tablas de comisiones ═══
    console.log('\n═══ Test 7: Tablas de agencia/comisiones ═══')
    const tables = ['agency_commission_config', 'agency_commissions', 'agency_clients', 'agency_applications']
    for (const table of tables) {
      const exists = await pool.query(
        "SELECT table_name FROM information_schema.tables WHERE table_name = $1",
        [table]
      )
      assert(exists.rows.length === 1, `Tabla ${table} existe`)
    }

    // ═══ Resumen ═══
    console.log('\n' + '═'.repeat(50))
    console.log(`📊 Resultado: ${passed} pasaron, ${failed} fallaron de ${passed + failed} tests`)
    if (failed === 0) {
      console.log('🎉 ¡Todos los tests pasaron! White-Label está LISTO.')
    } else {
      console.log('⚠️  Hay tests que fallaron, revisar arriba.')
    }

  } catch (error) {
    console.error('Error fatal:', error.message)
  } finally {
    await pool.end()
  }
}

testE2E()
