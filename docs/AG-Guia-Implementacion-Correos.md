# 📧 TEMPLATES DE CORREO CREADOS - GUÍA DE IMPLEMENTACIÓN

**Fecha:** 5 de Febrero de 2026  
**Estado:** Templates creados, pendiente configuración SMTP

---

## ✅ LO QUE YA ESTÁ HECHO

### 1. **Template Base Profesional** ✅

**Archivo:** `src/templates/email/base-template.html`

**Características:**
- ✅ Header con logo y lema "Experiencias que inspiran"
- ✅ Diseño responsive (mobile-first)
- ✅ Colores corporativos (#0066FF)
- ✅ Footer institucional completo con:
  - Email: contacto@asoperadora.com
  - Teléfono: +52 720 815 6804
  - WhatsApp: 720 815 6804
  - Aviso de privacidad
  - Opción de cancelar suscripción
- ✅ Compatible con todos los clientes de email
- ✅ Diseño premium y profesional

### 2. **Templates Específicos Creados** ✅

#### **A. Bienvenida** (`welcome.html`)
- Para nuevos usuarios al registrarse
- Explica qué pueden hacer en la plataforma
- Botón de acción: "Comenzar a Explorar"

#### **B. Confirmación de Reserva** (`booking-confirmed.html`)
- Número de reserva destacado
- Detalles completos del servicio
- Total pagado
- Próximos pasos (lista de acciones)
- Botones: "Ver Detalles" y "Todas Mis Reservas"

#### **C. Confirmación de Pago** (`payment-confirmed.html`)
- Monto pagado destacado
- Detalles de la transacción
- Método de pago
- Saldo pendiente (si aplica)
- Opción de solicitar factura

#### **D. Cotización Enviada** (`quote-sent.html`)
- Número de cotización
- Detalles del viaje
- Precio total y por persona
- Lo que incluye
- Plan de pagos (si aplica)
- Fecha de expiración
- Botones: "Aceptar Cotización" y "Ver Detalles"

### 3. **Servicio de Templates** ✅

**Archivo:** `src/services/EmailTemplateService.ts`

**Funcionalidades:**
- ✅ Renderiza templates combinando base + contenido
- ✅ Reemplaza variables {{VARIABLE}}
- ✅ Maneja condicionales {{#if}}...{{/if}}
- ✅ Maneja loops {{#each}}...{{/each}}
- ✅ Formatea moneda y fechas
- ✅ Métodos específicos para cada tipo de correo

**Métodos Disponibles:**
```typescript
// Bienvenida
EmailTemplateService.renderWelcome({
  customerName: 'Juan Pérez',
  email: 'juan@example.com'
})

// Confirmación de reserva
EmailTemplateService.renderBookingConfirmed({
  customerName: 'Juan Pérez',
  email: 'juan@example.com',
  bookingId: 123,
  serviceName: 'Tour Europa 10 días',
  bookingDate: '2026-02-05',
  travelDate: '2026-03-15',
  passengers: 2,
  destination: 'Europa',
  totalPrice: 2500,
  currency: 'USD'
})

// Confirmación de pago
EmailTemplateService.renderPaymentConfirmed({
  customerName: 'Juan Pérez',
  email: 'juan@example.com',
  bookingId: 123,
  amount: 1250,
  currency: 'USD',
  paymentDate: '2026-02-05',
  paymentMethod: 'Tarjeta de Crédito',
  transactionId: 'TXN-123456',
  serviceName: 'Tour Europa',
  remainingBalance: 1250,
  dueDate: '2026-03-01'
})

// Cotización
EmailTemplateService.renderQuoteSent({
  customerName: 'Juan Pérez',
  email: 'juan@example.com',
  quoteId: 'QT-2026-001',
  destination: 'París, Francia',
  travelDates: '15-25 Marzo 2026',
  duration: '10 días / 9 noches',
  passengers: 2,
  inclusions: ['Vuelos', 'Hotel 4*', 'Desayunos', 'Tours'],
  totalPrice: 2500,
  pricePerPerson: 1250,
  currency: 'USD',
  expiryDate: '15 de Febrero de 2026'
})
```

---

## ⚙️ CONFIGURACIÓN SMTP DE SITEGROUND

### Pasos para Configurar

#### 1. **Crear Cuenta de Correo en SiteGround**

1. Accede a tu cPanel de SiteGround
2. Ve a "Email Accounts" (Cuentas de Correo)
3. Crea una nueva cuenta:
   - **Email:** `noreply@asoperadora.com`
   - **Contraseña:** [Genera una segura]
   - **Cuota:** 250 MB (suficiente)

#### 2. **Obtener Configuración SMTP**

En SiteGround, la configuración SMTP suele ser:

```
SMTP_HOST=mail.asoperadora.com
SMTP_PORT=587 (o 465 para SSL)
SMTP_USER=noreply@asoperadora.com
SMTP_PASS=[LA CONTRASEÑA QUE CREASTE]
```

**Alternativa (si mail.asoperadora.com no funciona):**
```
SMTP_HOST=smtp.siteground.com
```

#### 3. **Actualizar `.env.local`**

Agrega estas variables al archivo `.env.local`:

```bash
# SMTP Configuration (SiteGround)
SMTP_HOST=mail.asoperadora.com
SMTP_PORT=587
SMTP_USER=noreply@asoperadora.com
SMTP_PASS=TU_CONTRASEÑA_AQUI
```

#### 4. **Configurar SPF Record (Importante para no caer en spam)**

En el DNS de tu dominio (SiteGround DNS Zone Editor):

Agrega un registro TXT:
```
Nombre: @
Valor: v=spf1 include:_spf.siteground.com ~all
```

#### 5. **Configurar DKIM (Opcional pero recomendado)**

En SiteGround cPanel:
1. Ve a "Email Deliverability"
2. Activa DKIM para asoperadora.com
3. Copia los registros DNS que te da
4. Agrégalos en DNS Zone Editor

---

## 🧪 PROBAR EL SISTEMA

### Script de Prueba

Crea este archivo para probar:

**`scripts/test-email.js`**

```javascript
import dotenv from 'dotenv';
import { emailService } from '../src/services/EmailService.js';
import { EmailTemplateService } from '../src/services/EmailTemplateService.js';

dotenv.config({ path: '.env.local' });

async function testEmail() {
  console.log('🧪 Probando envío de correo...\n');

  // Renderizar template
  const { html, subject } = EmailTemplateService.renderWelcome({
    customerName: 'Sergio Aguilar',
    email: 'tu-email@example.com' // CAMBIA ESTO
  });

  // Enviar
  const success = await emailService.sendEmail({
    to: 'tu-email@example.com', // CAMBIA ESTO
    subject,
    html
  });

  if (success) {
    console.log('✅ Correo enviado exitosamente!');
    console.log('📧 Revisa tu bandeja de entrada');
  } else {
    console.log('❌ Error al enviar correo');
    console.log('Revisa la configuración SMTP en .env.local');
  }
}

testEmail();
```

**Ejecutar:**
```bash
node scripts/test-email.js
```

---

## 🔗 INTEGRAR EN LOS FLUJOS

### 1. **Al Registrarse (Bienvenida)**

**Archivo:** `src/app/api/auth/register/route.ts` (o donde manejes registro)

```typescript
import { emailService } from '@/services/EmailService';
import { EmailTemplateService } from '@/services/EmailTemplateService';
import { CommunicationService } from '@/services/CommunicationService';

// Después de crear el usuario...
const { html, subject } = EmailTemplateService.renderWelcome({
  customerName: user.name,
  email: user.email
});

// Enviar correo
await emailService.sendEmail({
  to: user.email,
  subject,
  html
});

// Guardar en Centro de Comunicación
const thread = await CommunicationService.createThread({
  client_id: user.id,
  subject: 'Bienvenida a AS Operadora',
  thread_type: 'general',
  tenant_id: 1
});

await CommunicationService.sendMessage({
  thread_id: thread.id,
  sender_type: 'system',
  sender_name: 'AS Operadora',
  body: `Correo de bienvenida enviado a ${user.email}`,
  body_html: html,
  tenant_id: 1
});
```

### 2. **Al Confirmar Reserva**

**Archivo:** `src/app/api/bookings/route.ts` (o donde crees reservas)

```typescript
// Después de crear la reserva...
const { html, subject } = EmailTemplateService.renderBookingConfirmed({
  customerName: booking.customer_name,
  email: booking.customer_email,
  bookingId: booking.id,
  serviceName: booking.service_name,
  bookingDate: new Date().toISOString(),
  travelDate: booking.travel_date,
  passengers: booking.passengers,
  destination: booking.destination,
  totalPrice: booking.total_price,
  currency: booking.currency
});

await emailService.sendEmail({
  to: booking.customer_email,
  subject,
  html
});

// Guardar en comunicación...
```

### 3. **Al Confirmar Pago**

**Archivo:** Ya está parcialmente en `src/app/api/payments/paypal/capture-order/route.ts`

**Reemplazar:**
```typescript
// ANTES:
await emailService.sendPaymentConfirmation(...)

// DESPUÉS:
const { html, subject } = EmailTemplateService.renderPaymentConfirmed({
  customerName: booking.customer_name,
  email: booking.customer_email,
  bookingId: booking.id,
  amount: payment.amount,
  currency: payment.currency,
  paymentDate: new Date().toISOString(),
  paymentMethod: 'PayPal',
  transactionId: payment.id,
  serviceName: booking.service_name,
  invoiceAvailable: true
});

await emailService.sendEmail({
  to: booking.customer_email,
  subject,
  html
});
```

### 4. **Al Generar Cotización**

**Archivo:** `src/app/api/groups/quote/route.ts`

**Descomentar y actualizar:**
```typescript
const { html, subject } = EmailTemplateService.renderQuoteSent({
  customerName: quote.customer_name,
  email: quote.customer_email,
  quoteId: `QT-${quote.id}`,
  destination: quote.destination,
  travelDates: `${quote.start_date} - ${quote.end_date}`,
  duration: `${quote.days} días / ${quote.nights} noches`,
  passengers: quote.passengers,
  inclusions: quote.inclusions,
  totalPrice: quote.total_price,
  pricePerPerson: quote.price_per_person,
  currency: quote.currency,
  expiryDate: quote.expiry_date
});

await emailService.sendEmail({
  to: quote.customer_email,
  subject,
  html
});
```

---

## 📋 TEMPLATES ADICIONALES A CREAR

### Próximos Templates (Prioridad Media)

1. **Recordatorio de Pago** (`payment-reminder.html`)
2. **Cambio en Itinerario** (`itinerary-changed.html`)
3. **Documentos Listos** (`documents-ready.html`)
4. **Recordatorio Pre-Viaje** (`trip-reminder.html`)
5. **Recuperar Contraseña** (`password-reset.html`)
6. **Verificación de Email** (`email-verification.html`)
7. **Reserva Cancelada** (`booking-cancelled.html`)
8. **Factura Generada** (`invoice-generated.html`)

### Templates Futuros (Baja Prioridad)

9. **Newsletter**
10. **Ofertas Especiales**
11. **Encuesta Post-Viaje**
12. **Alerta de Precio**

---

## 🎯 CHECKLIST DE IMPLEMENTACIÓN

### Fase 1: Configuración (HOY)
- [ ] Crear cuenta `noreply@asoperadora.com` en SiteGround
- [ ] Obtener credenciales SMTP
- [ ] Actualizar `.env.local`
- [ ] Configurar SPF record
- [ ] Probar envío con `test-email.js`

### Fase 2: Integración (Esta Semana)
- [ ] Integrar correo de bienvenida al registrarse
- [ ] Integrar confirmación de reserva
- [ ] Integrar confirmación de pago
- [ ] Integrar cotización enviada
- [ ] Guardar todos los correos en Centro de Comunicación

### Fase 3: Templates Adicionales (Próxima Semana)
- [ ] Crear template de recordatorio de pago
- [ ] Crear template de cambio en itinerario
- [ ] Crear template de documentos listos
- [ ] Crear template de recordatorio pre-viaje

### Fase 4: Optimización (Semana 3)
- [ ] Dashboard de correos enviados
- [ ] Sistema de reintentos
- [ ] Preferencias de usuario
- [ ] Analytics básicos

---

## 📞 DATOS DE CONTACTO CONFIGURADOS

Los templates ya incluyen:

- **Email:** contacto@asoperadora.com
- **Teléfono:** +52 720 815 6804
- **WhatsApp:** 720 815 6804
- **Ubicación:** CDMX, México

---

## 🚨 IMPORTANTE

### Al Enviar Correos, SIEMPRE:

1. **Guardar en Centro de Comunicación**
   - Crear thread si no existe
   - Guardar mensaje con HTML completo
   - Registrar delivery

2. **Manejar Errores**
   - Log detallado
   - Reintentos automáticos
   - Notificar a admin si falla

3. **Respetar Preferencias**
   - Verificar que el usuario acepta correos
   - Respetar horarios
   - Opción de darse de baja

---

## 📄 ARCHIVOS CREADOS

```
src/
├── templates/
│   └── email/
│       ├── base-template.html          ✅ Template base
│       ├── welcome.html                ✅ Bienvenida
│       ├── booking-confirmed.html      ✅ Confirmación reserva
│       ├── payment-confirmed.html      ✅ Confirmación pago
│       └── quote-sent.html             ✅ Cotización enviada
└── services/
    └── EmailTemplateService.ts         ✅ Servicio de templates
```

---

## 🎉 RESUMEN

**Lo que tienes ahora:**
- ✅ 4 templates profesionales listos
- ✅ Template base con branding completo
- ✅ Servicio de renderizado con variables y condicionales
- ✅ Datos de contacto configurados
- ✅ Diseño responsive y premium

**Lo que necesitas hacer:**
1. Configurar SMTP en SiteGround (15 minutos)
2. Probar envío (5 minutos)
3. Integrar en los flujos (2-3 horas)
4. Guardar en Centro de Comunicación (1 hora)

**Total estimado:** ~4 horas para tener todo funcionando

---

**Siguiente Paso:** Configura el SMTP y prueba con `test-email.js` 🚀
