# 🌎 AS OPERADORA — Sistema de Gestión de Viajes y Eventos

**Última actualización:** 28 de Mayo de 2026  
**Versión:** v2.344  
**Actualizado por:** Equipo Antigravity + Amadeus Group

![Version](https://img.shields.io/badge/version-2.344-blue.svg)
![Production](https://img.shields.io/badge/live-app.asoperadora.com-success.svg)
![Status](https://img.shields.io/badge/status-production--live-green.svg)
![Deploy](https://img.shields.io/badge/deploy-vercel-brightgreen.svg)
![PWA](https://img.shields.io/badge/PWA-ready-blueviolet.svg)
![Multi--Tenant](https://img.shields.io/badge/multi--tenant-white--label-orange.svg)

> **Plataforma SaaS multi-tenant de gestión de viajes con CRM, RRHH, tours MegaTravel, sistema de comisiones, PWA y arquitectura White-Label.**

---

## 🔗 Enlaces Rápidos

| Servicio | URL | Descripción |
|----------|-----|-------------|
| 🌐 **Producción** | [app.asoperadora.com](https://app.asoperadora.com) | Aplicación en vivo (Vercel) |
| 🏷️ **White-Label** | [mmta.app.asoperadora.com](https://mmta.app.asoperadora.com) | Tenant M&M Travel Agency |
| 💻 **Desarrollo** | [localhost:3000](http://localhost:3000) | Entorno local |
| 📂 **Repositorio** | [GitHub](https://github.com/sergioaguilargranados-ai/operadora-dev) | Código fuente |
| 🗄️ **Base de datos** | Neon PostgreSQL | Serverless con branching |

**🚀 Flujo:** Código → GitHub → Vercel (auto-deploy) → app.asoperadora.com

---

## 📋 Tabla de Contenidos

- [Arquitectura](#-arquitectura)
- [Módulos del Sistema](#-módulos-del-sistema)
- [Tecnologías](#-tecnologías)
- [Instalación](#-instalación-rápida)
- [Configuración](#-configuración)
- [Estructura del Proyecto](#-estructura-del-proyecto)
- [API Documentation](#-api-documentation)
- [Testing](#-testing)
- [Deployment](#-deployment)
- [Documentación Técnica](#-documentación-técnica)

---

## 🏗 Arquitectura

```
┌─────────────────────────────────────────────────────┐
│                   FRONTEND (Next.js 15)              │
│  ┌──────────┐ ┌──────────┐ ┌──────────┐ ┌────────┐ │
│  │Dashboard │ │  Tours   │ │   CRM    │ │  RRHH  │ │
│  │Corporate │ │ Catálogo │ │ Clientes │ │Empleado│ │
│  └──────────┘ └──────────┘ └──────────┘ └────────┘ │
├─────────────────────────────────────────────────────┤
│           MIDDLEWARE (Edge — Tenant Detection)       │
├─────────────────────────────────────────────────────┤
│                API ROUTES (Next.js App Router)       │
│  ┌─────────┐ ┌──────────┐ ┌──────────┐ ┌────────┐ │
│  │  Auth   │ │ Bookings │ │ Payments │ │  Cron  │ │
│  │Google+  │ │ Quotes   │ │Stripe/PP │ │ Jobs   │ │
│  └─────────┘ └──────────┘ └──────────┘ └────────┘ │
├─────────────────────────────────────────────────────┤
│              SERVICES (42 servicios)                 │
│  TenantService • CRMService • HRService • etc.     │
├─────────────────────────────────────────────────────┤
│              DATABASE (Neon PostgreSQL)              │
│  60+ tablas • Multi-tenant • Row-level isolation    │
└─────────────────────────────────────────────────────┘
```

### Multi-Tenant / White-Label
- **Detección automática** por `custom_domain` o slug del `company_name`
- **Personalización**: colores, logo, favicon, slogan, markup de precios
- **Contexto**: `WhiteLabelContext` → inyecta branding al frontend
- **Aislamiento**: `tenant_id` en todas las tablas de datos

---

## ✨ Módulos del Sistema

### 🏢 Corporativo (100%)
- Dashboard con KPIs en tiempo real
- Workflow de aprobaciones multi-nivel
- Gestión de empleados y departamentos
- Políticas de viaje configurables
- Reportes y exportación Excel/PDF

### 🗺️ Tours MegaTravel (100%)
- **325 paquetes** sincronizados vía scraping
- Itinerarios completos (scraping Cheerio + Puppeteer)
- Catálogo con sidebar de filtros (país, ciudad, precio, duración, región)
- Detalle con itinerario día a día, includes, galería
- Cotización vía WhatsApp/email
- Sincronización automática vía cron (`/api/cron/megatravel-sync`)

### 📧 Centro de Comunicación (100%)
- **14 templates HTML** de email (bienvenida, reserva, pago, etc.)
- **3 proveedores** con fallback: Resend → SendGrid → SMTP
- 3 cron jobs: recordatorios cotización, pre-viaje, encuesta post-viaje
- Registro en `message_deliveries` (Centro de Comunicación)

### 🏷️ White-Label / Multi-Empresa (100%)
- Tenant AS Operadora (corporate) + M&M Travel Agency (agency)
- `white_label_config`: colores, markup, meta tags, soporte
- Sistema de comisiones por agencia
- Solicitudes de agencia (`agency_applications`)
- Dashboard de agencia y dashboard de agente

### 👥 CRM (95%)
- Pipeline de leads con etapas Kanban
- Seguimiento de actividades y tareas
- Campañas de marketing
- Métricas y reportes
- IA predictiva y scoring
- Integraciones WhatsApp/SMS

### 👨‍💼 RRHH (90%)
- Directorio de empleados multi-tipo (administrativo, agente, guía)
- Contratos laborales con vencimiento
- Solicitudes de ausencia/vacaciones
- Documentos de empleado con alertas de vencimiento
- Licencias de agente con seguimiento
- Cron de alertas automáticas (`/api/cron/hr-alerts`)

### 💳 Pagos (90%)
- Stripe (tarjetas crédito/débito)
- PayPal
- MercadoPago
- Webhooks automáticos
- Dashboard de transacciones

### 🔐 Seguridad (95%)
- Encriptación AES-256
- JWT + Google OAuth + One-Tap
- Rate limiting por IP
- CORS + CSP + HSTS
- Sanitización de inputs
- Audit logs completos

### 📱 PWA (100% infraestructura)
- `manifest.json` con shortcuts y iconos
- Service Worker con estrategias Network-First / Cache-First
- Componentes: `InstallPrompt`, `OfflineIndicator`
- Página `/offline` para uso sin conexión
- Meta tags iOS (apple-touch-icon, status-bar)

### 📄 Documentos (90%)
- Upload seguro a Vercel Blob
- URLs firmadas con expiración
- Soporte: JPG, PNG, WEBP, PDF
- Documentos de clientes y empleados

---

## 🛠 Tecnologías

### Frontend
| Tecnología | Uso |
|---|---|
| Next.js 15 | App Router, SSR, Edge |
| React 18 | UI Library |
| TypeScript | Type Safety |
| Tailwind CSS | Styling |
| shadcn/ui | UI Components |
| Framer Motion | Animaciones |
| Recharts | Gráficas y analytics |

### Backend
| Tecnología | Uso |
|---|---|
| Next.js API Routes | RESTful APIs |
| PostgreSQL (Neon) | Base de datos serverless |
| Edge Runtime | Middleware tenant detection |

### Integraciones
| Servicio | Uso |
|---|---|
| Stripe | Pagos con tarjeta |
| PayPal | Pagos alternativos |
| MercadoPago | Pagos LATAM |
| Resend / SendGrid | Emails transaccionales |
| Vercel Blob | Almacenamiento documentos |
| Google OAuth | Autenticación social |
| MegaTravel | Catálogo de tours (scraping) |
| Civitatis | Tours opcionales |
| Facturama | Facturación electrónica (preparado) |

---

## 🚀 Instalación Rápida

### Requisitos Previos
- Node.js 18.17+
- npm 9+ (o bun)
- PostgreSQL (Neon recomendado)
- Git

### Paso 1: Clonar
```bash
git clone https://github.com/sergioaguilargranados-ai/operadora-dev.git
cd operadora-dev
```

### Paso 2: Instalar Dependencias
```bash
npm install
```

### Paso 3: Configurar Variables
```bash
cp .env.example .env.local
# Editar .env.local con tus credenciales
```

### Paso 4: Ejecutar Migraciones
```bash
# Las migraciones están en migrations/ (001 a 043)
node scripts/ejecutar-migraciones.js
```

### Paso 5: Iniciar
```bash
npm run dev
```

Abre [http://localhost:3000](http://localhost:3000) 🎉

---

## ⚙️ Configuración

### Variables Críticas (`.env.local`)

```bash
# Base de Datos (OBLIGATORIO)
DATABASE_URL=postgresql://...

# Autenticación (OBLIGATORIO)
JWT_SECRET=...
NEXTAUTH_SECRET=...
GOOGLE_CLIENT_ID=...
GOOGLE_CLIENT_SECRET=...

# Pagos
STRIPE_SECRET_KEY=sk_...
NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY=pk_...

# Emails
RESEND_API_KEY=re_...           # Opción 1 (recomendada)
SENDGRID_API_KEY=SG....         # Opción 2
SMTP_HOST=mail.asoperadora.com  # Opción 3

# Almacenamiento
BLOB_READ_WRITE_TOKEN=vercel_blob_rw_...

# Cron Jobs
CRON_SECRET=...
```

Ver `.env.example` para la lista completa (~180 variables documentadas).

---

## 📁 Estructura del Proyecto

```
operadora-dev/
├── docs/                        # Documentación AG- (contexto, histórico, integraciones)
├── migrations/                  # 43 migraciones SQL
├── scripts/                     # Scripts de utilidad y diagnóstico
├── public/                      # Assets estáticos + PWA (manifest, sw.js, iconos)
├── src/
│   ├── app/                     # Next.js App Router
│   │   ├── api/                # ~50 endpoints API
│   │   │   ├── auth/           # Login, registro, Google OAuth
│   │   │   ├── cron/           # hr-alerts, email-reminders, megatravel-sync
│   │   │   ├── payments/       # Stripe, PayPal, MercadoPago
│   │   │   ├── tenant/         # Detección y config de tenant
│   │   │   └── tours/          # Quotes de tours
│   │   ├── dashboard/          # Corporate, Agency, Agent dashboards
│   │   ├── tours/              # Catálogo de tours con sidebar
│   │   ├── tours/[code]/       # Detalle de tour
│   │   ├── crm/                # Pipeline, clientes, campañas
│   │   ├── rrhh/               # Módulo de recursos humanos
│   │   └── offline/            # Página PWA offline
│   ├── components/              # ~40 componentes React
│   │   ├── ui/                 # shadcn/ui base
│   │   └── pwa/                # PWA components
│   ├── contexts/                # AuthContext, WhiteLabelContext
│   ├── cron/                    # Lógica de cron jobs
│   ├── lib/                     # Helpers (db, emailHelper, auth)
│   ├── services/                # 42 servicios de negocio
│   │   ├── TenantService.ts
│   │   ├── CRMService.ts
│   │   ├── HRService.ts
│   │   ├── MegaTravelScrapingService.ts
│   │   ├── MegaTravelSyncService.ts
│   │   └── ... (42 total)
│   └── templates/email/         # 15 templates HTML de email
├── tests/                       # Tests unitarios (Vitest)
├── operadora-mobile/            # App móvil Expo/React Native (stand-by)
├── .env.example                 # ~180 variables documentadas
├── vercel.json                  # Config deploy + 3 cron jobs
└── package.json
```

---

## 📚 API Documentation

### Autenticación
```
POST /api/auth/login
POST /api/auth/register
POST /api/auth/google          # OAuth + One-Tap
GET  /api/auth/me
```

### Tours
```
GET  /api/groups               # Catálogo de tours (con filtros)
GET  /api/tours/packages       # Paquetes (formato sidebar)
POST /api/tours/quote          # Crear cotización
```

### CRM
```
GET  /api/crm/leads
POST /api/crm/leads
GET  /api/crm/pipeline
GET  /api/crm/campaigns
```

### RRHH
```
GET  /api/rrhh/employees
POST /api/rrhh/employees
GET  /api/rrhh/contracts
GET  /api/rrhh/leaves
```

### Pagos
```
POST /api/payments/stripe/create-payment-intent
POST /api/payments/paypal/create-order
GET  /api/payments
```

### Tenant / White-Label
```
POST /api/tenant/detect
GET  /api/tenant/config
```

### Cron Jobs
```
GET  /api/cron/email-reminders     # Diario 10:00 AM CST
GET  /api/cron/megatravel-sync     # Diario 3:00 AM CST
GET  /api/cron/hr-alerts           # Diario 9:00 AM CST
```

---

## 🧪 Testing

```bash
# Ejecutar tests
npm test

# Con coverage
npm run test:coverage

# Solo una vez
npm run test:run
```

### Tests Disponibles
- ✅ EncryptionService
- ✅ Sanitization utilities
- ✅ WhiteLabel E2E (24 tests via scripts)
- ✅ Email system verification
- ✅ Tours data integrity

---

## 🚢 Deployment

### Vercel (Producción)

```bash
# Automático vía GitHub push
git push origin main
# → Vercel detecta cambio → Build → Deploy → app.asoperadora.com
```

### Variables en Vercel
Configurar en Vercel → Settings → Environment Variables todas las variables de `.env.example`.

### Cron Jobs
Definidos en `vercel.json`:
- `email-reminders`: 0 16 * * * (10:00 AM CST)
- `megatravel-sync`: 0 9 * * * (3:00 AM CST)
- `hr-alerts`: 0 15 * * * (9:00 AM CST)

---

## 📖 Documentación Técnica

Todos los documentos técnicos están en `docs/` con prefijo `AG-`:

| Documento | Contenido |
|---|---|
| `AG-Contexto-Proyecto.md` | Visión general, arquitectura, estado |
| `AG-Historico-Cambios.md` | Control de versiones detallado |
| `AG-Informe-Multi-Empresa-MarcaBlanca.md` | Arquitectura White-Label |
| `AG-Centro-Comunicacion-Omnicanal-COMPLETO.md` | Sistema de emails y mensajería |
| `AG-Implementacion-Scraping-Completo-v2.262.md` | Scraping MegaTravel |
| `AG-Analisis-Funcional-Movil-260118.md` | Plan de app móvil |
| `AG-Testing-RRHH.md` | Plan de pruebas RRHH |

---

## 📊 Estado del Proyecto — v2.344

| Módulo | Progreso | Estado |
|--------|----------|--------|
| Sistema Corporativo | 100% | ✅ Completo |
| Tours MegaTravel | 100% | ✅ 325 paquetes |
| White-Label | 100% | ✅ Multi-tenant |
| Emails | 100% | ✅ 14 templates |
| PWA | 100% | ✅ Infraestructura |
| CRM | 95% | ✅ Funcional |
| Seguridad | 95% | ✅ Funcional |
| RRHH | 90% | ✅ Funcional |
| Pagos | 90% | ✅ Funcional |
| Documentos | 90% | ✅ Funcional |
| App Móvil | 10% | ⏳ Stand-by (PWA activa) |
| Testing | 25% | ⏳ En progreso |

### Métricas
- **Líneas de código:** ~80,000+
- **Servicios:** 42
- **APIs:** ~50 endpoints
- **Templates email:** 14 + base
- **Migraciones:** 43
- **Tablas BD:** 60+

---

## 📝 Licencia

Proyecto privado — Propiedad de AS Operadora de Viajes.

---

## 📞 Soporte

- **Documentación:** `docs/` (prefijo AG-)
- **Email:** support@asoperadora.com
- **WhatsApp:** +52 720 815 6804

---

**Hecho con ❤️ por el equipo de AS Operadora**  
**Última actualización:** Mayo 28, 2026 | **Versión:** v2.344
