import { NextRequest, NextResponse } from 'next/server'
import AuthService from '@/services/AuthService'

export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const {
      name,
      email,
      password,
      phone,
      user_type = 'cliente',
      company_name,
      company_id,
      agency_name,
      agency_id,
      corporate_role,
      agency_role,
      internal_role
    } = body

    // Validar datos requeridos
    if (!name || !email || !password) {
      return NextResponse.json(
        { success: false, error: 'Datos incompletos' },
        { status: 400 }
      )
    }

    // Validar formato de email
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/
    if (!emailRegex.test(email)) {
      return NextResponse.json(
        { success: false, error: 'Email inválido' },
        { status: 400 }
      )
    }

    // Validar longitud de contraseña
    if (password.length < 6) {
      return NextResponse.json(
        { success: false, error: 'La contraseña debe tener al menos 6 caracteres' },
        { status: 400 }
      )
    }

    // Obtener IP del usuario
    const ipAddress = request.headers.get('x-forwarded-for') ||
      request.headers.get('x-real-ip') ||
      '0.0.0.0'

    // Registrar usuario
    console.log('🔵 REGISTRO INICIADO:', { email, name })

    const result = await AuthService.register({
      name,
      email,
      password,
      phone,
      user_type,
      company_name,
      company_id,
      agency_name,
      agency_id,
      corporate_role,
      agency_role,
      internal_role
    }, ipAddress)

    console.log('✅ REGISTRO EXITOSO:', {
      userId: result.user?.id,
      email: result.user?.email
    })

    // Enviar correo de verificación
    if (result.success && result.user) {
      try {
        const crypto = await import('crypto');
        const { query } = await import('@/lib/db');
        const { sendEmailVerificationEmail } = await import('@/lib/emailHelper');

        // Generar token de verificación
        const token = crypto.randomBytes(32).toString('hex');
        const expiresAt = new Date(Date.now() + 24 * 60 * 60 * 1000); // 24 horas

        // Guardar token en BD
        await query(
          `INSERT INTO email_verification_tokens 
           (user_id, token, expires_at, ip_address, user_agent)
           VALUES ($1, $2, $3, $4, $5)`,
          [
            result.user.id,
            token,
            expiresAt,
            ipAddress,
            request.headers.get('user-agent') || 'unknown'
          ]
        );

        // Generar URL de verificación
        const verificationUrl = `${process.env.NEXT_PUBLIC_APP_URL}/verify-email?token=${token}`;

        // Enviar email de verificación
        await sendEmailVerificationEmail({
          name: result.user.name,
          email: result.user.email,
          verificationUrl,
          expiryTime: '24 horas'
        });

        console.log('📧 Email de verificación enviado a:', result.user.email);
      } catch (emailError) {
        console.error('⚠️ Error enviando email de verificación:', emailError);
        // No fallar el registro si el correo falla
      }
    }

    return NextResponse.json(result, { status: 201 })
  } catch (error) {
    console.error('Error en registro:', error)
    return NextResponse.json({
      success: false,
      error: error instanceof Error ? error.message : 'Error al registrar usuario'
    }, { status: 500 })
  }
}
