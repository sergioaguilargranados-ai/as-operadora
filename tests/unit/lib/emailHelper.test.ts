import { describe, it, expect, vi, beforeEach, type Mock } from 'vitest'

// ── Mocks de dependencias ──────────────────────────────────────────

const mockSendMail = vi.fn().mockResolvedValue({ messageId: 'nodemailer-msg-001' })
const mockCreateTransport = vi.fn(() => ({ sendMail: mockSendMail }))

vi.mock('nodemailer', () => ({
  default: { createTransport: mockCreateTransport }
}))

const mockResendSend = vi.fn().mockResolvedValue({ data: { id: 'resend-id-001' }, error: null })

vi.mock('resend', () => ({
  Resend: vi.fn().mockImplementation(() => ({
    emails: { send: mockResendSend }
  }))
}))

vi.mock('fs', () => ({
  default: {
    readFileSync: vi.fn().mockReturnValue('<html>{{CONTENT}}</html>'),
    existsSync: vi.fn().mockReturnValue(true)
  }
}))

const mockQuery = vi.fn().mockResolvedValue({ rows: [], rowCount: 0 })

vi.mock('@/lib/db', () => ({
  query: mockQuery
}))

// ── Import del módulo bajo prueba (después de los mocks) ───────────
import { sendEmail } from '@/lib/emailHelper'

// ── Helpers ────────────────────────────────────────────────────────

/** Opciones base reutilizables para cada test */
const baseOptions = {
  to: 'cliente@example.com',
  subject: 'Confirmación de prueba',
  html: '<p>Hola mundo</p>'
}

/** Limpia las env vars de providers de email */
const clearEmailEnv = () => {
  delete process.env.RESEND_API_KEY
  delete process.env.RESEND_FROM_EMAIL
  delete process.env.SENDGRID_API_KEY
  delete process.env.SENDGRID_FROM_EMAIL
  delete process.env.SMTP_HOST
  delete process.env.SMTP_PORT
  delete process.env.SMTP_USER
  delete process.env.SMTP_PASS
}

// ── Suite principal ────────────────────────────────────────────────

