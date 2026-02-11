/**
 * AgencyService - Gestión de agencias, agentes y clientes
 * 
 * Jerarquía: AS Operadora → Agencia → Agente → Cliente
 */

import { query, queryOne, insertOne } from '@/lib/db'
import { v4 as uuidv4 } from 'uuid'

// ═══════════════════════════════════════════
// Tipos
// ═══════════════════════════════════════════

export interface Agent {
    id: number
    user_id: number
    tenant_id: number
    role: string
    referral_code: string | null
    agent_phone: string | null
    agent_commission_split: number
    agent_status: string
    is_active: boolean
    // Joined fields
    agent_name?: string
    agent_email?: string
    agency_name?: string
}

export interface AgencyClient {
    id: number
    agency_id: number
    client_user_id: number
    agent_id: number
    referral_code: string | null
    client_name: string | null
    client_email: string | null
    client_phone: string | null
    source: string
    status: string
    total_bookings: number
    total_revenue: number
    last_booking_at: Date | null
    commission_rate: number
}

export interface AgencyDashboardStats {
    total_agents: number
    active_agents: number
    total_clients: number
    total_bookings: number
    total_revenue: number
    total_commissions: number
    pending_commissions: number
    available_commissions: number
    paid_commissions: number
    top_agents: Array<{
        agent_name: string
        total_clients: number
        total_bookings: number
        total_commissions: number
    }>
}

// ═══════════════════════════════════════════
// Servicio
// ═══════════════════════════════════════════

export class AgencyService {

    // ─────────────────────────────────────────
    // AGENTES
    // ─────────────────────────────────────────

    /**
     * Listar agentes de una agencia
     */
    async getAgents(agencyId: number, filters?: {
        status?: string
        search?: string
    }): Promise<Agent[]> {
        let sql = `
      SELECT 
        tu.*,
        u.name AS agent_name,
        u.email AS agent_email,
        u.phone AS agent_user_phone,
        t.company_name AS agency_name
      FROM tenant_users tu
      JOIN users u ON tu.user_id = u.id
      JOIN tenants t ON tu.tenant_id = t.id
      WHERE tu.tenant_id = $1
        AND tu.role IN ('AGENT', 'AGENCY_ADMIN')
    `
        const params: any[] = [agencyId]
        let idx = 2

        if (filters?.status) {
            sql += ` AND tu.agent_status = $${idx}`
            params.push(filters.status)
            idx++
        }

        if (filters?.search) {
            sql += ` AND (u.name ILIKE $${idx} OR u.email ILIKE $${idx})`
            params.push(`%${filters.search}%`)
            idx++
        }

        sql += ` ORDER BY u.name ASC`

        const result = await query(sql, params)
        return result.rows || []
    }

    /**
     * Crear un agente (vincular usuario a la agencia)
     */
    async createAgent(agencyId: number, data: {
        userId: number
        role?: string
        phone?: string
        commissionSplit?: number
    }): Promise<Agent> {
        const referralCode = this.generateReferralCode()

        const result = await query(`
      INSERT INTO tenant_users (user_id, tenant_id, role, referral_code, agent_phone, agent_commission_split, is_active, agent_status)
      VALUES ($1, $2, $3, $4, $5, $6, true, 'active')
      RETURNING *
    `, [
            data.userId,
            agencyId,
            data.role || 'AGENT',
            referralCode,
            data.phone || null,
            data.commissionSplit || 0
        ])

        return result.rows[0]
    }

    /**
     * Crear usuario + agente en una sola operación
     */
    async createAgentWithUser(agencyId: number, data: {
        name: string
        email: string
        phone?: string
        password: string
        role?: string
        commissionSplit?: number
    }): Promise<{ user: any; agent: Agent }> {
        // Verificar email único
        const existing = await queryOne('SELECT id FROM users WHERE email = $1', [data.email])
        if (existing) {
            throw new Error(`Ya existe un usuario con el email ${data.email}`)
        }

        // Crear usuario
        const bcrypt = require('bcryptjs')
        const hashedPassword = await bcrypt.hash(data.password, 10)

        const userResult = await query(`
      INSERT INTO users (name, email, phone, password_hash, role, is_active, email_verified)
      VALUES ($1, $2, $3, $4, 'user', true, true)
      RETURNING *
    `, [data.name, data.email, data.phone || null, hashedPassword])

        const user = userResult.rows[0]

        // Crear agente
        const agent = await this.createAgent(agencyId, {
            userId: user.id,
            role: data.role || 'AGENT',
            phone: data.phone,
            commissionSplit: data.commissionSplit || 0
        })

        return { user, agent }
    }

