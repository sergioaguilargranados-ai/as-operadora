import { NextRequest, NextResponse } from 'next/server'
import { agencyService } from '@/services/AgencyService'

export const runtime = 'nodejs'

/**
 * GET /api/agency/agents/[id]
 */
export async function GET(
    request: NextRequest,
    { params }: { params: Promise<{ id: string }> }
) {
    try {
        const { id } = await params
        const agent = await agencyService.getAgentById(parseInt(id))

        if (!agent) {
            return NextResponse.json({ success: false, error: 'Agent not found' }, { status: 404 })
        }

        return NextResponse.json({ success: true, data: agent })
    } catch (error) {
        return NextResponse.json({
            success: false,
            error: (error as Error).message
        }, { status: 500 })
    }
}

/**
 * PUT /api/agency/agents/[id]
 */
export async function PUT(
    request: NextRequest,
    { params }: { params: Promise<{ id: string }> }
) {
    try {
        const { id } = await params
        const body = await request.json()

        const updated = await agencyService.updateAgent(parseInt(id), {
            role: body.role,
            phone: body.phone,
            commissionSplit: body.commission_split,
            status: body.status,
            isActive: body.is_active
        })

        return NextResponse.json({
            success: true,
            data: updated,
            message: 'Agent updated successfully'
        })
    } catch (error) {
        return NextResponse.json({
            success: false,
            error: (error as Error).message
        }, { status: 500 })
    }
}
