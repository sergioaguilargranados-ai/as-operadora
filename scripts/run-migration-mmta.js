// Script para ejecutar la migración del tenant M&MTravelAgency
// Uso: node scripts/run-migration-mmta.js

require('dotenv').config({ path: '.env.local' });
const { Pool } = require('pg');
const fs = require('fs');
const path = require('path');

const pool = new Pool({
    connectionString: process.env.DATABASE_URL,
    ssl: { rejectUnauthorized: false }
});

async function main() {
    const client = await pool.connect();

    try {
        console.log('🚀 Ejecutando migración: M&MTravelAgency...\n');

        // 1. Insertar tenant
        console.log('1️⃣  Creando tenant...');
        await client.query(`
      INSERT INTO tenants (
        tenant_type, company_name, legal_name, email, phone,
        primary_color, secondary_color, accent_color,
        custom_domain, is_active, subscription_plan
      ) VALUES (
        'agency', 'M&MTravelAgency', 'M&M Travel Agency S.A. de C.V.',
        'ventas@mmta.com.mx', '7225187558',
        '#FF6B00', '#0066FF', '#FF6B00',
        'mmta.app-asoperadora.com', true, 'professional'
      ) ON CONFLICT DO NOTHING
    `);

        // Actualizar si ya existía
        await client.query(`
      UPDATE tenants SET
        email = 'ventas@mmta.com.mx',
        phone = '7225187558',
        primary_color = '#FF6B00',
        secondary_color = '#0066FF',
        accent_color = '#FF6B00',
        custom_domain = 'mmta.app-asoperadora.com',
        is_active = true,
        updated_at = CURRENT_TIMESTAMP
      WHERE company_name = 'M&MTravelAgency'
    `);

        // Obtener ID
        const tenantResult = await client.query(
            "SELECT id FROM tenants WHERE company_name = 'M&MTravelAgency'"
        );
        const tenantId = tenantResult.rows[0]?.id;

        if (!tenantId) {
            console.error('❌ Error: No se pudo crear/encontrar el tenant');
            return;
        }
        console.log(`   ✅ Tenant creado con ID: ${tenantId}`);

        // 2. White-label config
        console.log('2️⃣  Configurando white-label...');
        await client.query(`
      INSERT INTO white_label_config (
        tenant_id, footer_text, support_email, support_phone,
        meta_title, meta_description
      ) VALUES (
        $1,
        '© M&M Travel Agency. Haz el viaje de tus sueños!! Todos los derechos reservados.',
        'ventas@mmta.com.mx', '7225187558',
        'M&M Travel Agency | Haz el viaje de tus sueños',
        'Descubre los mejores destinos y paquetes de viaje con M&M Travel Agency.'
      ) ON CONFLICT (tenant_id) DO UPDATE SET
        footer_text = EXCLUDED.footer_text,
        support_email = EXCLUDED.support_email,
        support_phone = EXCLUDED.support_phone,
        meta_title = EXCLUDED.meta_title,
        meta_description = EXCLUDED.meta_description,
        updated_at = CURRENT_TIMESTAMP
    `, [tenantId]);
        console.log('   ✅ White-label configurado');

        // 3. Verificar
        console.log('\n3️⃣  Verificación:');
        const verify = await client.query(`
      SELECT 
        t.id, t.company_name, t.tenant_type, t.email, t.phone,
        t.primary_color, t.secondary_color, t.custom_domain, t.is_active,
        wl.meta_title, wl.support_email, wl.footer_text
      FROM tenants t
      LEFT JOIN white_label_config wl ON t.id = wl.tenant_id
      WHERE t.company_name = 'M&MTravelAgency'
    `);

        if (verify.rows.length > 0) {
            const row = verify.rows[0];
            console.log(`   📋 ID: ${row.id}`);
            console.log(`   📋 Nombre: ${row.company_name}`);
            console.log(`   📋 Tipo: ${row.tenant_type}`);
            console.log(`   📋 Email: ${row.email}`);
            console.log(`   📋 Teléfono: ${row.phone}`);
            console.log(`   🎨 Color Primario: ${row.primary_color}`);
            console.log(`   🎨 Color Secundario: ${row.secondary_color}`);
            console.log(`   🌐 Dominio: ${row.custom_domain}`);
            console.log(`   ✅ Activo: ${row.is_active}`);
            console.log(`   🏷️  Meta Título: ${row.meta_title}`);
            console.log(`   📧 Email Soporte: ${row.support_email}`);
            console.log(`   📝 Footer: ${row.footer_text}`);
        }

        console.log('\n🎉 Migración completada exitosamente!');
        console.log('\n📌 Para probar, visita: http://localhost:3000?tenant=mmta');
        console.log('📌 En producción: https://mmta.app-asoperadora.com');

    } catch (e) {
        console.error('❌ Error:', e.message);
    } finally {
        client.release();
        pool.end();
    }
}

main();
