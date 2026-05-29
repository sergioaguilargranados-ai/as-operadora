# 🚀 Plan de Acción — Retoma AS Operadora
### Tareas SIN Bloqueadores Externos | 28 Mayo 2026

---

> [!IMPORTANT]
> Este plan incluye **SOLO** las tareas que podemos ejecutar **ya mismo** sin depender de:
> - ❌ Amadeus (contrato/API keys)
> - ❌ Twilio (cuenta WhatsApp/SMS)
> - ❌ Google OAuth (proyecto GCP)
> - ❌ Expedia (integración nueva)
> - ❌ DNS del cliente (SPF/DKIM/DMARC)
>
> Los ítems bloqueados quedan para cuando el cliente los resuelva.

---

## 📋 RESUMEN DE FASES

| Fase | Nombre | Estimación | Prioridad |
|------|--------|:----------:|:---------:|
| **1** | 🌐 PWA — App Móvil Inmediata | 2-3 días | 🔴 Máxima |
| **2** | 🏷️ White-Label — Correcciones Críticas | 1-2 días | 🔴 Alta |
| **3** | 📧 Emails — Estabilización y Activación | 1-2 días | 🔴 Alta |
| **4** | 🗺️ Tours — Mejoras de Datos y UI | 2-3 días | 🟡 Media |
| **5** | 🧹 Limpieza Técnica y README | 1 día | 🟡 Media |
| **6** | 🧪 Testing — Cobertura Crítica | 2-3 días | 🟡 Media |
| **7** | 👥 RRHH — Data Seeding y Pruebas | 1 día | 🟢 Normal |

**Total estimado: 10-15 días de desarrollo**

---

## FASE 1 — 🌐 PWA (Progressive Web App)
> **Estrategia del cliente:** PWA primero → App nativa después

### Objetivo
Convertir la app web Next.js existente en una PWA instalable en móviles, con experiencia nativa-like sin necesidad de tiendas de apps.

### 1.1 Manifest y Service Worker
- [ ] Crear `public/manifest.json` con metadatos de la app (nombre, iconos, colores, display: standalone)
- [ ] Generar set de iconos PWA (192x192, 512x512, maskable) con branding AS Operadora
- [ ] Implementar Service Worker con `next-pwa` o `@serwist/next` para:
  - Cache de assets estáticos (CSS, JS, imágenes)
  - Estrategia network-first para APIs
  - Página offline de fallback
