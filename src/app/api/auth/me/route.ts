import { NextRequest, NextResponse } from 'next/server'
import { queryOne, query } from '@/lib/db'

export const runtime = 'nodejs'

/**
 * GET /api/auth/me
 * Retorna info completa del usuario autenticado, incluyendo su rol de agente si aplica
 */
export async function GET(request: NextRequest) {
    try {
        // Obtener token del header o cookie
        const authHeader = request.headers.get('authorization')
        const token = authHeader?.replace('Bearer ', '') || request.cookies.get('as_token')?.value

        // También intentar obtener user_id del header custom (usado internamente)
        const userId = request.nextUrl.searchParams.get('user_id')

        if (!token && !userId) {
            return NextResponse.json({ success: false, error: 'Not authenticated' }, { status: 401 })
        }

        let user: any = null

        if (userId) {
            user = await queryOne('SELECT id, name, email, phone, role, created_at FROM users WHERE id = $1', [userId])
        } else if (token) {
            // Intentar decodificar JWT básico (nuestro token simple)
            try {
                const jwt = await import('jsonwebtoken')
                const decoded: any = jwt.default.verify(token, process.env.JWT_SECRET || 'as-operadora-secret-2026')
                user = await queryOne('SELECT id, name, email, phone, role, created_at FROM users WHERE id = $1', [decoded.userId || decoded.id])
            } catch {
                // Token inválido
                return NextResponse.json({ success: false, error: 'Invalid token' }, { status: 401 })
            }
        }

        if (!user) {
            return NextResponse.json({ success: false, error: 'User not found' }, { status: 404 })
        }

        // Buscar info de agente
        let agentInfo = null
        const agentData = await queryOne(`
            SELECT 
                tu.id AS agent_id,
                tu.tenant_id,
                tu.role,
                tu.referral_code,
                tu.agent_commission_split,
                tu.agent_status,
                tu.is_active,
                t.company_name AS agency_name
            FROM tenant_users tu
            JOIN tenants t ON tu.tenant_id = t.id
            WHERE tu.user_id = $1 AND tu.is_active = true
            LIMIT 1
        `, [user.id])

        if (agentData) {
            agentInfo = {
                agentId: agentData.agent_id,
                tenantId: agentData.tenant_id,
                agencyName: agentData.agency_name,
                role: agentData.role,
                referralCode: agentData.referral_code,
                commissionSplit: parseFloat(agentData.agent_commission_split) || 0,
                isActive: agentData.is_active
            }
        }

        // Buscar notificaciones no leídas
        let unreadNotifications = 0
        try {
            const notifCount = await queryOne(
                "SELECT COUNT(*) FROM agent_notifications WHERE user_id = $1 AND is_read = false",
                [user.id]
            )
            unreadNotifications = parseInt(notifCount?.count || '0')
        } catch {
            // Tabla no existe aún, no importa
        }

        return NextResponse.json({
            success: true,
            user: {
                id: user.id,
                name: user.name,
                email: user.email,
                phone: user.phone,
                role: agentInfo?.role || user.role || 'CLIENT',
                memberSince: user.created_at
            },
            agentInfo,
            unreadNotifications
        })
    } catch (error) {
        console.error('Error in /api/auth/me:', error)
        return NextResponse.json({
            success: false, error: (error as Error).message
        }, { status: 500 })
    }
}
