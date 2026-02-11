# Análisis Fase 2: Dashboard de Agencias, Comisiones y Referidos

**Build:** 11 Feb 2026 - v2.304  
**Autor:** Antigravity AI  
**Objetivo:** Mapear lo que **YA EXISTE** vs lo que **FALTA** para completar la Fase 2

---

## Jerarquía del Sistema

```
AS Operadora (Admin/Super Admin)
  └── Agencia (Tenant type: agency)
       └── Agente (User con rol AGENT vinculado al tenant)
            └── Cliente (User referido por el agente)
```

---

## 1. ANÁLISIS DE BASE DE DATOS

### ✅ Tablas que YA EXISTEN

| Tabla | Columnas Clave | Estado |
|:------|:---------------|:-------|
| `tenants` | id, tenant_type, company_name, colores, domain | ✅ Funcional, 2 registros |
| `tenant_users` | user_id, tenant_id, role, department | ✅ Existe pero 0 registros |
| `white_label_config` | tenant_id, footer, soporte, SEO | ✅ Funcional |
| `users` | id, email, name, role | ✅ 24 usuarios, **SIN tenant_id** |
| `bookings` | id, user_id, **tenant_id**, tipo, precios | ✅ 105 reservas |
| `agency_commissions` | agency_id, booking_id, commission_rate/amount, status | ✅ Existe pero 0 registros |
| `agency_commission_config` | agency_id, commission_type, default_rate, payment_frequency | ✅ Existe, configuración por agencia |
| `commission_by_service` | config_id, service_type, commission_rate | ✅ Comisión por tipo de servicio |
| `commission_tiers` | config_id, min/max_bookings, commission_rate | ✅ Escalas de comisión |
| `agency_commissions_summary` | agency_id, totales, pendiente, pagado | ✅ Vista/tabla de resumen |
| `agency_clients` | agency_id, client_user_id, **agent_id**, **referral_code** | ✅ Relación agencia-cliente-agente |
| `batch_payments` | batch_id, amount | ✅ Pagos en lote |

### ❌ Tablas que NO EXISTEN (necesarias)

| Tabla Necesaria | Propósito | Prioridad |
|:---------------|:----------|:----------|
| `referral_clicks` | Log de clics en ligas de referido (user_agent, timestamp, IP) | Alta |
| `referral_conversions` | Registro de conversiones (clic → registro → compra) | Alta |
| `agent_referral_codes` | Códigos de referido por agente (UUID único) | Alta |
| `commission_disbursements` | Historial de pagos/dispersiones a agentes | Media |

### ⚠️ Columnas FALTANTES en tablas existentes

| Tabla | Columna Faltante | Propósito |
|:------|:----------------|:----------|
| `users` | `tenant_id` | Vincular usuario directamente a un tenant |
| `users` | `referred_by_agent_id` | Quién refirió al usuario |
| `users` | `referral_source` | Source del registro (link, manual, etc.) |
| `agency_commissions` | `agent_id` | A qué agente corresponde la comisión (split) |
| `agency_commissions` | `agent_commission_amount` | Monto de comisión del agente (vs agencia) |
| `agency_commissions` | `commission_percentage` | La API lo usa pero la BD no lo tiene |
| `agency_commissions` | `calculation_date` | Fecha de cálculo |
| `agency_commissions` | `created_by` | Quién creó la comisión |

---

## 2. ANÁLISIS DE APIs (Backend)

### ✅ APIs que YA EXISTEN

| Endpoint | Métodos | Estado |
|:---------|:--------|:-------|
| `/api/tenants` | GET (listar), POST (crear) | ✅ Funcional |
| `/api/tenants/[id]` | GET, PUT, DELETE | ✅ Funcional |
| `/api/tenant/detect` | GET (detectar por host) | ✅ Nuevo (Fase 1) |
| `/api/commissions` | GET (listar+stats), POST (crear) | ✅ Existe PERO referencia `agency_commissions` con columnas que no coinciden con la BD real |
| `/api/commissions/[id]` | GET, PUT (mark_paid, adjust), DELETE | ✅ Existe, misma nota |
| `/api/bookings` | CRUD completo | ✅ Funcional |
| `/api/corporate/stats` | GET | ✅ Para dashboard corporativo |
| `/api/corporate/employees` | CRUD + import CSV | ✅ Para gestión de empleados |

