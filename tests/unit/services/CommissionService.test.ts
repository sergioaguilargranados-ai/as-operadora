import { describe, it, expect, vi, beforeEach } from 'vitest'

vi.mock('@/lib/db', () => ({
  query: vi.fn(),
  queryOne: vi.fn(),
}))

import { CommissionService, commissionService } from '@/services/CommissionService'
import { query, queryOne } from '@/lib/db'

const mockedQuery = vi.mocked(query)
const mockedQueryOne = vi.mocked(queryOne)

// ── Datos de test reutilizables ──────────────────────────────────────

const mockBooking = {
  id: 1,
  agency_id: 2,
  total_price: '10000',
  currency: 'MXN',
  booking_type: 'tour',
}

const mockConfig = {
  id: 1,
  agency_id: 2,
  commission_type: 'percentage',
  default_rate: 10,
  payment_frequency: 'monthly',
  payment_method: 'transfer',
  minimum_payout: 0,
  withholding_tax: true,
  withholding_percentage: 16,
}

const mockConfigNoTax = {
  ...mockConfig,
  withholding_tax: false,
  withholding_percentage: 0,
}

const mockAgent = { agent_commission_split: 30 }

const mockExistingCommission = {
  id: 99,
  agency_id: 2,
  agent_id: null,
  booking_id: 1,
  base_price: 10000,
  currency: 'MXN',
  commission_rate: 10,
  commission_amount: 1000,
  agent_commission_amount: 0,
  agency_commission_amount: 1000,
  withholding_amount: 160,
  net_commission: 840,
  status: 'pending',
  booking_type: 'tour',
  is_active: true,
  created_at: new Date(),
}

// ── Tests ────────────────────────────────────────────────────────────

