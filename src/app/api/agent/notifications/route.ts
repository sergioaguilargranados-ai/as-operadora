import { NextRequest, NextResponse } from 'next/server'
import { query, queryOne } from '@/lib/db'

export const runtime = 'nodejs'

/**
 * GET /api/agent/notifications?user_id=X&limit=20&unread_only=true
 * Lista notificaciones del agente
 */
export async function GET(request: NextRequest) {
    try {
        const userId = request.nextUrl.searchParams.get('user_id')
        const agentId = request.nextUrl.searchParams.get('agent_id')
        const unreadOnly = request.nextUrl.searchParams.get('unread_only') === 'true'
        const limit = parseInt(request.nextUrl.searchParams.get('limit') || '20')

        if (!userId && !agentId) {
            return NextResponse.json({ success: false, error: 'user_id or agent_id required' }, { status: 400 })
        }

        let sql = 'SELECT * FROM agent_notifications WHERE 1=1'
        const params: any[] = []
        let idx = 1

        if (userId) {
            sql += ` AND user_id = $${idx++}`
            params.push(userId)
        }
        if (agentId) {
            sql += ` AND agent_id = $${idx++}`
            params.push(agentId)
        }
        if (unreadOnly) {
            sql += ' AND is_read = false'
        }

        sql += ` ORDER BY created_at DESC LIMIT $${idx}`
        params.push(limit)

        const result = await query(sql, params)

        // Contar no leídas
        let unreadSql = 'SELECT COUNT(*) FROM agent_notifications WHERE is_read = false AND '
        const unreadParams: any[] = []
        if (userId) {
            unreadSql += 'user_id = $1'
            unreadParams.push(userId)
        } else {
            unreadSql += 'agent_id = $1'
            unreadParams.push(agentId)
        }

        const unreadCount = await queryOne(unreadSql, unreadParams)

        return NextResponse.json({
            success: true,
            data: {
                notifications: result.rows || [],
                unread_count: parseInt(unreadCount?.count || '0'),
                total: (result.rows || []).length
            }
        })
    } catch (error) {
        console.error('Error fetching notifications:', error)
        return NextResponse.json({ success: false, error: (error as Error).message }, { status: 500 })
    }
}

/**
 * PUT /api/agent/notifications
 * Marcar notificaciones como leídas
 * Body: { notification_ids: number[] } o { mark_all: true, user_id: number }
 */
export async function PUT(request: NextRequest) {
    try {
        const body = await request.json()
        const { notification_ids, mark_all, user_id } = body

        if (mark_all && user_id) {
            // Marcar todas como leídas
            const result = await query(
                "UPDATE agent_notifications SET is_read = true, read_at = CURRENT_TIMESTAMP WHERE user_id = $1 AND is_read = false RETURNING id",
                [user_id]
            )
            return NextResponse.json({
                success: true,
                message: `${result.rows.length} notificaciones marcadas como leídas`
            })
        }

        if (notification_ids && Array.isArray(notification_ids) && notification_ids.length > 0) {
            const placeholders = notification_ids.map((_: any, i: number) => `$${i + 1}`).join(',')
            const result = await query(
                `UPDATE agent_notifications SET is_read = true, read_at = CURRENT_TIMESTAMP WHERE id IN (${placeholders}) RETURNING id`,
                notification_ids
            )
            return NextResponse.json({
                success: true,
                message: `${result.rows.length} notificaciones marcadas como leídas`
            })
        }

        return NextResponse.json({ success: false, error: 'notification_ids or mark_all required' }, { status: 400 })
    } catch (error) {
        console.error('Error updating notifications:', error)
        return NextResponse.json({ success: false, error: (error as Error).message }, { status: 500 })
    }
}
