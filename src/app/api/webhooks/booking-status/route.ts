import { NextRequest, NextResponse } from 'next/server'
import { commissionService } from '@/services/CommissionService'

export const runtime = 'nodejs'

/**
 * POST /api/webhooks/booking-status
 * Webhook interno para procesar cambios de status en bookings.
 * Disparadores:
 *  - booking completed/checked_out → comisión pasa a "available"
 *  - booking cancelled → comisión pasa a "cancelled"
 *  - booking confirmed + tiene agente → calcula comisión
 * 
 * Payload esperado:
 * {
 *   booking_id: number,
 *   new_status: string,
 *   agent_id?: number,        // si aplica
 *   webhook_secret?: string   // validación interna
 * }
 */
export async function POST(request: NextRequest) {
    try {
        const body = await request.json()
        const { booking_id, new_status, agent_id, webhook_secret } = body

        // Validación básica del secret (para uso interno)
        const expectedSecret = process.env.WEBHOOK_INTERNAL_SECRET || 'as-operadora-internal-2026'
        if (webhook_secret && webhook_secret !== expectedSecret) {
            return NextResponse.json({ success: false, error: 'Invalid webhook secret' }, { status: 403 })
        }

        if (!booking_id || !new_status) {
            return NextResponse.json(
                { success: false, error: 'booking_id and new_status are required' },
                { status: 400 }
            )
        }

        console.log(`[Webhook] Booking #${booking_id} → status: ${new_status}`)

        let result: any = null

        switch (new_status) {
            case 'confirmed':
                // Si tiene agente, calcular comisión automáticamente
                if (agent_id) {
                    result = await commissionService.calculateCommission(booking_id, agent_id)
                    if (result) {
                        console.log(`[Webhook] Comisión calculada: $${result.commission_amount} para booking #${booking_id}`)
                    }
                }
                break

            case 'completed':
            case 'checked_out':
                // Marcar comisión como disponible
                await commissionService.processBookingStatusChange(booking_id, new_status)
                result = { action: 'commission_available', booking_id }
                console.log(`[Webhook] Comisión #${booking_id} marcada como disponible`)
                break

            case 'cancelled':
                // Cancelar comisión
                await commissionService.processBookingStatusChange(booking_id, new_status)
                result = { action: 'commission_cancelled', booking_id }
                console.log(`[Webhook] Comisión #${booking_id} cancelada`)
                break

            default:
                result = { action: 'no_action', status: new_status }
                break
        }

        return NextResponse.json({
            success: true,
            data: result,
            message: `Booking status change processed: ${new_status}`
        })
    } catch (error) {
        console.error('[Webhook] Error processing booking status:', error)
        return NextResponse.json({
            success: false,
            error: (error as Error).message
        }, { status: 500 })
    }
}
