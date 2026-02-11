import { NextRequest, NextResponse } from 'next/server'
import { commissionService } from '@/services/CommissionService'

export const runtime = 'nodejs'

/**
 * GET /api/agency/commissions?agency_id=X
 * Listar todas las comisiones de la agencia (admin view)
 * Filtros: status, agent_id, booking_type, date_from, date_to
 */
export async function GET(request: NextRequest) {
    try {
        const agencyId = request.nextUrl.searchParams.get('agency_id')
        const status = request.nextUrl.searchParams.get('status') || undefined
        const agentId = request.nextUrl.searchParams.get('agent_id') || undefined
        const bookingType = request.nextUrl.searchParams.get('booking_type') || undefined

        if (!agencyId) {
            return NextResponse.json({ success: false, error: 'agency_id is required' }, { status: 400 })
        }

        const result = await commissionService.listCommissions({
            agencyId: parseInt(agencyId),
            status,
            agentId: agentId ? parseInt(agentId) : undefined
        })

        // Sumar totales
        let totalPending = 0, totalAvailable = 0, totalPaid = 0, totalAll = 0
        result.commissions.forEach((c: any) => {
            const amt = parseFloat(c.commission_amount) || 0
            totalAll += amt
            if (c.status === 'pending') totalPending += amt
            if (c.status === 'available') totalAvailable += amt
            if (c.status === 'paid') totalPaid += amt
        })

        return NextResponse.json({
            success: true,
            data: {
                commissions: result.commissions,
                summary: {
                    total: totalAll,
                    pending: totalPending,
                    available: totalAvailable,
                    paid: totalPaid,
                    count: result.total
                }
            }
        })
    } catch (error) {
        return NextResponse.json({
            success: false, error: (error as Error).message
        }, { status: 500 })
    }
}

/**
 * PUT /api/agency/commissions
 * Marcar comisiones como pagadas (disbursement)
 * Body: { commission_ids: number[], payment_method: string, payment_reference: string }
 */
export async function PUT(request: NextRequest) {
    try {
        const body = await request.json()
        const { commission_ids, payment_method, payment_reference } = body

        if (!commission_ids || !Array.isArray(commission_ids) || commission_ids.length === 0) {
            return NextResponse.json({ success: false, error: 'commission_ids required' }, { status: 400 })
        }

        const results = []
        for (const commId of commission_ids) {
            const result = await commissionService.markAsPaid(commId, {
                paymentMethod: payment_method,
                paymentReference: payment_reference
            })
            if (result) results.push(result)
        }

        return NextResponse.json({
            success: true,
            data: { paid: results.length, total: commission_ids.length },
            message: `${results.length} comisiones marcadas como pagadas`
        })
    } catch (error) {
        return NextResponse.json({
            success: false, error: (error as Error).message
        }, { status: 500 })
    }
}
