import { NextRequest, NextResponse } from 'next/server'
import { query, queryOne, insertOne } from '@/lib/db'
import { AgentNotificationService } from '@/services/AgentNotificationService'

export const runtime = 'nodejs'

/**
 * GET /api/agent/reviews?agent_id=X
 * Lista reviews de un agente con estadísticas
 */
export async function GET(request: NextRequest) {
    try {
        const agentId = request.nextUrl.searchParams.get('agent_id')
        const limit = parseInt(request.nextUrl.searchParams.get('limit') || '20')

        if (!agentId) {
            return NextResponse.json({ success: false, error: 'agent_id is required' }, { status: 400 })
        }

        // Obtener reviews
        const result = await query(`
            SELECT 
                ar.*,
                ac.client_name,
                u.name AS reviewer_name
            FROM agent_reviews ar
            LEFT JOIN agency_clients ac ON ar.client_id = ac.id
            LEFT JOIN users u ON ar.user_id = u.id
            WHERE ar.agent_id = $1 AND ar.is_active = true AND ar.is_public = true
            ORDER BY ar.created_at DESC
            LIMIT $2
        `, [agentId, limit])

        // Estadísticas
        const stats = await queryOne(`
            SELECT 
                COUNT(*) AS total_reviews,
                AVG(rating)::NUMERIC(3,2) AS avg_rating,
                COUNT(*) FILTER (WHERE rating = 5) AS five_star,
                COUNT(*) FILTER (WHERE rating = 4) AS four_star,
                COUNT(*) FILTER (WHERE rating = 3) AS three_star,
                COUNT(*) FILTER (WHERE rating = 2) AS two_star,
                COUNT(*) FILTER (WHERE rating = 1) AS one_star
            FROM agent_reviews
            WHERE agent_id = $1 AND is_active = true
        `, [agentId])

        return NextResponse.json({
            success: true,
            data: {
                reviews: result.rows || [],
                stats: {
                    total_reviews: parseInt(stats?.total_reviews || '0'),
                    avg_rating: parseFloat(stats?.avg_rating || '0'),
                    distribution: {
                        5: parseInt(stats?.five_star || '0'),
                        4: parseInt(stats?.four_star || '0'),
                        3: parseInt(stats?.three_star || '0'),
                        2: parseInt(stats?.two_star || '0'),
                        1: parseInt(stats?.one_star || '0')
                    }
                }
            }
        })
    } catch (error) {
        console.error('Error fetching reviews:', error)
        return NextResponse.json({ success: false, error: (error as Error).message }, { status: 500 })
    }
}

/**
 * POST /api/agent/reviews
 * Crear una nueva review para un agente
 */
export async function POST(request: NextRequest) {
    try {
        const body = await request.json()
        const { agent_id, client_id, user_id, booking_id, rating, title, comment } = body

        if (!agent_id || !rating) {
            return NextResponse.json({
                success: false, error: 'agent_id and rating are required'
            }, { status: 400 })
        }

        if (rating < 1 || rating > 5) {
            return NextResponse.json({
                success: false, error: 'Rating must be between 1 and 5'
            }, { status: 400 })
        }

        const review = await insertOne('agent_reviews', {
            agent_id,
            client_id: client_id || null,
            user_id: user_id || null,
            booking_id: booking_id || null,
            rating,
            title: title || null,
            comment: comment || null,
            is_verified: !!booking_id,
            is_public: true,
            is_active: true
        })

        // Notificar al agente
        try {
            const clientName = client_id
                ? (await queryOne('SELECT client_name FROM agency_clients WHERE id = $1', [client_id]))?.client_name || 'Un cliente'
                : 'Un cliente'
            await AgentNotificationService.notifyNewReview(agent_id, {
                rating,
                title: title || `Calificación de ${rating} estrellas`,
                clientName
            })
            await AgentNotificationService.checkAchievements(agent_id)
        } catch (notifErr) {
            console.error('Error sending review notification:', notifErr)
        }

        return NextResponse.json({
            success: true,
            data: review,
            message: 'Review creada exitosamente'
        })
    } catch (error) {
        console.error('Error creating review:', error)
        return NextResponse.json({ success: false, error: (error as Error).message }, { status: 500 })
    }
}
