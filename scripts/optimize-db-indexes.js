// Sprint 6: Optimización de base de datos - Índices de rendimiento
require('dotenv').config({ path: '.env.local' });
const { Pool } = require('pg');

const pool = new Pool({
    connectionString: process.env.DATABASE_URL,
    ssl: { rejectUnauthorized: false }
});

async function main() {
    const client = await pool.connect();
    try {
        console.log('🔧 Creando índices de rendimiento...\n');

        // ═══════════════════════════════════════
        // Índices para agency_commissions
        // ═══════════════════════════════════════
        const commissionIndexes = [
            { sql: "CREATE INDEX IF NOT EXISTS idx_comm_agency_status ON agency_commissions(agency_id, status)", name: "commission por agencia+status" },
            { sql: "CREATE INDEX IF NOT EXISTS idx_comm_agent_status ON agency_commissions(agent_id, status)", name: "commission por agente+status" },
            { sql: "CREATE INDEX IF NOT EXISTS idx_comm_created ON agency_commissions(created_at DESC)", name: "commission por fecha desc" },
            { sql: "CREATE INDEX IF NOT EXISTS idx_comm_booking ON agency_commissions(booking_id)", name: "commission por booking" },
            { sql: "CREATE INDEX IF NOT EXISTS idx_comm_status_active ON agency_commissions(status) WHERE is_active = true", name: "commission activas por status" },
        ];

        for (const idx of commissionIndexes) {
            await client.query(idx.sql);
            console.log(`  ✅ ${idx.name}`);
        }

        // ═══════════════════════════════════════
        // Índices para bookings
        // ═══════════════════════════════════════
        const bookingIndexes = [
            { sql: "CREATE INDEX IF NOT EXISTS idx_booking_tenant ON bookings(tenant_id)", name: "booking por tenant" },
            { sql: "CREATE INDEX IF NOT EXISTS idx_booking_status ON bookings(booking_status)", name: "booking por status" },
            { sql: "CREATE INDEX IF NOT EXISTS idx_booking_created ON bookings(created_at DESC)", name: "booking por fecha" },
            { sql: "CREATE INDEX IF NOT EXISTS idx_booking_user ON bookings(user_id)", name: "booking por usuario" },
            { sql: "CREATE INDEX IF NOT EXISTS idx_booking_reference ON bookings(booking_reference)", name: "booking por referencia" },
        ];

        for (const idx of bookingIndexes) {
            await client.query(idx.sql);
            console.log(`  ✅ ${idx.name}`);
        }

        // ═══════════════════════════════════════
        // Índices para referral_clicks
        // ═══════════════════════════════════════
        const referralIndexes = [
            { sql: "CREATE INDEX IF NOT EXISTS idx_refclick_agent ON referral_clicks(agent_id)", name: "referral clicks por agente" },
            { sql: "CREATE INDEX IF NOT EXISTS idx_refclick_date ON referral_clicks(clicked_at DESC)", name: "referral clicks por fecha" },
            { sql: "CREATE INDEX IF NOT EXISTS idx_refconv_agent ON referral_conversions(agent_id)", name: "referral conversions por agente" },
        ];

        for (const idx of referralIndexes) {
            try {
                await client.query(idx.sql);
                console.log(`  ✅ ${idx.name}`);
            } catch (e) {
                console.log(`  ⚠️ Saltando ${idx.name}: ${e.message.substring(0, 60)}`);
            }
        }

        // ═══════════════════════════════════════
        // Índices para tenant_users
        // ═══════════════════════════════════════
        const tenantUserIndexes = [
            { sql: "CREATE INDEX IF NOT EXISTS idx_tu_tenant_active ON tenant_users(tenant_id) WHERE is_active = true", name: "tenant users activos" },
            { sql: "CREATE INDEX IF NOT EXISTS idx_tu_user ON tenant_users(user_id)", name: "tenant users por user_id" },
            { sql: "CREATE INDEX IF NOT EXISTS idx_tu_referral ON tenant_users(referral_code) WHERE referral_code IS NOT NULL", name: "tenant users por referral code" },
        ];

        for (const idx of tenantUserIndexes) {
            await client.query(idx.sql);
            console.log(`  ✅ ${idx.name}`);
        }

        // ═══════════════════════════════════════
        // Índices para notificaciones y reviews
        // ═══════════════════════════════════════
        const extraIndexes = [
            { sql: "CREATE INDEX IF NOT EXISTS idx_notif_created ON agent_notifications(created_at DESC)", name: "notificaciones por fecha" },
            { sql: "CREATE INDEX IF NOT EXISTS idx_reviews_created ON agent_reviews(created_at DESC)", name: "reviews por fecha" },
            { sql: "CREATE INDEX IF NOT EXISTS idx_reviews_avg ON agent_reviews(agent_id, rating) WHERE is_active = true", name: "reviews promedio activo" },
        ];

        for (const idx of extraIndexes) {
            await client.query(idx.sql);
            console.log(`  ✅ ${idx.name}`);
        }

        // ═══════════════════════════════════════
        // Verificar índices creados
        // ═══════════════════════════════════════
        const allIndexes = await client.query(`
            SELECT tablename, indexname 
            FROM pg_indexes 
            WHERE schemaname = 'public' 
            AND indexname LIKE 'idx_%'
            ORDER BY tablename, indexname
        `);

        console.log(`\n📊 Total de índices personalizados: ${allIndexes.rows.length}`);
        let currentTable = '';
        for (const row of allIndexes.rows) {
            if (row.tablename !== currentTable) {
                currentTable = row.tablename;
                console.log(`\n  📁 ${currentTable}:`);
            }
            console.log(`     - ${row.indexname}`);
        }

        console.log('\n✅ Optimización de base de datos completa');

    } catch (error) {
        console.error('❌ Error:', error.message);
    } finally {
        client.release();
        pool.end();
    }
}

main();
