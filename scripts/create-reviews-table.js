// Sprint 5: Crear tabla de reviews para agentes
require('dotenv').config({ path: '.env.local' });
const { Pool } = require('pg');

const pool = new Pool({
    connectionString: process.env.DATABASE_URL,
    ssl: { rejectUnauthorized: false }
});

async function main() {
    const client = await pool.connect();
    try {
        // Tabla de reviews
        await client.query(`
            CREATE TABLE IF NOT EXISTS agent_reviews (
                id SERIAL PRIMARY KEY,
                agent_id INTEGER NOT NULL REFERENCES tenant_users(id),
                client_id INTEGER REFERENCES agency_clients(id),
                user_id INTEGER REFERENCES users(id),
                booking_id INTEGER REFERENCES bookings(id),
                rating INTEGER NOT NULL CHECK (rating >= 1 AND rating <= 5),
                title VARCHAR(255),
                comment TEXT,
                response TEXT,
                response_at TIMESTAMP,
                is_verified BOOLEAN DEFAULT false,
                is_public BOOLEAN DEFAULT true,
                is_active BOOLEAN DEFAULT true,
                created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
                updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
            )
        `);
        console.log('✅ Tabla agent_reviews creada');

        // Índices
        await client.query(`CREATE INDEX IF NOT EXISTS idx_reviews_agent ON agent_reviews(agent_id)`);
        await client.query(`CREATE INDEX IF NOT EXISTS idx_reviews_rating ON agent_reviews(agent_id, rating)`);
        console.log('✅ Índices creados');

        // Reviews de prueba
        const agents = await client.query(
            "SELECT tu.id AS agent_id FROM tenant_users tu WHERE tu.tenant_id = 2"
        );
        const clients = await client.query(
            "SELECT id, client_user_id, client_name FROM agency_clients WHERE agency_id = 2 LIMIT 6"
        );
        console.log(`  Encontrados ${agents.rows.length} agentes, ${clients.rows.length} clientes`);

        const reviewTemplates = [
            { rating: 5, title: '¡Excelente servicio!', comment: 'María nos organizó un viaje increíble a Cancún. Todo salió perfecto, desde el hotel hasta las excursiones. La recomiendo al 100%.' },
            { rating: 5, title: 'Muy profesional', comment: 'El mejor agente que hemos tenido. Siempre disponible y con opciones increíbles para nuestro presupuesto.' },
            { rating: 4, title: 'Buen servicio', comment: 'Todo bien con la reserva del tour. Hubo un pequeño retraso en la confirmación pero se resolvió rápido.' },
            { rating: 5, title: 'Servicio de primera', comment: 'Nos consiguió un upgrade de habitación sin costo adicional. Muy contenta con el servicio.' },
            { rating: 4, title: 'Recomendable', comment: 'Buenas opciones de hoteles y paquetes. La comunicación fue clara y oportuna.' },
            { rating: 3, title: 'Puede mejorar', comment: 'El servicio fue aceptable pero la respuesta por WhatsApp fue un poco lenta algunos días.' },
            { rating: 5, title: '¡Viaje soñado!', comment: 'Roberto nos planeó la luna de miel perfecta. Todo detallito estuvo cuidado. ¡Gracias!' },
            { rating: 4, title: 'Muy buena experiencia', comment: 'Ana fue muy atenta y nos dio varias opciones antes de decidir. El tour a Vallarta fue espectacular.' },
        ];

        let count = 0;
        for (let i = 0; i < agents.rows.length; i++) {
            const agent = agents.rows[i];
            // 2-3 reviews por agente
            const numReviews = Math.floor(Math.random() * 2) + 2;
            for (let j = 0; j < numReviews && j < clients.rows.length; j++) {
                const template = reviewTemplates[(i * 3 + j) % reviewTemplates.length];
                const clientRow = clients.rows[(i + j) % clients.rows.length];
                await client.query(`
                    INSERT INTO agent_reviews (agent_id, client_id, user_id, rating, title, comment, is_verified, created_at)
                    VALUES ($1, $2, $3, $4, $5, $6, true, CURRENT_TIMESTAMP - INTERVAL '${Math.floor(Math.random() * 60)} days')
                `, [
                    agent.agent_id,
                    clientRow.id,
                    clientRow.client_user_id,
                    template.rating,
                    template.title,
                    template.comment
                ]);
                count++;
            }
        }
        console.log(`✅ ${count} reviews de prueba creadas`);

        // Stats
        const avgResult = await client.query(
            "SELECT agent_id, COUNT(*) as count, AVG(rating)::NUMERIC(3,2) as avg_rating FROM agent_reviews GROUP BY agent_id ORDER BY avg_rating DESC"
        );
        for (const row of avgResult.rows) {
            console.log(`  Agent ${row.agent_id}: ${row.count} reviews, ⭐ ${row.avg_rating}`);
        }

    } catch (error) {
        console.error('❌ Error:', error.message);
    } finally {
        client.release();
        pool.end();
    }
}

main();
