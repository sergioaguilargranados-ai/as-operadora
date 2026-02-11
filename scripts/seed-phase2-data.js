// Sprint 3: Crear datos de prueba - Agentes de M&MTravelAgency
require('dotenv').config({ path: '.env.local' });
const { Pool } = require('pg');
const bcrypt = require('bcryptjs');

const pool = new Pool({
    connectionString: process.env.DATABASE_URL,
    ssl: { rejectUnauthorized: false }
});

const testAgents = [
    {
        name: 'María González López',
        email: 'maria.gonzalez@mmta.com.mx',
        phone: '7221234501',
        role: 'AGENCY_ADMIN',
        commission_split: 0 // Admin no tiene split, ve todo
    },
    {
        name: 'Carlos Ramírez Torres',
        email: 'carlos.ramirez@mmta.com.mx',
        phone: '7221234502',
        role: 'AGENT',
        commission_split: 30
    },
    {
        name: 'Ana Martínez Soto',
        email: 'ana.martinez@mmta.com.mx',
        phone: '7221234503',
        role: 'AGENT',
        commission_split: 25
    },
    {
        name: 'Roberto Hernández Villa',
        email: 'roberto.hernandez@mmta.com.mx',
        phone: '7221234504',
        role: 'AGENT',
        commission_split: 20
    }
];

function generateReferralCode() {
    const chars = 'ABCDEFGHJKLMNPQRSTUVWXYZ23456789';
    let code = '';
    for (let i = 0; i < 8; i++) {
        code += chars.charAt(Math.floor(Math.random() * chars.length));
    }
    return code;
}