    /**
     * Actualizar agente
     */
    async updateAgent(agentId: number, updates: {
        role?: string
        phone?: string
        commissionSplit?: number
        status?: string
        isActive?: boolean
    }): Promise<Agent> {
        const setClauses: string[] = []
        const params: any[] = []
        let idx = 1

        if (updates.role !== undefined) {
            setClauses.push(`role = $${idx}`)
            params.push(updates.role)
            idx++
        }
        if (updates.phone !== undefined) {
            setClauses.push(`agent_phone = $${idx}`)
            params.push(updates.phone)
            idx++
        }
        if (updates.commissionSplit !== undefined) {
            setClauses.push(`agent_commission_split = $${idx}`)
            params.push(updates.commissionSplit)
            idx++
        }
        if (updates.status !== undefined) {
            setClauses.push(`agent_status = $${idx}`)
            params.push(updates.status)
            idx++
        }
        if (updates.isActive !== undefined) {
            setClauses.push(`is_active = $${idx}`)
            params.push(updates.isActive)
            idx++
        }

        setClauses.push('updated_at = CURRENT_TIMESTAMP')

        const result = await query(`
      UPDATE tenant_users SET ${setClauses.join(', ')}
      WHERE id = $${idx}
      RETURNING *
    `, [...params, agentId])

        return result.rows[0]
    }

    /**
     * Obtener agente por ID
     */
    async getAgentById(agentId: number): Promise<Agent | null> {
        return queryOne(`
      SELECT 
        tu.*,
        u.name AS agent_name,
        u.email AS agent_email,
        t.company_name AS agency_name
      FROM tenant_users tu
      JOIN users u ON tu.user_id = u.id
      JOIN tenants t ON tu.tenant_id = t.id
      WHERE tu.id = $1
    `, [agentId])
    }

    /**
     * Obtener agente por referral_code
     */
    async getAgentByReferralCode(code: string): Promise<Agent | null> {
        return queryOne(`
      SELECT 
        tu.*,
        u.name AS agent_name,
        u.email AS agent_email,
        t.company_name AS agency_name
      FROM tenant_users tu
      JOIN users u ON tu.user_id = u.id
      JOIN tenants t ON tu.tenant_id = t.id
      WHERE tu.referral_code = $1 AND tu.is_active = true
    `, [code])
    }

    // ─────────────────────────────────────────
    // CLIENTES
    // ─────────────────────────────────────────

    /**
     * Listar clientes de una agencia (o de un agente específico)
     */
    async getClients(agencyId: number, filters?: {
        agentId?: number
        status?: string
        search?: string
        limit?: number
        offset?: number
    }): Promise<{ clients: AgencyClient[]; total: number }> {
        let sql = `
      SELECT 
        ac.*,
        u.name AS user_name,
        u.email AS user_email,
        u.phone AS user_phone
      FROM agency_clients ac
      LEFT JOIN users u ON ac.client_user_id = u.id
      WHERE ac.agency_id = $1
    `
        let countSql = `SELECT COUNT(*) FROM agency_clients ac WHERE ac.agency_id = $1`
        const params: any[] = [agencyId]
        const countParams: any[] = [agencyId]
        let idx = 2

        if (filters?.agentId) {
            const clause = ` AND ac.agent_id = $${idx}`
            sql += clause
            countSql += clause
            params.push(filters.agentId)
            countParams.push(filters.agentId)
            idx++
        }

        if (filters?.status) {
            const clause = ` AND ac.status = $${idx}`
            sql += clause
            countSql += clause
            params.push(filters.status)
            countParams.push(filters.status)
            idx++
        }

        if (filters?.search) {
            const clause = ` AND (ac.client_name ILIKE $${idx} OR ac.client_email ILIKE $${idx} OR u.name ILIKE $${idx})`
            sql += clause
            countSql += clause
            params.push(`%${filters.search}%`)
            countParams.push(`%${filters.search}%`)
            idx++
        }

        sql += ` ORDER BY ac.created_at DESC`

        if (filters?.limit) {
            sql += ` LIMIT $${idx}`
            params.push(filters.limit)
            idx++
        }
        if (filters?.offset) {
            sql += ` OFFSET $${idx}`
            params.push(filters.offset)
            idx++
        }

        const [result, countResult] = await Promise.all([
            query(sql, params),
            query(countSql, countParams)
        ])

        return {
            clients: result.rows || [],
            total: parseInt(countResult.rows[0]?.count || '0')
        }
    }

    /**
     * Registrar un cliente para una agencia/agente
     */
    async registerClient(data: {
        agencyId: number
        agentId: number
        userId?: number
        referralCode?: string
        name: string
        email: string
        phone?: string
        source?: string
    }): Promise<AgencyClient> {
        const result = await query(`
      INSERT INTO agency_clients (agency_id, agent_id, client_user_id, referral_code, client_name, client_email, client_phone, source)
      VALUES ($1, $2, $3, $4, $5, $6, $7, $8)
      RETURNING *
    `, [
            data.agencyId,
            data.agentId,
            data.userId || null,
            data.referralCode || null,
            data.name,
            data.email,
            data.phone || null,
            data.source || 'referral'
        ])

        return result.rows[0]
    }

    // ─────────────────────────────────────────
    // DASHBOARD STATS
    // ─────────────────────────────────────────

