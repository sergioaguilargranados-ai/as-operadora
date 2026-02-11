// Ejecutar migración Fase 2 como bloque completo
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
        console.log('🚀 Ejecutando migración Fase 2 (bloque completo)...\n');

        // Execute each ALTER/CREATE separately for better error handling
        const statements = [
            // 1. Extend tenant_users
            `ALTER TABLE tenant_users ADD COLUMN IF NOT EXISTS referral_code VARCHAR(50) UNIQUE`,
            `ALTER TABLE tenant_users ADD COLUMN IF NOT EXISTS agent_phone VARCHAR(20)`,
            `ALTER TABLE tenant_users ADD COLUMN IF NOT EXISTS agent_commission_split NUMERIC(5,2) DEFAULT 0`,
            `ALTER TABLE tenant_users ADD COLUMN IF NOT EXISTS agent_status VARCHAR(20) DEFAULT 'active'`,
            `ALTER TABLE tenant_users ADD COLUMN IF NOT EXISTS updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP`,

            // 2. Extend agency_commissions
            `ALTER TABLE agency_commissions ADD COLUMN IF NOT EXISTS agent_id INTEGER`,
            `ALTER TABLE agency_commissions ADD COLUMN IF NOT EXISTS agent_commission_amount NUMERIC(12,2) DEFAULT 0`,
            `ALTER TABLE agency_commissions ADD COLUMN IF NOT EXISTS agency_commission_amount NUMERIC(12,2) DEFAULT 0`,
            `ALTER TABLE agency_commissions ADD COLUMN IF NOT EXISTS booking_type VARCHAR(50)`,
            `ALTER TABLE agency_commissions ADD COLUMN IF NOT EXISTS is_active BOOLEAN DEFAULT true`,
            `ALTER TABLE agency_commissions ADD COLUMN IF NOT EXISTS notes TEXT`,
            `ALTER TABLE agency_commissions ADD COLUMN IF NOT EXISTS updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP`,

            // 3. Table referral_clicks
            `CREATE TABLE IF NOT EXISTS referral_clicks (
        id SERIAL PRIMARY KEY,
        agent_id INTEGER NOT NULL,
        referral_code VARCHAR(50) NOT NULL,
        ip_address VARCHAR(45),
        user_agent TEXT,
        referer_url TEXT,
        landing_page VARCHAR(500),
        utm_source VARCHAR(100),
        utm_medium VARCHAR(100),
        utm_campaign VARCHAR(100),
        session_id VARCHAR(100),
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
      )`,

            // 4. Table referral_conversions
            `CREATE TABLE IF NOT EXISTS referral_conversions (
        id SERIAL PRIMARY KEY,
        click_id INTEGER REFERENCES referral_clicks(id),
        agent_id INTEGER NOT NULL,
        user_id INTEGER REFERENCES users(id),
        conversion_type VARCHAR(30) NOT NULL,
        booking_id INTEGER REFERENCES bookings(id),
        revenue_amount NUMERIC(12,2) DEFAULT 0,
        currency VARCHAR(3) DEFAULT 'MXN',
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
      )`,

            // 5. Table commission_disbursements
            `CREATE TABLE IF NOT EXISTS commission_disbursements (
        id SERIAL PRIMARY KEY,
        agent_id INTEGER NOT NULL,
        agency_id INTEGER NOT NULL REFERENCES tenants(id),
        amount NUMERIC(12,2) NOT NULL,
        currency VARCHAR(3) DEFAULT 'MXN',
        payment_method VARCHAR(50),
        payment_reference VARCHAR(100),
        bank_name VARCHAR(100),
        bank_account VARCHAR(50),
        period_start DATE,
        period_end DATE,
        status VARCHAR(20) DEFAULT 'pending',
        processed_by INTEGER REFERENCES users(id),
        processed_at TIMESTAMP,
        notes TEXT,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
      )`,

            // 6. Extend agency_clients
            `ALTER TABLE agency_clients ADD COLUMN IF NOT EXISTS client_name VARCHAR(200)`,
            `ALTER TABLE agency_clients ADD COLUMN IF NOT EXISTS client_email VARCHAR(200)`,
            `ALTER TABLE agency_clients ADD COLUMN IF NOT EXISTS client_phone VARCHAR(20)`,
            `ALTER TABLE agency_clients ADD COLUMN IF NOT EXISTS source VARCHAR(50) DEFAULT 'referral'`,
            `ALTER TABLE agency_clients ADD COLUMN IF NOT EXISTS status VARCHAR(20) DEFAULT 'active'`,
            `ALTER TABLE agency_clients ADD COLUMN IF NOT EXISTS total_bookings INTEGER DEFAULT 0`,
            `ALTER TABLE agency_clients ADD COLUMN IF NOT EXISTS total_revenue NUMERIC(12,2) DEFAULT 0`,
            `ALTER TABLE agency_clients ADD COLUMN IF NOT EXISTS last_booking_at TIMESTAMP`,
            `ALTER TABLE agency_clients ADD COLUMN IF NOT EXISTS updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP`,

            // Indexes
            `CREATE INDEX IF NOT EXISTS idx_tenant_users_referral_code ON tenant_users(referral_code) WHERE referral_code IS NOT NULL`,
            `CREATE INDEX IF NOT EXISTS idx_agency_commissions_agent ON agency_commissions(agent_id)`,
            `CREATE INDEX IF NOT EXISTS idx_agency_commissions_status ON agency_commissions(status)`,
            `CREATE INDEX IF NOT EXISTS idx_referral_clicks_agent ON referral_clicks(agent_id)`,
            `CREATE INDEX IF NOT EXISTS idx_referral_clicks_code ON referral_clicks(referral_code)`,
            `CREATE INDEX IF NOT EXISTS idx_referral_clicks_date ON referral_clicks(created_at)`,
            `CREATE INDEX IF NOT EXISTS idx_referral_conversions_agent ON referral_conversions(agent_id)`,
            `CREATE INDEX IF NOT EXISTS idx_disbursements_agent ON commission_disbursements(agent_id)`,
            `CREATE INDEX IF NOT EXISTS idx_disbursements_agency ON commission_disbursements(agency_id)`,
        ];

        let success = 0, errors = 0;
        for (const stmt of statements) {
            try {
                await client.query(stmt);
                success++;
                const preview = stmt.replace(/\s+/g, ' ').substring(0, 80).trim();
                console.log(`  ✅ ${preview}...`);
            } catch (e) {
                errors++;
                const preview = stmt.replace(/\s+/g, ' ').substring(0, 60).trim();
                console.log(`  ⚠️  ${preview}... → ${e.message}`);
            }
        }

        // Create view separately (complex query)
        try {
            await client.query(`
        CREATE OR REPLACE VIEW agent_dashboard_stats AS
        SELECT
          tu.id AS agent_id,
          tu.user_id,
          tu.tenant_id AS agency_id,
          tu.referral_code,
          u.name AS agent_name,
          u.email AS agent_email,
          t.company_name AS agency_name,
          COALESCE((SELECT COUNT(*) FROM referral_clicks rc WHERE rc.agent_id = tu.id), 0) AS total_clicks,
          COALESCE((SELECT COUNT(*) FROM referral_clicks rc WHERE rc.agent_id = tu.id AND rc.created_at >= CURRENT_DATE), 0) AS clicks_today,
          COALESCE((SELECT COUNT(*) FROM referral_clicks rc WHERE rc.agent_id = tu.id AND rc.created_at >= DATE_TRUNC('week', CURRENT_DATE)), 0) AS clicks_this_week,
          COALESCE((SELECT COUNT(*) FROM referral_clicks rc WHERE rc.agent_id = tu.id AND rc.created_at >= DATE_TRUNC('month', CURRENT_DATE)), 0) AS clicks_this_month,
          COALESCE((SELECT COUNT(*) FROM referral_conversions rcv WHERE rcv.agent_id = tu.id), 0) AS total_conversions,
          COALESCE((SELECT COUNT(*) FROM referral_conversions rcv WHERE rcv.agent_id = tu.id AND rcv.conversion_type = 'registration'), 0) AS total_registrations,
          COALESCE((SELECT COUNT(*) FROM referral_conversions rcv WHERE rcv.agent_id = tu.id AND rcv.conversion_type = 'booking'), 0) AS total_bookings_referred,
          COALESCE((SELECT SUM(ac.agent_commission_amount) FROM agency_commissions ac WHERE ac.agent_id = tu.id AND ac.status = 'pending' AND ac.is_active = true), 0) AS commission_pending,
          COALESCE((SELECT SUM(ac.agent_commission_amount) FROM agency_commissions ac WHERE ac.agent_id = tu.id AND ac.status = 'available' AND ac.is_active = true), 0) AS commission_available,
          COALESCE((SELECT SUM(ac.agent_commission_amount) FROM agency_commissions ac WHERE ac.agent_id = tu.id AND ac.status = 'paid' AND ac.is_active = true), 0) AS commission_paid,
          COALESCE((SELECT SUM(ac.agent_commission_amount) FROM agency_commissions ac WHERE ac.agent_id = tu.id AND ac.is_active = true), 0) AS commission_total,
          COALESCE((SELECT COUNT(*) FROM agency_clients acl WHERE acl.agent_id = tu.user_id), 0) AS total_clients
        FROM tenant_users tu
        JOIN users u ON tu.user_id = u.id
        JOIN tenants t ON tu.tenant_id = t.id
        WHERE tu.role IN ('AGENT', 'AGENCY_ADMIN')
          AND tu.is_active = true
      `);
            success++;
            console.log(`  ✅ CREATE VIEW agent_dashboard_stats...`);
        } catch (e) {
            errors++;
            console.log(`  ⚠️  CREATE VIEW... → ${e.message}`);
        }

        console.log(`\n📊 Resultado: ${success} exitosos, ${errors} con warnings`);

        // Verification
        console.log('\n🔍 Verificación:');
        for (const t of ['referral_clicks', 'referral_conversions', 'commission_disbursements']) {
            const r = await client.query(
                "SELECT COUNT(*) as cols FROM information_schema.columns WHERE table_name=$1", [t]
            );
            console.log(`  📋 ${t}: ${r.rows[0].cols} columnas`);
        }

        const tuCols = await client.query(
            "SELECT column_name FROM information_schema.columns WHERE table_name='tenant_users' ORDER BY ordinal_position"
        );
        console.log(`  📋 tenant_users: ${tuCols.rows.map(r => r.column_name).join(', ')}`);

        const acCols = await client.query(
            "SELECT column_name FROM information_schema.columns WHERE table_name='agency_commissions' ORDER BY ordinal_position"
        );
        console.log(`  📋 agency_commissions: ${acCols.rows.map(r => r.column_name).join(', ')}`);

        const viewCheck = await client.query(
            "SELECT COUNT(*) as c FROM information_schema.views WHERE table_name='agent_dashboard_stats'"
        );
        console.log(`  📋 Vista agent_dashboard_stats: ${viewCheck.rows[0].c > 0 ? '✅' : '❌'}`);

        console.log('\n🎉 Migración Fase 2 completada!');
    } catch (e) {
        console.error('❌ Error fatal:', e.message);
    } finally {
        client.release();
        pool.end();
    }
}
main();
