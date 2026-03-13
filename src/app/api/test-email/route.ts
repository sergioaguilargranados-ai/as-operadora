import { NextRequest, NextResponse } from 'next/server'
import { Resend } from 'resend'

export async function GET(request: NextRequest) {
    const { searchParams } = new URL(request.url)
    const to = searchParams.get('to')
    const secret = searchParams.get('secret')

    if (secret !== (process.env.CRON_SECRET_KEY || 'admin-test-2026')) {
        return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const apiKey = (process.env.RESEND_API_KEY || '').trim()
    const fromEmail = (process.env.RESEND_FROM_EMAIL || 'onboarding@resend.dev').trim()

    if (!apiKey) {
        return NextResponse.json({
            status: 'ERROR',
            message: '⚠️ RESEND_API_KEY no está configurado en Vercel',
            hint: 'Agrega RESEND_API_KEY en Vercel → Settings → Environment Variables'
        })
    }

    let verifyResult: any = null
    let sendResult: any = null

    // Test Resend
    try {
        const resend = new Resend(apiKey)

        // Verificar API key
        const domains = await resend.domains.list()
        verifyResult = {
            status: 'OK',
            keyFirstChars: apiKey.substring(0, 8) + '***',
            fromEmail,
            domains: (domains.data as any)?.data?.map((d: any) => ({ name: d.name, status: d.status })) || []
        }

        // Enviar si hay destinatario
        if (to) {
            const { data, error } = await resend.emails.send({
                from: `AS Operadora <${fromEmail}>`,
                to: [to],
                subject: `✅ Test Resend ${new Date().toLocaleString('es-MX', { timeZone: 'America/Mexico_City' })} CST`,
                html: `<div style="font-family:Arial;max-width:500px;margin:0 auto;">
                    <div style="background:#0066FF;color:white;padding:20px;border-radius:8px 8px 0 0;">
                        <strong style="font-size:22px;">AS</strong> <span style="font-size:13px;opacity:.85;">Operadora de Viajes</span>
                    </div>
                    <div style="padding:24px;background:#f9fafb;border:1px solid #e5e7eb;border-top:none;border-radius:0 0 8px 8px;">
                        <h2 style="color:#1e3a5f;margin:0 0 8px;">✅ Email funcionando correctamente</h2>
                        <p style="color:#555;">Enviado via <strong>Resend</strong> desde <code>${fromEmail}</code></p>
                        <hr style="border:none;border-top:1px solid #e5e7eb;margin:16px 0;">
                        <p style="color:#888;font-size:12px;">Hora: ${new Date().toLocaleString('es-MX', { timeZone: 'America/Mexico_City' })} CST</p>
                    </div>
                </div>`
            })
            if (error) {
                sendResult = { status: 'FAILED', error }
            } else {
                sendResult = { status: 'OK', id: data?.id, to }
            }
        }
    } catch (err: any) {
        verifyResult = { status: 'FAILED', error: err.message }
    }

    return NextResponse.json({
        resendKeyPresent: true,
        fromEmail,
        verify: verifyResult,
        send: sendResult || (to ? 'Error antes del envío' : 'Agrega ?to=tucorreo@gmail.com para probar envío')
    })
}
