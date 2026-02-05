# 📧 SISTEMA DE CORREOS Y COMUNICACIÓN - AS OPERADORA

**Fecha de Análisis:** 5 de Febrero de 2026  
**Versión del Sistema:** v2.262+  
**Estado:** En Revisión para Implementación Completa

---

## 📋 ÍNDICE

1. [Resumen Ejecutivo](#resumen-ejecutivo)
2. [Estado Actual del Sistema](#estado-actual-del-sistema)
3. [Arquitectura Implementada](#arquitectura-implementada)
4. [Servicios de Correo](#servicios-de-correo)
5. [Centro de Comunicación](#centro-de-comunicación)
6. [Configuración de Proveedores](#configuración-de-proveedores)
7. [Casos de Uso y Triggers](#casos-de-uso-y-triggers)
8. [Plantillas de Correo](#plantillas-de-correo)
9. [Tareas Pendientes](#tareas-pendientes)
10. [Plan de Implementación](#plan-de-implementación)

---

## 🎯 RESUMEN EJECUTIVO

### ¿Qué Tenemos?

✅ **IMPLEMENTADO:**
- Sistema completo de base de datos para comunicación multicanal
- Servicio de Email con Nodemailer (SMTP)
- Servicio de Notificaciones con SendGrid
- Centro de Comunicación (UI completa)
- Trazabilidad completa de mensajes
- Sistema de moderación de mensajes
- Plantillas de correo básicas

⚠️ **PARCIALMENTE IMPLEMENTADO:**
- Configuración SMTP (variables definidas pero no probadas)
- SendGrid configurado pero no integrado completamente
- Templates de correo (básicos, necesitan diseño profesional)

❌ **PENDIENTE:**
- Integración de WhatsApp Business API
- SMS con Twilio
- Correos transaccionales automáticos en todos los flujos
- Templates HTML profesionales con branding
- Pruebas de envío real
- Configuración del dominio asoperadora.com con SiteGround

---

## 📊 ESTADO ACTUAL DEL SISTEMA

### 1. Base de Datos ✅ COMPLETA

**Migración:** `010_communication_center.sql`

**Tablas Implementadas:**

| Tabla | Propósito | Estado |
|-------|-----------|--------|
| `communication_threads` | Hilos de conversación | ✅ Completa |
| `messages` | Mensajes individuales | ✅ Completa |
| `message_deliveries` | Entregas por canal (email, SMS, WhatsApp) | ✅ Completa |
| `message_reads` | Registro de lecturas (evidencia legal) | ✅ Completa |
| `communication_preferences` | Preferencias de usuario | ✅ Completa |
| `message_templates` | Plantillas de mensajes | ✅ Completa |
| `scheduled_messages` | Mensajes programados | ✅ Completa |
| `quick_responses` | Respuestas rápidas | ✅ Completa |
| `communication_settings` | Configuración del sistema | ✅ Completa |
| `message_satisfaction` | Encuestas de satisfacción | ✅ Completa |

**Características de la BD:**
- ✅ Multi-tenancy completo
- ✅ Trazabilidad total (quién, cuándo, dónde)
- ✅ Soporte para múltiples canales
- ✅ Sistema de moderación
- ✅ SLA y tiempos de respuesta
- ✅ Retención de datos (7 años)
- ✅ Triggers automáticos para contadores

### 2. Servicios Backend ✅ IMPLEMENTADOS

#### **EmailService.ts** ✅
**Ubicación:** `src/services/EmailService.ts`

**Funcionalidades:**
- ✅ Configuración SMTP con Nodemailer
- ✅ Método genérico `sendEmail()`
- ✅ `sendBookingConfirmation()` - Confirmación de reserva
- ✅ `sendPaymentConfirmation()` - Confirmación de pago
- ✅ Templates HTML básicos incluidos

**Configuración Actual:**
```typescript
SMTP_HOST=smtp.asoperadora.com (o Gmail/SendGrid)
SMTP_PORT=587
SMTP_USER=noreply@asoperadora.com
SMTP_PASS=[PENDIENTE CONFIGURAR]
```

**Estado:** ⚠️ Configurado pero NO PROBADO

#### **NotificationService.ts** ✅
**Ubicación:** `src/services/NotificationService.ts`

**Funcionalidades:**
- ✅ Integración con SendGrid API
- ✅ `sendBookingConfirmation()`
- ✅ `sendInvoiceEmail()` - Envío de facturas
- ✅ `sendPaymentReminder()` - Recordatorios de pago
- ✅ `sendCancellationEmail()` - Cancelaciones

**Configuración Actual:**
```typescript
SENDGRID_API_KEY=SG.6GFaIE3pSPacUN6kFxFq0Q...
SENDGRID_FROM_EMAIL=noreply@asoperadora.com
```

**Estado:** ✅ Configurado, ⚠️ NO PROBADO

#### **CommunicationService.ts** ✅
**Ubicación:** `src/services/CommunicationService.ts`

**Funcionalidades Completas:**
- ✅ Gestión de hilos de conversación
- ✅ Envío de mensajes con moderación
- ✅ Entrega multicanal (email, SMS, WhatsApp, in-app)
- ✅ Registro de lecturas (evidencia legal)
- ✅ Preferencias de usuario
- ✅ Rate limiting
- ✅ Templates y respuestas rápidas
- ✅ Estadísticas de agentes

**Canales Soportados:**
- ✅ Email (implementado con EmailService)
- ⚠️ SMS (estructura lista, Twilio pendiente)
- ⚠️ WhatsApp (estructura lista, API pendiente)
- ✅ In-App (completo)

### 3. Centro de Comunicación (UI) ✅ COMPLETO

**Ubicación:** `src/app/comunicacion/page.tsx`

**Características:**
- ✅ Interfaz completa de mensajería
- ✅ Lista de hilos con filtros
- ✅ Vista de conversación
- ✅ Envío de mensajes
- ✅ Indicadores de no leídos
- ✅ Estados y prioridades
- ✅ Búsqueda de conversaciones
- ✅ Polling automático (actualización cada 5 seg)

**APIs Implementadas:**
- ✅ `/api/communication/threads` - Gestión de hilos
- ✅ `/api/communication/messages` - Gestión de mensajes
- ✅ `/api/communication/preferences` - Preferencias
- ✅ `/api/communication/templates` - Plantillas
- ✅ `/api/communication/quick-responses` - Respuestas rápidas

---

## 🏗️ ARQUITECTURA IMPLEMENTADA

### Flujo de Comunicación

```
┌─────────────────────────────────────────────────────────────┐
│                    EVENTO TRIGGER                            │
│  (Reserva, Pago, Cambio de Itinerario, etc.)               │
└────────────────────┬────────────────────────────────────────┘
                     │
                     ▼
┌─────────────────────────────────────────────────────────────┐
│              CommunicationService                            │
│  • Crear Thread (si no existe)                             │
│  • Crear Mensaje                                            │
│  • Verificar Moderación                                     │
└────────────────────┬────────────────────────────────────────┘
                     │
                     ▼
┌─────────────────────────────────────────────────────────────┐
│           Obtener Preferencias del Usuario                   │
│  • Canales habilitados (email, SMS, WhatsApp)              │
│  • Horarios (quiet hours)                                   │
│  • Tipos de mensajes aceptados                             │
└────────────────────┬────────────────────────────────────────┘
                     │
                     ▼
┌─────────────────────────────────────────────────────────────┐
│         Crear Registros de Delivery por Canal               │
│  • message_deliveries (email, SMS, WhatsApp, in-app)       │
└────────────────────┬────────────────────────────────────────┘
                     │
         ┌───────────┴───────────┬──────────────┬─────────────┐
         ▼                       ▼              ▼             ▼
    ┌────────┐            ┌──────────┐    ┌──────────┐  ┌────────┐
    │ Email  │            │   SMS    │    │ WhatsApp │  │ In-App │
    │ SMTP/  │            │ Twilio   │    │ Business │  │  DB    │
    │SendGrid│            │ (TODO)   │    │  (TODO)  │  │  ✅    │
    └────┬───┘            └────┬─────┘    └────┬─────┘  └───┬────┘
         │                     │               │            │
         └─────────────────────┴───────────────┴────────────┘
                                 │
                                 ▼
                    ┌────────────────────────┐
                    │ Actualizar Delivery    │
                    │ Status en BD           │
                    │ (sent/delivered/read)  │
                    └────────────────────────┘
                                 │
                                 ▼
                    ┌────────────────────────┐
                    │ Guardar en Centro de   │
                    │ Comunicación           │
                    │ (Evidencia/Historial)  │
                    └────────────────────────┘
```

---

## 📧 SERVICIOS DE CORREO

### Configuración Actual

**Variables de Entorno (.env.local):**
```bash
# SendGrid (Configurado)
SENDGRID_API_KEY=SG.xxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxx
SENDGRID_FROM_EMAIL=noreply@asoperadora.com

# SMTP (NO Configurado)
SMTP_HOST=[PENDIENTE]
SMTP_PORT=587
SMTP_USER=[PENDIENTE]
SMTP_PASS=[PENDIENTE]
```

### Proveedores Disponibles

| Proveedor | Estado | Uso Recomendado |
|-----------|--------|-----------------|
| **SendGrid** | ✅ Configurado | Correos transaccionales |
| **SMTP (SiteGround)** | ⚠️ Pendiente | Correos institucionales |
| **Gmail SMTP** | ⚠️ Alternativa | Desarrollo/Testing |

### Métodos de Envío Implementados

#### 1. EmailService (Nodemailer)

```typescript
// Envío genérico
await emailService.sendEmail({
  to: 'cliente@example.com',
  subject: 'Asunto',
  html: '<h1>Contenido HTML</h1>',
  text: 'Contenido texto plano'
})

// Confirmación de reserva
await emailService.sendBookingConfirmation({
  bookingId: 123,
  customerName: 'Juan Pérez',
  customerEmail: 'juan@example.com',
  serviceName: 'Tour Europa',
  totalPrice: 1500,
  currency: 'USD',
  bookingDate: '2026-03-15',
  details: { pasajeros: 2 }
})

// Confirmación de pago
await emailService.sendPaymentConfirmation(
  bookingId,
  customerEmail,
  amount,
  currency
)
```

#### 2. NotificationService (SendGrid)

```typescript
// Confirmación de reserva
await NotificationService.sendBookingConfirmation(
  email,
  {
    userName: 'Juan Pérez',
    bookingReference: 'BK-12345',
    bookingType: 'flight',
    totalAmount: 1500,
    currency: 'USD',
    details: {...}
  }
)

// Factura
await NotificationService.sendInvoiceEmail(
  email,
  {
    folio: 'FAC-001',
    total: 1500,
    currency: 'MXN',
    pdfUrl: 'https://...',
    xmlUrl: 'https://...'
  }
)

// Recordatorio de pago
await NotificationService.sendPaymentReminder(
  email,
  {
    customerName: 'Juan Pérez',
    amount: 500,
    currency: 'USD',
    dueDate: '2026-03-01',
    accountId: 123
  }
)

// Cancelación
await NotificationService.sendCancellationEmail(
  email,
  bookingReference,
  reason
)
```

---

## 🏢 CENTRO DE COMUNICACIÓN

### Funcionalidades Implementadas

#### 1. Gestión de Hilos (Threads)

**Características:**
- ✅ Crear hilos automáticamente por reserva/cotización
- ✅ Asignar agentes
- ✅ Estados: active, pending_client, pending_agent, closed, escalated
- ✅ Prioridades: low, normal, high, urgent
- ✅ Tags personalizados
- ✅ Referencias a reservas/pagos/itinerarios
- ✅ Contadores de mensajes no leídos
- ✅ SLA y tiempos de respuesta

#### 2. Mensajes

**Características:**
- ✅ Mensajes de texto y HTML
- ✅ Adjuntos (estructura lista)
- ✅ Mensajes internos (notas de staff)
- ✅ Moderación automática
- ✅ Estados: draft, pending, sent, delivered, failed
- ✅ Soft delete (nunca se eliminan)

#### 3. Entregas (Deliveries)

**Canales Soportados:**
- ✅ **Email:** Implementado con SMTP/SendGrid
- ⚠️ **SMS:** Estructura lista, Twilio pendiente
- ⚠️ **WhatsApp:** Estructura lista, API pendiente
- ✅ **In-App:** Completo

**Trazabilidad:**
- ✅ Estado de cada entrega
- ✅ Timestamps: queued, sent, delivered, read, failed
- ✅ Provider ID y respuestas
- ✅ Reintentos automáticos
- ✅ Registro de errores

#### 4. Registro de Lecturas

**Evidencia Legal:**
- ✅ Timestamp de lectura
- ✅ IP address
- ✅ User agent
- ✅ Dispositivo (desktop/mobile/tablet)
- ✅ Geolocalización (opcional)
- ✅ Tiempo de lectura

---

## ⚙️ CONFIGURACIÓN DE PROVEEDORES

### 1. SendGrid (Configurado ✅)

**API Key:** Configurada en `.env.local`  
**From Email:** `noreply@asoperadora.com`

**Próximos Pasos:**
1. ✅ Verificar dominio en SendGrid
2. ⚠️ Configurar SPF/DKIM/DMARC
3. ⚠️ Probar envío real
4. ⚠️ Configurar templates en SendGrid dashboard

### 2. SMTP con SiteGround (Pendiente ⚠️)

**Dominio:** `asoperadora.com`  
**Hosting:** SiteGround

**Configuración Necesaria:**

```bash
SMTP_HOST=mail.asoperadora.com
SMTP_PORT=587 (o 465 para SSL)
SMTP_USER=noreply@asoperadora.com
SMTP_PASS=[CREAR EN SITEGROUND]
```

**Pasos para Configurar:**
1. Acceder a cPanel de SiteGround
2. Crear cuenta de correo: `noreply@asoperadora.com`
3. Obtener credenciales SMTP
4. Configurar SPF record en DNS
5. Probar envío

### 3. Twilio (SMS) - Pendiente ❌

**Para Implementar:**
```bash
TWILIO_ACCOUNT_SID=[OBTENER]
TWILIO_AUTH_TOKEN=[OBTENER]
TWILIO_PHONE_NUMBER=[OBTENER]
```

**Código ya preparado en:**
- `CommunicationService.sendSMS()`

### 4. WhatsApp Business API - Pendiente ❌

**Opciones:**
- Twilio WhatsApp Business
- Meta WhatsApp Business API
- Infobip

**Código ya preparado en:**
- `CommunicationService.sendWhatsApp()`

---

## 🎯 CASOS DE USO Y TRIGGERS

### Correos que DEBEN Enviarse Automáticamente

#### 1. **Reservas (Bookings)**

| Evento | Template | Cuándo | Estado |
|--------|----------|--------|--------|
| Reserva creada | `booking_created` | Al crear reserva | ⚠️ Parcial |
| Reserva confirmada | `booking_confirmed` | Al confirmar pago | ✅ Implementado |
| Reserva modificada | `booking_modified` | Al cambiar detalles | ❌ Pendiente |
| Reserva cancelada | `booking_cancelled` | Al cancelar | ✅ Implementado |
| Recordatorio pre-viaje | `trip_reminder` | 7 días antes | ❌ Pendiente |

#### 2. **Pagos**

| Evento | Template | Cuándo | Estado |
|--------|----------|--------|--------|
| Pago recibido | `payment_confirmed` | Al confirmar pago | ✅ Implementado |
| Pago pendiente | `payment_pending` | Al crear orden | ❌ Pendiente |
| Recordatorio de pago | `payment_reminder` | X días antes | ✅ Implementado |
| Pago rechazado | `payment_failed` | Al fallar pago | ❌ Pendiente |
| Reembolso procesado | `refund_processed` | Al procesar reembolso | ❌ Pendiente |

#### 3. **Cotizaciones (Quotes)**

| Evento | Template | Cuándo | Estado |
|--------|----------|--------|--------|
| Cotización enviada | `quote_sent` | Al generar cotización | ❌ Pendiente |
| Cotización aceptada | `quote_accepted` | Al aceptar | ❌ Pendiente |
| Cotización expirada | `quote_expired` | Al expirar | ❌ Pendiente |
| Recordatorio cotización | `quote_reminder` | 3 días antes de expirar | ❌ Pendiente |

#### 4. **Itinerarios**

| Evento | Template | Cuándo | Estado |
|--------|----------|--------|--------|
| Cambio de vuelo | `itinerary_flight_change` | Al cambiar vuelo | ❌ Pendiente |
| Cambio de hotel | `itinerary_hotel_change` | Al cambiar hotel | ❌ Pendiente |
| Actualización general | `itinerary_updated` | Al actualizar | ❌ Pendiente |
| Envío de documentos | `documents_ready` | Al estar listos | ❌ Pendiente |

#### 5. **Facturación**

| Evento | Template | Cuándo | Estado |
|--------|----------|--------|--------|
| Factura generada | `invoice_generated` | Al generar CFDI | ✅ Implementado |
| Factura cancelada | `invoice_cancelled` | Al cancelar | ❌ Pendiente |

#### 6. **Cuenta de Usuario**

| Evento | Template | Cuándo | Estado |
|--------|----------|--------|--------|
| Bienvenida | `welcome` | Al registrarse | ❌ Pendiente |
| Verificación email | `email_verification` | Al registrarse | ❌ Pendiente |
| Recuperar contraseña | `password_reset` | Al solicitar | ❌ Pendiente |
| Cambio de contraseña | `password_changed` | Al cambiar | ❌ Pendiente |

#### 7. **Notificaciones de Precio**

| Evento | Template | Cuándo | Estado |
|--------|----------|--------|--------|
| Alerta de precio bajo | `price_drop_alert` | Al bajar precio | ❌ Pendiente |
| Oferta especial | `special_offer` | Campaña marketing | ❌ Pendiente |

#### 8. **Soporte y Comunicación**

| Evento | Template | Cuándo | Estado |
|--------|----------|--------|--------|
| Nuevo mensaje | `new_message` | Al recibir mensaje | ⚠️ Parcial |
| Respuesta de agente | `agent_response` | Al responder | ⚠️ Parcial |
| Ticket cerrado | `ticket_closed` | Al cerrar | ❌ Pendiente |
| Encuesta satisfacción | `satisfaction_survey` | Al cerrar ticket | ❌ Pendiente |

---

## 🎨 PLANTILLAS DE CORREO

### Estado Actual

**Templates Básicos Implementados:**
- ✅ Confirmación de reserva
- ✅ Confirmación de pago
- ✅ Factura generada
- ✅ Recordatorio de pago
- ✅ Cancelación

**Diseño Actual:** ⚠️ Básico, necesita mejora

### Elementos que DEBEN Incluir los Templates

#### 1. **Header Institucional**
```html
- Logo de AS Operadora
- Lema: "Experiencias que inspiran"
- Colores corporativos (azul #0066FF)
```

#### 2. **Footer Institucional**
```html
- Nombre completo: AS Operadora de Viajes y Eventos
- Contactos:
  * Email: contacto@asoperadora.com
  * Teléfono: [DEFINIR]
  * WhatsApp: [DEFINIR]
- Redes sociales (si aplica)
- Dirección física (si aplica)
- Aviso de privacidad
- Opción de darse de baja
```

#### 3. **Diseño Responsive**
- ✅ Mobile-first
- ✅ Compatible con todos los clientes de email
- ✅ Imágenes con fallback
- ✅ Texto alternativo

#### 4. **Branding Consistente**
- Colores: Azul (#0066FF), blanco, grises
- Tipografía: Arial, sans-serif
- Espaciado consistente
- Botones de acción claros

### Templates Prioritarios a Crear

#### **Alta Prioridad (Crear AHORA)**

1. **Bienvenida al Registrarse**
   - Mensaje de bienvenida
   - Qué pueden hacer en la plataforma
   - Link a completar perfil
   - Contacto de soporte

2. **Confirmación de Reserva (Mejorar)**
   - Detalles completos de la reserva
   - Itinerario resumido
   - Instrucciones de pago
   - Qué sigue (próximos pasos)
   - Botón: "Ver Mi Reserva"

3. **Confirmación de Pago (Mejorar)**
   - Recibo de pago
   - Método de pago usado
   - Desglose de montos
   - Próximos pagos (si aplica)
   - Botón: "Descargar Recibo"

4. **Cotización Enviada**
   - Resumen de la cotización
   - Precio total
   - Validez de la oferta
   - Botón: "Ver Cotización Completa"
   - Botón: "Aceptar Cotización"

5. **Recordatorio de Pago**
   - Monto pendiente
   - Fecha límite
   - Consecuencias de no pagar
   - Métodos de pago disponibles
   - Botón: "Pagar Ahora"

#### **Media Prioridad**

6. **Cambio en Itinerario**
7. **Documentos Listos**
8. **Recordatorio Pre-Viaje**
9. **Encuesta Post-Viaje**
10. **Recuperar Contraseña**

#### **Baja Prioridad**

11. **Newsletter**
12. **Ofertas Especiales**
13. **Programa de Lealtad**

---

## ✅ TAREAS PENDIENTES

### 🔴 CRÍTICAS (Hacer AHORA)

1. **Configurar SMTP con SiteGround**
   - [ ] Crear cuenta `noreply@asoperadora.com`
   - [ ] Obtener credenciales SMTP
   - [ ] Configurar variables en `.env.local`
   - [ ] Configurar SPF/DKIM en DNS
   - [ ] Probar envío de correo

2. **Crear Templates HTML Profesionales**
   - [ ] Diseñar header institucional
   - [ ] Diseñar footer institucional
   - [ ] Template: Bienvenida
   - [ ] Template: Confirmación de reserva (mejorar)
   - [ ] Template: Confirmación de pago (mejorar)
   - [ ] Template: Cotización enviada
   - [ ] Template: Recordatorio de pago (mejorar)

3. **Probar Sistema de Correos**
   - [ ] Envío de correo de prueba con SMTP
   - [ ] Envío de correo de prueba con SendGrid
   - [ ] Verificar recepción en diferentes clientes
   - [ ] Verificar diseño responsive
   - [ ] Verificar que no caigan en spam

4. **Integrar Correos en Flujos Principales**
   - [ ] Al crear reserva → Enviar confirmación
   - [ ] Al confirmar pago → Enviar recibo
   - [ ] Al generar cotización → Enviar cotización
   - [ ] Al registrarse → Enviar bienvenida
   - [ ] Al cambiar itinerario → Enviar notificación

### 🟡 IMPORTANTES (Próximas 2 Semanas)

5. **Guardar Correos en Centro de Comunicación**
   - [ ] Al enviar correo, crear thread automáticamente
   - [ ] Guardar mensaje en `messages`
   - [ ] Guardar delivery en `message_deliveries`
   - [ ] Actualizar estado al confirmar entrega

6. **Dashboard de Correos (Admin)**
   - [ ] Ver todos los correos enviados
   - [ ] Filtrar por tipo, fecha, destinatario
   - [ ] Ver tasa de apertura (si es posible)
   - [ ] Ver errores de envío
   - [ ] Reenviar correos fallidos

7. **Sistema de Reintentos**
   - [ ] Configurar reintentos automáticos
   - [ ] Notificar a admin si falla después de X intentos
   - [ ] Log de errores detallado

8. **Preferencias de Usuario**
   - [ ] UI para que usuario configure preferencias
   - [ ] Opción de darse de baja de emails promocionales
   - [ ] Horarios de "no molestar"
   - [ ] Canales preferidos

### 🟢 DESEABLES (Futuro)

9. **WhatsApp Business**
   - [ ] Investigar proveedores (Twilio, Meta, Infobip)
   - [ ] Obtener número de WhatsApp Business
   - [ ] Configurar API
   - [ ] Integrar con `CommunicationService.sendWhatsApp()`
   - [ ] Crear templates de WhatsApp

10. **SMS con Twilio**
    - [ ] Crear cuenta Twilio
    - [ ] Obtener número
    - [ ] Configurar API
    - [ ] Integrar con `CommunicationService.sendSMS()`

11. **Mensajes Programados**
    - [ ] Cron job para procesar `scheduled_messages`
    - [ ] UI para programar mensajes
    - [ ] Recordatorios automáticos

12. **Analytics de Correos**
    - [ ] Tasa de apertura
    - [ ] Tasa de clics
    - [ ] Conversiones
    - [ ] Mejores horarios de envío

---

## 📅 PLAN DE IMPLEMENTACIÓN

### **FASE 1: Fundamentos (Esta Semana)**

**Objetivo:** Tener correos funcionando en producción

**Tareas:**
1. Configurar SMTP con SiteGround (2 horas)
2. Probar envío de correos (1 hora)
3. Crear template base HTML (3 horas)
4. Crear 3 templates prioritarios:
   - Bienvenida (2 horas)
   - Confirmación de reserva mejorada (2 horas)
   - Confirmación de pago mejorada (2 horas)

**Total:** ~12 horas

### **FASE 2: Integración (Próxima Semana)**

**Objetivo:** Correos automáticos en todos los flujos

**Tareas:**
1. Integrar correo de bienvenida al registrarse (1 hora)
2. Integrar confirmación de reserva (2 horas)
3. Integrar confirmación de pago (2 horas)
4. Integrar cotizaciones (3 horas)
5. Guardar todos los correos en Centro de Comunicación (4 horas)

**Total:** ~12 horas

### **FASE 3: Centro de Comunicación (Semana 3)**

**Objetivo:** Trazabilidad completa y evidencia

**Tareas:**
1. Dashboard de correos enviados (4 horas)
2. Sistema de reintentos (3 horas)
3. Notificaciones de errores (2 horas)
4. UI de preferencias de usuario (3 horas)

**Total:** ~12 horas

### **FASE 4: Canales Adicionales (Semana 4)**

**Objetivo:** WhatsApp y SMS

**Tareas:**
1. Investigar y contratar WhatsApp Business (4 horas)
2. Integrar WhatsApp API (6 horas)
3. Crear templates de WhatsApp (2 horas)
4. (Opcional) Integrar SMS con Twilio (4 horas)

**Total:** ~16 horas

### **FASE 5: Optimización (Mes 2)**

**Objetivo:** Analytics y mejora continua

**Tareas:**
1. Implementar tracking de aperturas (4 horas)
2. A/B testing de templates (6 horas)
3. Mensajes programados y automatizaciones (6 horas)
4. Encuestas de satisfacción (4 horas)

**Total:** ~20 horas

---

## 📝 NOTAS IMPORTANTES

### Cumplimiento Legal

✅ **Retención de Datos:** 7 años configurados en BD  
✅ **Evidencia de Envío:** Timestamps completos  
✅ **Evidencia de Lectura:** IP, user agent, geolocalización  
⚠️ **Aviso de Privacidad:** Incluir en footer de correos  
⚠️ **Opción de Baja:** Implementar unsubscribe  

### Mejores Prácticas

1. **Nunca eliminar mensajes:** Soft delete solamente
2. **Siempre guardar en Centro de Comunicación:** Evidencia legal
3. **Respetar preferencias:** Horarios, canales, tipos
4. **Rate limiting:** No saturar a usuarios
5. **Reintentos inteligentes:** Exponential backoff
6. **Monitoreo:** Alertas si tasa de error > 5%

### Contactos y Credenciales

**SiteGround:**
- Panel: [URL del cPanel]
- Usuario: [DEFINIR]
- Contraseña: [DEFINIR]

**SendGrid:**
- Dashboard: https://app.sendgrid.com
- API Key: Configurada en `.env.local`

**Dominio:**
- asoperadora.com
- DNS: Configurar SPF, DKIM, DMARC

---

## 🎯 RESUMEN DE PRÓXIMOS PASOS

### Para el Usuario (Sergio)

**Mientras revisas y defines los correos:**

1. **Listar TODOS los correos necesarios**
   - Por cada flujo del sistema
   - Qué debe contener cada uno
   - Cuándo se debe enviar

2. **Definir contactos institucionales**
   - Email de contacto
   - Teléfono
   - WhatsApp
   - Dirección física (si aplica)

3. **Acceso a SiteGround**
   - Proporcionar credenciales de cPanel
   - O crear cuenta de correo `noreply@asoperadora.com`

### Para el Asistente (Yo)

**Mientras tanto:**

1. **Crear templates HTML base**
   - Header institucional
   - Footer institucional
   - Estructura responsive

2. **Preparar sistema de integración**
   - Hooks en los flujos principales
   - Función genérica de envío + guardado

3. **Documentar todo**
   - Guía de uso
   - Ejemplos de código
   - Troubleshooting

---

## 📞 CONTACTO Y SOPORTE

**Documentación Relacionada:**
- `AG-Contexto-Proyecto.md` - Contexto general
- `AG-Historico-Cambios.md` - Historial de versiones
- Migración: `migrations/010_communication_center.sql`

**Servicios:**
- `src/services/EmailService.ts`
- `src/services/NotificationService.ts`
- `src/services/CommunicationService.ts`

**UI:**
- `src/app/comunicacion/page.tsx`

**APIs:**
- `src/app/api/communication/*`

---

**Última Actualización:** 5 de Febrero de 2026, 10:32 AM  
**Próxima Revisión:** Después de implementar Fase 1
