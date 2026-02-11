import { NextRequest, NextResponse } from 'next/server'
import { agencyService } from '@/services/AgencyService'

export const runtime = 'nodejs'

/**
 * GET /api/agency/dashboard/stats?agency_id=X
 * Estadísticas del dashboard de la agencia
 */
export async function GET(request: NextRequest) {
    try {
        const agencyId = request.nextUrl.searchParams.get('agency_id')

        if (!agencyId) {
            return NextResponse.json({
                success: false,
                error: 'agency_id is required'
            }, { status: 400 })
        }

        const stats = await agencyService.getDashboardStats(parseInt(agencyId))

        return NextResponse.json({
            success: true,
            data: stats
        })
    } catch (error) {
        console.error('Error fetching agency dashboard stats:', error)
        return NextResponse.json({
            success: false,
            error: 'Failed to fetch dashboard stats',
            message: (error as Error).message
        }, { status: 500 })
    }
}
