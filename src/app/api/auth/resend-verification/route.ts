/**
 * POST /api/auth/resend-verification
 * Reenviar email de verificación
 */

import { NextRequest, NextResponse } from 'next/server';
import { queryOne, query } from '@/lib/db';
import { sendEmailVerificationEmail } from '@/lib/emailHelper';
import crypto from 'crypto';

export async function POST(request: NextRequest) {
    try {
        const body = await request.json();
        const { email } = body;

        if (!email || typeof email !== 'string') {
            return NextResponse.json({
                success: false,
                error: 'Email requerido'
            }, { status: 400 });
        }

        // Buscar usuario
        const user = await queryOne<any>(
            'SELECT id, name, email, email_verified FROM users WHERE email = $1',
            [email.toLowerCase().trim()]
        );

        if (!user) {
            // Por seguridad, no revelar si el email existe
            return NextResponse.json({
                success: true,
                message: 'Si el email existe y no está verificado, recibirás un nuevo email de verificación'
            });
        }

        // Verificar si ya está verificado
        if (user.email_verified) {
            return NextResponse.json({
                success: false,
                error: 'Este email ya está verificado'
            }, { status: 400 });
        }

        // Invalidar tokens anteriores
        await query(
            `UPDATE email_verification_tokens 
       SET used = true, used_at = NOW() 
       WHERE user_id = $1 AND used = false`,
            [user.id]
        );

        // Generar nuevo token
        const token = crypto.randomBytes(32).toString('hex');
        const expiresAt = new Date(Date.now() + 24 * 60 * 60 * 1000); // 24 horas

        // Obtener IP y User Agent
        const ipAddress = request.headers.get('x-forwarded-for') ||
            request.headers.get('x-real-ip') ||
            'unknown';
        const userAgent = request.headers.get('user-agent') || 'unknown';

        // Guardar nuevo token
        await query(
            `INSERT INTO email_verification_tokens 
       (user_id, token, expires_at, ip_address, user_agent)
       VALUES ($1, $2, $3, $4, $5)`,
            [user.id, token, expiresAt, ipAddress, userAgent]
        );

        // Generar URL de verificación
        const verificationUrl = `${process.env.NEXT_PUBLIC_APP_URL}/verify-email?token=${token}`;

        // Enviar email
        try {
            await sendEmailVerificationEmail({
                name: user.name,
                email: user.email,
                verificationUrl,
                expiryTime: '24 horas'
            });

            console.log(`✅ Email de verificación reenviado a: ${user.email}`);
        } catch (emailError) {
            console.error('❌ Error enviando email:', emailError);
            return NextResponse.json({
                success: false,
                error: 'Error al enviar email'
            }, { status: 500 });
        }

        return NextResponse.json({
            success: true,
            message: 'Email de verificación enviado'
        });

    } catch (error) {
        console.error('❌ Error en resend-verification:', error);
        return NextResponse.json({
            success: false,
            error: 'Error al procesar solicitud'
        }, { status: 500 });
    }
}
