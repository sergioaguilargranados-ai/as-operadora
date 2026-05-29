import { describe, it, expect, vi, beforeEach } from 'vitest'

vi.mock('@/lib/db', () => ({
  query: vi.fn(),
  queryOne: vi.fn(),
  queryMany: vi.fn(),
  insertOne: vi.fn(),
  updateOne: vi.fn(),
}))

import tenantService from '@/services/TenantService'
import { query, queryOne, queryMany, insertOne, updateOne } from '@/lib/db'

const mockQueryOne = queryOne as ReturnType<typeof vi.fn>
const mockQueryMany = queryMany as ReturnType<typeof vi.fn>
const mockInsertOne = insertOne as ReturnType<typeof vi.fn>
const mockUpdateOne = updateOne as ReturnType<typeof vi.fn>
const mockQuery = query as ReturnType<typeof vi.fn>

// Datos de prueba reutilizables
const fakeTenant = {
  id: 1,
  tenant_type: 'agency' as const,
  company_name: 'MMTA',
  legal_name: 'MMTA Travel SA de CV',
  email: 'info@mmta.com',
  custom_domain: 'viajes-mmta.com',
  is_active: true,
  created_at: new Date(),
  updated_at: new Date(),
}

const fakeWhiteLabelConfig = {
  id: 1,
  tenant_id: 1,
  favicon_url: '/favicon-mmta.ico',
  footer_text: '© MMTA Travel',
  support_email: 'soporte@mmta.com',
  markup_percentage: 10,
  markup_type: 'percentage' as const,
  created_at: new Date(),
  updated_at: new Date(),
}

