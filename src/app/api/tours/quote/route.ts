import { NextRequest, NextResponse } from 'next/server'
import { query } from '@/lib/db'

// Generar folio con formato AS-99999-AAMMDD-99999
async function generateFolio(tourId: string): Promise<string> {
    // Obtener secuencia del tour (los últimos 5 dígitos del ID o hash)
    const tourNum = tourId.replace(/\D/g, '').slice(0, 5).padStart(5, '0')

    // Fecha AAMMDD
    const now = new Date()
    const aa = String(now.getFullYear()).slice(-2)
    const mm = String(now.getMonth() + 1).padStart(2, '0')
    const dd = String(now.getDate()).padStart(2, '0')
    const dateStr = `${aa}${mm}${dd}`

    // Secuencia auto-incremental
    try {
        const seqResult = await query(`SELECT nextval('tour_quote_folio_seq') as seq`)
        const seq = String(seqResult.rows[0].seq).padStart(5, '0')
        return `AS-${tourNum}-${dateStr}-${seq}`
    } catch {
        // Fallback si la secuencia no existe aún
        const fallbackSeq = String(Date.now() % 100000).padStart(5, '0')
        return `AS-${tourNum}-${dateStr}-${fallbackSeq}`
    }
}

export async function POST(request: NextRequest) {
    try {
        const body = await request.json()
        const {
            tourId,
            tourName,
            tourPrice,
            tourRegion,
            tourDuration,
            tourCities,
            contactName,
            contactEmail,
            contactPhone,
            numPersonas,
            specialRequests,
            notificationMethod,
            // Nuevos campos de fecha y precios
            departureDate,
            taxes,
            supplement,
            totalPerPerson,
            originCity
        } = body

        // Validaciones
        if (!tourId || !tourName || !contactName || !contactEmail) {
            return NextResponse.json(
                { success: false, error: 'Faltan datos requeridos' },
                { status: 400 }
            )
        }

        // Generar folio único con nuevo formato
        const folio = await generateFolio(tourId)

        // Calcular precios
        const basePrice = parseFloat(tourPrice) || 0
        const taxesAmount = parseFloat(taxes) || 0
        const supplementAmount = parseFloat(supplement) || 0
        const totalPP = parseFloat(totalPerPerson) || (basePrice + taxesAmount + supplementAmount)
        const personas = parseInt(numPersonas) || 1
        const totalPrice = totalPP * personas

        // Guardar en base de datos
        const insertQuery = `
            INSERT INTO tour_quotes (
                folio,
                tour_id,
                tour_name,
                tour_region,
                tour_duration,
                tour_cities,
                contact_name,
                contact_email,
                contact_phone,
                num_personas,
                price_per_person,
                total_price,
                special_requests,
                notification_method,
                departure_date,
                taxes,
                supplement,
                origin_city,
                total_per_person,
                status,
                created_at
            ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13, $14, $15, $16, $17, $18, $19, $20, NOW())
            RETURNING id, folio
        `

        const result = await query(insertQuery, [
            folio,
            tourId,
            tourName,
            tourRegion || '',
            tourDuration || '',
            Array.isArray(tourCities) ? tourCities.join(', ') : tourCities || '',
            contactName,
            contactEmail,
            contactPhone || '',
            personas,
            basePrice,
            totalPrice,
            specialRequests || '',
            notificationMethod || 'both',
            departureDate || null,
            taxesAmount,
            supplementAmount,
            originCity || null,
            totalPP,
            'pending'
        ])

        const quoteId = result.rows[0].id
        const quoteFolio = result.rows[0].folio

        // ============================================
        // CREAR THREAD DE COMUNICACIÓN
        // ============================================
        try {
            const threadResult = await query(`
                INSERT INTO communication_threads (
                    thread_type,
                    subject,
                    reference_type,
                    reference_id,
                    status,
                    priority,
                    tenant_id,
                    created_at
                ) VALUES ($1, $2, $3, $4, $5, $6, $7, NOW())
                RETURNING id
            `, [
                'inquiry',
                `Cotización de Tour: ${tourName}`,
                'tour_quote',
                quoteId,
                'active',
                'normal',
                1
            ])

            const threadId = threadResult.rows[0].id

            // Mensaje de confirmación automático
            const departureLine = departureDate
                ? `• Fecha de salida: ${new Date(departureDate + 'T12:00:00').toLocaleDateString('es-MX', { day: 'numeric', month: 'long', year: 'numeric' })}\r\n`
                : ''
            const originLine = originCity ? `• Ciudad de salida: ${originCity}\r\n` : ''
            const taxesLine = taxesAmount > 0 ? `• Impuestos: $${taxesAmount.toLocaleString('es-MX')} USD\r\n` : ''
            const supplementLine = supplementAmount > 0 ? `• Suplemento: $${supplementAmount.toLocaleString('es-MX')} USD\r\n` : ''

            await query(`
                INSERT INTO messages (
                    thread_id,
                    sender_type,
                    sender_name,
                    sender_email,
                    body,
                    message_type,
                    status,
                    tenant_id,
                    created_at,
                    sent_at
                ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, NOW(), NOW())
            `, [
                threadId,
                'system',
                'AS Operadora',
                'viajes@asoperadora.com',
                `¡Hola ${contactName}!\r\n\r\nHemos recibido tu solicitud de cotización para el tour "${tourName}".\r\n\r\n📋 Detalles de tu solicitud:\r\n• Folio: ${quoteFolio}\r\n• Tour: ${tourName}\r\n• Región: ${tourRegion}\r\n• Duración: ${tourDuration}\r\n${departureLine}${originLine}• Personas: ${personas}\r\n• Precio base por persona: $${basePrice.toLocaleString('es-MX')} USD\r\n${taxesLine}${supplementLine}• Total por persona: $${totalPP.toLocaleString('es-MX')} USD\r\n• Total estimado: $${totalPrice.toLocaleString('es-MX')} USD\r\n\r\nNuestro equipo revisará tu solicitud y te contactaremos pronto con una propuesta personalizada.\r\n\r\nPuedes dar seguimiento a tu cotización en: ${process.env.NEXT_PUBLIC_APP_URL || 'https://www.as-ope-viajes.company'}/cotizacion/${quoteFolio}\r\n\r\n¡Gracias por tu preferencia!`,
                'text',
                'sent',
                1
            ])

            console.log(`✅ Thread de comunicación creado (ID: ${threadId}) para cotización ${quoteFolio}`)
        } catch (commError) {
            console.error('⚠️ Error creando thread de comunicación:', commError)
        }

        // ============================================
        // CRM - Crear contacto e interacción
        // ============================================
        try {
            const { CRMService } = await import('@/services/CRMService')
            const crm = new CRMService()

            // Crear contacto CRM
            const contact = await crm.createContact({
                full_name: contactName,
                email: contactEmail,
                phone: contactPhone || '',
                source: 'tour_quote',
                source_detail: `Tour: ${tourName}`,
                contact_type: 'lead',
                pipeline_stage: 'new',
                interested_destination: tourRegion || '',
                num_travelers: personas,
                travel_type: 'tour',
                special_requirements: specialRequests || '',
                tags: ['tour', tourRegion || 'general'].filter(Boolean),
                notes: `Cotización ${quoteFolio} - ${tourName}`
            })

            // Registrar interacción
            await crm.createInteraction({
                contact_id: contact.id,
                interaction_type: 'quote_request',
                channel: 'web',
                direction: 'inbound',
                subject: `Cotización: ${tourName}`,
                body: `Solicitud de cotización para ${tourName}. Folio: ${quoteFolio}. ${personas} personas. Total: $${totalPrice.toLocaleString('es-MX')} USD`,
                is_automated: true,
                metadata: { folio: quoteFolio, tourId, tourName, numPersonas: personas, totalPrice }
            })

            console.log(`✅ CRM actualizado para ${contactEmail}`)
        } catch (crmError) {
            console.error('⚠️ Error en CRM:', crmError)
        }

        // Generar URL de seguimiento
        const trackingUrl = `${process.env.NEXT_PUBLIC_APP_URL || 'https://www.as-ope-viajes.company'}/cotizacion/${quoteFolio}`

        return NextResponse.json({
            success: true,
            message: `¡Cotización ${quoteFolio} creada exitosamente! Te contactaremos pronto.`,
            data: {
                id: quoteId,
                folio: quoteFolio,
                trackingUrl,
                totalPrice,
                totalPerPerson: totalPP
            }
        }, { status: 201 })

    } catch (error: any) {
        console.error('❌ Error creando cotización:', error)
        return NextResponse.json(
            { success: false, error: error.message || 'Error al crear la cotización' },
            { status: 500 }
        )
    }
}
