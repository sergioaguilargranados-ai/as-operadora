import { NextRequest, NextResponse } from 'next/server'

/**
 * Middleware de Next.js para Multi-Empresa / Marca Blanca
 * 
 * NOTA: Este middleware corre en Edge Runtime, NO puede importar pg/TenantService.
 * La detección real se hace vía /api/tenant/detect (Node.js runtime).
 * Aquí solo extraemos subdomain/host y lo pasamos como header para que
 * el frontend o las APIs lo usen.
 */
export async function middleware(request: NextRequest) {
  const host = request.headers.get('host') || ''
  const pathname = request.nextUrl.pathname
  const url = request.nextUrl

  // Crear response
  const response = NextResponse.next()

  // ─────────────────────────────────────────────
  // 1. Detectar subdomain o dominio personalizado
  // ─────────────────────────────────────────────
  const tenantInfo = extractTenantFromHost(host)

  if (tenantInfo) {
    // Pasar info al frontend/APIs vía headers
    response.headers.set('x-tenant-host', host)
    response.headers.set('x-tenant-subdomain', tenantInfo.subdomain || '')
    response.headers.set('x-tenant-custom-domain', tenantInfo.customDomain || '')
    response.headers.set('x-white-label', 'true')
  }

  // ─────────────────────────────────────────────
  // 2. Detectar referral code (?r=CODIGO)
  // ─────────────────────────────────────────────
  const referralCode = url.searchParams.get('r')
  if (referralCode) {
    // Guardar referral en cookie (30 días)
    response.cookies.set('as_referral', referralCode, {
      maxAge: 30 * 24 * 60 * 60, // 30 días
      path: '/',
      httpOnly: false, // Frontend necesita leerla
      sameSite: 'lax',
    })
    response.headers.set('x-referral-code', referralCode)
  } else {
    // Verificar si ya existe cookie de referral
    const existingReferral = request.cookies.get('as_referral')?.value
    if (existingReferral) {
      response.headers.set('x-referral-code', existingReferral)
    }
  }

  return response
}

/**
 * Extrae información de tenant desde el hostname
 */
function extractTenantFromHost(host: string): {
  subdomain: string | null
  customDomain: string | null
} | null {
  // Remover puerto si existe
  const hostname = host.split(':')[0]

  // Si es localhost, no hay tenant
  if (hostname === 'localhost' || hostname === '127.0.0.1') {
    return null
  }

  // Dominios principales de AS Operadora (sin tenant)
  const mainDomains = [
    'asoperadora.com',
    'www.asoperadora.com',
    'app.asoperadora.com',
    'as-ope-viajes.company',
    'www.as-ope-viajes.company',
  ]

  if (mainDomains.includes(hostname)) {
    return null
  }

  // Verificar si es subdominio de asoperadora.com o app.asoperadora.com
  // Ejemplos: mmta.app.asoperadora.com, agencia1.asoperadora.com
  const baseDomains = [
    '.app.asoperadora.com',    // mmta.app.asoperadora.com
    '.app-asoperadora.com',    // mmta.app-asoperadora.com  
    '.asoperadora.com',        // agencia1.asoperadora.com
  ]

  for (const baseDomain of baseDomains) {
    if (hostname.endsWith(baseDomain)) {
      const subdomain = hostname.replace(baseDomain, '')
      if (subdomain && !subdomain.includes('.')) {
        return { subdomain, customDomain: null }
      }
    }
  }

  // Si no es ningún dominio conocido de AS Operadora, 
  // podría ser un dominio personalizado de agencia
  if (!hostname.includes('asoperadora') && !hostname.includes('vercel')) {
    return { subdomain: null, customDomain: hostname }
  }

  return null
}

export const config = {
  matcher: [
    /*
     * Match all request paths except for the ones starting with:
     * - api (API routes)
     * - _next/static (static files)
     * - _next/image (image optimization files)
     * - favicon.ico (favicon file)
     */
    '/((?!api|_next/static|_next/image|favicon.ico).*)',
  ],
}
