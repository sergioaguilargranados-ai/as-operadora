/**
 * API: Tour Quote Contact Lookup
 * GET /api/tours/quote/contact-lookup?email=...&phone=...
 *
 * Busca si existe un contacto CRM previo con ese email o teléfono
 * para pre-llenar el formulario de cotización.
 *
 * Build: 12 Mar 2026 - 17:25 CST - v2.335
 */

import { NextRequest, NextResponse } from 'next/server'
import { query } from '@/lib/db'

export async function GET(request: NextRequest) {
    try {
        const sp = request.nextUrl.searchParams
        const email = sp.get('email')?.trim().toLowerCase()
        const phone = sp.get('phone')?.trim()

        if (!email && !phone) {
            return NextResponse.json(
                { success: false, error: 'Se requiere email o teléfono' },
                { status: 400 }
            )
        }

        // Buscar en crm_contacts por email o teléfono
        let contactResult
        if (email) {
            contactResult = await query(
                `SELECT full_name, email, phone, whatsapp, num_travelers
                 FROM crm_contacts
                 WHERE LOWER(email) = $1 AND status = 'active'
                 ORDER BY last_contact_at DESC NULLS LAST, created_at DESC
                 LIMIT 1`,
                [email]
            )
        } else {
            // Buscar por teléfono normalizando espacios y guiones
            contactResult = await query(
                `SELECT full_name, email, phone, whatsapp, num_travelers
                 FROM crm_contacts
                 WHERE REPLACE(REPLACE(phone, ' ', ''), '-', '') = REPLACE(REPLACE($1, ' ', ''), '-', '')
                   AND status = 'active'
                 ORDER BY last_contact_at DESC NULLS LAST, created_at DESC
                 LIMIT 1`,
                [phone]
            )
        }

        if (contactResult.rows.length === 0) {
            // Si no hay en CRM, buscar en historial de cotizaciones de tours
            let quoteResult
            if (email) {
                quoteResult = await query(
                    `SELECT contact_name, contact_email, contact_phone, num_personas
                     FROM tour_quotes
                     WHERE LOWER(contact_email) = $1
                     ORDER BY created_at DESC
                     LIMIT 1`,
                    [email]
                )
            } else {
                quoteResult = await query(
                    `SELECT contact_name, contact_email, contact_phone, num_personas
                     FROM tour_quotes
                     WHERE REPLACE(REPLACE(contact_phone, ' ', ''), '-', '') = REPLACE(REPLACE($1, ' ', ''), '-', '')
                     ORDER BY created_at DESC
                     LIMIT 1`,
                    [phone]
                )
            }

            if (quoteResult.rows.length === 0) {
                return NextResponse.json({ success: true, found: false })
            }

            const q = quoteResult.rows[0]
            // Separar nombre y apellido (best effort)
            const nameParts = (q.contact_name || '').trim().split(' ')
            const nombre = nameParts[0] || ''
            const apellido = nameParts.slice(1).join(' ') || ''

            return NextResponse.json({
                success: true,
                found: true,
                source: 'tour_history',
                contact: {
                    nombre,
                    apellido,
                    correo: q.contact_email || '',
                    telefono: q.contact_phone || '',
                    numPersonas: String(q.num_personas || '1')
                }
            })
        }

        const c = contactResult.rows[0]
        const nameParts = (c.full_name || '').trim().split(' ')
        const nombre = nameParts[0] || ''
        const apellido = nameParts.slice(1).join(' ') || ''

        return NextResponse.json({
            success: true,
            found: true,
            source: 'crm',
            contact: {
                nombre,
                apellido,
                correo: c.email || '',
                telefono: c.phone || c.whatsapp || '',
                numPersonas: String(c.num_travelers || '1')
            }
        })

    } catch (error: any) {
        console.error('Error en contact-lookup:', error)
        return NextResponse.json(
            { success: false, error: error.message },
            { status: 500 }
        )
    }
}