### ❌ APIs que FALTAN

| Endpoint Necesario | Propósito | Prioridad |
|:-------------------|:----------|:----------|
| `/api/agency/dashboard/stats` | Stats del dashboard de agencia (reservas, comisiones, clientes) | Alta |
| `/api/agency/agents` | CRUD de agentes de la agencia | Alta |
| `/api/agency/clients` | Listar clientes por agente/agencia | Alta |
| `/api/referrals/click` | Registrar clic en liga de referido | Alta |
| `/api/referrals/stats` | Stats de referidos por agente | Alta |
| `/api/agent/dashboard` | Dashboard personal del agente (mi monedero, mis clientes) | Alta |
| `/api/agent/referral-link` | Generar/obtener link de referido del agente | Media |
| `/api/commission/calculate` | Trigger automático de cálculo de comisión post-reserva | Media |
| `/api/commission/disburse` | Registro de dispersión/pago | Media |

---

## 3. ANÁLISIS DE FRONTEND (Páginas/Componentes)

### ✅ Páginas que YA EXISTEN

| Ruta | Propósito | Estado |
|:-----|:----------|:-------|
| `/dashboard` | Dashboard financiero general (facturas, por cobrar, por pagar, comisiones) | ✅ Existe, genérico |
| `/dashboard/corporate` | Dashboard corporativo (empleados, políticas, reportes) | ✅ Existe, para type=corporate |
| `/dashboard/payments` | Gestión de pagos (tabs: facturas, CxC, CxP, comisiones) | ✅ Existe |
| `/admin/tenants` | Admin CRUD de tenants | ✅ Nuevo (Fase 1) |
| `/admin/features` | Admin de features | ✅ Existe |
| `/mis-reservas` | Mis reservas del usuario | ✅ Existe |

### ❌ Páginas que FALTAN

| Ruta Necesaria | Propósito | Prioridad |
|:--------------|:----------|:----------|
| `/dashboard/agency` | Dashboard principal de la Agencia (resumen ventas, comisiones, agentes) | Alta |
| `/dashboard/agency/agents` | Gestión de agentes de la agencia | Alta |
| `/dashboard/agency/clients` | Catálogo de clientes por agente | Alta |
| `/dashboard/agency/commissions` | Detalle de comisiones de la agencia | Alta |
| `/dashboard/agent` | Dashboard personal del Agente ("Mi Monedero", mis referidos, clientes) | Alta |
| `/dashboard/agent/referrals` | Mis ligas de referido y tracking | Alta |
| `/admin/agencies` | Vista admin de todas las agencias (para Super Admin) | Media |
| `/admin/agents` | Vista admin de todos los agentes | Media |

### ✅ Servicios Backend que YA EXISTEN

| Servicio | Funcionalidad |
|:---------|:-------------|
| `TenantService` | Detección, CRUD de tenants, white-label, usuarios por tenant |
| `CorporateService` | Empleados, stats, políticas de viaje (para corporativo) |
| `CommunicationService` | Centro de comunicación |
| `AuthService` | Autenticación |
| `ApprovalService` | Aprobaciones |

### ❌ Servicios que FALTAN

| Servicio Necesario | Propósito |
|:-------------------|:----------|
| `AgencyService` | Gestión de agencia: agentes, clientes, stats de agencia |
| `ReferralService` | Tracking de referidos, generación de códigos, conversiones |
| `CommissionService` | Cálculo automático, split agencia/agente, dispersión |

---

## 4. ANÁLISIS DE GAPS CRÍTICOS

### 🔴 Gap 1: `users.tenant_id` no existe
La tabla `users` NO tiene `tenant_id`. La relación usuario↔tenant se hace vía `tenant_users` (tabla de relación N:N). Esto está bien para "un usuario puede estar en múltiples tenants", PERO para la jerarquía Agencia→Agente→Cliente necesitamos saber de forma directa a qué tenant pertenece un usuario.

**Decisión:**
- Opción A: Agregar `tenant_id` a `users` (tenant principal)
- Opción B: Usar `tenant_users` con roles (AGENT, CLIENT) — **más flexible**
- **Recomendación:** Opción B + agregar columnas a `tenant_users`

