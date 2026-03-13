import { NextRequest, NextResponse } from 'next/server'
import nodemailer from 'nodemailer'

/**
 * GET /api/test-email?secret=XXX&to=email@gmail.com
 * Prueba los 3 puertos SMTP posibles y reporta cuál funciona.
 */
export async function GET(request: NextRequest) {
    const { searchParams } = new URL(request.url)
    const to = searchParams.get('to')
    const secret = searchParams.get('secret')

    if (secret !== (process.env.CRON_SECRET_KEY || 'admin-test-2026')) {
        return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const host = (process.env.SMTP_HOST || '').trim()
    const user = (process.env.SMTP_USER || '').trim()
    const pass = (process.env.SMTP_PASS || '').replace(/^"|"$/g, '').trim()

    const config = {
        host,
        smtpUser: user,
        passLength: pass.length,
        passFirstChars: pass.substring(0, 3) + '***',
        nodeEnv: process.env.NODE_ENV
    }

    // Probar los 3 puertos SMTP más comunes
    const tryPort = async (port: number, secure: boolean, label: string) => {
        try {
            const t = nodemailer.createTransport({
                host, port, secure,
                auth: { user, pass },
                connectionTimeout: 8000,
                tls: { rejectUnauthorized: false }
            } as any)
            await t.verify()
            return { status: 'OK', label, port, secure }
        } catch (err: any) {
            return {
                status: 'FAILED', label, port, secure,
                error: {
                    message: err.message,
                    code: err.code,
                    responseCode: err.responseCode,
                    response: err.response,
                    command: err.command
                }
            }
        }
    }

    // Probar en paralelo
    const [r465, r587, r25] = await Promise.all([
        tryPort(465, true,  '465 SSL'),
        tryPort(587, false, '587 STARTTLS'),
        tryPort(25,  false, '25 SMTP')
    ])

    const working = [r465, r587, r25].find(r => r.status === 'OK')

    // Si algún puerto funciona y hay destinatario, enviar email de prueba
    let sendResult: any = 'Sin puerto funcional o sin &to='
    if (working && to) {
        try {
            const t = nodemailer.createTransport({
                host, port: working.port, secure: working.secure,
                auth: { user, pass },
                tls: { rejectUnauthorized: false }
            } as any)
            const info = await t.sendMail({
                from: `"AS Operadora TEST" <${user}>`,
                to,
                subject: `🧪 Test SMTP ${new Date().toLocaleString('es-MX', { timeZone: 'America/Mexico_City' })}`,
                html: `<div style="font-family:Arial;padding:24px;">
                    <div style="background:#0066FF;color:white;padding:16px;border-radius:8px 8px 0 0;"><strong>AS</strong> Operadora</div>
                    <div style="padding:20px;background:#f9f9f9;border:1px solid #eee;">
                        <p>✅ <strong>Funcionando vía puerto ${working.port}</strong></p>
                        <p>Servidor: ${host}:${working.port}</p>
                        <p>Hora: ${new Date().toLocaleString('es-MX', { timeZone: 'America/Mexico_City' })} CST</p>
                    </div>
                </div>`
            })
            sendResult = { ok: true, messageId: info.messageId, accepted: info.accepted, port: working.port }
        } catch (err: any) {
            sendResult = { ok: false, error: err.message }
        }
    }

    return NextResponse.json({
        config,
        ports: { p465: r465, p587: r587, p25: r25 },
        workingPort: working?.port ?? null,
        send: sendResult
    })
}
