import { query, insertOne, queryOne } from '@/lib/db'

/**
 * AgentNotificationService: Servicio de notificaciones in-app para agentes
 * Complementa al NotificationService (emails) con notificaciones internas
 */

export type AgentNotificationType =
    | 'commission'      // Nueva comisión generada
    | 'payout'          // Dispersión recibida
    | 'referral'        // Nuevo clic en liga
    | 'conversion'      // Nuevo cliente referido
    | 'achievement'     // Nivel/logro alcanzado
    | 'info'            // Información general
    | 'alert'           // Alerta importante
    | 'review'          // Nueva calificación recibida

interface NotificationPayload {
    userId: number
    tenantId?: number
    agentId?: number
    type: AgentNotificationType
    title: string
    message: string
    icon?: string
    link?: string
    metadata?: Record<string, any>
}

export class AgentNotificationService {

    /**
     * Crear una notificación in-app
     */
    static async create(payload: NotificationPayload): Promise<any> {
        try {
            const notification = await insertOne('agent_notifications', {
                user_id: payload.userId,
                tenant_id: payload.tenantId || null,
                agent_id: payload.agentId || null,
                type: payload.type,
                title: payload.title,
                message: payload.message,
                icon: payload.icon || this.getDefaultIcon(payload.type),
                link: payload.link || '/dashboard/agent',
                metadata: JSON.stringify(payload.metadata || {}),
                is_read: false,
            })
            return notification
        } catch (error) {
            console.error('Error creating notification:', error)
            return null
        }
    }

    /**
     * Notificar al agente cuando se genera una comisión
     */
    static async notifyCommissionCreated(agentId: number, commissionData: {
        amount: number
        bookingReference: string
        bookingType: string
        currency?: string
    }): Promise<void> {
        const agent = await queryOne(`
            SELECT tu.user_id, tu.tenant_id, u.name
            FROM tenant_users tu JOIN users u ON tu.user_id = u.id
            WHERE tu.id = $1
        `, [agentId])

        if (!agent) return

        await this.create({
            userId: agent.user_id,
            tenantId: agent.tenant_id,
            agentId,
            type: 'commission',
            title: '💰 Nueva comisión generada',
            message: `La reserva ${commissionData.bookingReference} (${commissionData.bookingType}) generó una comisión de $${commissionData.amount.toLocaleString()} ${commissionData.currency || 'MXN'}`,
            icon: '💰',
            link: '/dashboard/agent',
            metadata: commissionData
        })
    }

    /**
     * Notificar al agente cuando su comisión cambia a "available"
     */
    static async notifyCommissionAvailable(agentId: number, data: {
        amount: number
        bookingReference: string
    }): Promise<void> {
        const agent = await queryOne(`
            SELECT tu.user_id, tu.tenant_id
            FROM tenant_users tu WHERE tu.id = $1
        `, [agentId])

        if (!agent) return

        await this.create({
            userId: agent.user_id,
            tenantId: agent.tenant_id,
            agentId,
            type: 'commission',
            title: '✅ Comisión disponible para cobro',
            message: `Tu comisión de $${data.amount.toLocaleString()} MXN (Reserva ${data.bookingReference}) ya está disponible para dispersión.`,
            icon: '✅',
            link: '/dashboard/agent'
        })
    }

    /**
     * Notificar pago/dispersión
     */
    static async notifyDisbursement(agentId: number, data: {
        totalAmount: number
        commissionCount: number
        batchRef: string
        paymentMethod: string
    }): Promise<void> {
        const agent = await queryOne(`
            SELECT tu.user_id, tu.tenant_id
            FROM tenant_users tu WHERE tu.id = $1
        `, [agentId])

        if (!agent) return

        await this.create({
            userId: agent.user_id,
            tenantId: agent.tenant_id,
            agentId,
            type: 'payout',
            title: '💸 ¡Dispersión recibida!',
            message: `Se dispersaron $${data.totalAmount.toLocaleString()} MXN (${data.commissionCount} comisiones) vía ${data.paymentMethod}. Lote: ${data.batchRef}`,
            icon: '💸',
            link: '/dashboard/agent',
            metadata: data
        })
    }

    /**
     * Notificar nuevo clic en liga de referido
     */
    static async notifyReferralClick(agentId: number, source?: string): Promise<void> {
        const agent = await queryOne(`
            SELECT tu.user_id, tu.tenant_id
            FROM tenant_users tu WHERE tu.id = $1
        `, [agentId])

        if (!agent) return

        await this.create({
            userId: agent.user_id,
            tenantId: agent.tenant_id,
            agentId,
            type: 'referral',
            title: '🔗 Nuevo clic en tu liga',
            message: source
                ? `Alguien hizo clic en tu liga de referido desde ${source}`
                : 'Tu liga de referido recibió un nuevo clic',
            icon: '🔗'
        })
    }

