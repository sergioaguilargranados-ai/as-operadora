import { NextRequest, NextResponse } from 'next/server'
import { agencyService } from '@/services/AgencyService'
import { referralService } from '@/services/ReferralService'

export const runtime = 'nodejs'

/**
 * GET /api/agent/referral-link?agent_id=X
 * Obtener la liga de referido del agente y stats rápidos
 */
export async function GET(request: NextRequest) {
    try {
        const agentId = request.nextUrl.searchParams.get('agent_id')

        if (!agentId) {
            return NextResponse.json({ success: false, error: 'agent_id is required' }, { status: 400 })
        }

        const id = parseInt(agentId)
        const agent = await agencyService.getAgentById(id)

        if (!agent) {
            return NextResponse.json({ success: false, error: 'Agent not found' }, { status: 404 })
        }

        // Obtener stats de referidos
        const stats = await referralService.getAgentStats(id)

        // Construir URL de referido
        const baseUrl = process.env.NEXT_PUBLIC_AGENCY_BASE_URL || 'https://mmta.app.asoperadora.com'
        const referralUrl = agent.referral_code
            ? `${baseUrl}/?r=${agent.referral_code}`
            : null

        return NextResponse.json({
            success: true,
            data: {
                agent_id: agent.id,
                agent_name: agent.agent_name,
                referral_code: agent.referral_code,
                referral_url: referralUrl,
                stats: {
                    total_clicks: stats.total_clicks,
                    clicks_today: stats.clicks_today,
                    total_conversions: stats.total_conversions,
                    conversion_rate: stats.total_clicks > 0
                        ? ((stats.total_conversions / stats.total_clicks) * 100).toFixed(1)
                        : '0.0'
                }
            }
        })
    } catch (error) {
        return NextResponse.json({
            success: false, error: (error as Error).message
        }, { status: 500 })
    }
}
