/**
 * CommissionService - Motor de cálculo de comisiones
 * 
 * Flujo: Booking finalizado → Cálculo auto → Split agencia/agente → Dispersión
 * 
 * Estados de comisión:
 *   pending    → Reserva confirmada pero no viajada
 *   available  → Viaje finalizado, lista para cobro
 *   paid       → Dispersión realizada
 *   cancelled  → Cancelada
 */

import { query, queryOne } from '@/lib/db'

export interface CommissionConfig {
    id: number
    agency_id: number
    commission_type: string
    default_rate: number
    payment_frequency: string
    payment_method: string
    minimum_payout: number
    withholding_tax: boolean
    withholding_percentage: number
}

export interface Commission {
    id: number
    agency_id: number
    agent_id: number | null
    booking_id: number
    base_price: number
    currency: string
    commission_rate: number
    commission_amount: number
    agent_commission_amount: number
    agency_commission_amount: number
    withholding_amount: number
    net_commission: number
    status: string
    booking_type: string | null
    is_active: boolean
    created_at: Date
}

export class CommissionService {

    /**
     * Calcular y crear comisión automáticamente desde una reserva
     * 
     * Regla de oro: Se calcula al confirmar la reserva.
     * Se mueve a "available" cuando el viaje finaliza.
     */
    async calculateCommission(bookingId: number, agentId?: number): Promise<Commission | null> {
        // Obtener datos de la reserva
        const booking = await queryOne(`
      SELECT b.*, b.tenant_id AS agency_id
      FROM bookings b
      WHERE b.id = $1
    `, [bookingId])

        if (!booking || !booking.agency_id) {
            console.log(`[CommissionService] Booking ${bookingId} sin agency_id, sin comisión`)
            return null
        }

        // Verificar si ya existe comisión
        const existing = await queryOne(`
      SELECT * FROM agency_commissions
      WHERE booking_id = $1 AND is_active = true
    `, [bookingId])

        if (existing) {
            console.log(`[CommissionService] Ya existe comisión para booking ${bookingId}`)
            return existing
        }

        // Obtener configuración de comisión de la agencia
        const config = await this.getCommissionConfig(booking.agency_id)

        // Obtener tasa por tipo de servicio si existe
        let commissionRate = config?.default_rate || 10

        if (config && booking.booking_type) {
            const serviceRate = await queryOne(`
        SELECT commission_rate FROM commission_by_service
        WHERE config_id = $1 AND service_type = $2
      `, [config.id, booking.booking_type])

            if (serviceRate) {
                commissionRate = parseFloat(serviceRate.commission_rate)
            }
        }

        // Verificar tiers (escalas por volumen)
        if (config) {
            const bookingCount = await queryOne(`
        SELECT COUNT(*) AS total FROM agency_commissions
        WHERE agency_id = $1 AND is_active = true
      `, [booking.agency_id])

            const tierRate = await queryOne(`
        SELECT commission_rate FROM commission_tiers
        WHERE config_id = $1 AND min_bookings <= $2 AND (max_bookings IS NULL OR max_bookings >= $2)
        ORDER BY min_bookings DESC LIMIT 1
      `, [config.id, parseInt(bookingCount.total)])

            if (tierRate) {
                commissionRate = parseFloat(tierRate.commission_rate)
            }
        }

        // Calcular montos
        const basePrice = parseFloat(booking.total_price || booking.subtotal || 0)
        const commissionAmount = basePrice * (commissionRate / 100)

        // Split agencia/agente
        let agentCommission = 0
        let agencyCommission = commissionAmount
        let agentTenantUserId = agentId || null

        if (agentTenantUserId) {
            const agent = await queryOne(`
        SELECT agent_commission_split FROM tenant_users WHERE id = $1
      `, [agentTenantUserId])

            if (agent && agent.agent_commission_split > 0) {
                agentCommission = commissionAmount * (agent.agent_commission_split / 100)
                agencyCommission = commissionAmount - agentCommission
            }
        }

        // Calcular retención de impuestos
        let withholdingAmount = 0
        if (config?.withholding_tax && config?.withholding_percentage) {
            withholdingAmount = commissionAmount * (config.withholding_percentage / 100)
        }

        const netCommission = commissionAmount - withholdingAmount

        // Crear comisión
        const result = await query(`
      INSERT INTO agency_commissions 
        (agency_id, agent_id, booking_id, base_price, currency, commission_rate, 
         commission_amount, agent_commission_amount, agency_commission_amount,
         withholding_amount, net_commission, status, booking_type, is_active)
      VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, 'pending', $12, true)
      RETURNING *
    `, [
            booking.agency_id,
            agentTenantUserId,
            bookingId,
            basePrice,
            booking.currency || 'MXN',
            commissionRate,
            commissionAmount,
            agentCommission,
            agencyCommission,
            withholdingAmount,
            netCommission,
            booking.booking_type || null
        ])

        console.log(`[CommissionService] Comisión creada: $${commissionAmount} (${commissionRate}%) para booking ${bookingId}`)
        return result.rows[0]
    }