describe('TenantService', () => {
  beforeEach(() => {
    vi.clearAllMocks()
  })

  // =====================================================
  // detectTenant
  // =====================================================
  describe('detectTenant', () => {
    it('debería retornar null para localhost', async () => {
      const result = await tenantService.detectTenant('localhost')
      expect(result).toBeNull()
      expect(mockQueryOne).not.toHaveBeenCalled()
    })

    it('debería retornar null para localhost con puerto', async () => {
      const result = await tenantService.detectTenant('localhost:3000')
      expect(result).toBeNull()
      expect(mockQueryOne).not.toHaveBeenCalled()
    })

    it('debería retornar null para 127.0.0.1', async () => {
      const result = await tenantService.detectTenant('127.0.0.1')
      expect(result).toBeNull()
    })

    it('debería retornar null para dominio principal app.asoperadora.com', async () => {
      const result = await tenantService.detectTenant('app.asoperadora.com')
      expect(result).toBeNull()
      expect(mockQueryOne).not.toHaveBeenCalled()
    })

    it('debería retornar null para dominio principal asoperadora.com', async () => {
      const result = await tenantService.detectTenant('asoperadora.com')
      expect(result).toBeNull()
    })

    it('debería retornar null para dominio principal www.asoperadora.com', async () => {
      const result = await tenantService.detectTenant('www.asoperadora.com')
      expect(result).toBeNull()
    })

    it('debería detectar subdomain desde mmta.app.asoperadora.com', async () => {
      mockQueryOne.mockResolvedValueOnce(fakeTenant)

      const result = await tenantService.detectTenant('mmta.app.asoperadora.com')

      expect(result).toEqual(fakeTenant)
      // Debe buscar por subdomain "mmta" (slug match exacto)
      expect(mockQueryOne).toHaveBeenCalledWith(
        expect.stringContaining('LOWER(REPLACE(company_name'),
        ['mmta']
      )
    })

    it('debería detectar subdomain desde agencia1.asoperadora.com', async () => {
      const agenciaTenant = { ...fakeTenant, id: 2, company_name: 'agencia1' }
      mockQueryOne.mockResolvedValueOnce(agenciaTenant)

      const result = await tenantService.detectTenant('agencia1.asoperadora.com')

      expect(result).toEqual(agenciaTenant)
      expect(mockQueryOne).toHaveBeenCalledWith(
        expect.stringContaining('LOWER(REPLACE(company_name'),
        ['agencia1']
      )
    })

    it('debería detectar subdomain desde mmta.app-asoperadora.com', async () => {
      mockQueryOne.mockResolvedValueOnce(fakeTenant)

      const result = await tenantService.detectTenant('mmta.app-asoperadora.com')

      expect(result).toEqual(fakeTenant)
      expect(mockQueryOne).toHaveBeenCalledWith(
        expect.stringContaining('LOWER(REPLACE(company_name'),
        ['mmta']
      )
    })

    it('debería buscar por dominio personalizado si no es dominio asoperadora ni vercel', async () => {
      mockQueryOne.mockResolvedValueOnce(fakeTenant)

      const result = await tenantService.detectTenant('viajes-mmta.com')

      expect(result).toEqual(fakeTenant)
      expect(mockQueryOne).toHaveBeenCalledWith(
        expect.stringContaining('custom_domain'),
        ['viajes-mmta.com']
      )
    })

    it('debería retornar null para dominio de vercel', async () => {
      const result = await tenantService.detectTenant('my-app.vercel.app')
      expect(result).toBeNull()
    })

    it('debería normalizar host a minúsculas', async () => {
      mockQueryOne.mockResolvedValueOnce(fakeTenant)

      await tenantService.detectTenant('MMTA.APP.ASOPERADORA.COM')

      expect(mockQueryOne).toHaveBeenCalledWith(
        expect.stringContaining('LOWER(REPLACE(company_name'),
        ['mmta']
      )
    })

    it('debería hacer fallback a LIKE si no encuentra match exacto por subdomain', async () => {
      // Primer queryOne (match exacto slug) → null
      mockQueryOne.mockResolvedValueOnce(null)
      // Segundo queryOne (LIKE) → tenant encontrado
      mockQueryOne.mockResolvedValueOnce(fakeTenant)

      const result = await tenantService.detectTenant('mmta.app.asoperadora.com')

      expect(result).toEqual(fakeTenant)
      expect(mockQueryOne).toHaveBeenCalledTimes(2)
      expect(mockQueryOne).toHaveBeenNthCalledWith(
        2,
        expect.stringContaining('LIKE'),
        ['%mmta%']
      )
    })

    it('debería retornar null para dominio personalizado sin resultados', async () => {
      mockQueryOne.mockResolvedValueOnce(null)

      const result = await tenantService.detectTenant('dominio-inexistente.com')
      expect(result).toBeNull()
    })
  })

  // =====================================================
  // getTenantById
  // =====================================================
  describe('getTenantById', () => {
    it('debería retornar tenant cuando existe', async () => {
      mockQueryOne.mockResolvedValueOnce(fakeTenant)

      const result = await tenantService.getTenantById(1)

      expect(result).toEqual(fakeTenant)
      expect(mockQueryOne).toHaveBeenCalledWith(
        expect.stringContaining('WHERE id = $1'),
        [1]
      )
    })

    it('debería retornar null cuando no existe', async () => {
      mockQueryOne.mockResolvedValueOnce(null)

      const result = await tenantService.getTenantById(999)

      expect(result).toBeNull()
      expect(mockQueryOne).toHaveBeenCalledWith(
        expect.stringContaining('WHERE id = $1'),
        [999]
      )
    })
  })

  // =====================================================
  // getTenantByDomain
  // =====================================================
  describe('getTenantByDomain', () => {
    it('debería retornar tenant por custom_domain', async () => {
      mockQueryOne.mockResolvedValueOnce(fakeTenant)

      const result = await tenantService.getTenantByDomain('viajes-mmta.com')

      expect(result).toEqual(fakeTenant)
      expect(mockQueryOne).toHaveBeenCalledWith(
        expect.stringContaining('custom_domain = $1'),
        ['viajes-mmta.com']
      )
    })

    it('debería retornar null si no hay tenant con ese dominio', async () => {
      mockQueryOne.mockResolvedValueOnce(null)

      const result = await tenantService.getTenantByDomain('no-existe.com')

      expect(result).toBeNull()
    })
  })

  // =====================================================
  // getTenantBySubdomain
  // =====================================================
  describe('getTenantBySubdomain', () => {
    it('debería retornar tenant con match exacto por slug', async () => {
      mockQueryOne.mockResolvedValueOnce(fakeTenant)

      const result = await tenantService.getTenantBySubdomain('mmta')

      expect(result).toEqual(fakeTenant)
      expect(mockQueryOne).toHaveBeenCalledTimes(1)
      expect(mockQueryOne).toHaveBeenCalledWith(
        expect.stringContaining('LOWER(REPLACE(company_name'),
        ['mmta']
      )
    })

    it('debería hacer fallback a LIKE si no hay match exacto', async () => {
      mockQueryOne.mockResolvedValueOnce(null)
      mockQueryOne.mockResolvedValueOnce(fakeTenant)

      const result = await tenantService.getTenantBySubdomain('mmta')

      expect(result).toEqual(fakeTenant)
      expect(mockQueryOne).toHaveBeenCalledTimes(2)
      expect(mockQueryOne).toHaveBeenNthCalledWith(
        2,
        expect.stringContaining('LIKE'),
        ['%mmta%']
      )
    })

    it('debería retornar null si no encuentra ningún match', async () => {
      mockQueryOne.mockResolvedValueOnce(null)
      mockQueryOne.mockResolvedValueOnce(null)

      const result = await tenantService.getTenantBySubdomain('inexistente')

      expect(result).toBeNull()
      expect(mockQueryOne).toHaveBeenCalledTimes(2)
    })
  })

  // =====================================================
  // getWhiteLabelConfig
  // =====================================================
  describe('getWhiteLabelConfig', () => {
    it('debería retornar config cuando existe', async () => {
      mockQueryOne.mockResolvedValueOnce(fakeWhiteLabelConfig)

      const result = await tenantService.getWhiteLabelConfig(1)

      expect(result).toEqual(fakeWhiteLabelConfig)
      expect(mockQueryOne).toHaveBeenCalledWith(
        expect.stringContaining('white_label_config'),
        [1]
      )
    })

    it('debería retornar null cuando no hay config', async () => {
      mockQueryOne.mockResolvedValueOnce(null)

      const result = await tenantService.getWhiteLabelConfig(999)

      expect(result).toBeNull()
    })
  })

  // =====================================================
  // userBelongsToTenant
  // =====================================================
  describe('userBelongsToTenant', () => {
    it('debería retornar true si el usuario pertenece al tenant', async () => {
      mockQueryOne.mockResolvedValueOnce({ count: '1' })

      const result = await tenantService.userBelongsToTenant(10, 1)

      expect(result).toBe(true)
      expect(mockQueryOne).toHaveBeenCalledWith(
        expect.stringContaining('tenant_users'),
        [10, 1]
      )
    })

    it('debería retornar false si el usuario NO pertenece al tenant', async () => {
      mockQueryOne.mockResolvedValueOnce({ count: '0' })

      const result = await tenantService.userBelongsToTenant(10, 99)

      expect(result).toBe(false)
    })

    it('debería retornar false si queryOne retorna null', async () => {
      mockQueryOne.mockResolvedValueOnce(null)

      const result = await tenantService.userBelongsToTenant(10, 1)

      expect(result).toBe(false)
    })
  })

  // =====================================================
  // createTenant
  // =====================================================
  describe('createTenant', () => {
    it('debería crear tenant con datos correctos', async () => {
      const inputData = {
        tenant_type: 'agency' as const,
        company_name: 'Nueva Agencia',
        email: 'info@nuevaagencia.com',
        subscription_plan: 'pro',
      }

      const createdTenant = { ...fakeTenant, ...inputData, id: 5 }
      mockInsertOne.mockResolvedValueOnce(createdTenant)

      const result = await tenantService.createTenant(inputData)

      expect(result).toEqual(createdTenant)
      expect(mockInsertOne).toHaveBeenCalledWith('tenants', {
        ...inputData,
        is_active: true,
      })
    })

    it('debería crear tenant corporativo', async () => {
      const inputData = {
        tenant_type: 'corporate' as const,
        company_name: 'Corp XYZ',
        legal_name: 'Corp XYZ SA de CV',
        tax_id: 'CXY123456',
      }

      const createdTenant = { ...fakeTenant, ...inputData, id: 6 }
      mockInsertOne.mockResolvedValueOnce(createdTenant)

      const result = await tenantService.createTenant(inputData)

      expect(result).toEqual(createdTenant)
      expect(mockInsertOne).toHaveBeenCalledWith('tenants', {
        ...inputData,
        is_active: true,
      })
    })
  })

  // =====================================================
  // updateTenant
  // =====================================================
  describe('updateTenant', () => {
    it('debería actualizar tenant existente', async () => {
      const updated = { ...fakeTenant, company_name: 'MMTA Actualizado' }
      mockUpdateOne.mockResolvedValueOnce(updated)

      const result = await tenantService.updateTenant(1, { company_name: 'MMTA Actualizado' })

      expect(result).toEqual(updated)
      expect(mockUpdateOne).toHaveBeenCalledWith('tenants', 1, { company_name: 'MMTA Actualizado' })
    })
  })

  // =====================================================
  // getUserRoleInTenant
  // =====================================================
  describe('getUserRoleInTenant', () => {
    it('debería retornar el rol del usuario en el tenant', async () => {
      mockQueryOne.mockResolvedValueOnce({ role: 'admin' })

      const result = await tenantService.getUserRoleInTenant(10, 1)

      expect(result).toBe('admin')
    })

    it('debería retornar null si el usuario no tiene rol', async () => {
      mockQueryOne.mockResolvedValueOnce(null)

      const result = await tenantService.getUserRoleInTenant(10, 1)

      expect(result).toBeNull()
    })
  })
})
