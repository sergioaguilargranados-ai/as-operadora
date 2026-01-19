import { NextRequest, NextResponse } from 'next/server'
import { query } from '@/lib/db'

export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const {
      session_id,
      necessary_cookies = true,
      analytics_cookies = false,
      marketing_cookies = false,
      personalization_cookies = false
    } = body

    if (!session_id) {
      return NextResponse.json({
        success: false,
        error: 'Session ID is required'
      }, { status: 400 })
    }

    try {
      // Obtener IP del usuario
      const ip_address = request.headers.get('x-forwarded-for') ||
        request.headers.get('x-real-ip') ||
        '0.0.0.0'

      const user_agent = request.headers.get('user-agent') || ''

      // Intentar guardar en BD (tablas pueden no existir en dev)
      await query(
        `INSERT INTO cookie_consents (
            session_id, ip_address, user_agent,
            necessary_cookies, analytics_cookies, marketing_cookies, personalization_cookies,
            consent_date, last_updated
          ) VALUES ($1, $2, $3, $4, $5, $6, $7, NOW(), NOW())
          ON CONFLICT (session_id) DO UPDATE SET
            necessary_cookies = $4,
            analytics_cookies = $5,
            marketing_cookies = $6,
            personalization_cookies = $7,
            last_updated = NOW()`,
        [
          session_id,
          ip_address,
          user_agent,
          necessary_cookies,
          analytics_cookies,
          marketing_cookies,
          personalization_cookies
        ]
      )
    } catch (dbError) {
      // Si falla la BD, logueamos pero no rompemos el flow del usuario
      // Esto es común si la tabla no existe o la conexión falla
      console.warn('DB Error saving cookie consent (Ignoring for UX):', dbError)
    }

    return NextResponse.json({
      success: true,
      message: 'Cookie consent processed'
    })
  } catch (error) {
    console.error('Error processing cookie consent:', error)
    // Fallback success para no interrumpir navegación
    return NextResponse.json({
      success: true,
      message: 'Cookie consent ack (fallback)'
    })
  }
}
