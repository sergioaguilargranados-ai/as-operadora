// Script para verificar migraciones White-Label en la base de datos
require('dotenv').config({ path: '.env.local' })
const { Pool } = require('pg')

const pool = new Pool({
  connectionString: process.env.DATABASE_URL,
  ssl: { rejectUnauthorized: false }
})

async function checkMigrations() {
  try {
    // 1. Verificar migración 032 — campos markup en white_label_config
    console.log('=== Migración 032 (markup en white_label_config) ===')
    const markupCols = await pool.query(`
      SELECT column_name, data_type 
      FROM information_schema.columns 
      WHERE table_name = 'white_label_config' 
      AND column_name IN ('markup_percentage', 'markup_fixed', 'markup_type')
      ORDER BY column_name
    `)
    
    if (markupCols.rows.length > 0) {
      console.log('✅ EJECUTADA — Campos encontrados:')
      markupCols.rows.forEach(r => console.log(`  - ${r.column_name} (${r.data_type})`))
    } else {
      console.log('❌ NO EJECUTADA — Campos markup NO encontrados')
    }

    // 2. Verificar migración 033 — tabla agency_applications
    console.log('\n=== Migración 033 (tabla agency_applications) ===')
    const appTable = await pool.query(`
      SELECT table_name 
      FROM information_schema.tables 
      WHERE table_name = 'agency_applications'
    `)
    
    if (appTable.rows.length > 0) {
      console.log('✅ EJECUTADA — Tabla existe')
    } else {
      console.log('❌ NO EJECUTADA — Tabla NO existe')
    }

    // 3. Listar todas las tablas de White-Label
    console.log('\n=== Tablas White-Label relacionadas ===')
    const wlTables = await pool.query(`
      SELECT table_name 
      FROM information_schema.tables 
      WHERE table_schema = 'public'
      AND (
        table_name LIKE '%tenant%' 
        OR table_name LIKE '%white_label%'
        OR table_name LIKE '%agency%'
        OR table_name LIKE '%agent%'
        OR table_name LIKE '%commission%'
      )
      ORDER BY table_name
    `)
    wlTables.rows.forEach(r => console.log(`  ✓ ${r.table_name}`))

    // 4. Verificar que hay al menos 1 tenant configurado
    console.log('\n=== Tenants existentes ===')
    const tenants = await pool.query(`
      SELECT id, company_name, tenant_type, subdomain, custom_domain, is_active 
      FROM tenants 
      ORDER BY id
    `)
    
    if (tenants.rows.length > 0) {
      tenants.rows.forEach(t => {
        console.log(`  ${t.is_active ? '✅' : '⚠️'} [${t.id}] ${t.company_name} (${t.tenant_type}) — subdomain: ${t.subdomain || 'N/A'} — domain: ${t.custom_domain || 'N/A'}`)
      })
    } else {
      console.log('  ❌ No hay tenants — se necesita crear al menos el tenant principal')
    }

    // 5. Verificar white_label_config
    console.log('\n=== White-Label Configs ===')
    const wlConfigs = await pool.query(`
      SELECT wlc.id, wlc.tenant_id, t.company_name, 
             wlc.markup_percentage, wlc.markup_type
      FROM white_label_config wlc
      JOIN tenants t ON t.id = wlc.tenant_id
      ORDER BY wlc.id
    `)
    
    if (wlConfigs.rows.length > 0) {
      wlConfigs.rows.forEach(c => {
        console.log(`  ✓ [${c.id}] Tenant: ${c.company_name} — Markup: ${c.markup_percentage || 0}% (${c.markup_type || 'percentage'})`)
      })
    } else {
      console.log('  ❌ No hay configuraciones White-Label')
    }

    // 6. Verificar columnas de la tabla tenants
    console.log('\n=== Columnas de tabla tenants ===')
    const tenantCols = await pool.query(`
      SELECT column_name, data_type, is_nullable
      FROM information_schema.columns
      WHERE table_name = 'tenants'
      ORDER BY ordinal_position
    `)
    tenantCols.rows.forEach(c => console.log(`  ${c.column_name} (${c.data_type}) ${c.is_nullable === 'YES' ? '— nullable' : '— required'}`))

  } catch (error) {
    console.error('Error:', error.message)
  } finally {
    await pool.end()
  }
}

checkMigrations()
