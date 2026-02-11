// Sprint 5: Crear tabla de notificaciones para agentes
require('dotenv').config({ path: '.env.local' });
const { Pool } = require('pg');

const pool = new Pool({
    connectionString: process.env.DATABASE_URL,
    ssl: { rejectUnauthorized: false }
});

async function main() {
    const client = await pool.connect();
    try {
        // Tabla de notificaciones
        await client.query(`
            CREATE TABLE IF NOT EXISTS agent_notifications (
                id SERIAL PRIMARY KEY,
                user_id INTEGER NOT NULL REFERENCES users(id),
                tenant_id INTEGER REFERENCES tenants(id),
                agent_id INTEGER REFERENCES tenant_users(id),
                type VARCHAR(50) NOT NULL DEFAULT 'info',
                title VARCHAR(255) NOT NULL,
                message TEXT,
                icon VARCHAR(10),
                link VARCHAR(500),
                metadata JSONB DEFAULT '{}',
                is_read BOOLEAN DEFAULT false,
                read_at TIMESTAMP,
                created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
            )
        `);
        console.log('✅ Tabla agent_notifications creada');

        // Índices
        await client.query(`
            CREATE INDEX IF NOT EXISTS idx_notif_user_unread ON agent_notifications(user_id, is_read) WHERE is_read = false
        `);
        await client.query(`
            CREATE INDEX IF NOT EXISTS idx_notif_agent ON agent_notifications(agent_id)
        `);
        console.log('✅ Índices creados');

        // Insertar algunas notificaciones de prueba para los agentes de MMTA
        const agents = await client.query(
            "SELECT tu.id AS agent_id, tu.user_id, u.name FROM tenant_users tu JOIN users u ON tu.user_id = u.id WHERE tu.tenant_id = 2"
        );

        const notifications = [
            { type: 'commission', title: '💰 Nueva comisión generada', message: 'La reserva #109 generó una comisión de $3,538 MXN', icon: '💰', link: '/dashboard/agent' },
            { type: 'referral', title: '🔗 Nuevo clic en tu liga', message: 'Alguien hizo clic en tu liga de referido desde Instagram', icon: '🔗', link: '/dashboard/agent' },
            { type: 'conversion', title: '🎉 ¡Nuevo cliente referido!', message: 'Laura Pérez se registró usando tu código de referido', icon: '🎉', link: '/dashboard/agent' },
            { type: 'payout', title: '💸 Dispersión recibida', message: 'Se dispersaron $2,700 MXN a tu cuenta (Lote DISP-001)', icon: '💸', link: '/dashboard/agent' },
            { type: 'info', title: '📢 Nuevo servicio disponible', message: 'Ahora puedes ofrecer tours en Puerto Vallarta con 15% de comisión', icon: '📢', link: '/tours' },
            { type: 'achievement', title: '🏆 ¡Nivel alcanzado!', message: 'Llegaste a 10 referidos. Tu tasa de comisión subió a 12%', icon: '🏆', link: '/dashboard/agent' },
        ];

        let count = 0;
        for (const agent of agents.rows) {
            // No todas las notificaciones para todos los agentes
            const agentNotifs = notifications.slice(0, Math.floor(Math.random() * 4) + 2);
            for (const notif of agentNotifs) {
                await client.query(`
                    INSERT INTO agent_notifications (user_id, tenant_id, agent_id, type, title, message, icon, link, is_read, created_at)
                    VALUES ($1, 2, $2, $3, $4, $5, $6, $7, $8, CURRENT_TIMESTAMP - INTERVAL '${Math.floor(Math.random() * 72)} hours')
                `, [
                    agent.user_id,
                    agent.agent_id,
                    notif.type,
                    notif.title,
                    notif.message,
                    notif.icon,
                    notif.link,
                    Math.random() > 0.6 // 40% leidas
                ]);
                count++;
            }
        }
        console.log(`✅ ${count} notificaciones de prueba creadas`);

        // Verificar
        const total = await client.query('SELECT COUNT(*) FROM agent_notifications');
        const unread = await client.query('SELECT COUNT(*) FROM agent_notifications WHERE is_read = false');
        console.log(`📊 Total: ${total.rows[0].count}, No leídas: ${unread.rows[0].count}`);

    } catch (error) {
        console.error('❌ Error:', error.message);
    } finally {
        client.release();
        pool.end();
    }
}

main();
