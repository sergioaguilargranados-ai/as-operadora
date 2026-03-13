import nodemailer from 'nodemailer';

interface EmailOptions {
  to: string;
  subject: string;
  html: string;
  text?: string;
}

interface BookingConfirmationData {
  bookingId: number;
  customerName: string;
  customerEmail: string;
  serviceName: string;
  totalPrice: number;
  currency: string;
  bookingDate: string;
  details: any;
}

export class EmailService {
  private transporter: nodemailer.Transporter | null = null;

  constructor() {
    this.initializeTransporter();
  }

  private initializeTransporter() {
    const sendgridKey = (process.env.SENDGRID_API_KEY || '').trim()

    if (sendgridKey) {
      // SendGrid SMTP relay — sin restricciones de IP desde Vercel/AWS
      this.transporter = nodemailer.createTransport({
        host: 'smtp.sendgrid.net',
        port: 587,
        secure: false,
        auth: { user: 'apikey', pass: sendgridKey }
      } as any)
      console.log('[EMAIL] SendGrid SMTP relay inicializado')
      return
    }

    // Fallback: SMTP directo (SiteGround / cPanel)
    const smtpHost = (process.env.SMTP_HOST || '').trim()
    const smtpUser = (process.env.SMTP_USER || '').trim()
    const smtpPass = (process.env.SMTP_PASS || '').replace(/^"|"$/g, '').trim()

    if (!smtpHost || !smtpUser || !smtpPass) {
      console.warn('[EMAIL] Sin credenciales SMTP. Los emails se simularán.')
      return
    }

    try {
      this.transporter = nodemailer.createTransport({
        host: smtpHost,
        port: parseInt(process.env.SMTP_PORT || '587'),
        secure: process.env.SMTP_PORT === '465',
        auth: { user: smtpUser, pass: smtpPass },
        tls: { rejectUnauthorized: false }
      } as any)
      console.log('[EMAIL] SMTP directo inicializado')
    } catch (error) {
      console.error('[EMAIL] Error inicializando transporter:', error)
    }
  }

  async sendEmail(options: EmailOptions): Promise<boolean> {
    try {
      if (!this.transporter) {
        console.log('[EMAIL] Would send email:', {
          to: options.to,
          subject: options.subject,
          preview: options.text?.substring(0, 100) || 'HTML email'
        });
        return true; // Simular éxito en desarrollo
      }

      const info = await this.transporter.sendMail({
        from: `"AS Operadora" <${(process.env.SENDGRID_FROM_EMAIL || process.env.SMTP_USER || 'noreply@asoperadora.com').trim()}>`,
        to: options.to,
        subject: options.subject,
        text: options.text,
        html: options.html,
      });

      console.log('[EMAIL] Message sent:', info.messageId);
      return true;
    } catch (error) {
      console.error('[EMAIL] Error sending email:', error);
      return false;
    }
  }

