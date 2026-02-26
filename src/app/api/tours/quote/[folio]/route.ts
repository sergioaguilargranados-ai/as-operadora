import { NextRequest, NextResponse } from 'next/server'
import { query } from '@/lib/db'

export async function GET(
    request: NextRequest,
    { params }: { params: Promise<{ folio: string }> }
) {
    try {
        const { folio } = await params

        if (!folio) {
            return NextResponse.json({ success: false, error: 'Folio requerido' }, { status: 400 })
        }

        const result = await query(`SELECT * FROM tour_quotes WHERE folio = $1`, [folio])

        if (result.rows.length === 0) {
            return NextResponse.json({ success: false, error: 'Cotización no encontrada' }, { status: 404 })
        }

        return NextResponse.json({ success: true, data: result.rows[0] })

    } catch (error) {
        console.error('Error fetching quote:', error)
        return NextResponse.json({ success: false, error: 'Error al obtener la cotización' }, { status: 500 })
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
            // Campos de precio (staff)
            price_per_person,
            taxes,
            supplement,
            total_per_person,
            total_price,
            // Items incluidos (staff)
            included_items,
            updatedBy
        } = body

        if (!folio) {
            return NextResponse.json({ success: false, error: 'Folio requerido' }, { status: 400 })
        }

        const existing = await query('SELECT * FROM tour_quotes WHERE folio = $1', [folio])
        if (existing.rows.length === 0) {
            return NextResponse.json({ success: false, error: 'Cotización no encontrada' }, { status: 404 })
        }

        const currentQuote = existing.rows[0]

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
            updates.push(`notes = $${paramIndex}`)
            values.push(notes)
            paramIndex++
        }

        // Campos de precio (staff)
        if (price_per_person !== undefined) {
            updates.push(`price_per_person = $${paramIndex}`)
            values.push(parseFloat(price_per_person) || 0)
            paramIndex++
        }

        if (taxes !== undefined) {
            updates.push(`taxes = $${paramIndex}`)
            values.push(parseFloat(taxes) || 0)
            paramIndex++
        }

        if (supplement !== undefined) {
            updates.push(`supplement = $${paramIndex}`)
            values.push(parseFloat(supplement) || 0)
            paramIndex++
        }

        if (total_per_person !== undefined) {
            updates.push(`total_per_person = $${paramIndex}`)
            values.push(parseFloat(total_per_person) || 0)
            paramIndex++
        }

        if (total_price !== undefined) {
            updates.push(`total_price = $${paramIndex}`)
            values.push(parseFloat(total_price) || 0)
            paramIndex++
        }

        // Items incluidos (guardar en columna, añadir si no existe)
        if (included_items !== undefined) {
            try {
                updates.push(`included_items = $${paramIndex}`)
                values.push(included_items)
                paramIndex++
            } catch {
                // Si la columna no existe, ignorar
            }
        }

        if (updates.length === 0) {
            return NextResponse.json({ success: false, error: 'No hay campos para actualizar' }, { status: 400 })
        }

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