### 🔴 Gap 2: No hay concepto de "Agente" separado
Actualmente `tenant_users.role` puede contener cualquier string. Para la Fase 2 necesitamos definir roles claros:
- `AGENCY_ADMIN` — Administrador de la agencia
- `AGENT` — Agente de ventas
- `CLIENT` — Cliente referido

### 🔴 Gap 3: API de comisiones no coincide con la BD
El código en `/api/commissions/route.ts` referencia columnas que NO existen en `agency_commissions`:
- `commission_percentage` → la BD tiene `commission_rate`
- `base_amount` → la BD tiene `base_price`
- `is_active` → no existe en la BD
- `created_by` → no existe en la BD
- `calculation_date` → no existe en la BD

### 🔴 Gap 4: No hay sistema de referidos
No existe ninguna tabla, API, ni componente para tracking de referidos. El middleware ya captura `?r=CODE` en cookie, pero no hay lógica backend.

### 🟡 Gap 5: `agency_clients` sin uso
La tabla existe con campos perfectos (`agent_id`, `referral_code`) pero no hay ningún código que la use.

---

## 5. PLAN DE IMPLEMENTACIÓN FASE 2

### Sprint 1: Base de Datos + APIs Core (2-3 sesiones)

1. **Migración BD:**
   - Agregar columnas a `tenant_users`: `referral_code`, `agent_phone`, `agent_commission_split`
   - Crear tabla `referral_clicks`: agent_id, ip, user_agent, utm_source, timestamp
   - Crear tabla `referral_conversions`: click_id, user_id, conversion_type, timestamp
   - Agregar columnas faltantes a `agency_commissions`: agent_id, agent_commission_amount, is_active
   - Crear tabla `commission_disbursements`: agent_id, amount, payment_method, reference, date

2. **Servicios:**
   - Crear `AgencyService.ts` (CRUD agentes, clientes, stats)
   - Crear `ReferralService.ts` (códigos, tracking, conversiones)
   - Crear `CommissionService.ts` (cálculo, split, dispersión)
   - Corregir `/api/commissions` para que coincida con la BD real

3. **APIs:**
   - `/api/agency/dashboard/stats` — estadísticas
   - `/api/agency/agents` — CRUD agentes
   - `/api/agency/clients` — catálogo clientes
   - `/api/referrals/click` — log de clics
   - `/api/referrals/stats` — estadísticas
   - `/api/agent/dashboard` — "Mi Monedero"

### Sprint 2: Frontend Dashboard Agencia (2-3 sesiones)

4. **Dashboard de Agencia** (`/dashboard/agency`):
   - Widget de ventas (hoy/semana/mes)
   - Widget de comisiones (pendiente/disponible/pagada)
   - Lista de agentes con performance
   - Catálogo de clientes

5. **Dashboard de Agente** (`/dashboard/agent`):
   - "Mi Monedero" (pendiente, disponible, pagada)
   - Liga de referido con botón copiar
   - Mis clientes referidos
   - Gráfico de proyección de ingresos

### Sprint 3: Automatizaciones + Polish (1-2 sesiones)

6. **Disparador de cambio de estado:**
   - Booking status "completed" → mover comisión de "pending" a "available"
   - Notificación al agente cuando tiene comisión disponible

7. **Admin views:**
   - `/admin/agencies` — vista global de agencias
   - `/admin/agents` — vista global de agentes

---

## 6. RESUMEN EJECUTIVO

| Categoría | Existe | Falta |
|:----------|:-------|:------|
| **Tablas BD** | 12 tablas relevantes | 4 tablas nuevas + 8 columnas |
| **APIs** | 8 endpoints | 9 endpoints nuevos |
| **Servicios** | TenantService, CorporateService | AgencyService, ReferralService, CommissionService |
| **Páginas** | Dashboard financiero + corporativo | Dashboard agencia + dashboard agente |
| **Datos** | 2 tenants, 24 users, 105 bookings | 0 agentes, 0 clientes agencia, 0 comisiones |

**La base de datos tiene una estructura sólida** (tablas de comisiones, clientes de agencia, configuración). Los gaps principales son:
1. Falta conectar los usuarios con los tenants (`tenant_users` tiene 0 registros)
2. Falta el sistema de referidos completo
3. La API de comisiones no coincide con el esquema real de la BD
4. No hay frontend para agencias/agentes