    /**
     * Notificar nueva conversión
     */
    static async notifyConversion(agentId: number, clientName: string): Promise<void> {
        const agent = await queryOne(`
            SELECT tu.user_id, tu.tenant_id
            FROM tenant_users tu WHERE tu.id = $1
        `, [agentId])

        if (!agent) return

        await this.create({
            userId: agent.user_id,
            tenantId: agent.tenant_id,
            agentId,
            type: 'conversion',
            title: '🎉 ¡Nuevo cliente referido!',
            message: `${clientName} se registró usando tu código de referido. ¡Sigue así!`,
            icon: '🎉'
        })
    }

    /**
     * Notificar nueva review
     */
    static async notifyNewReview(agentId: number, data: {
        rating: number
        title: string
        clientName: string
    }): Promise<void> {
        const agent = await queryOne(`
            SELECT tu.user_id, tu.tenant_id
            FROM tenant_users tu WHERE tu.id = $1
        `, [agentId])

        if (!agent) return

        const stars = '⭐'.repeat(data.rating)
        await this.create({
            userId: agent.user_id,
            tenantId: agent.tenant_id,
            agentId,
            type: 'review',
            title: `${stars} Nueva calificación`,
            message: `${data.clientName} te calificó: "${data.title}"`,
            icon: '⭐',
            link: '/dashboard/agent'
        })
    }

    /**
     * Verificar y otorgar logros/badges
     */
    static async checkAchievements(agentId: number): Promise<void> {
        const agent = await queryOne(`
            SELECT tu.user_id, tu.tenant_id
            FROM tenant_users tu WHERE tu.id = $1
        `, [agentId])

        if (!agent) return

        // Contar totales
        const stats = await queryOne(`
            SELECT 
                COALESCE((SELECT COUNT(*) FROM referral_conversions WHERE agent_id = $1), 0) AS total_conversions,
                COALESCE((SELECT SUM(agent_commission_amount) FROM agency_commissions WHERE agent_id = $1 AND status = 'paid'), 0) AS total_earned,
                COALESCE((SELECT COUNT(*) FROM agent_reviews WHERE agent_id = $1 AND is_active = true), 0) AS total_reviews,
                COALESCE((SELECT AVG(rating) FROM agent_reviews WHERE agent_id = $1 AND is_active = true), 0) AS avg_rating
        `, [agentId])

        const conversions = parseInt(stats?.total_conversions || '0')
        const earned = parseFloat(stats?.total_earned || '0')
        const reviews = parseInt(stats?.total_reviews || '0')
        const rating = parseFloat(stats?.avg_rating || '0')

        const milestones = [
            { check: conversions === 5, title: '🎯 ¡5 referidos!', message: 'Llegaste a 5 clientes referidos. ¡Excelente comienzo!' },
            { check: conversions === 10, title: '🏆 ¡10 referidos!', message: '10 clientes referidos. Tu red de clientes crece.' },
            { check: conversions === 25, title: '🌟 ¡25 referidos!', message: '25 clientes referidos. ¡Eres un referidor experto!' },
            { check: earned >= 10000, title: '💎 $10,000+ en comisiones', message: 'Has generado más de $10,000 MXN en comisiones.' },
            { check: earned >= 50000, title: '👑 $50,000+ en comisiones', message: '¡Más de $50,000 MXN en comisiones! Eres un líder.' },
            { check: rating >= 4.8 && reviews >= 5, title: '⭐ Calificación perfecta', message: `Tienes ${rating.toFixed(1)} estrellas con ${reviews} calificaciones.` },
        ]

        for (const milestone of milestones) {
            if (milestone.check) {
                const existing = await queryOne(`
                    SELECT id FROM agent_notifications
                    WHERE agent_id = $1 AND title = $2 AND type = 'achievement'
                `, [agentId, milestone.title])

                if (!existing) {
                    await this.create({
                        userId: agent.user_id,
                        tenantId: agent.tenant_id,
                        agentId,
                        type: 'achievement',
                        title: milestone.title,
                        message: milestone.message,
                        icon: '🏆'
                    })
                }
            }
        }
    }

    /**
     * Icono por defecto según tipo
     */
    private static getDefaultIcon(type: AgentNotificationType): string {
        const icons: Record<AgentNotificationType, string> = {
            commission: '💰',
            payout: '💸',
            referral: '🔗',
            conversion: '🎉',
            achievement: '🏆',
            info: '📢',
            alert: '⚠️',
            review: '⭐'
        }
        return icons[type] || '📌'
    }
}