    /**
     * DISPARADOR DE CAMBIO DE ESTADO
     * Cuando el viaje finaliza: pending → available
     */
    async markAsAvailable(bookingId: number): Promise<Commission | null> {
        const result = await query(`
      UPDATE agency_commissions
      SET status = 'available', updated_at = CURRENT_TIMESTAMP
      WHERE booking_id = $1 AND status = 'pending' AND is_active = true
      RETURNING *
    `, [bookingId])

        if (result.rows[0]) {
            console.log(`[CommissionService] Comisión ${result.rows[0].id} → available (booking ${bookingId} finalizado)`)
        }
        return result.rows[0] || null
    }

    /**
     * Marcar comisión como pagada
     */
    async markAsPaid(commissionId: number, paymentData: {
        paymentMethod?: string
        paymentReference?: string
    }): Promise<Commission | null> {
        const result = await query(`
      UPDATE agency_commissions
      SET status = 'paid', paid_at = CURRENT_TIMESTAMP, updated_at = CURRENT_TIMESTAMP
      WHERE id = $1 AND status = 'available' AND is_active = true
      RETURNING *
    `, [commissionId])

        return result.rows[0] || null
    }

    /**
     * Obtener configuración de comisión de una agencia
     */
    async getCommissionConfig(agencyId: number): Promise<CommissionConfig | null> {
        return queryOne(`
      SELECT * FROM agency_commission_config
      WHERE agency_id = $1 AND is_active = true
    `, [agencyId])
    }

    /**
     * Configurar comisiones de una agencia
     */
    async setCommissionConfig(agencyId: number, data: {
        commissionType?: string
        defaultRate: number
        paymentFrequency?: string
        paymentMethod?: string
        minimumPayout?: number
        withholdingTax?: boolean
        withholdingPercentage?: number
    }): Promise<CommissionConfig> {
        // Upsert
        const existing = await this.getCommissionConfig(agencyId)

        if (existing) {
            const result = await query(`
        UPDATE agency_commission_config SET
          commission_type = $1,
          default_rate = $2,
          payment_frequency = $3,
          payment_method = $4,
          minimum_payout = $5,
          withholding_tax = $6,
          withholding_percentage = $7,
          updated_at = CURRENT_TIMESTAMP
        WHERE id = $8
        RETURNING *
      `, [
                data.commissionType || existing.commission_type,
                data.defaultRate,
                data.paymentFrequency || existing.payment_frequency,
                data.paymentMethod || existing.payment_method,
                data.minimumPayout || existing.minimum_payout,
                data.withholdingTax ?? existing.withholding_tax,
                data.withholdingPercentage ?? existing.withholding_percentage,
                existing.id
            ])
            return result.rows[0]
        }

        const result = await query(`
      INSERT INTO agency_commission_config 
        (agency_id, commission_type, default_rate, payment_frequency, payment_method, minimum_payout, withholding_tax, withholding_percentage, is_active)
      VALUES ($1, $2, $3, $4, $5, $6, $7, $8, true)
      RETURNING *
    `, [
            agencyId,
            data.commissionType || 'percentage',
            data.defaultRate,
            data.paymentFrequency || 'monthly',
            data.paymentMethod || 'transfer',
            data.minimumPayout || 0,
            data.withholdingTax || false,
            data.withholdingPercentage || 0
        ])
        return result.rows[0]
    }

    /**
     * Configurar tasa por tipo de servicio
     */
    async setServiceRate(configId: number, serviceType: string, rate: number): Promise<any> {
        const existing = await queryOne(`
      SELECT * FROM commission_by_service WHERE config_id = $1 AND service_type = $2
    `, [configId, serviceType])

        if (existing) {
            const result = await query(`
        UPDATE commission_by_service SET commission_rate = $1 WHERE id = $2 RETURNING *
      `, [rate, existing.id])
            return result.rows[0]
        }

        const result = await query(`
      INSERT INTO commission_by_service (config_id, service_type, commission_rate)
      VALUES ($1, $2, $3) RETURNING *
    `, [configId, serviceType, rate])
        return result.rows[0]
    }

