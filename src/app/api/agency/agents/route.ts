import { NextRequest, NextResponse } from 'next/server'
import { agencyService } from '@/services/AgencyService'

export const runtime = 'nodejs'

/**
 * GET /api/agency/agents?agency_id=X
 * Listar agentes de una agencia
 */
export async function GET(request: NextRequest) {
    try {
        const agencyId = request.nextUrl.searchParams.get('agency_id')
        const status = request.nextUrl.searchParams.get('status') || undefined
        const search = request.nextUrl.searchParams.get('search') || undefined

        if (!agencyId) {
            return NextResponse.json({ success: false, error: 'agency_id is required' }, { status: 400 })
        }

        const agents = await agencyService.getAgents(parseInt(agencyId), { status, search })

        return NextResponse.json({
            success: true,
            data: agents,
            total: agents.length
        })
    } catch (error) {
        console.error('Error fetching agents:', error)
        return NextResponse.json({
            success: false,
            error: 'Failed to fetch agents',
            message: (error as Error).message
        }, { status: 500 })
    }
}

/**
 * POST /api/agency/agents
 * Crear un nuevo agente (con o sin usuario)
 */
export async function POST(request: NextRequest) {
    try {
        const body = await request.json()
        const { agency_id, user_id, name, email, phone, password, role, commission_split } = body

        if (!agency_id) {
            return NextResponse.json({ success: false, error: 'agency_id is required' }, { status: 400 })
        }

        let result

        if (user_id) {
            // Vincular usuario existente como agente
            result = await agencyService.createAgent(parseInt(agency_id), {
                userId: parseInt(user_id),
                role: role || 'AGENT',
                phone,
                commissionSplit: commission_split || 0
            })
        } else {
            // Crear usuario + agente
            if (!name || !email || !password) {
                return NextResponse.json({
                    success: false,
                    error: 'name, email, and password are required when creating a new agent'
                }, { status: 400 })
            }

            result = await agencyService.createAgentWithUser(parseInt(agency_id), {
                name,
                email,
                phone,
                password,
                role: role || 'AGENT',
                commissionSplit: commission_split || 0
            })
        }

        return NextResponse.json({
            success: true,
            data: result,
            message: 'Agent created successfully'
        }, { status: 201 })
    } catch (error) {
        console.error('Error creating agent:', error)
        return NextResponse.json({
            success: false,
            error: 'Failed to create agent',
            message: (error as Error).message
        }, { status: 500 })
    }
}