    /**
     * Estadísticas del dashboard de la agencia
     */
    async getDashboardStats(agencyId: number): Promise<AgencyDashboardStats> {
        const [agents, clients, bookings, commissions, topAgents] = await Promise.all([
            // Agentes
            query(`
        SELECT 
          COUNT(*) AS total,
          COUNT(*) FILTER (WHERE agent_status = 'active' AND is_active = true) AS active
        FROM tenant_users
        WHERE tenant_id = $1 AND role IN ('AGENT', 'AGENCY_ADMIN')
      `, [agencyId]),

            // Clientes
            query(`SELECT COUNT(*) AS total FROM agency_clients WHERE agency_id = $1`, [agencyId]),

            // Reservas de la agencia
            query(`
        SELECT 
          COUNT(*) AS total,
          COALESCE(SUM(total_price), 0) AS revenue
        FROM bookings
        WHERE tenant_id = $1
      `, [agencyId]),

            // Comisiones
            query(`
        SELECT
          COALESCE(SUM(commission_amount), 0) AS total,
          COALESCE(SUM(CASE WHEN status = 'pending' THEN commission_amount ELSE 0 END), 0) AS pending,
          COALESCE(SUM(CASE WHEN status = 'available' THEN commission_amount ELSE 0 END), 0) AS available,
          COALESCE(SUM(CASE WHEN status = 'paid' THEN commission_amount ELSE 0 END), 0) AS paid
        FROM agency_commissions
        WHERE agency_id = $1 AND is_active = true
      `, [agencyId]),

            // Top agentes  
            query(`
        SELECT 
          u.name AS agent_name,
          (SELECT COUNT(*) FROM agency_clients ac WHERE ac.agent_id = tu.user_id) AS total_clients,
          COALESCE((SELECT COUNT(*) FROM bookings b 
            JOIN agency_clients ac ON b.user_id = ac.client_user_id 
            WHERE ac.agent_id = tu.user_id AND ac.agency_id = $1), 0) AS total_bookings,
          COALESCE((SELECT SUM(commission_amount) FROM agency_commissions 
            WHERE agent_id = tu.id AND is_active = true), 0) AS total_commissions
        FROM tenant_users tu
        JOIN users u ON tu.user_id = u.id
        WHERE tu.tenant_id = $1 AND tu.role IN ('AGENT', 'AGENCY_ADMIN')
        ORDER BY total_commissions DESC
        LIMIT 10
      `, [agencyId])
        ])

        return {
            total_agents: parseInt(agents.rows[0]?.total || '0'),
            active_agents: parseInt(agents.rows[0]?.active || '0'),
            total_clients: parseInt(clients.rows[0]?.total || '0'),
            total_bookings: parseInt(bookings.rows[0]?.total || '0'),
            total_revenue: parseFloat(bookings.rows[0]?.revenue || '0'),
            total_commissions: parseFloat(commissions.rows[0]?.total || '0'),
            pending_commissions: parseFloat(commissions.rows[0]?.pending || '0'),
            available_commissions: parseFloat(commissions.rows[0]?.available || '0'),
            paid_commissions: parseFloat(commissions.rows[0]?.paid || '0'),
            top_agents: topAgents.rows || []
        }
    }

    /**
     * Stats del dashboard del agente individual
     */
    async getAgentDashboardStats(agentId: number): Promise<any> {
        const stats = await queryOne(`
      SELECT * FROM agent_dashboard_stats WHERE agent_id = $1
    `, [agentId])

        if (!stats) return null

        // Proyección de ingresos (próximos 3 meses basado en reservas confirmadas)
        const projection = await query(`
      SELECT 
        DATE_TRUNC('month', b.check_in) AS month,
        COUNT(*) AS bookings,
        SUM(ac.agent_commission_amount) AS projected_income
      FROM agency_commissions ac
      JOIN bookings b ON ac.booking_id = b.id
      WHERE ac.agent_id = $1 
        AND ac.is_active = true
        AND b.check_in >= CURRENT_DATE
        AND b.check_in < CURRENT_DATE + INTERVAL '3 months'
      GROUP BY DATE_TRUNC('month', b.check_in)
      ORDER BY month
    `, [agentId])

        return {
            ...stats,
            conversion_rate: stats.total_clicks > 0
                ? ((stats.total_conversions / stats.total_clicks) * 100).toFixed(1)
                : '0.0',
            income_projection: projection.rows || []
        }
    }

    // ─────────────────────────────────────────
    // HELPERS
    // ─────────────────────────────────────────

    /**
     * Generar código de referido único (8 chars alfanumérico)
     */
    private generateReferralCode(): string {
        const chars = 'ABCDEFGHJKLMNPQRSTUVWXYZ23456789'
        let code = ''
        for (let i = 0; i < 8; i++) {
            code += chars.charAt(Math.floor(Math.random() * chars.length))
        }
        return code
    }
}

export const agencyService = new AgencyService()
