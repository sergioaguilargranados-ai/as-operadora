import { NextRequest, NextResponse } from 'next/server'
import { referralService } from '@/services/ReferralService'
import { agencyService } from '@/services/AgencyService'

export const runtime = 'nodejs'

/**
 * POST /api/referrals/click
 * Registrar un clic en liga de referido
 */
export async function POST(request: NextRequest) {
    try {
        const body = await request.json()
        const { referral_code, landing_page, utm_source, utm_medium, utm_campaign, session_id } = body

        if (!referral_code) {
            return NextResponse.json({ success: false, error: 'referral_code is required' }, { status: 400 })
        }

        // Buscar agente por código
        const agent = await agencyService.getAgentByReferralCode(referral_code)
        if (!agent) {
            return NextResponse.json({ success: false, error: 'Invalid referral code' }, { status: 404 })
        }

        // Obtener IP y User-Agent del request
        const ipAddress = request.headers.get('x-forwarded-for')?.split(',')[0]?.trim()
            || request.headers.get('x-real-ip')
            || 'unknown'
        const userAgent = request.headers.get('user-agent') || ''
        const refererUrl = request.headers.get('referer') || ''

        const click = await referralService.trackClick({
            agentId: agent.id,
            referralCode: referral_code,
            ipAddress,
            userAgent,
            refererUrl,
            landingPage: landing_page,
            utmSource: utm_source,
            utmMedium: utm_medium,
            utmCampaign: utm_campaign,
            sessionId: session_id
        })

        return NextResponse.json({
            success: true,
            data: { click_id: click.id, agent_name: agent.agent_name },
            message: 'Click tracked successfully'
        })
    } catch (error) {
        console.error('Error tracking referral click:', error)
        return NextResponse.json({
            success: false, error: (error as Error).message
        }, { status: 500 })
    }
}

/**
 * GET /api/referrals/click?agent_id=X
 * Obtener estadísticas de referidos
 */
export async function GET(request: NextRequest) {
    try {
        const agentId = request.nextUrl.searchParams.get('agent_id')
        const agencyId = request.nextUrl.searchParams.get('agency_id')

        if (agentId) {
            const stats = await referralService.getAgentStats(parseInt(agentId))
            return NextResponse.json({ success: true, data: stats })
        }

        if (agencyId) {
            const stats = await referralService.getAgencyStats(parseInt(agencyId))
            return NextResponse.json({ success: true, data: stats })
        }

        return NextResponse.json({ success: false, error: 'agent_id or agency_id required' }, { status: 400 })
    } catch (error) {
        return NextResponse.json({
            success: false, error: (error as Error).message
        }, { status: 500 })
    }
}
