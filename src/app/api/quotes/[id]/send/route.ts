import { NextRequest, NextResponse } from 'next/server'
import { pool } from '@/lib/db'
import { generateQuotePDF } from '@/lib/pdfGenerator'
import nodemailer from 'nodemailer'

export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id: quoteId } = await params
    const body = await request.json()
    const { customMessage } = body

    // Obtener cotización
    const quoteResult = await pool.query(
      'SELECT * FROM quotes WHERE id = $1',
      [quoteId]
    )

    if (quoteResult.rows.length === 0) {
      return NextResponse.json({
        success: false,
        error: 'Cotización no encontrada'
      }, { status: 404 })
    }

    const quote = quoteResult.rows[0]

    // Obtener items
    const itemsResult = await pool.query(
      'SELECT * FROM quote_items WHERE quote_id = $1 ORDER BY display_order',
      [quoteId]
    )

    quote.items = itemsResult.rows

    // Generar PDF
    const pdf = generateQuotePDF(quote)
    const pdfBuffer = Buffer.from(pdf.output('arraybuffer'))

    // Configurar transportador — SendGrid SMTP relay (o fallback a SMTP directo)
    const sgKey = (process.env.SENDGRID_API_KEY || '').trim()
    const transportConfig = sgKey
      ? { host: 'smtp.sendgrid.net', port: 587, secure: false, auth: { user: 'apikey', pass: sgKey } }
      : {
          host: (process.env.SMTP_HOST || '').trim(),
          port: parseInt(process.env.SMTP_PORT || '587'),
          secure: false,
          auth: {
            user: (process.env.SMTP_USER || '').trim(),
            pass: (process.env.SMTP_PASS || '').replace(/^"|"$/g, '').trim()
          },
          tls: { rejectUnauthorized: false }
        }
    const transporter = nodemailer.createTransport(transportConfig as any)
    const fromAddress = (process.env.SENDGRID_FROM_EMAIL || process.env.SMTP_USER || 'noreply@asoperadora.com').trim()

    // Contenido del email
    const emailHTML = `
<!DOCTYPE html>
<html>
<head>
  <style>
    body { font-family: Arial, sans-serif; line-height: 1.6; color: #333; }
    .container { max-width: 600px; margin: 0 auto; padding: 20px; }
    .header { background: linear-gradient(135deg, #0066FF 0%, #0052CC 100%); color: white; padding: 30px; text-align: center; border-radius: 10px 10px 0 0; }
    .content { background: #f9f9f9; padding: 30px; border-radius: 0 0 10px 10px; }
    .highlight { background: white; padding: 20px; border-left: 4px solid #0066FF; margin: 20px 0; }
    .button { display: inline-block; padding: 12px 30px; background: #0066FF; color: white; text-decoration: none; border-radius: 5px; margin: 20px 0; }
    .footer { text-align: center; margin-top: 30px; padding-top: 20px; border-top: 1px solid #ddd; color: #666; font-size: 12px; }
  </style>
</head>
<body>
  <div class="container">
    <div class="header">
      <h1>AS OPERADORA</h1>
      <p>Experiencias que inspiran</p>
    </div>
    <div class="content">
      <h2>¡Hola ${quote.customer_name}!</h2>

      <p>Nos complace enviarte tu cotización personalizada para:</p>

      <div class="highlight">
        <h3>${quote.title}</h3>
        ${quote.destination ? `<p><strong>Destino:</strong> ${quote.destination}</p>` : ''}
        ${quote.travel_start_date ? `<p><strong>Fechas:</strong> ${new Date(quote.travel_start_date).toLocaleDateString('es-MX')} - ${new Date(quote.travel_end_date).toLocaleDateString('es-MX')}</p>` : ''}
        <p><strong>No. Cotización:</strong> ${quote.quote_number}</p>
        <h2 style="color: #0066FF; margin-top: 20px;">Total: $${quote.total.toLocaleString()} ${quote.currency}</h2>
      </div>

      ${customMessage ? `<p>${customMessage}</p>` : ''}

      <p>Hemos adjuntado el PDF con todos los detalles de tu cotización. Por favor revísalo y no dudes en contactarnos si tienes alguna pregunta.</p>

      <p>¿Listo para viajar? ¡Contáctanos para confirmar tu reserva!</p>

      <div style="text-align: center;">
        <a href="https://app.asoperadora.com" class="button">Ver en línea</a>
      </div>

      <div class="footer">
        <p><strong>AS Operadora de Viajes y Eventos</strong></p>
        <p>📧 info@asoperadora.com | ☎️ +52 55 1234 5678</p>
        <p>🌐 www.asoperadora.com</p>
        <p style="margin-top: 15px; color: #999;">Esta cotización es válida hasta ${quote.valid_until ? new Date(quote.valid_until).toLocaleDateString('es-MX') : '30 días'}</p>
      </div>
    </div>
  </div>
</body>
</html>
    `

    // Enviar email
    await transporter.sendMail({
      from: `"AS Operadora" <${fromAddress}>`,
      to: quote.customer_email,
      subject: `Cotización ${quote.quote_number} - ${quote.title}`,
      html: emailHTML,
      attachments: [
        {
          filename: `Cotizacion_${quote.quote_number}.pdf`,
          content: pdfBuffer,
          contentType: 'application/pdf'
        }
      ]
    })

    // Actualizar estado de la cotización
    await pool.query(
      'UPDATE quotes SET status = $1, sent_at = NOW() WHERE id = $2',
      ['sent', quoteId]
    )

    return NextResponse.json({
      success: true,
      message: 'Cotización enviada por email exitosamente',
      sentTo: quote.customer_email
    })

  } catch (error: any) {
    console.error('Error sending quote email:', error)
    return NextResponse.json({
      success: false,
      error: error.message,
      details: 'Verifica la configuración de SMTP en variables de entorno'
    }, { status: 500 })
  }
}