describe('emailHelper – sendEmail', () => {
  beforeEach(() => {
    vi.clearAllMocks()
    clearEmailEnv()
  })

  // ─────────────────────────────────────────────────────────────────
  // 1. Selección de provider
  // ─────────────────────────────────────────────────────────────────

  describe('Selección de proveedor de envío', () => {
    it('debería usar Resend cuando RESEND_API_KEY está configurada', async () => {
      process.env.RESEND_API_KEY = 'rk_test_abc123'

      const result = await sendEmail(baseOptions)

      expect(result).toBe(true)
      expect(mockResendSend).toHaveBeenCalledTimes(1)
      // No debería caer al fallback nodemailer
      expect(mockSendMail).not.toHaveBeenCalled()
    })

    it('debería usar SendGrid (nodemailer) cuando no hay Resend pero sí SENDGRID_API_KEY', async () => {
      process.env.SENDGRID_API_KEY = 'SG.test123'

      const result = await sendEmail(baseOptions)

      expect(result).toBe(true)
      expect(mockResendSend).not.toHaveBeenCalled()
      expect(mockCreateTransport).toHaveBeenCalledTimes(1)
      expect(mockSendMail).toHaveBeenCalledTimes(1)
    })

    it('debería usar SMTP directo cuando no hay Resend ni SendGrid', async () => {
      process.env.SMTP_HOST = 'smtp.test.com'
      process.env.SMTP_PORT = '587'
      process.env.SMTP_USER = 'user@test.com'
      process.env.SMTP_PASS = 'password123'

      const result = await sendEmail(baseOptions)

      expect(result).toBe(true)
      expect(mockResendSend).not.toHaveBeenCalled()
      expect(mockCreateTransport).toHaveBeenCalledTimes(1)
      expect(mockSendMail).toHaveBeenCalledTimes(1)
    })

    it('debería hacer fallback a nodemailer cuando Resend falla', async () => {
      process.env.RESEND_API_KEY = 'rk_test_abc123'
      process.env.SENDGRID_API_KEY = 'SG.test123'

      // Resend devuelve error
      mockResendSend.mockResolvedValueOnce({ data: null, error: { message: 'rate limit' } })

      const result = await sendEmail(baseOptions)

      expect(result).toBe(true)
      // Intentó Resend primero
      expect(mockResendSend).toHaveBeenCalledTimes(1)
      // Cayó al fallback
      expect(mockSendMail).toHaveBeenCalledTimes(1)
    })

    it('debería hacer fallback a nodemailer cuando Resend lanza excepción', async () => {
      process.env.RESEND_API_KEY = 'rk_test_abc123'

      mockResendSend.mockRejectedValueOnce(new Error('Network error'))

      const result = await sendEmail(baseOptions)

      expect(result).toBe(true)
      expect(mockResendSend).toHaveBeenCalledTimes(1)
      expect(mockSendMail).toHaveBeenCalledTimes(1)
    })
  })

  // ─────────────────────────────────────────────────────────────────
  // 2. Valores de retorno
  // ─────────────────────────────────────────────────────────────────

  describe('Valores de retorno', () => {
    it('debería retornar true cuando el envío es exitoso vía Resend', async () => {
      process.env.RESEND_API_KEY = 'rk_test_abc123'

      const result = await sendEmail(baseOptions)

      expect(result).toBe(true)
    })

    it('debería retornar true cuando el envío es exitoso vía nodemailer', async () => {
      // Sin Resend → cae a nodemailer
      const result = await sendEmail(baseOptions)

      expect(result).toBe(true)
    })

    it('debería retornar false cuando todos los proveedores fallan', async () => {
      // Sin Resend API key, y nodemailer explota
      mockSendMail.mockRejectedValueOnce(new Error('SMTP connection refused'))

      const result = await sendEmail(baseOptions)

      expect(result).toBe(false)
    })

    it('debería retornar false cuando Resend falla Y nodemailer también falla', async () => {
      process.env.RESEND_API_KEY = 'rk_test_abc123'

      mockResendSend.mockResolvedValueOnce({ data: null, error: { message: 'forbidden' } })
      mockSendMail.mockRejectedValueOnce(new Error('Auth failed'))

      const result = await sendEmail(baseOptions)

      expect(result).toBe(false)
    })
  })

  // ─────────────────────────────────────────────────────────────────
  // 3. Persistencia en message_deliveries
  // ─────────────────────────────────────────────────────────────────

  describe('Persistencia en Centro de Comunicación (message_deliveries)', () => {
    it('debería guardar un registro con status "sent" cuando el envío es exitoso', async () => {
      process.env.RESEND_API_KEY = 'rk_test_abc123'

      await sendEmail(baseOptions)

      expect(mockQuery).toHaveBeenCalledTimes(1)
      const [sql, params] = mockQuery.mock.calls[0]
      expect(sql).toContain('INSERT INTO message_deliveries')
      // params: [0, 'email', to, status, provider, providerMsgId, errorMsg]
      expect(params[1]).toBe('email')
      expect(params[2]).toBe('cliente@example.com')
      expect(params[3]).toBe('sent')
      expect(params[4]).toBe('resend')
    })

    it('debería guardar un registro con status "failed" cuando el envío falla', async () => {
      mockSendMail.mockRejectedValueOnce(new Error('SMTP timeout'))

      await sendEmail(baseOptions)

      expect(mockQuery).toHaveBeenCalledTimes(1)
      const params = mockQuery.mock.calls[0][1]
      expect(params[3]).toBe('failed')
      expect(params[6]).toBe('SMTP timeout') // error_message
    })

    it('debería registrar provider "sendgrid" cuando se usa SENDGRID_API_KEY', async () => {
      process.env.SENDGRID_API_KEY = 'SG.test123'

      await sendEmail(baseOptions)

      const params = mockQuery.mock.calls[0][1]
      expect(params[4]).toBe('sendgrid')
    })

    it('debería registrar provider "smtp" cuando no hay Resend ni SendGrid', async () => {
      process.env.SMTP_HOST = 'smtp.test.com'

      await sendEmail(baseOptions)

      const params = mockQuery.mock.calls[0][1]
      expect(params[4]).toBe('smtp')
    })

    it('no debería fallar el envío si la escritura a BD falla', async () => {
      process.env.RESEND_API_KEY = 'rk_test_abc123'
      mockQuery.mockRejectedValueOnce(new Error('DB connection lost'))

      const result = await sendEmail(baseOptions)

      // El email se envió con éxito a pesar del error de BD
      expect(result).toBe(true)
    })
  })

  // ─────────────────────────────────────────────────────────────────
  // 4. Parámetros enviados correctamente
  // ─────────────────────────────────────────────────────────────────

  describe('Forwarding correcto de parámetros', () => {
    it('debería pasar to, subject, html y text a Resend', async () => {
      process.env.RESEND_API_KEY = 'rk_test_abc123'

      await sendEmail({ ...baseOptions, text: 'Texto plano' })

      expect(mockResendSend).toHaveBeenCalledWith(
        expect.objectContaining({
          to: ['cliente@example.com'],
          subject: 'Confirmación de prueba',
          html: '<p>Hola mundo</p>',
          text: 'Texto plano'
        })
      )
    })

    it('debería pasar to, subject, html y text a nodemailer', async () => {
      // Sin Resend
      await sendEmail({ ...baseOptions, text: 'Texto plano' })

      expect(mockSendMail).toHaveBeenCalledWith(
        expect.objectContaining({
          to: 'cliente@example.com',
          subject: 'Confirmación de prueba',
          html: '<p>Hola mundo</p>',
          text: 'Texto plano'
        })
      )
    })

    it('debería usar subject como text cuando text no se proporciona (nodemailer)', async () => {
      await sendEmail(baseOptions)

      const sendMailArgs = mockSendMail.mock.calls[0][0]
      expect(sendMailArgs.text).toBe('Confirmación de prueba')
    })
  })

  // ─────────────────────────────────────────────────────────────────
  // 5. Edge cases
  // ─────────────────────────────────────────────────────────────────

  describe('Casos borde', () => {
    it('debería ignorar RESEND_API_KEY si es solo espacios en blanco', async () => {
      process.env.RESEND_API_KEY = '   '

      await sendEmail(baseOptions)

      // No debería intentar Resend
      expect(mockResendSend).not.toHaveBeenCalled()
      // Debería ir directo a nodemailer
      expect(mockSendMail).toHaveBeenCalledTimes(1)
    })

    it('debería configurar SendGrid con host smtp.sendgrid.net cuando SENDGRID_API_KEY existe', async () => {
      process.env.SENDGRID_API_KEY = 'SG.testkey'

      await sendEmail(baseOptions)

      expect(mockCreateTransport).toHaveBeenCalledWith(
        expect.objectContaining({
          host: 'smtp.sendgrid.net',
          port: 587,
          auth: { user: 'apikey', pass: 'SG.testkey' }
        })
      )
    })

    it('debería usar RESEND_FROM_EMAIL cuando está configurado', async () => {
      process.env.RESEND_API_KEY = 'rk_test_abc123'
      process.env.RESEND_FROM_EMAIL = 'noreply@asoperadora.com'

      await sendEmail(baseOptions)

      expect(mockResendSend).toHaveBeenCalledWith(
        expect.objectContaining({
          from: 'AS Operadora <noreply@asoperadora.com>'
        })
      )
    })

    it('debería usar onboarding@resend.dev como remitente por defecto en Resend', async () => {
      process.env.RESEND_API_KEY = 'rk_test_abc123'
      delete process.env.RESEND_FROM_EMAIL

      await sendEmail(baseOptions)

      expect(mockResendSend).toHaveBeenCalledWith(
        expect.objectContaining({
          from: 'AS Operadora <onboarding@resend.dev>'
        })
      )
    })
  })
})
