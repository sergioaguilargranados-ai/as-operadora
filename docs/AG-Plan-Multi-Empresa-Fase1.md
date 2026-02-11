# Fase 1: Infraestructura Core Multi-Empresa + Marca Blanca

Conectar las piezas backend existentes (`TenantService`, API routes, DB schema) con un frontend dinámico que soporte branding por tenant, y crear la UI de administración de tenants.

## User Review Required

> [!IMPORTANT]
> Se necesitan los datos de la agencia de prueba para crear el tenant inicial. Por favor proporcionar: nombre, tipo (corporate/agency), logo URL, colores (primario, secundario), email, teléfono, y dominio deseado (ej: `agencia1.asoperadora.com`).

> [!WARNING]
> El middleware actual **no está conectado a la BD** — siempre retorna `null`. Esto significa que actualmente NINGÚN tenant se detecta. Lo corregiremos al importar `TenantService` en el middleware.

---

## Proposed Changes

### Middleware — Detección Real de Tenants

#### [MODIFY] [middleware.ts](file:///g:/Otros%20ordenadores/Mi%20PC/operadora-dev/src/middleware.ts)

Reemplazar los TODOs con consultas reales a BD via `TenantService`:

- Importar `TenantService` y llamar `detectTenant(host)` que ya busca por subdominio y dominio custom
- Agregar detección de referral code (`?r=CODIGO`) → guardar en cookie
- Pasar datos del tenant como cookies (no solo headers) para que el frontend los pueda leer
- Mantener el dominio principal `asoperadora.com` sin tenant (plataforma AS Operadora)

> [!NOTE]
> El middleware de Next.js corre en edge runtime. Verificaremos que `pg` funcione allí; si no, usaremos una API route interna `/api/tenant/detect` como fallback.

---

### API — Endpoint de Detección

#### [NEW] [route.ts](file:///g:/Otros%20ordenadores/Mi%20PC/operadora-dev/src/app/api/tenant/detect/route.ts)

Endpoint para que el frontend detecte el tenant actual:

- `GET /api/tenant/detect` — detecta tenant desde headers/cookies del request
- Retorna: `{ tenant, whiteLabelConfig }` o `null`
- Usado por `WhiteLabelContext` para cargar configuración

---

### Frontend Context — WhiteLabelProvider

#### [NEW] [WhiteLabelContext.tsx](file:///g:/Otros%20ordenadores/Mi%20PC/operadora-dev/src/contexts/WhiteLabelContext.tsx)

Nuevo context provider siguiendo el patrón de `FeaturesContext.tsx`:

```typescript
interface WhiteLabelConfig {
  tenantId: number | null
  tenantType: 'corporate' | 'agency' | null
  companyName: string         // "AS Operadora" por defecto
  logoUrl: string | null      // URL de logo o null para usar Logo.tsx default
  primaryColor: string        // "#0066FF" por defecto
  secondaryColor: string      // "#0052CC" por defecto
  accentColor: string
  supportEmail: string
  supportPhone: string
  footerText: string
  isWhiteLabel: boolean       // true si se accede via agencia
}
```

- Carga al montar llamando `/api/tenant/detect`
- Expone hook `useWhiteLabel()` para acceder a config
- Valores por defecto = branding AS Operadora
- Se inserta en `layout.tsx` entre `AuthProvider` y `FeaturesProvider`

---

### Branding Dinámico

#### [MODIFY] [Logo.tsx](file:///g:/Otros%20ordenadores/Mi%20PC/operadora-dev/src/components/Logo.tsx)

- Usar `useWhiteLabel()` para obtener `logoUrl` y `companyName`
- Si `logoUrl` existe → mostrar `<img>` con el logo del tenant
- Si no → mostrar el logo actual de texto "AS" (sin cambios)
- Prop opcional `forceDefault` para forzar logo AS en ciertas páginas

#### [MODIFY] [globals.css](file:///g:/Otros%20ordenadores/Mi%20PC/operadora-dev/src/app/globals.css)

Agregar CSS variables en `:root`:

```css
:root {
  --brand-primary: #0066FF;
  --brand-secondary: #0052CC;
  --brand-accent: #0066FF;
}
```

#### [NEW] [BrandStyles.tsx](file:///g:/Otros%20ordenadores/Mi%20PC/operadora-dev/src/components/BrandStyles.tsx)

Componente client-side que inyecta un `<style>` tag dinámico con las CSS variables del tenant actual, actualizando `:root` desde JavaScript con los colores del `WhiteLabelContext`.

#### [MODIFY] [layout.tsx](file:///g:/Otros%20ordenadores/Mi%20PC/operadora-dev/src/app/layout.tsx)

- Agregar `WhiteLabelProvider` entre `AuthProvider` y `FeaturesProvider`
- Agregar `BrandStyles` dentro del provider chain
- Hacer metadata dinámica (título del tenant)

---

### Admin UI — Gestión de Tenants

#### [NEW] [page.tsx](file:///g:/Otros%20ordenadores/Mi%20PC/operadora-dev/src/app/admin/tenants/page.tsx)

Página de administración de tenants (solo SUPER_ADMIN):

- Tabla con todos los tenants (nombre, tipo, dominio, estado, fecha)
- Botón "Crear Tenant" → modal/formulario
- Formulario: nombre, tipo(corporate/agency), email, teléfono, logo URL
- Para agencias: sección adicional de White-Label (colores, footer, etc.)
- Acciones: editar, activar/desactivar, ver usuarios, ver stats
- Usa las APIs existentes (`/api/tenants`)
- Estilo consistente con otras páginas admin (`/admin/features`)
- FeatureGate opcional para controlar acceso

---

### Script de Datos de Prueba

#### [NEW] [create-test-tenant.js](file:///g:/Otros%20ordenadores/Mi%20PC/operadora-dev/scripts/create-test-tenant.js)

Script para crear el tenant de prueba de la agencia del usuario:

- Inserta en tabla `tenants`
- Inserta en `white_label_config`
- Asigna usuario de prueba como admin de la agencia en `tenant_users`
- Ejecutable con `node scripts/create-test-tenant.js`

---

## Verification Plan

### Verificación por el usuario

Al completar la implementación, le pediré al usuario que:

1. **Abra `/admin/tenants`** logueado como `superadmin@asoperadora.com` y verifique que puede ver la lista de tenants, crear uno nuevo y editarlo
2. **Ejecute el script de prueba** `node scripts/create-test-tenant.js` y confirme que los datos se insertaron
3. **Verifique el branding** — al acceder desde `localhost:3000` debe ver branding de AS Operadora (sin cambios); cuando proporcionemos datos de agencia podremos probar el white-label
4. **Confirme que nada se rompió** — navegación normal, login, tours, dashboard siguen funcionando como antes

### Build check

```bash
cd "g:\Otros ordenadores\Mi PC\operadora-dev"
npm run build
```

El build debe pasar sin errores TypeScript.