describe('CommissionService', () => {
  const service = new CommissionService()

  beforeEach(() => {
    vi.clearAllMocks()
  })

  // ── calculateCommission ──────────────────────────────────────────

  describe('calculateCommission', () => {
    it('debería retornar null si el booking no tiene agency_id', async () => {
      mockedQueryOne.mockResolvedValueOnce({ id: 1, agency_id: null } as any)

      const result = await service.calculateCommission(1)

      expect(result).toBeNull()
      // Solo se llamó una vez (para buscar booking), no más
      expect(mockedQueryOne).toHaveBeenCalledTimes(1)
    })

    it('debería retornar null si el booking no existe', async () => {
      mockedQueryOne.mockResolvedValueOnce(null as any)

      const result = await service.calculateCommission(999)

      expect(result).toBeNull()
    })

    it('debería retornar comisión existente si ya existe para ese booking', async () => {
      // 1. queryOne → booking
      mockedQueryOne.mockResolvedValueOnce(mockBooking as any)
      // 2. queryOne → comisión existente
      mockedQueryOne.mockResolvedValueOnce(mockExistingCommission as any)

      const result = await service.calculateCommission(1)

      expect(result).toEqual(mockExistingCommission)
      // No debe haber INSERT
      expect(mockedQuery).not.toHaveBeenCalled()
    })

    it('debería calcular comisión correctamente SIN agente y CON retención', async () => {
      // 1. queryOne → booking
      mockedQueryOne.mockResolvedValueOnce(mockBooking as any)
      // 2. queryOne → no existe comisión
      mockedQueryOne.mockResolvedValueOnce(null as any)
      // 3. queryOne → config (getCommissionConfig)
      mockedQueryOne.mockResolvedValueOnce(mockConfig as any)
      // 4. queryOne → service rate (commission_by_service) → null
      mockedQueryOne.mockResolvedValueOnce(null as any)
      // 5. queryOne → booking count (tiers)
      mockedQueryOne.mockResolvedValueOnce({ total: '5' } as any)
      // 6. queryOne → tier rate → null
      mockedQueryOne.mockResolvedValueOnce(null as any)

      const expectedCommission = {
        id: 10,
        commission_amount: 1000,
        withholding_amount: 160,
        net_commission: 840,
        agent_commission_amount: 0,
        agency_commission_amount: 1000,
        status: 'pending',
      }
      mockedQuery.mockResolvedValueOnce({ rows: [expectedCommission] } as any)

      const result = await service.calculateCommission(1)

      expect(result).toEqual(expectedCommission)
      // Verificar que INSERT fue llamado con los valores correctos
      expect(mockedQuery).toHaveBeenCalledTimes(1)
      const insertCall = mockedQuery.mock.calls[0]
      const params = insertCall[1] as any[]
      // agency_id
      expect(params[0]).toBe(2)
      // agent_id = null (sin agente)
      expect(params[1]).toBeNull()
      // bookingId
      expect(params[2]).toBe(1)
      // basePrice = 10000
      expect(params[3]).toBe(10000)
      // currency
      expect(params[4]).toBe('MXN')
      // commissionRate = 10
      expect(params[5]).toBe(10)
      // commissionAmount = 10000 * 0.10 = 1000
      expect(params[6]).toBe(1000)
      // agentCommission = 0
      expect(params[7]).toBe(0)
      // agencyCommission = 1000
      expect(params[8]).toBe(1000)
      // withholdingAmount = 1000 * 0.16 = 160
      expect(params[9]).toBe(160)
      // netCommission = 1000 - 160 = 840
      expect(params[10]).toBe(840)
    })

    it('debería calcular comisión correctamente CON agente (split 30%)', async () => {
      // 1. booking
      mockedQueryOne.mockResolvedValueOnce(mockBooking as any)
      // 2. no existe comisión
      mockedQueryOne.mockResolvedValueOnce(null as any)
      // 3. config sin retención
      mockedQueryOne.mockResolvedValueOnce(mockConfigNoTax as any)
      // 4. service rate → null
      mockedQueryOne.mockResolvedValueOnce(null as any)
      // 5. booking count
      mockedQueryOne.mockResolvedValueOnce({ total: '0' } as any)
      // 6. tier rate → null
      mockedQueryOne.mockResolvedValueOnce(null as any)
      // 7. agent split
      mockedQueryOne.mockResolvedValueOnce(mockAgent as any)

      const insertedCommission = {
        id: 11,
        commission_amount: 1000,
        agent_commission_amount: 300,
        agency_commission_amount: 700,
        withholding_amount: 0,
        net_commission: 1000,
      }
      mockedQuery.mockResolvedValueOnce({ rows: [insertedCommission] } as any)

      const result = await service.calculateCommission(1, 42)

      expect(result).toEqual(insertedCommission)
      const params = mockedQuery.mock.calls[0][1] as any[]
      // agent_id = 42
      expect(params[1]).toBe(42)
      // agentCommission = 1000 * 0.30 = 300
      expect(params[7]).toBe(300)
      // agencyCommission = 1000 - 300 = 700
      expect(params[8]).toBe(700)
      // withholding = 0 (sin retención)
      expect(params[9]).toBe(0)
      // net = 1000
      expect(params[10]).toBe(1000)
    })

    it('debería usar service rate cuando existe para el booking_type', async () => {
      mockedQueryOne.mockResolvedValueOnce(mockBooking as any)
      mockedQueryOne.mockResolvedValueOnce(null as any)
      mockedQueryOne.mockResolvedValueOnce(mockConfigNoTax as any)
      // service rate = 15%
      mockedQueryOne.mockResolvedValueOnce({ commission_rate: '15' } as any)
      // booking count
      mockedQueryOne.mockResolvedValueOnce({ total: '0' } as any)
      // tier → null
      mockedQueryOne.mockResolvedValueOnce(null as any)

      mockedQuery.mockResolvedValueOnce({ rows: [{ id: 12 }] } as any)

      await service.calculateCommission(1)

      const params = mockedQuery.mock.calls[0][1] as any[]
      // commissionRate = 15
      expect(params[5]).toBe(15)
      // commissionAmount = 10000 * 0.15 = 1500
      expect(params[6]).toBe(1500)
    })

    it('debería usar tier rate cuando existe y sobrescribir service rate', async () => {
      mockedQueryOne.mockResolvedValueOnce(mockBooking as any)
      mockedQueryOne.mockResolvedValueOnce(null as any)
      mockedQueryOne.mockResolvedValueOnce(mockConfigNoTax as any)
      // service rate → null
      mockedQueryOne.mockResolvedValueOnce(null as any)
      // booking count
      mockedQueryOne.mockResolvedValueOnce({ total: '50' } as any)
      // tier rate = 12%
      mockedQueryOne.mockResolvedValueOnce({ commission_rate: '12' } as any)

      mockedQuery.mockResolvedValueOnce({ rows: [{ id: 13 }] } as any)

      await service.calculateCommission(1)

      const params = mockedQuery.mock.calls[0][1] as any[]
      // commissionRate sobrescrito por tier = 12
      expect(params[5]).toBe(12)
      // commissionAmount = 10000 * 0.12 = 1200
      expect(params[6]).toBe(1200)
    })
  })

  // ── markAsAvailable ──────────────────────────────────────────────

  describe('markAsAvailable', () => {
    it('debería retornar la comisión actualizada a available', async () => {
      const updated = { ...mockExistingCommission, status: 'available' }
      mockedQuery.mockResolvedValueOnce({ rows: [updated] } as any)

      const result = await service.markAsAvailable(1)

      expect(result).toEqual(updated)
      expect(result!.status).toBe('available')
      expect(mockedQuery).toHaveBeenCalledWith(
        expect.stringContaining("SET status = 'available'"),
        [1],
      )
    })

    it('debería retornar null si no hay comisión pendiente para ese booking', async () => {
      mockedQuery.mockResolvedValueOnce({ rows: [] } as any)

      const result = await service.markAsAvailable(999)

      expect(result).toBeNull()
    })
  })

  // ── markAsPaid ───────────────────────────────────────────────────

  describe('markAsPaid', () => {
    it('debería retornar la comisión actualizada a paid', async () => {
      const paid = { ...mockExistingCommission, status: 'paid' }
      mockedQuery.mockResolvedValueOnce({ rows: [paid] } as any)

      const result = await service.markAsPaid(99, { paymentMethod: 'transfer', paymentReference: 'REF-123' })

      expect(result).toEqual(paid)
      expect(result!.status).toBe('paid')
      expect(mockedQuery).toHaveBeenCalledWith(
        expect.stringContaining("SET status = 'paid'"),
        [99],
      )
    })

    it('debería retornar null si la comisión no está en status available', async () => {
      mockedQuery.mockResolvedValueOnce({ rows: [] } as any)

      const result = await service.markAsPaid(999, {})

      expect(result).toBeNull()
    })
  })

  // ── getCommissionConfig ──────────────────────────────────────────

  describe('getCommissionConfig', () => {
    it('debería retornar la configuración de comisión de la agencia', async () => {
      mockedQueryOne.mockResolvedValueOnce(mockConfig as any)

      const result = await service.getCommissionConfig(2)

      expect(result).toEqual(mockConfig)
      expect(mockedQueryOne).toHaveBeenCalledWith(
        expect.stringContaining('agency_commission_config'),
        [2],
      )
    })

    it('debería retornar null si la agencia no tiene configuración', async () => {
      mockedQueryOne.mockResolvedValueOnce(null as any)

      const result = await service.getCommissionConfig(999)

      expect(result).toBeNull()
    })
  })

  // ── processBookingStatusChange ───────────────────────────────────

  describe('processBookingStatusChange', () => {
    it('debería llamar markAsAvailable cuando status es completed', async () => {
      mockedQuery.mockResolvedValueOnce({ rows: [{ id: 1, status: 'available' }] } as any)

      await service.processBookingStatusChange(1, 'completed')

      expect(mockedQuery).toHaveBeenCalledWith(
        expect.stringContaining("SET status = 'available'"),
        [1],
      )
    })

    it('debería llamar markAsAvailable cuando status es checked_out', async () => {
      mockedQuery.mockResolvedValueOnce({ rows: [{ id: 1, status: 'available' }] } as any)

      await service.processBookingStatusChange(1, 'checked_out')

      expect(mockedQuery).toHaveBeenCalledWith(
        expect.stringContaining("SET status = 'available'"),
        [1],
      )
    })

    it('debería cancelar comisiones cuando status es cancelled', async () => {
      mockedQuery.mockResolvedValueOnce({ rows: [] } as any)

      await service.processBookingStatusChange(1, 'cancelled')

      expect(mockedQuery).toHaveBeenCalledWith(
        expect.stringContaining("SET status = 'cancelled'"),
        [1],
      )
    })

    it('no debería hacer nada para un status no relevante', async () => {
      await service.processBookingStatusChange(1, 'confirmed')

      expect(mockedQuery).not.toHaveBeenCalled()
      expect(mockedQueryOne).not.toHaveBeenCalled()
    })
  })

  // ── getAgentWallet ───────────────────────────────────────────────

  describe('getAgentWallet', () => {
    it('debería retornar el resumen de monedero con datos', async () => {
      mockedQueryOne.mockResolvedValueOnce({
        pending: '500',
        available: '1200',
        paid: '3000',
        total: '4700',
        currency: 'MXN',
      } as any)

      const result = await service.getAgentWallet(42)

      expect(result).toEqual({
        pending: 500,
        available: 1200,
        paid: 3000,
        total: 4700,
        currency: 'MXN',
      })
      expect(mockedQueryOne).toHaveBeenCalledWith(
        expect.stringContaining('agent_commission_amount'),
        [42],
      )
    })

    it('debería retornar ceros y MXN cuando no hay datos', async () => {
      mockedQueryOne.mockResolvedValueOnce(null as any)

      const result = await service.getAgentWallet(999)

      expect(result).toEqual({
        pending: 0,
        available: 0,
        paid: 0,
        total: 0,
        currency: 'MXN',
      })
    })
  })

  // ── Singleton ────────────────────────────────────────────────────

  describe('singleton export', () => {
    it('debería exportar una instancia singleton de CommissionService', () => {
      expect(commissionService).toBeInstanceOf(CommissionService)
    })
  })
})
