import { NextRequest, NextResponse } from 'next/server'
import { agencyService } from '@/services/AgencyService'

export const runtime = 'nodejs'

/**
 * GET /api/agency/clients?agency_id=X&agent_id=X
 */
export async function GET(request: NextRequest) {
    try {
        const sp = request.nextUrl.searchParams
        const agencyId = sp.get('agency_id')

        if (!agencyId) {
            return NextResponse.json({ success: false, error: 'agency_id is required' }, { status: 400 })
        }

        const { clients, total } = await agencyService.getClients(parseInt(agencyId), {
            agentId: sp.get('agent_id') ? parseInt(sp.get('agent_id')!) : undefined,
            status: sp.get('status') || undefined,
            search: sp.get('search') || undefined,
            limit: sp.get('limit') ? parseInt(sp.get('limit')!) : 50,
            offset: sp.get('offset') ? parseInt(sp.get('offset')!) : 0
        })

        return NextResponse.json({
            success: true,
            data: clients,
            total
        })
    } catch (error) {
        return NextResponse.json({
            success: false,
            error: (error as Error).message
        }, { status: 500 })
    }
}

/**
 * POST /api/agency/clients
 * Registrar un cliente manualmente
 */
export async function POST(request: NextRequest) {
    try {
        const body = await request.json()
        const { agency_id, agent_id, name, email, phone, user_id, referral_code, source } = body

        if (!agency_id || !agent_id || !name || !email) {
            return NextResponse.json({
                success: false,
                error: 'agency_id, agent_id, name, and email are required'
            }, { status: 400 })
        }

        const client = await agencyService.registerClient({
            agencyId: parseInt(agency_id),
            agentId: parseInt(agent_id),
            userId: user_id ? parseInt(user_id) : undefined,
            referralCode: referral_code,
            name,
            email,
            phone,
            source: source || 'manual'
        })

        return NextResponse.json({
            success: true,
            data: client,
            message: 'Client registered successfully'
        }, { status: 201 })
    } catch (error) {
        return NextResponse.json({
            success: false,
            error: (error as Error).message
        }, { status: 500 })
    }
}
