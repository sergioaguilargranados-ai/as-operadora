import { NextRequest, NextResponse } from 'next/server'
import { query } from '@/lib/db'

export async function GET(request: NextRequest) {
    try {
        // Obtener todas las cotizaciones de tours
        const result = await query(`
            SELECT 
                id,
                folio as quote_number,
                contact_name as customer_name,
                contact_email as customer_email,
                contact_phone as customer_phone,
                tour_name as title,
                tour_region as destination,
                num_personas,
                price_per_person,
                total_price as total,
                'USD' as currency,
                status,
                created_at,
                updated_at,
                special_requests,
                notification_method,
                tour_duration,
                tour_cities
            FROM tour_quotes
            ORDER BY created_at DESC
        `)

        return NextResponse.json({
            success: true,
            data: result.rows
        })

    } catch (error) {
        console.error('Error fetching tour quotes:', error)
        return NextResponse.json(
            { success: false, error: 'Error al obtener cotizaciones de tours' },
            { status: 500 }
        )
    }
}
