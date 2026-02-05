/**
 * GET /api/auth/verify-email?token=xxx
 * Verificar email del usuario
 */

import { NextRequest, NextResponse } from 'next/server';
import { queryOne, query } from '@/lib/db';
import { sendWelcomeEmail } from '@/lib/emailHelper';

export async function GET(request: NextRequest) {
    try {
        const { searchParams } = new URL(request.url);
        const token = searchParams.get('token');

        if (!token) {
            return NextResponse.json({
                success: false,
                error: 'Token requerido'
            }, { status: 400 });
        }

        // Buscar token válido
        const verificationToken = await queryOne<any>(
            `SELECT 
        evt.id,
        evt.user_id,
        evt.expires_at,
        evt.used,
        u.email,
        u.name,
        u.email_verified
       FROM email_verification_tokens evt
       JOIN users u ON evt.user_id = u.id
       WHERE evt.token = $1`,
            [token]
        );

        if (!verificationToken) {
            return NextResponse.json({
                success: false,
                error: 'Token inválido'
            }, { status: 400 });
        }

        // Verificar si ya fue usado
        if (verificationToken.used) {
            return NextResponse.json({
                success: false,
                error: 'Este email ya fue verificado anteriormente'
            }, { status: 400 });
        }

        // Verificar si expiró
        const now = new Date();
        const expiresAt = new Date(verificationToken.expires_at);
        if (now > expiresAt) {
            return NextResponse.json({
                success: false,
                error: 'El token ha expirado. Solicita un nuevo email de verificación.'
            }, { status: 400 });
        }

        // Marcar email como verificado
        await query(
            `UPDATE users 
       SET email_verified = true, 
           email_verified_at = NOW() 
       WHERE id = $1`,
            [verificationToken.user_id]
        );

        // Marcar token como usado
        await query(
            `UPDATE email_verification_tokens 
       SET used = true, 
           used_at = NOW() 
       WHERE id = $1`,
            [verificationToken.id]
        );

        // Enviar email de bienvenida ahora que está verificado
        try {
            await sendWelcomeEmail({
                name: verificationToken.name,
                email: verificationToken.email
            });
            console.log('📧 Email de bienvenida enviado a:', verificationToken.email);
        } catch (emailError) {
            console.error('⚠️ Error enviando email de bienvenida:', emailError);
            // No fallar la verificación si el email falla
        }

        console.log(`✅ Email verificado: ${verificationToken.email}`);

        return NextResponse.json({
            success: true,
            message: 'Email verificado exitosamente',
            user: {
                email: verificationToken.email,
                name: verificationToken.name
            }
        });

    } catch (error) {
        console.error('❌ Error en verify-email:', error);
        return NextResponse.json({
            success: false,
            error: 'Error al verificar email'
        }, { status: 500 });
    }
}