    /**
     * Listar comisiones con filtros
     */
    async listCommissions(filters: {
        agencyId?: number
        agentId?: number
        status?: string
        startDate?: string
        endDate?: string
        limit?: number
        offset?: number
    }): Promise<{ commissions: Commission[]; total: number }> {
        let sql = `
      SELECT 
        ac.*,
        t.company_name AS agency_name,
        u.name AS agent_name,
        b.booking_reference,
        b.booking_type AS booking_service_type,
        b.destination,
        b.lead_traveler_name
      FROM agency_commissions ac
      LEFT JOIN tenants t ON ac.agency_id = t.id
      LEFT JOIN tenant_users tu ON ac.agent_id = tu.id
      LEFT JOIN users u ON tu.user_id = u.id
      LEFT JOIN bookings b ON ac.booking_id = b.id
      WHERE ac.is_active = true
    `
        let countSql = `SELECT COUNT(*) FROM agency_commissions ac WHERE ac.is_active = true`
        const params: any[] = []
        const countParams: any[] = []
        let idx = 1

        if (filters.agencyId) {
            sql += ` AND ac.agency_id = $${idx}`
            countSql += ` AND ac.agency_id = $${idx}`
            params.push(filters.agencyId)
            countParams.push(filters.agencyId)
            idx++
        }
        if (filters.agentId) {
            sql += ` AND ac.agent_id = $${idx}`
            countSql += ` AND ac.agent_id = $${idx}`
            params.push(filters.agentId)
            countParams.push(filters.agentId)
            idx++
        }
        if (filters.status) {
            sql += ` AND ac.status = $${idx}`
            countSql += ` AND ac.status = $${idx}`
            params.push(filters.status)
            countParams.push(filters.status)
            idx++
        }
        if (filters.startDate) {
            sql += ` AND ac.created_at >= $${idx}`
            countSql += ` AND ac.created_at >= $${idx}`
            params.push(filters.startDate)
            countParams.push(filters.startDate)
            idx++
        }
        if (filters.endDate) {
            sql += ` AND ac.created_at <= $${idx}`
            countSql += ` AND ac.created_at <= $${idx}`
            params.push(filters.endDate)
            countParams.push(filters.endDate)
            idx++
        }

        sql += ` ORDER BY ac.created_at DESC`

        if (filters.limit) {
            sql += ` LIMIT $${idx}`
            params.push(filters.limit)
            idx++
        }
        if (filters.offset) {
            sql += ` OFFSET $${idx}`
            params.push(filters.offset)
        }

        const [result, countResult] = await Promise.all([
            query(sql, params),
            query(countSql, countParams)
        ])

        return {
            commissions: result.rows || [],
            total: parseInt(countResult.rows[0]?.count || '0')
        }
    }

    /**
     * Resumen de comisiones "Mi Monedero" para un agente
     */
    async getAgentWallet(agentId: number): Promise<{
        pending: number
        available: number
        paid: number
        total: number
        currency: string
    }> {
        const result = await queryOne(`
      SELECT
        COALESCE(SUM(CASE WHEN status = 'pending' THEN agent_commission_amount ELSE 0 END), 0) AS pending,
        COALESCE(SUM(CASE WHEN status = 'available' THEN agent_commission_amount ELSE 0 END), 0) AS available,
        COALESCE(SUM(CASE WHEN status = 'paid' THEN agent_commission_amount ELSE 0 END), 0) AS paid,
        COALESCE(SUM(agent_commission_amount), 0) AS total,
        COALESCE(MAX(currency), 'MXN') AS currency
      FROM agency_commissions
      WHERE agent_id = $1 AND is_active = true
    `, [agentId])

        return {
            pending: parseFloat(result?.pending || '0'),
            available: parseFloat(result?.available || '0'),
            paid: parseFloat(result?.paid || '0'),
            total: parseFloat(result?.total || '0'),
            currency: result?.currency || 'MXN'
        }
    }

    /**
     * Procesar cambio de estado de booking → actualizar comisión
     * REGLA DE ORO: booking "completed" → comisión "available"
     */
    async processBookingStatusChange(bookingId: number, newStatus: string): Promise<void> {
        if (newStatus === 'completed' || newStatus === 'checked_out') {
            await this.markAsAvailable(bookingId)
            console.log(`[CommissionService] Booking ${bookingId} finalizado → comisión disponible`)
        } else if (newStatus === 'cancelled') {
            await query(`
        UPDATE agency_commissions
        SET status = 'cancelled', updated_at = CURRENT_TIMESTAMP
        WHERE booking_id = $1 AND status IN ('pending', 'available') AND is_active = true
      `, [bookingId])
            console.log(`[CommissionService] Booking ${bookingId} cancelado → comisión cancelada`)
        }
    }
}

export const commissionService = new CommissionService()
