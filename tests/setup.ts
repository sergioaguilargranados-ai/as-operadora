/**
 * Test Setup
 * Configuración global para todos los tests
 */

import { vi } from 'vitest'

// Cleanup no es necesario para Node.js services
// Eliminar mocks de DOM que fallaban

// Mock de variables de entorno
process.env.NEXT_PUBLIC_APP_URL = 'http://localhost:3000'
process.env.JWT_SECRET = 'test-secret-key-32-characters-long'
process.env.ENCRYPTION_SECRET_KEY = 'test-encryption-key-32-chars-long!'

// Mock de fetch global
global.fetch = vi.fn()