async function main() {
    const client = await pool.connect();
    try {
        console.log('🚀 Sprint 3: Creando datos de prueba...\n');

        // 1. Obtener tenant MMTA
        const tenantRes = await client.query(
            "SELECT id, company_name FROM tenants WHERE company_name = 'M&MTravelAgency'"
        );
        if (tenantRes.rows.length === 0) {
            console.error('❌ Tenant M&MTravelAgency no encontrado');
            return;
        }
        const tenantId = tenantRes.rows[0].id;
        console.log(`📋 Tenant: ${tenantRes.rows[0].company_name} (ID: ${tenantId})\n`);

        // 2. Crear usuarios y agentes
        const hashedPassword = await bcrypt.hash('mmta2026', 10);

        for (const agent of testAgents) {
            try {
                // Verificar si ya existe
                const existing = await client.query('SELECT id FROM users WHERE email = $1', [agent.email]);
                let userId;

                if (existing.rows.length > 0) {
                    userId = existing.rows[0].id;
                    console.log(`  ⚠️  Usuario ${agent.name} ya existe (ID: ${userId})`);
                } else {
                    const userRes = await client.query(`
            INSERT INTO users (name, email, phone, password_hash, role, is_active, email_verified)
            VALUES ($1, $2, $3, $4, 'user', true, true)
            RETURNING id
          `, [agent.name, agent.email, agent.phone, hashedPassword]);
                    userId = userRes.rows[0].id;
                    console.log(`  ✅ Usuario creado: ${agent.name} (ID: ${userId})`);
                }

                // Verificar si ya es agente del tenant
                const existingAgent = await client.query(
                    'SELECT id FROM tenant_users WHERE user_id = $1 AND tenant_id = $2',
                    [userId, tenantId]
                );

                if (existingAgent.rows.length > 0) {
                    console.log(`     ↳ Ya es agente del tenant (ID: ${existingAgent.rows[0].id})`);
                } else {
                    const referralCode = generateReferralCode();
                    const agentRes = await client.query(`
            INSERT INTO tenant_users (user_id, tenant_id, role, referral_code, agent_phone, agent_commission_split, is_active, agent_status)
            VALUES ($1, $2, $3, $4, $5, $6, true, 'active')
            RETURNING id, referral_code
          `, [userId, tenantId, agent.role, referralCode, agent.phone, agent.commission_split]);
                    console.log(`     ↳ Agente creado: rol=${agent.role}, código=${agentRes.rows[0].referral_code}, split=${agent.commission_split}%`);
                }
            } catch (e) {
                console.log(`  ❌ Error con ${agent.name}: ${e.message}`);
            }
        }

        // 3. Crear configuración de comisión para la agencia
        console.log('\n📋 Configurando comisiones de la agencia...');

        const existingConfig = await client.query(
            'SELECT id FROM agency_commission_config WHERE agency_id = $1',
            [tenantId]
        );

        let configId;
        if (existingConfig.rows.length > 0) {
            configId = existingConfig.rows[0].id;
            console.log(`  ⚠️  Config ya existe (ID: ${configId})`);
        } else {
            const configRes = await client.query(`
        INSERT INTO agency_commission_config 
          (agency_id, commission_type, default_rate, payment_frequency, payment_method, minimum_payout, withholding_tax, withholding_percentage, is_active)
        VALUES ($1, 'percentage', 12.0, 'biweekly', 'transfer', 500, true, 3.5, true)
        RETURNING id
      `, [tenantId]);
            configId = configRes.rows[0].id;
            console.log(`  ✅ Config creada (ID: ${configId}): 12% default, pago quincenal, retención 3.5%`);

            // Tasas por tipo de servicio
            const serviceRates = [
                { type: 'hotel', rate: 10 },
                { type: 'tour', rate: 15 },
                { type: 'package', rate: 12 },
                { type: 'transfer', rate: 8 },
                { type: 'activity', rate: 10 },
                { type: 'flight', rate: 5 }
            ];

            for (const sr of serviceRates) {
                await client.query(`
          INSERT INTO commission_by_service (config_id, service_type, commission_rate)
          VALUES ($1, $2, $3) ON CONFLICT DO NOTHING
        `, [configId, sr.type, sr.rate]);
            }
            console.log('  ✅ Tasas por servicio: hotel 10%, tour 15%, paquete 12%, transfer 8%, actividad 10%, vuelo 5%');

            // Tiers por volumen
            const tiers = [
                { min: 0, max: 10, rate: 10 },
                { min: 11, max: 30, rate: 12 },
                { min: 31, max: 50, rate: 14 },
                { min: 51, max: null, rate: 16 }
            ];

            for (const tier of tiers) {
                await client.query(`
          INSERT INTO commission_tiers (config_id, min_bookings, max_bookings, commission_rate)
          VALUES ($1, $2, $3, $4) ON CONFLICT DO NOTHING
        `, [configId, tier.min, tier.max, tier.rate]);
            }
            console.log('  ✅ Tiers: 0-10=10%, 11-30=12%, 31-50=14%, 51+=16%');
        }

        // 4. Crear algunos clientes de prueba
        console.log('\n📋 Creando clientes de prueba...');

        const agents = await client.query(
            'SELECT tu.id, tu.user_id, tu.referral_code, u.name FROM tenant_users tu JOIN users u ON tu.user_id = u.id WHERE tu.tenant_id = $1 AND tu.role = $2',
            [tenantId, 'AGENT']
        );

        const testClients = [
            { name: 'Laura Pérez Mendoza', email: 'laura.perez@gmail.com', phone: '5551234567' },
            { name: 'Miguel Ángel Torres', email: 'miguel.torres@hotmail.com', phone: '5559876543' },
            { name: 'Patricia Ruiz Vargas', email: 'patricia.ruiz@yahoo.com', phone: '5552468135' },
            { name: 'Fernando Jiménez Luna', email: 'fernando.jimenez@gmail.com', phone: '5553691472' },
            { name: 'Sofía Castillo Rojas', email: 'sofia.castillo@outlook.com', phone: '5558527419' },
            { name: 'Diego Morales Ríos', email: 'diego.morales@gmail.com', phone: '5557418529' }
        ];

        for (let i = 0; i < testClients.length; i++) {
            const tc = testClients[i];
            const agent = agents.rows[i % agents.rows.length]; // Distribuir entre agentes

            const existing = await client.query(
                'SELECT id FROM agency_clients WHERE client_email = $1 AND agency_id = $2',
                [tc.email, tenantId]
            );

            if (existing.rows.length > 0) {
                console.log(`  ⚠️  Cliente ${tc.name} ya existe`);
            } else {
                // Primero crear usuario para el cliente
                let clientUserId;
                const existingUser = await client.query('SELECT id FROM users WHERE email = $1', [tc.email]);
                if (existingUser.rows.length > 0) {
                    clientUserId = existingUser.rows[0].id;
                } else {
                    const clientUserRes = await client.query(
                        "INSERT INTO users (name, email, phone, password_hash, role, is_active, email_verified) VALUES ($1, $2, $3, $4, 'user', true, true) RETURNING id",
                        [tc.name, tc.email, tc.phone, hashedPassword]
                    );
                    clientUserId = clientUserRes.rows[0].id;
                }

                await client.query(`
          INSERT INTO agency_clients (agency_id, client_user_id, agent_id, client_name, client_email, client_phone, referral_code, source, status, total_bookings, total_revenue)
          VALUES ($1, $2, $3, $4, $5, $6, $7, 'referral', 'active', $8, $9)
        `, [
                    tenantId,
                    clientUserId,
                    agent.user_id,
                    tc.name,
                    tc.email,
                    tc.phone,
                    agent.referral_code,
                    Math.floor(Math.random() * 5) + 1,
                    Math.floor(Math.random() * 50000) + 10000
                ]);
                console.log(`  ✅ Cliente ${tc.name} (User ID: ${clientUserId}) → Agente: ${agent.name}`);
            }
        }

        // 5. Crear bookings y comisiones de prueba
        console.log('\n📋 Creando bookings y comisiones de prueba...');

        // Obtenemos clientes de la agencia para asignar bookings
        const clientsDb = await client.query(
            'SELECT id, client_user_id, client_name FROM agency_clients WHERE agency_id = $1',
            [tenantId]
        );

        const bookingTypes = ['hotel', 'tour', 'package', 'transfer', 'activity'];
        const statuses = ['pending', 'available', 'paid', 'pending', 'available'];
        const destinations = ['Cancún', 'Los Cabos', 'Riviera Maya', 'Puerto Vallarta', 'CDMX'];

        for (let i = 0; i < 5; i++) {
            const agent = agents.rows[i % agents.rows.length];
            const clientRow = clientsDb.rows[i % clientsDb.rows.length];
            const basePrice = Math.floor(Math.random() * 40000) + 15000;
            const bookingType = bookingTypes[i];

            // Crear booking
            const refCode = `MMTA-${Date.now()}-${i}`;
            const bookingRes = await client.query(`
              INSERT INTO bookings 
                (user_id, tenant_id, booking_type, booking_reference, booking_status, payment_status,
                 currency, original_price, subtotal, total_price, 
                 lead_traveler_name, destination, check_in, check_out, adults, booked_at)
              VALUES ($1, $2, $3, $4, 'confirmed', 'paid', 'MXN', $5, $5, $6, $7, $8,
                CURRENT_DATE + INTERVAL '10 days', CURRENT_DATE + INTERVAL '15 days', 2, CURRENT_TIMESTAMP)
              RETURNING id
            `, [
                clientRow.client_user_id,
                tenantId,
                bookingType,
                refCode,
                basePrice,
                basePrice * 1.16,
                clientRow.client_name,
                destinations[i]
            ]);
            const bookingId = bookingRes.rows[0].id;

            // Crear comisión
            const commRate = 12;
            const commAmount = basePrice * (commRate / 100);
            const agentSplit = agent.agent_commission_split || 25;
            const agentAmount = commAmount * (agentSplit / 100);
            const agencyAmount = commAmount - agentAmount;
            const withholding = commAmount * 0.035;

            await client.query(`
              INSERT INTO agency_commissions 
                (agency_id, booking_id, agent_id, base_price, currency, commission_rate, commission_amount, 
                 agent_commission_amount, agency_commission_amount, withholding_amount, net_commission,
                 status, booking_type, is_active)
              VALUES ($1, $2, $3, $4, 'MXN', $5, $6, $7, $8, $9, $10, $11, $12, true)
            `, [
                tenantId,
                bookingId,
                agent.id,
                basePrice,
                commRate,
                commAmount,
                agentAmount,
                agencyAmount,
                withholding,
                commAmount - withholding,
                statuses[i],
                bookingType
            ]);
            console.log(`  ✅ Booking #${bookingId} (${bookingType}): $${basePrice.toLocaleString()} → Comisión $${commAmount.toLocaleString()} (${statuses[i]}) → ${agent.name}`);
        }

        // 6. Crear algunos referral clicks de prueba
        console.log('\n📋 Creando referral clicks de prueba...');

        for (const agent of agents.rows) {
            const numClicks = Math.floor(Math.random() * 20) + 5;
            for (let i = 0; i < numClicks; i++) {
                const daysAgo = Math.floor(Math.random() * 30);
                await client.query(`
          INSERT INTO referral_clicks (agent_id, referral_code, ip_address, user_agent, landing_page, created_at)
          VALUES ($1, $2, $3, $4, $5, CURRENT_TIMESTAMP - INTERVAL '${daysAgo} days')
        `, [
                    agent.id,
                    agent.referral_code,
                    `192.168.1.${Math.floor(Math.random() * 255)}`,
                    'Mozilla/5.0 (iPhone; CPU iPhone OS 16_0 like Mac OS X)',
                    'https://mmta.app.asoperadora.com/'
                ]);
            }
            console.log(`  ✅ ${numClicks} clics para ${agent.name}`);
        }

        // 7. Crear conversiones de prueba
        console.log('\n📋 Creando conversiones de prueba...');

        for (const agent of agents.rows) {
            const numConv = Math.floor(Math.random() * 5) + 2;
            for (let i = 0; i < numConv; i++) {
                await client.query(`
          INSERT INTO referral_conversions (agent_id, conversion_type, revenue_amount, currency, created_at)
          VALUES ($1, $2, $3, 'MXN', CURRENT_TIMESTAMP - INTERVAL '${Math.floor(Math.random() * 30)} days')
        `, [
                    agent.id,
                    ['registration', 'booking', 'registration', 'booking'][i % 4],
                    ['registration', 'registration'].includes(['registration', 'booking', 'registration', 'booking'][i % 4]) ? 0 : Math.floor(Math.random() * 30000) + 10000
                ]);
            }
            console.log(`  ✅ ${numConv} conversiones para ${agent.name}`);
        }

        // 8. Verificación final
        console.log('\n═══ VERIFICACIÓN FINAL ═══');

        const finalCounts = await client.query(`
      SELECT
        (SELECT COUNT(*) FROM tenant_users WHERE tenant_id = $1) as agents,
        (SELECT COUNT(*) FROM agency_clients WHERE agency_id = $1) as clients,
        (SELECT COUNT(*) FROM agency_commissions WHERE agency_id = $1) as commissions,
        (SELECT COUNT(*) FROM referral_clicks rc JOIN tenant_users tu ON rc.agent_id = tu.id WHERE tu.tenant_id = $1) as clicks,
        (SELECT COUNT(*) FROM referral_conversions rcv JOIN tenant_users tu ON rcv.agent_id = tu.id WHERE tu.tenant_id = $1) as conversions,
        (SELECT COALESCE(SUM(commission_amount), 0) FROM agency_commissions WHERE agency_id = $1 AND is_active = true) as total_commission
    `, [tenantId]);

        const f = finalCounts.rows[0];
        console.log(`  📊 Agentes: ${f.agents}`);
        console.log(`  📊 Clientes: ${f.clients}`);
        console.log(`  📊 Comisiones: ${f.commissions} ($${parseFloat(f.total_commission).toLocaleString()} MXN)`);
        console.log(`  📊 Referral Clicks: ${f.clicks}`);
        console.log(`  📊 Conversiones: ${f.conversions}`);

        // Vista del dashboard del agente
        const agentStats = await client.query(`
      SELECT * FROM agent_dashboard_stats LIMIT 3
    `);
        console.log('\n  📊 Agent Dashboard Stats (muestra):');
        for (const a of agentStats.rows) {
            console.log(`     ${a.agent_name}: ${a.total_clicks} clics, ${a.total_conversions} conv, $${parseFloat(a.commission_total).toLocaleString()} comisiones, ${a.total_clients} clientes`);
        }

        console.log('\n🎉 Datos de prueba creados exitosamente!');

    } catch (e) {
        console.error('❌ Error:', e.message);
    } finally {
        client.release();
        pool.end();
    }
}

main();