- [ ] Agregar `<link rel="manifest">` y meta tags de PWA en [layout.tsx](file:///g:/Otros ordenadores/Mi PC/operadora-dev/src/app/layout.tsx)
- [ ] Agregar meta tags para iOS (apple-mobile-web-app-capable, apple-touch-icon, status-bar-style)

### 1.2 Optimización Responsive Móvil
- [ ] Auditar y corregir las 18+ páginas principales para responsive móvil:
  - Landing page (154KB — necesita revisión)
  - Catálogo de tours y detalle
  - Dashboard y CRM
  - Cotizaciones
  - Checkout/Pagos
  - Centro de Comunicación
- [ ] Implementar navegación móvil tipo bottom-tabs (Inicio, Buscar, Reservas, Perfil)
- [ ] Optimizar touch targets (mínimo 44px)
- [ ] Implementar gestos swipe donde aplique

### 1.3 Funcionalidades PWA
- [ ] Banner de instalación ("Agregar a pantalla de inicio")
- [ ] Splash screen personalizado
- [ ] Notificaciones push vía Web Push API (no requiere Twilio)
- [ ] Cache inteligente de datos del usuario (reservas, perfil, favoritos)
- [ ] Detección de conectividad (online/offline) con indicador visual

### 1.4 Verificación
- [ ] Pasar auditoría Lighthouse PWA ≥ 90 puntos
- [ ] Probar instalación en Chrome Android
- [ ] Probar instalación en Safari iOS
- [ ] Verificar modo offline con datos cacheados
- [ ] Verificar que funcione como app standalone

#### Archivos a crear/modificar:
| Archivo | Acción |
|---------|--------|
| `public/manifest.json` | [NUEVO] |
| `src/app/layout.tsx` | [MODIFICAR] — meta tags PWA |
| `next.config.js` | [MODIFICAR] — configurar PWA plugin |
| `public/sw.js` o via plugin | [NUEVO] — Service Worker |
| `public/icons/` | [NUEVO] — Iconos PWA |
| `src/components/pwa/InstallPrompt.tsx` | [NUEVO] — Banner de instalación |
| `src/components/pwa/OfflineIndicator.tsx` | [NUEVO] — Indicador offline |
| `src/app/offline/page.tsx` | [NUEVO] — Página offline |

---

## FASE 2 — 🏷️ White-Label — Correcciones Críticas

### Hallazgos de la investigación
La investigación reveló que el estado del White-Label es **mucho mejor de lo documentado**:
- ✅ `TenantService` tiene 16 métodos funcionales
- ✅ `AgencyService` existe (505 líneas) — NO estaba faltante como decían los docs
- ✅ `CommissionService` existe (436 líneas) — NO estaba faltante
- ✅ Dashboard de agencia existe (921 líneas) — NO estaba faltante
- ✅ Dashboard de agente "Mi Monedero" existe (689 líneas) — NO estaba faltante
- ✅ Middleware detecta tenants correctamente (no retorna siempre null, solo en localhost)

> [!NOTE]
> El informe anterior decía que faltaban AgencyService, CommissionService y los dashboards. **Ya existen todos.** Los documentos AG-* estaban desactualizados.

### 2.1 Corregir IDs Hardcodeados
- [ ] **Dashboard Agency** ([page.tsx](file:///g:/Otros ordenadores/Mi PC/operadora-dev/src/app/dashboard/agency/page.tsx) línea 122): Cambiar `agencyId = 2` hardcodeado por obtenerlo del JWT/AuthContext del usuario
- [ ] **Dashboard Agent** ([page.tsx](file:///g:/Otros ordenadores/Mi PC/operadora-dev/src/app/dashboard/agent/page.tsx) línea 95): Cambiar `agentId` de query param por obtenerlo del JWT/AuthContext

### 2.2 API Tenant Detect — Campos Faltantes
- [ ] Agregar `markup_percentage`, `markup_fixed`, `markup_type` al response de `/api/tenant/detect` (líneas 77-88 del route.ts)

### 2.3 Verificar Migraciones
- [ ] Verificar si migración [032_add_markup_to_wl_config.sql](file:///g:/Otros ordenadores/Mi PC/operadora-dev/migrations/032_add_markup_to_wl_config.sql) fue ejecutada en Neon
- [ ] Verificar si migración [033_agency_applications_table.sql](file:///g:/Otros ordenadores/Mi PC/operadora-dev/migrations/033_agency_applications_table.sql) fue ejecutada en Neon
- [ ] Si no están ejecutadas → ejecutarlas

### 2.4 Prueba End-to-End White-Label
- [ ] Probar flujo completo: detección de tenant → branding → markup de precios → cotización → email con branding
- [ ] Verificar que `?tenant=mmta` funcione en localhost para testing

#### Archivos a modificar:
| Archivo | Cambio |
|---------|--------|
| [agency/page.tsx](file:///g:/Otros ordenadores/Mi PC/operadora-dev/src/app/dashboard/agency/page.tsx) | Obtener agencyId del auth context |
| [agent/page.tsx](file:///g:/Otros ordenadores/Mi PC/operadora-dev/src/app/dashboard/agent/page.tsx) | Obtener agentId del auth context |
| `/api/tenant/detect/route.ts` | Agregar markup fields al response |

---

## FASE 3 — 📧 Emails — Estabilización y Activación

### 3.1 Corregir Inconsistencias Encontradas
- [ ] **Variable de entorno inconsistente**: El código usa `CRON_SECRET` pero `.env.example` define `CRON_SECRET_KEY` → Unificar a `CRON_SECRET`
- [ ] **Agregar variables faltantes** a `.env.example`: `RESEND_API_KEY` y `RESEND_FROM_EMAIL` (el código las usa como proveedor prioritario)
- [ ] **Eliminar archivo duplicado**: [emailHelper-new-functions.ts](file:///g:/Otros ordenadores/Mi PC/operadora-dev/src/lib/emailHelper-new-functions.ts) es redundante (ya integrado en emailHelper.ts)
- [ ] **Unificar sistemas de email**: `EmailService.ts` (templates inline) vs `emailHelper.ts` (templates HTML) — Migrar `CommunicationService` para que use `emailHelper.ts`

### 3.2 Activar Cron Jobs en Vercel

> [!CAUTION]
> Solo `hr-alerts` está configurado en [vercel.json](file:///g:/Otros ordenadores/Mi PC/operadora-dev/vercel.json). Faltan los otros 2 cron jobs.

- [ ] Agregar `email-reminders` a `vercel.json` (diario 16:00 UTC / 10:00 AM CST)
- [ ] Agregar `megatravel-sync` a `vercel.json` (diario 09:00 UTC / 3:00 AM CST)

**vercel.json actualizado:**
```json
{
    "framework": "nextjs",
    "buildCommand": "next build",
    "crons": [
        { "path": "/api/cron/hr-alerts", "schedule": "0 14 * * *" },
        { "path": "/api/cron/email-reminders", "schedule": "0 16 * * *" },
        { "path": "/api/cron/megatravel-sync", "schedule": "0 9 * * *" }
    ]
}
```

### 3.3 Probar Envío de Email
- [ ] Verificar si `SENDGRID_API_KEY` está configurada en las variables de Vercel
- [ ] Si está → enviar email de prueba desde `/api/test-email`
- [ ] Si no → probar con SMTP de Gmail como alternativa temporal para validar que el flujo funciona end-to-end
- [ ] Verificar que los 15 templates rendericen correctamente (no hay errores de variables)

### 3.4 Integrar Templates Faltantes
- [ ] Conectar `sendNewsletterEmail()` a flujo admin
- [ ] Conectar `sendSpecialOfferEmail()` a flujo de promociones
- [ ] Conectar `sendPriceAlertEmail()` a sistema de alertas
- [ ] Conectar `sendDocumentsReadyEmail()` a flujo de documentos

#### Archivos a modificar:
| Archivo | Cambio |
|---------|--------|
| [vercel.json](file:///g:/Otros ordenadores/Mi PC/operadora-dev/vercel.json) | Agregar 2 cron jobs |
| [.env.example](file:///g:/Otros ordenadores/Mi PC/operadora-dev/.env.example) | Agregar RESEND vars, corregir CRON_SECRET |
| `src/lib/emailHelper-new-functions.ts` | [ELIMINAR] |
| [EmailService.ts](file:///g:/Otros ordenadores/Mi PC/operadora-dev/src/services/EmailService.ts) | Evaluar deprecación |

---

## FASE 4 — 🗺️ Tours — Mejoras de Datos y UI

### 4.1 Mejorar Scraping de Ciudades/Países
- [ ] Revisar y debuggear [scrapeCitiesAndCountries](file:///g:/Otros ordenadores/Mi PC/operadora-dev/src/services/MegaTravelScrapingService.ts) (líneas 1014-1210)
- [ ] El usuario reportó que no funciona completamente (v2.324) — diagnosticar qué tours fallan
- [ ] Mejorar regex y fallbacks para cubrir más formatos de HTML de MegaTravel
- [ ] Re-ejecutar `MegaConexionService.updateAllToursFromMegaConexion()` para enriquecer los 325 tours

### 4.2 Corregir Imágenes Genéricas
- [ ] Verificar fix de imágenes genéricas "EUROPA" en tours incorrectos (v2.324)
- [ ] Re-ejecutar admin endpoint `/api/admin/fix-tour-images` para tours afectados
- [ ] Validar que el filtrado por categoría funcione

### 4.3 Decidir Adopción de Tours v2 Sidebar
- [ ] Probar la versión sidebar [page-v2-sidebar.tsx](file:///g:/Otros ordenadores/Mi PC/operadora-dev/src/app/tours/page-v2-sidebar.tsx)
- [ ] Si se aprueba → reemplazar `page.tsx` actual con la versión sidebar
- [ ] Agregar filtros faltantes: regiones, tags, ordenamiento
- [ ] Hacer sidebar colapsable en móvil (importante para PWA)
- [ ] Guardar filtros en URL (query params) para compartir búsquedas

### 4.4 Verificación
- [ ] Probar tour MT-52172 (Brasil y Argentina) — fue el tour de prueba con problemas
- [ ] Verificar que el mapa del tour funcione con fallback Google Maps
- [ ] Verificar que las cotizaciones generen el código AS-XXXXX correctamente

---

## FASE 5 — 🧹 Limpieza Técnica y README

### 5.1 Actualizar README
- [ ] Actualizar versión de v2.174 → v2.343
- [ ] Corregir badge de versión (dice 2.173)
- [ ] Corregir footer de versión (dice 2.82)
- [ ] Cambiar package manager de Bun a npm
- [ ] Agregar módulos faltantes: MegaTravel, CRM, RRHH, White-Label, OAuth, Feature Flags, Civitatis
- [ ] Actualizar métricas: tablas (62), campos (~620), APIs (48+), páginas (18+)
- [ ] Corregir referencias a `.same/` por `docs/`
- [ ] Actualizar URL de BD Neon si cambió

### 5.2 Limpiar Archivos Obsoletos
- [ ] Eliminar [emailHelper-new-functions.ts](file:///g:/Otros ordenadores/Mi PC/operadora-dev/src/lib/emailHelper-new-functions.ts) (duplicado)
- [ ] Evaluar si `page.tsx.backup` y `page-backup-01feb.tsx` en tours son necesarios o eliminar
- [ ] Revisar scripts de debug en raíz (`debug-circuito.html`, `debug-megatravel.html`, `debug-tour.html`) — mover a `scratch/` o eliminar
- [ ] Limpiar scripts de check/fix en raíz (18+ archivos `.js` sueltos) — mover a `scripts/`
- [ ] Actualizar [netlify.toml](file:///g:/Otros ordenadores/Mi PC/operadora-dev/netlify.toml) — todavía dice `bun run build` en vez de `npm run build`

### 5.3 Corregir `.env.example`
- [ ] Agregar `RESEND_API_KEY`, `RESEND_FROM_EMAIL`
- [ ] Corregir `CRON_SECRET_KEY` → `CRON_SECRET`
- [ ] Verificar que todas las variables usadas en código estén documentadas

---

## FASE 6 — 🧪 Testing — Cobertura Crítica

### Estado actual
- **Web:** Solo 2 archivos de test (`EncryptionService`, `sanitization`)
- **Móvil:** 3 archivos de test (`biometric`, `offline`, `share`)
- **Coverage:** ~20% — **Objetivo: 50% mínimo en esta fase**

### 6.1 Tests Prioritarios (Paths Críticos)
- [ ] `TenantService.test.ts` — detección, CRUD, white-label config
- [ ] `CommissionService.test.ts` — cálculo, tiers, split, wallet
- [ ] `AgencyService.test.ts` — agentes, clientes, dashboard stats
- [ ] `emailHelper.test.ts` — renderizado de templates, envío (mock)
- [ ] `CRMService.test.ts` — contactos, pipeline, scoring
- [ ] Auth API routes — login, register, forgot-password, verify-email

### 6.2 Tests de Integración
- [ ] Flujo de cotización: crear → enviar email → generar PDF
- [ ] Flujo de pago: crear booking → webhook Stripe → confirmación
- [ ] Flujo White-Label: detectar tenant → aplicar branding → markup precios

### 6.3 Verificación
- [ ] Ejecutar `npm run test:coverage`
- [ ] Verificar coverage ≥ 50% en servicios críticos

---

## FASE 7 — 👥 RRHH — Data Seeding y Pruebas

### 7.1 Crear Datos de Prueba
- [ ] Script de seeding para las 11 tablas HR con datos realistas MX:
  - 3 departamentos (Ventas, Operaciones, Admin)
  - 10 empleados con RFC, CURP, NSS, CLABE
  - 5 contratos activos (indefinido + plazo fijo)
  - Registros de asistencia (1 semana)
  - 2 solicitudes de ausencia (1 aprobada, 1 pendiente)
  - 1 proceso de reclutamiento activo (pipeline completo)

### 7.2 Ejecutar Plan de Pruebas
- [ ] Seguir guía de pruebas documentada en [AG-Testing-RRHH.md](file:///g:/Otros ordenadores/Mi PC/operadora-dev/docs/AG-Testing-RRHH.md)
- [ ] Verificar RBAC (SUPER_ADMIN/AGENCY_ADMIN/HR_MANAGER acceden, AGENT/CLIENT bloqueados)
- [ ] Verificar cron de alertas HR funcione correctamente

---

## User Review Required

> [!IMPORTANT]
> **Decisiones que necesito del cliente/equipo:**
>
> 1. **PWA vs App Nativa**: ¿Confirmamos que la PWA es la Fase 1 y la app React Native queda para después?
> 2. **Tours v2 Sidebar**: ¿Adoptamos el diseño con sidebar como la versión principal de `/tours`?
> 3. **Proveedor de email**: ¿Usamos SendGrid, Resend, o SMTP directo como proveedor principal?
> 4. **Limpieza de archivos**: ¿Eliminamos los ~20 scripts de debug/check de la raíz del proyecto o los conservamos?
> 5. **Orden de prioridades**: ¿Están de acuerdo con el orden propuesto de las 7 fases?

## Open Questions

> [!WARNING]
> **Preguntas técnicas abiertas:**
>
> 1. Las migraciones 032 y 033 — ¿se ejecutaron en la BD de Neon o están pendientes? Necesito verificar contra la BD.
> 2. La `SENDGRID_API_KEY` — ¿está configurada en las variables de Vercel de producción?
> 3. ¿Hay acceso al panel de Vercel para configurar los cron jobs adicionales?
> 4. ¿Se quiere mantener `netlify.toml` como alternativa de deploy o solo se usa Vercel?

---

## Verificación General

### Automatizada
- `npm run build` — Verificar que compila sin errores
- `npm run test:coverage` — Verificar coverage después de cada fase
- Lighthouse PWA audit ≥ 90 (Fase 1)

### Manual
- Probar White-Label con `?tenant=mmta` en localhost
- Probar envío de email real (cuando se configure proveedor)
- Probar instalación PWA en Android e iOS
- Revisar todos los tours problemáticos (MT-52172, etc.)