  async sendBookingConfirmation(data: BookingConfirmationData): Promise<boolean> {
    const {
      bookingId,
      customerName,
      customerEmail,
      serviceName,
      totalPrice,
      currency,
      bookingDate,
      details
    } = data;

    const subject = `Confirmación de Reserva #${bookingId} - AS Operadora`;

    const html = `
      <!DOCTYPE html>
      <html lang="es">
      <head>
        <meta charset="UTF-8">
        <meta name="viewport" content="width=device-width, initial-scale=1.0">
        <title>Confirmación de Reserva</title>
        <style>
          body {
            font-family: Arial, sans-serif;
            line-height: 1.6;
            color: #333;
            max-width: 600px;
            margin: 0 auto;
            padding: 20px;
          }
          .header {
            background: linear-gradient(135deg, #0066FF 0%, #0052CC 100%);
            color: white;
            padding: 30px 20px;
            text-align: center;
            border-radius: 10px 10px 0 0;
          }
          .header h1 {
            margin: 0;
            font-size: 24px;
          }
          .content {
            background: #fff;
            padding: 30px 20px;
            border: 1px solid #e0e0e0;
          }
          .booking-info {
            background: #f8f9fa;
            padding: 20px;
            border-radius: 8px;
            margin: 20px 0;
          }
          .booking-info h2 {
            margin-top: 0;
            color: #0066FF;
            font-size: 18px;
          }
          .info-row {
            display: flex;
            justify-content: space-between;
            padding: 10px 0;
            border-bottom: 1px solid #e0e0e0;
          }
          .info-row:last-child {
            border-bottom: none;
          }
          .info-label {
            font-weight: bold;
            color: #666;
          }
          .info-value {
            color: #333;
          }
          .total {
            background: #0066FF;
            color: white;
            padding: 15px 20px;
            border-radius: 8px;
            text-align: center;
            margin: 20px 0;
            font-size: 24px;
            font-weight: bold;
          }
          .footer {
            background: #f8f9fa;
            padding: 20px;
            text-align: center;
            border-radius: 0 0 10px 10px;
            border: 1px solid #e0e0e0;
            border-top: none;
          }
          .footer p {
            margin: 5px 0;
            font-size: 14px;
            color: #666;
          }
          .button {
            display: inline-block;
            background: #0066FF;
            color: white;
            padding: 12px 30px;
            text-decoration: none;
            border-radius: 5px;
            margin: 20px 0;
          }
        </style>
      </head>
      <body>
        <div class="header">
          <h1>✅ Reserva Confirmada</h1>
          <p>¡Gracias por confiar en AS Operadora!</p>
        </div>

        <div class="content">
          <p>Hola <strong>${customerName}</strong>,</p>

          <p>Tu reserva ha sido confirmada exitosamente. A continuación encontrarás los detalles:</p>

          <div class="booking-info">
            <h2>Detalles de la Reserva</h2>

            <div class="info-row">
              <span class="info-label">Número de Reserva:</span>
              <span class="info-value">#${bookingId}</span>
            </div>

            <div class="info-row">
              <span class="info-label">Servicio:</span>
              <span class="info-value">${serviceName}</span>
            </div>

            <div class="info-row">
              <span class="info-label">Fecha de Reserva:</span>
              <span class="info-value">${new Date(bookingDate).toLocaleDateString('es-MX', {
                weekday: 'long',
                year: 'numeric',
                month: 'long',
                day: 'numeric'
              })}</span>
            </div>

            ${details.pasajeros ? `
            <div class="info-row">
              <span class="info-label">Pasajeros:</span>
              <span class="info-value">${details.pasajeros}</span>
            </div>
            ` : ''}
          </div>

          <div class="total">
            Total: $${totalPrice.toLocaleString()} ${currency}
          </div>

          <p>Recibirás más información sobre tu reserva próximamente. Si tienes alguna pregunta, no dudes en contactarnos.</p>

          <div style="text-align: center;">
            <a href="${process.env.NEXT_PUBLIC_APP_URL || 'https://app.asoperadora.com'}/mis-reservas" class="button">
              Ver Mis Reservas
            </a>
          </div>
        </div>

        <div class="footer">
          <p><strong>AS Operadora de Viajes y Eventos</strong></p>
          <p>Experiencias que inspiran</p>
          <p>📧 contacto@asoperadora.com | 📱 +52 55 1234 5678</p>
          <p style="font-size: 12px; color: #999; margin-top: 15px;">
            Este es un correo automático, por favor no respondas a este mensaje.
          </p>
        </div>
      </body>
      </html>
    `;

    const text = `
      Confirmación de Reserva #${bookingId}

      Hola ${customerName},

      Tu reserva ha sido confirmada exitosamente.

      Detalles de la Reserva:
      - Número de Reserva: #${bookingId}
      - Servicio: ${serviceName}
      - Fecha: ${new Date(bookingDate).toLocaleDateString('es-MX')}
      ${details.pasajeros ? `- Pasajeros: ${details.pasajeros}` : ''}

      Total: $${totalPrice.toLocaleString()} ${currency}

      Gracias por confiar en AS Operadora.

      ---
      AS Operadora de Viajes y Eventos
      contacto@asoperadora.com | +52 55 1234 5678
    `;

    return this.sendEmail({
      to: customerEmail,
      subject,
      html,
      text
    });
  }

  async sendPaymentConfirmation(bookingId: number, customerEmail: string, amount: number, currency: string): Promise<boolean> {
    const subject = `Pago Confirmado - Reserva #${bookingId}`;

    const html = `
      <!DOCTYPE html>
      <html lang="es">
      <head>
        <meta charset="UTF-8">
        <style>
          body {
            font-family: Arial, sans-serif;
            max-width: 600px;
            margin: 0 auto;
            padding: 20px;
          }
          .header {
            background: #10b981;
            color: white;
            padding: 30px 20px;
            text-align: center;
            border-radius: 10px 10px 0 0;
          }
          .content {
            background: #fff;
            padding: 30px 20px;
            border: 1px solid #e0e0e0;
          }
          .amount {
            background: #10b981;
            color: white;
            padding: 20px;
            text-align: center;
            border-radius: 8px;
            margin: 20px 0;
            font-size: 28px;
            font-weight: bold;
          }
          .footer {
            background: #f8f9fa;
            padding: 20px;
            text-align: center;
            border-radius: 0 0 10px 10px;
            border: 1px solid #e0e0e0;
            border-top: none;
          }
        </style>
      </head>
      <body>
        <div class="header">
          <h1>✅ Pago Confirmado</h1>
        </div>

        <div class="content">
          <p>Tu pago ha sido procesado exitosamente.</p>

          <div class="amount">
            $${amount.toLocaleString()} ${currency}
          </div>

          <p><strong>Número de Reserva:</strong> #${bookingId}</p>
          <p>Tu reserva está confirmada y lista. Recibirás más detalles próximamente.</p>
        </div>

        <div class="footer">
          <p><strong>AS Operadora de Viajes y Eventos</strong></p>
          <p>📧 contacto@asoperadora.com | 📱 +52 55 1234 5678</p>
        </div>
      </body>
      </html>
    `;

    const text = `
      Pago Confirmado

      Tu pago de $${amount.toLocaleString()} ${currency} ha sido procesado exitosamente.

      Número de Reserva: #${bookingId}

      AS Operadora de Viajes y Eventos
    `;

    return this.sendEmail({
      to: customerEmail,
      subject,
      html,
      text
    });
  }
}

// Exportar instancia singleton
export const emailService = new EmailService();
