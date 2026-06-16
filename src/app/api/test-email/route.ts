import { NextRequest, NextResponse } from 'next/server';
import { Resend } from 'resend';
import nodemailer from 'nodemailer';

export async function GET(request: NextRequest) {
    const { searchParams } = new URL(request.url);
    const to = searchParams.get('to');
    const secret = searchParams.get('secret');

    if (secret !== (process.env.CRON_SECRET || 'admin-test-2026')) {
        return NextResponse.json({ error: 'Unauthorized. Agrega ?secret=admin-test-2026' }, { status: 401 });
    }

    let smtpResult: any = { status: 'SKIPPED' };
    let resendResult: any = { status: 'SKIPPED' };

    // --- 1. Probar SMTP (SiteGround) ---
    const smtpHost = (process.env.SMTP_HOST || '').trim();
    const smtpPort = parseInt((process.env.SMTP_PORT || '587').trim(), 10);
    const smtpUser = (process.env.SMTP_USER || '').trim();
    const smtpPass = (process.env.SMTP_PASS || '').replace(/^"|"$/g, '').trim();

    if (smtpHost && smtpUser) {
        try {
            const transporter = nodemailer.createTransport({
                host: smtpHost,
                port: smtpPort,
                secure: smtpPort === 465,
                auth: {
                    user: smtpUser,
                    pass: smtpPass
                },
                tls: { rejectUnauthorized: false }
            } as any);

            // Solo verificar la conexión si no hay correo de destino
            if (!to) {
                await transporter.verify();
                smtpResult = { status: 'OK', message: 'Conexión SMTP exitosa al servidor ' + smtpHost + ' en puerto ' + smtpPort };
            } else {
                const rawHtml = `
<!DOCTYPE html>
<html lang="es">
<head>
  <meta charset="UTF-8">
  <style>
    body { font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif; color: #1f2937; line-height: 1.6; }
    .header { background: #f8f9fa; padding: 20px; text-align: center; border-bottom: 1px solid #e5e7eb; }
    .content { padding: 30px 20px; }
    .info-box { background-color: #f9fafb; border-left: 4px solid #0066FF; padding: 20px; margin: 25px 0; border-radius: 4px; }
    .footer { text-align: center; color: #6b7280; font-size: 12px; margin-top: 40px; border-top: 1px solid #e5e7eb; padding-top: 20px; }
  </style>
</head>
<body>
  <div class="header">
    <h1 style="margin: 0; font-size: 24px; color: #000;">AS Operadora</h1>
    <p style="margin: 5px 0 0; font-size: 12px; letter-spacing: 2px;">DE VIAJES Y EVENTOS</p>
  </div>
  <div class="content">
    <div style="font-size: 20px; font-weight: 600; margin-bottom: 20px;">Hola, Test.</div>
    <div class="info-box">Prueba de Plantilla HTML desde Vercel.</div>
  </div>
</body>
</html>`;

                const info = await transporter.sendMail({
                    from: `"AS Operadora Test SMTP" <${smtpUser}>`,
                    to: to,
                    subject: 'Prueba de Conexión SMTP con HTML',
                    text: 'Si recibes este correo, la configuración SMTP y el HTML funcionan.',
                    html: rawHtml
                });
                smtpResult = { status: 'OK', messageId: info.messageId, host: smtpHost, port: smtpPort };
            }
        } catch (err: any) {
            smtpResult = { status: 'FAILED', error: err.message, code: err.code, command: err.command };
        }
    } else {
        smtpResult = { status: 'NOT_CONFIGURED', error: 'Faltan variables SMTP_HOST o SMTP_USER' };
    }

    // --- 2. Probar Resend ---
    const apiKey = (process.env.RESEND_API_KEY || '').trim();
    const fromEmail = (process.env.RESEND_FROM_EMAIL || 'onboarding@resend.dev').trim();

    if (apiKey) {
        try {
            const resend = new Resend(apiKey);
            if (!to) {
                const domains = await resend.domains.list();
                resendResult = { status: 'OK', domains: (domains.data as any)?.data?.map((d: any) => ({ name: d.name, status: d.status })) };
            } else {
                const { data, error } = await resend.emails.send({
                    from: `AS Operadora <${fromEmail}>`,
                    to: [to],
                    subject: `✅ Test Resend`,
                    html: `<p>Prueba de Resend.</p>`
                });
                if (error) resendResult = { status: 'FAILED', error };
                else resendResult = { status: 'OK', id: data?.id };
            }
        } catch (err: any) {
            resendResult = { status: 'FAILED', error: err.message };
        }
    } else {
        resendResult = { status: 'NOT_CONFIGURED' };
    }

    return NextResponse.json({
        instructions: 'Para enviar correo de prueba agrega &to=tucorreo@gmail.com',
        smtpConfig: {
            host: smtpHost,
            port: smtpPort,
            user: smtpUser,
            hasPass: !!smtpPass
        },
        smtpTest: smtpResult,
        resendTest: resendResult
    });
}
