# AG-sesion-260605-PWA-APIs-Local

**Fecha:** 05 de Junio de 2026 - 18:03 CST  
**Versión al cerrar:** v2.344  
**Equipo:** Lenovo (c:\operadora-dev)  
**Estado:** ✅ Configuración local lista — Servidor corriendo

---

## ✅ Lo que se hizo esta sesión

- Revisión completa de la documentación en `docs/`: contexto del proyecto, histórico de cambios (hasta v2.344), plan de acción Mayo 2026 (7 fases), plan de integración de APIs (v2.342)
- Identificadas las **3 nuevas APIs integradas en código** (Duffel, Hotelbeds, RateHawk) que NO tenían sus variables en `.env.local`
- Actualizado y corregido `.env.local` para desarrollo local:
  - `NODE_ENV=development` (estaba en `production` — causaría problemas locales)
  - `NEXT_PUBLIC_APP_URL=http://localhost:3000` (estaba apuntando a producción)
  - `CRON_SECRET` + `CRON_SECRET_KEY` (el código usa ambos nombres, ahora ambos están)
  - Variables agregadas: `DUFFEL_ACCESS_TOKEN`, `HOTELBEDS_API_KEY/SECRET/ENV`, `RATEHAWK_API_KEY/KEY_ID`
  - Variables VAPID para Web Push PWA **generadas y configuradas** ✅
  - `ENCRYPTION_SECRET_KEY`, `BLOB_READ_WRITE_TOKEN`
- Creada carpeta `chats/` con guía de uso para trabajo multi-equipo
- Servidor local levantado y verificado: **http://localhost:3000** ✅

---

## 📁 Archivos Modificados Esta Sesión

- `.env.local` — Corregido y completado para desarrollo local
- `chats/AG-COMO-USAR-ESTA-CARPETA.md` — [NUEVO] Guía de uso
- `chats/AG-sesion-260605-PWA-APIs-Local.md` — [NUEVO] Este archivo

---

## ⏭️ Próximos Pasos (continuar aquí)

La siguiente sesión debe seguir el **Plan de Acción Mayo 2026** en este orden:

### 🔴 FASE 1 — PWA (Prioridad Máxima)
**Objetivo:** Convertir la app en instalable en móviles Android e iOS

1. **Manifest PWA** — crear `public/manifest.json` con branding AS Operadora
2. **Iconos PWA** — generar set 192x192, 512x512, maskable
3. **Service Worker** — instalar `@serwist/next` (recomendado sobre `next-pwa`)
4. **Layout** — agregar meta tags PWA en `src/app/layout.tsx`
5. **Componentes PWA:**
   - `src/components/pwa/InstallPrompt.tsx` — banner "Agregar a pantalla de inicio"
   - `src/components/pwa/OfflineIndicator.tsx` — indicador sin conexión
   - `src/app/offline/page.tsx` — página offline
6. **next.config.js** — configurar plugin PWA
7. **Verificar:** Lighthouse PWA score ≥ 90, instalar en Android y iOS

### 🔴 FASE 2 — White-Label (cuando terminemos PWA)
- Corregir `agencyId = 2` hardcodeado en `src/app/dashboard/agency/page.tsx`
- Agregar markup fields a `/api/tenant/detect`
- Verificar migraciones 032 y 033 en Neon

### 🟡 FASE 3 — Integración APIs (cuando lleguen las credenciales)
Credenciales pendientes de obtener:
- `DUFFEL_ACCESS_TOKEN` → https://app.duffel.com/ → Settings → Access tokens
- `HOTELBEDS_API_KEY` + `HOTELBEDS_SECRET` → https://developer.hotelbeds.com/
- `RATEHAWK_API_KEY` + `RATEHAWK_KEY_ID` → https://www.ratehawk.com/

---

## ⚠️ Pendientes / Bloqueadores

| Item | Bloqueador | Acción |
|------|-----------|--------|
| Duffel vuelos | Falta `DUFFEL_ACCESS_TOKEN` | Crear cuenta en app.duffel.com |
| Hotelbeds hoteles | Faltan `HOTELBEDS_API_KEY` y `SECRET` | Portal developer.hotelbeds.com |
| RateHawk hoteles | Faltan `RATEHAWK_API_KEY` y `KEY_ID` | Contactar ratehawk.com B2B |
| Emails producción | `SENDGRID_API_KEY` no verificada en Vercel | Revisar panel Vercel → Environment vars |
| Cron jobs | Solo `hr-alerts` en `vercel.json`, faltan 2 | Agregar `email-reminders` y `megatravel-sync` |

---

## 🔧 Comandos para Retomar

```bash
# 1. Entrar al proyecto
cd c:\operadora-dev

# 2. Asegurarse de tener últimos cambios
git pull origin main

# 3. Iniciar servidor local
npm run dev

# 4. Verificar que el .env.local está correcto
node -e "require('dotenv').config({path:'.env.local'}); console.log('NODE_ENV:', process.env.NODE_ENV); console.log('APP_URL:', process.env.NEXT_PUBLIC_APP_URL)"
```

**URL local:** http://localhost:3000  
**Credenciales de prueba:** cualquier email de la tabla → `Password123!`

---

## 🗒️ Contexto del Sistema de Versiones

- **Formato:** `v2.XXX` (ej: v2.345)
- **Zona horaria:** CST (Ciudad de México, UTC-6)
- **Repositorio:** `operadora-dev` en GitHub → auto-deploy a Vercel
- **BD:** Neon PostgreSQL — misma BD para local y producción
- **Versión en footer:** se actualiza con `node scripts/update-version.js v2.XXX`

---

## 📂 Archivos Clave del Proyecto

| Archivo | Propósito |
|---------|-----------|
| `docs/AG-Contexto-Proyecto.md` | Fuente de verdad del proyecto |
| `docs/AG-Historico-Cambios.md` | Bitácora de versiones |
| `docs/AG-Plan-Accion-Retoma-Mayo2026.md` | Plan de 7 fases activo |
| `docs/AG-Plan-Integracion-APIs-260603.md` | Arquitectura Duffel/Hotelbeds/RateHawk |
| `.env.local` | Variables de entorno locales (NO en Git) |
| `chats/` | Resúmenes de sesiones (esta carpeta) |
