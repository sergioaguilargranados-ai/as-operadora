import { NextRequest, NextResponse } from 'next/server'
import { query, queryOne } from '@/lib/db'

export const runtime = 'nodejs'

/**
 * GET /api/agency/analytics?agency_id=X&period=30d
 * Retorna analytics avanzados: tendencias, top performers, métricas temporales
 */
export async function GET(request: NextRequest) {
    try {
        const agencyId = request.nextUrl.searchParams.get('agency_id') || '2'
        const period = request.nextUrl.searchParams.get('period') || '30d'

        // Calcular fecha de inicio según periodo
        const periodDays = parseInt(period) || 30
        const startDate = new Date()
        startDate.setDate(startDate.getDate() - periodDays)
        const startDateStr = startDate.toISOString()

        // ═══════════════════════════════════════
        // 1. Revenue Timeline (por día)
        // ═══════════════════════════════════════
        const revenueTimeline = await query(`
            SELECT 
                DATE(created_at) AS date,
                COUNT(*) AS bookings,
                COALESCE(SUM(total_price), 0)::NUMERIC(12,2) AS revenue,
                COALESCE(SUM(CASE WHEN booking_status = 'confirmed' THEN total_price ELSE 0 END), 0)::NUMERIC(12,2) AS confirmed_revenue
            FROM bookings
            WHERE tenant_id = $1 AND created_at >= $2
            GROUP BY DATE(created_at)
            ORDER BY date
        `, [agencyId, startDateStr])

        // ═══════════════════════════════════════
        // 2. Commission Timeline
        // ═══════════════════════════════════════
        const commissionTimeline = await query(`
            SELECT 
                DATE(created_at) AS date,
                COUNT(*) AS count,
                COALESCE(SUM(total_commission_amount), 0)::NUMERIC(12,2) AS total,
                COALESCE(SUM(CASE WHEN status = 'paid' THEN total_commission_amount ELSE 0 END), 0)::NUMERIC(12,2) AS paid,
                COALESCE(SUM(CASE WHEN status = 'available' THEN total_commission_amount ELSE 0 END), 0)::NUMERIC(12,2) AS available,
                COALESCE(SUM(CASE WHEN status = 'pending' THEN total_commission_amount ELSE 0 END), 0)::NUMERIC(12,2) AS pending
            FROM agency_commissions
            WHERE agency_id = $1 AND created_at >= $2 AND is_active = true
            GROUP BY DATE(created_at)
            ORDER BY date
        `, [agencyId, startDateStr])

        // ═══════════════════════════════════════
        // 3. Top Agents (Leaderboard)
        // ═══════════════════════════════════════
        const topAgents = await query(`
            SELECT 
                tu.id AS agent_id,
                u.name AS agent_name,
                COUNT(DISTINCT ac.id) AS total_commissions,
                COALESCE(SUM(ac.total_commission_amount), 0)::NUMERIC(12,2) AS total_earned,
                COALESCE(SUM(CASE WHEN ac.status = 'paid' THEN ac.agent_commission_amount ELSE 0 END), 0)::NUMERIC(12,2) AS total_paid,
                COUNT(DISTINCT ac2.id) FILTER (WHERE ac2.created_at >= $2) AS commissions_period,
                COALESCE(
                    (SELECT COUNT(*) FROM referral_clicks rc WHERE rc.agent_id = tu.id AND rc.created_at >= $2),
                    0
                ) AS clicks_period,
                COALESCE(
                    (SELECT COUNT(*) FROM referral_conversions rv WHERE rv.agent_id = tu.id AND rv.created_at >= $2),
                    0
                ) AS conversions_period,
                COALESCE(
                    (SELECT AVG(rating)::NUMERIC(3,2) FROM agent_reviews ar WHERE ar.agent_id = tu.id AND ar.is_active = true),
                    0
                ) AS avg_rating,
                COALESCE(
                    (SELECT COUNT(*) FROM agent_reviews ar WHERE ar.agent_id = tu.id AND ar.is_active = true),
                    0
                ) AS review_count
            FROM tenant_users tu
            JOIN users u ON tu.user_id = u.id
            LEFT JOIN agency_commissions ac ON ac.agent_id = tu.id AND ac.is_active = true
            LEFT JOIN agency_commissions ac2 ON ac2.agent_id = tu.id AND ac2.is_active = true
            WHERE tu.tenant_id = $1 AND tu.is_active = true
            GROUP BY tu.id, u.name
            ORDER BY total_earned DESC
            LIMIT 10
        `, [agencyId, startDateStr])

        // ═══════════════════════════════════════
        // 4. Referral Funnel (periodo)
        // ═══════════════════════════════════════
        const funnelData = await queryOne(`
            SELECT 
                COALESCE((SELECT COUNT(*) FROM referral_clicks rc
                    JOIN tenant_users tu ON rc.agent_id = tu.id
                    WHERE tu.tenant_id = $1 AND rc.created_at >= $2), 0) AS total_clicks,
                COALESCE((SELECT COUNT(*) FROM referral_conversions rv
                    JOIN tenant_users tu ON rv.agent_id = tu.id
                    WHERE tu.tenant_id = $1 AND rv.created_at >= $2), 0) AS total_conversions,
                COALESCE((SELECT COUNT(*) FROM agency_commissions ac
                    WHERE ac.agency_id = $1 AND ac.created_at >= $2 AND ac.is_active = true), 0) AS total_commissions_generated,
                COALESCE((SELECT COUNT(*) FROM agency_commissions ac
                    WHERE ac.agency_id = $1 AND ac.created_at >= $2 AND ac.status = 'paid'), 0) AS total_paid
        `, [agencyId, startDateStr])

        // ═══════════════════════════════════════
        // 5. Comparativa vs periodo anterior
        // ═══════════════════════════════════════
        const prevStart = new Date(startDate)
        prevStart.setDate(prevStart.getDate() - periodDays)

        const currentPeriod = await queryOne(`
            SELECT 
                COUNT(*) AS bookings,
                COALESCE(SUM(total_price), 0)::NUMERIC(12,2) AS revenue
            FROM bookings
            WHERE tenant_id = $1 AND created_at >= $2
        `, [agencyId, startDateStr])

        const prevPeriod = await queryOne(`
            SELECT 
                COUNT(*) AS bookings,
                COALESCE(SUM(total_price), 0)::NUMERIC(12,2) AS revenue
            FROM bookings
            WHERE tenant_id = $1 AND created_at >= $2 AND created_at < $3
        `, [agencyId, prevStart.toISOString(), startDateStr])

        // Calcular variación porcentual
        const bookingChange = prevPeriod?.bookings > 0
            ? (((currentPeriod?.bookings - prevPeriod?.bookings) / prevPeriod!.bookings) * 100).toFixed(1)
            : '0'
        const revenueChange = parseFloat(prevPeriod?.revenue) > 0
            ? (((parseFloat(currentPeriod?.revenue) - parseFloat(prevPeriod?.revenue)) / parseFloat(prevPeriod!.revenue)) * 100).toFixed(1)
            : '0'

        // ═══════════════════════════════════════
        // 6. Booking Types Distribution
        // ═══════════════════════════════════════
        const bookingTypes = await query(`
            SELECT 
                booking_type,
                COUNT(*) AS count,
                COALESCE(SUM(total_price), 0)::NUMERIC(12,2) AS revenue
            FROM bookings
            WHERE tenant_id = $1 AND created_at >= $2
            GROUP BY booking_type
            ORDER BY revenue DESC
        `, [agencyId, startDateStr])

        // ═══════════════════════════════════════
        // 7. Badges de agentes (performance)
        // ═══════════════════════════════════════
        const agentBadges: Record<string, any> = {}
        for (const agent of (topAgents.rows || [])) {
            const badges: string[] = []
            if (parseFloat(agent.total_earned) >= 50000) badges.push('💎 Diamond Seller')
            else if (parseFloat(agent.total_earned) >= 20000) badges.push('🥇 Gold Seller')
            else if (parseFloat(agent.total_earned) >= 5000) badges.push('🥈 Silver Seller')

            if (parseInt(agent.conversions_period) >= 10) badges.push('🎯 Top Converter')
            if (parseInt(agent.clicks_period) >= 100) badges.push('📢 Super Promoter')
            if (parseFloat(agent.avg_rating) >= 4.5 && parseInt(agent.review_count) >= 3) badges.push('⭐ Client Favorite')
            if (parseInt(agent.review_count) >= 5) badges.push('💬 Most Reviewed')

            agentBadges[agent.agent_id] = badges
        }

        return NextResponse.json({
            success: true,
            data: {
                period: { days: periodDays, start: startDateStr, end: new Date().toISOString() },
                revenue_timeline: revenueTimeline.rows || [],
                commission_timeline: commissionTimeline.rows || [],
                top_agents: (topAgents.rows || []).map(a => ({
                    ...a,
                    badges: agentBadges[a.agent_id] || []
                })),
                funnel: funnelData,
                comparison: {
                    current_bookings: parseInt(currentPeriod?.bookings || '0'),
                    prev_bookings: parseInt(prevPeriod?.bookings || '0'),
                    booking_change: parseFloat(bookingChange as string),
                    current_revenue: parseFloat(currentPeriod?.revenue || '0'),
                    prev_revenue: parseFloat(prevPeriod?.revenue || '0'),
                    revenue_change: parseFloat(revenueChange as string),
                },
                booking_types: bookingTypes.rows || [],
            }
        })
    } catch (error) {
        console.error('Error in agency analytics:', error)
        return NextResponse.json({ success: false, error: (error as Error).message }, { status: 500 })
    }
}
