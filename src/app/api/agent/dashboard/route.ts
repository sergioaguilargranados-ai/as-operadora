import { NextRequest, NextResponse } from 'next/server'
import { agencyService } from '@/services/AgencyService'
import { commissionService } from '@/services/CommissionService'

export const runtime = 'nodejs'

/**
 * GET /api/agent/dashboard?agent_id=X
 * Dashboard personal del agente: Mi Monedero, stats, prospectos
 */
export async function GET(request: NextRequest) {
    try {
        const agentId = request.nextUrl.searchParams.get('agent_id')

        if (!agentId) {
            return NextResponse.json({ success: false, error: 'agent_id is required' }, { status: 400 })
        }

        const id = parseInt(agentId)

        // Obtener stats del agente y wallet en paralelo
        const [stats, wallet] = await Promise.all([
            agencyService.getAgentDashboardStats(id),
            commissionService.getAgentWallet(id)
        ])

        if (!stats) {
            return NextResponse.json({ success: false, error: 'Agent not found' }, { status: 404 })
        }

        return NextResponse.json({
            success: true,
            data: {
                ...stats,
                wallet
            }
        })
    } catch (error) {
        console.error('Error fetching agent dashboard:', error)
        return NextResponse.json({
            success: false,
            error: (error as Error).message
        }, { status: 500 })
    }
}
