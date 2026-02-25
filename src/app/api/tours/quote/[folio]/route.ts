import { NextRequest, NextResponse } from 'next/server'
import { query } from '@/lib/db'

export async function GET(
    request: NextRequest,
    { params }: { params: Promise<{ folio: string }> }
) {
    try {
        const { folio } = await params

        if (!folio) {
            return NextResponse.json(
                { success: false, error: 'Folio requerido' },
                { status: 400 }
            )
        }

        // Buscar cotización por folio
        const result = await query(
            `SELECT * FROM tour_quotes WHERE folio = $1`,
            [folio]
        )

        if (result.rows.length === 0) {
            return NextResponse.json(
                { success: false, error: 'Cotización no encontrada' },
                { status: 404 }
            )
        }

        const quote = result.rows[0]

        return NextResponse.json({
            success: true,
            data: quote
        })

    } catch (error) {
        console.error('Error fetching quote:', error)
        return NextResponse.json(
            { success: false, error: 'Error al obtener la cotización' },
            { status: 500 }
        )
    }
}

export async function PUT(
    request: NextRequest,
    { params }: { params: Promise<{ folio: string }> }
) {
    try {
        const { folio } = await params
        const body = await request.json()
        const {
            status,
            num_personas,
            special_requests,
            contact_phone,
            notes,
            updatedBy
        } = body

        if (!folio) {
            return NextResponse.json(
                { success: false, error: 'Folio requerido' },
                { status: 400 }
            )
        }

        // Verificar que la cotización existe
        const existing = await query('SELECT * FROM tour_quotes WHERE folio = $1', [folio])
        if (existing.rows.length === 0) {
            return NextResponse.json(
                { success: false, error: 'Cotización no encontrada' },
                { status: 404 }
            )
        }

        const currentQuote = existing.rows[0]

        // Construir campos a actualizar dinámicamente
        const updates: string[] = []
        const values: any[] = []
        let paramIndex = 1

        if (status !== undefined) {
            updates.push(`status = $${paramIndex}`)
            values.push(status)
            paramIndex++
        }

        if (num_personas !== undefined) {
            updates.push(`num_personas = $${paramIndex}`)
            values.push(num_personas)
            paramIndex++

            // Recalcular total_price
            const totalPP = parseFloat(currentQuote.total_per_person) || parseFloat(currentQuote.price_per_person) || 0
            const newTotal = totalPP * (parseInt(num_personas) || 1)
            updates.push(`total_price = $${paramIndex}`)
            values.push(newTotal)
            paramIndex++
        }

        if (special_requests !== undefined) {
            updates.push(`special_requests = $${paramIndex}`)
            values.push(special_requests)
            paramIndex++
        }

        if (contact_phone !== undefined) {
            updates.push(`contact_phone = $${paramIndex}`)
            values.push(contact_phone)
            paramIndex++
        }

        if (notes !== undefined) {
            // Intentar agregar notas - puede que la columna no exista
            try {
                updates.push(`notes = $${paramIndex}`)
                values.push(notes)
                paramIndex++
            } catch {
                // Ignorar si la columna no existe
            }
        }

        if (updates.length === 0) {
            return NextResponse.json(
                { success: false, error: 'No hay campos para actualizar' },
                { status: 400 }
            )
        }

        // Ejecutar UPDATE
        const updateQuery = `
            UPDATE tour_quotes 
            SET ${updates.join(', ')}, updated_at = NOW()
            WHERE folio = $${paramIndex}
            RETURNING *
        `
        values.push(folio)

        const result = await query(updateQuery, values)

        console.log(`✅ Cotización ${folio} actualizada por ${updatedBy || 'desconocido'}`)

        return NextResponse.json({
            success: true,
            data: result.rows[0],
            message: 'Cotización actualizada exitosamente'
        })

    } catch (error: any) {
        console.error('Error updating quote:', error)
        return NextResponse.json(
            { success: false, error: error.message || 'Error al actualizar la cotización' },
            { status: 500 }
        )
    }
}
