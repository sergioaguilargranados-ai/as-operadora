import { NextRequest, NextResponse } from 'next/server'
import nodemailer from 'nodemailer'

export async function GET(request: NextRequest) {
    const { searchParams } = new URL(request.url)
    const to = searchParams.get('to')
    const secret = searchParams.get('secret')

    if (secret !== (process.env.CRON_SECRET_KEY || 'admin-test-2026')) {
        return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const sgKey = (process.env.SENDGRID_API_KEY || '').trim()
    const fromEmail = (process.env.SENDGRID_FROM_EMAIL || process.env.SMTP_USER || '').trim()

    // ---- Prueba SendGrid ----
    let sgResult: any = { status: 'SKIPPED', reason: 'No SENDGRID_API_KEY en Vercel' }
    if (sgKey) {
        try {
            const t = nodemailer.createTransport({
                host: 'smtp.sendgrid.net',
                port: 587,
                secure: false,
                auth: { user: 'apikey', pass: sgKey }
            } as any)
            await t.verify()
            sgResult = { status: 'OK', host: 'smtp.sendgrid.net', port: 587 }

            // Si verify OK y hay destinatario, enviar
            if (to) {
                const info = await t.sendMail({
                    from: `"AS Operadora" <${fromEmail}>`,
                    to,
                    subject: `✅ Test SendGrid ${new Date().toLocaleString('es-MX', { timeZone: 'America/Mexico_City' })} CST`,
                    html: `<div style="font-family:Arial;max-width:500px;margin:0 auto;">
                        <div style="background:#0066FF;color:white;padding:20px;border-radius:8px 8px 0 0;">
                            <strong style="font-size:22px;">AS</strong> <span style="font-size:13px;">Operadora de Viajes</span>
                        </div>
                        <div style="padding:24px;background:#f9fafb;border:1px solid #e5e7eb;border-top:none;border-radius:0 0 8px 8px;">
                            <h2 style="color:#1e3a5f;margin:0 0 8px;">✅ Email funcionando correctamente</h2>
                            <p style="color:#555;">Este es un email de prueba enviado vía <strong>SendGrid</strong>.</p>
                            <hr style="border:none;border-top:1px solid #e5e7eb;margin:16px 0;">
                            <p style="color:#888;font-size:12px;">Remitente: ${fromEmail}<br>Hora: ${new Date().toLocaleString('es-MX', { timeZone: 'America/Mexico_City' })} CST</p>
                        </div>
                    </div>`
                })
                sgResult.sent = { accepted: info.accepted, messageId: info.messageId }
            }
        } catch (err: any) {
            sgResult = {
                status: 'FAILED',
                error: { message: err.message, code: err.code, responseCode: err.responseCode, response: err.response }
            }
        }
    }

    return NextResponse.json({
        sendgridKeyPresent: !!sgKey,
        fromEmail,
        sendgrid: sgResult,
        note: sgKey
            ? 'emailHelper.ts usa SendGrid automáticamente cuando SENDGRID_API_KEY está configurado'
            : '⚠️ Agrega SENDGRID_API_KEY en Vercel → Settings → Environment Variables'
    })
}
