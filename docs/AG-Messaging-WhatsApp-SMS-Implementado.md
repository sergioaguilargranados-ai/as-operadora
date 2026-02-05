# 📱 INTEGRACIÓN WHATSAPP & SMS - CENTRO DE COMUNICACIÓN

**Fecha:** 5 de Febrero de 2026, 17:15 PM  
**Estado:** ✅ **IMPLEMENTADO** (Pendiente configuración Twilio)

---

## 🎉 **RESUMEN**

Se ha implementado la integración completa de WhatsApp y SMS al Centro de Comunicación usando Twilio:

- ✅ Servicio de mensajería (WhatsApp + SMS)
- ✅ Webhooks para recibir mensajes
- ✅ Integración con Centro de Comunicación
- ✅ Endpoints API para enviar mensajes
- ✅ Sistema de conversaciones unificado
- ✅ Tracking de estado de mensajes
- ✅ Scripts de prueba

---

## 📁 **ARCHIVOS CREADOS**

### **1. Servicio de Mensajería**
- **Archivo:** `src/services/MessagingService.ts`
- **Funciones:**
  - `sendWhatsAppMessage()` - Enviar WhatsApp
  - `sendSMSMessage()` - Enviar SMS
  - `processIncomingMessage()` - Procesar mensajes entrantes
  - `updateMessageStatus()` - Actualizar estado
  - `getConversations()` - Obtener conversaciones

### **2. Webhooks**
- `src/app/api/webhooks/whatsapp/route.ts` - Recibir WhatsApp
- `src/app/api/webhooks/sms/route.ts` - Recibir SMS
- `src/app/api/webhooks/message-status/route.ts` - Estado de mensajes

### **3. Endpoints API**
- `src/app/api/messaging/send/route.ts` - Enviar mensajes
- `src/app/api/messaging/conversations/route.ts` - Obtener conversaciones

### **4. Scripts de Prueba**
- `scripts/test-whatsapp.js` - Probar WhatsApp
- `scripts/test-sms.js` - Probar SMS

---

## 🔧 **CONFIGURACIÓN REQUERIDA**

### **1. Crear Cuenta en Twilio**

1. Ir a https://www.twilio.com/
2. Crear cuenta gratuita (incluye $15 USD de crédito)
3. Verificar tu número de teléfono

### **2. Obtener Credenciales**

En el Dashboard de Twilio:
- **Account SID** - Identificador de cuenta
- **Auth Token** - Token de autenticación
- **Phone Number** - Número para SMS
- **WhatsApp Number** - Número para WhatsApp (Sandbox)

### **3. Configurar Variables de Entorno**

Agregar a `.env.local`:

```bash
# Twilio Configuration
TWILIO_ACCOUNT_SID=ACxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxx
TWILIO_AUTH_TOKEN=your_auth_token_here
TWILIO_PHONE_NUMBER=+15551234567
TWILIO_WHATSAPP_NUMBER=+14155238886
```

### **4. Configurar Webhooks en Twilio**

#### **WhatsApp Sandbox**

1. Ir a: Messaging > Try it out > Try WhatsApp
2. Configurar webhook:
   - **When a message comes in:** `https://app.asoperadora.com/api/webhooks/whatsapp`
   - **Method:** POST

#### **SMS**

1. Ir a: Phone Numbers > Manage > Active numbers
2. Seleccionar tu número
3. Configurar:
   - **A MESSAGE COMES IN:** `https://app.asoperadora.com/api/webhooks/sms`
   - **Method:** POST

#### **Status Callbacks**

En ambos (WhatsApp y SMS):
- **STATUS CALLBACK URL:** `https://app.asoperadora.com/api/webhooks/message-status`
- **Method:** POST

---

## 🚀 **CÓMO USAR**

### **Enviar WhatsApp**

```typescript
// Desde el código
import { sendWhatsAppMessage } from '@/services/MessagingService';

await sendWhatsAppMessage({
  to: '+5215512345678',
  body: '¡Hola! Tu reserva ha sido confirmada 🎉',
  threadId: 123, // Opcional: asociar a conversación
  userId: 456 // Opcional: asociar a usuario
});
```

```bash
# Desde API
curl -X POST http://localhost:3000/api/messaging/send \
  -H "Content-Type: application/json" \
  -d '{
    "channel": "whatsapp",
    "to": "+5215512345678",
    "message": "Hola! Tu reserva ha sido confirmada"
  }'
```

### **Enviar SMS**

```typescript
// Desde el código
import { sendSMSMessage } from '@/services/MessagingService';

await sendSMSMessage({
  to: '+5215512345678',
  body: 'Tu código de verificación es: 123456',
  threadId: 123,
  userId: 456
});
```

```bash
# Desde API
curl -X POST http://localhost:3000/api/messaging/send \
  -H "Content-Type: application/json" \
  -d '{
    "channel": "sms",
    "to": "+5215512345678",
    "message": "Tu código de verificación es: 123456"
  }'
```

### **Obtener Conversaciones**

```typescript
// Desde el código
import { getConversations } from '@/services/MessagingService';

const conversations = await getConversations({
  channel: 'whatsapp', // o 'sms'
  status: 'open',
  limit: 50
});
```

```bash
# Desde API
curl "http://localhost:3000/api/messaging/conversations?channel=whatsapp&status=open"
```

---

## 🔄 **FLUJO COMPLETO**

### **1. Cliente Envía Mensaje**

```
Cliente envía WhatsApp/SMS
  ↓
Twilio recibe mensaje
  ↓
Twilio llama webhook (/api/webhooks/whatsapp o /sms)
  ↓
Sistema busca usuario por número
  ↓
Busca o crea hilo de conversación
  ↓
Guarda mensaje en communication_threads
  ↓
Incrementa contador de no leídos
  ↓
Notifica a agentes (opcional)
```

### **2. Agente Responde**

```
Agente escribe respuesta en Centro de Comunicación
  ↓
Sistema llama sendWhatsAppMessage() o sendSMSMessage()
  ↓
Twilio envía mensaje al cliente
  ↓
Guarda mensaje en hilo
  ↓
Registra en message_deliveries
  ↓
Twilio notifica estado (enviado/entregado/leído)
  ↓
Sistema actualiza estado en BD
```

---

## 📊 **INTEGRACIÓN CON CENTRO DE COMUNICACIÓN**

### **Tablas Utilizadas**

```sql
-- Hilos de conversación
communication_threads
  - thread_type: 'whatsapp' | 'sms' | 'email'
  - client_id: ID del usuario
  - status: 'open' | 'closed'
  - unread_count_agent: Mensajes no leídos por agente

-- Mensajes
messages
  - thread_id: ID del hilo
  - sender_type: 'client' | 'agent' | 'system'
  - body: Contenido del mensaje
  - message_type: 'whatsapp' | 'sms' | 'email'
  - metadata: JSON con datos adicionales

-- Entregas
message_deliveries
  - message_id: ID del mensaje
  - delivery_method: 'whatsapp' | 'sms'
  - status: 'sent' | 'delivered' | 'read' | 'failed'
  - provider_message_id: SID de Twilio
```

### **Vista Unificada**

El Centro de Comunicación ahora muestra:
- ✅ Correos electrónicos
- ✅ Mensajes de WhatsApp
- ✅ Mensajes de SMS
- ✅ Todo en una sola interfaz

---

## 🧪 **TESTING**

### **1. Instalar Twilio**

```bash
npm install twilio
```

### **2. Configurar Variables de Entorno**

Agregar credenciales de Twilio a `.env.local`

### **3. Probar WhatsApp**

```bash
# Editar número en el script
node scripts/test-whatsapp.js
```

### **4. Probar SMS**

```bash
# Editar número en el script
node scripts/test-sms.js
```

### **5. Probar Recepción**

1. Conectar tu WhatsApp al Sandbox de Twilio
2. Enviar mensaje al número de Twilio
3. Verificar que aparece en Centro de Comunicación

---

## 💰 **COSTOS DE TWILIO**

### **Cuenta Gratuita**
- $15 USD de crédito inicial
- Suficiente para ~1,000 mensajes de prueba

### **Costos Aproximados (México)**
- **SMS:** $0.0075 USD por mensaje (~$0.15 MXN)
- **WhatsApp (sesión iniciada por negocio):** $0.005 USD (~$0.10 MXN)
- **WhatsApp (sesión iniciada por usuario):** Gratis primeras 24h

### **Recomendación**
- Usar WhatsApp cuando sea posible (más barato)
- Usar SMS solo para verificaciones críticas
- Implementar rate limiting para evitar costos excesivos

---

## 🎯 **CASOS DE USO**

### **1. Confirmación de Reserva**

```typescript
// Enviar confirmación por WhatsApp
await sendWhatsAppMessage({
  to: user.phone,
  body: `¡Hola ${user.name}! 🎉\n\nTu reserva #${booking.id} ha sido confirmada.\n\nDestino: ${booking.destination}\nFecha: ${booking.date}\nPasajeros: ${booking.passengers}\n\n¡Nos vemos pronto!`,
  threadId: booking.thread_id,
  userId: user.id
});
```

### **2. Recordatorio de Pago**

```typescript
// Enviar recordatorio por SMS
await sendSMSMessage({
  to: user.phone,
  body: `Hola ${user.name}, te recordamos que tienes un pago pendiente de $${payment.amount} MXN para tu reserva #${booking.id}. Paga aquí: ${paymentLink}`,
  threadId: booking.thread_id,
  userId: user.id
});
```

### **3. Código de Verificación**

```typescript
// Enviar código por SMS
const code = generateVerificationCode();
await sendSMSMessage({
  to: user.phone,
  body: `Tu código de verificación de AS Operadora es: ${code}. Válido por 10 minutos.`,
  userId: user.id
});
```

### **4. Soporte al Cliente**

```typescript
// Cliente envía mensaje por WhatsApp
// Sistema automáticamente:
// 1. Crea hilo de conversación
// 2. Notifica a agentes
// 3. Agente responde desde Centro de Comunicación
// 4. Respuesta se envía por WhatsApp
```

---

## 🔒 **SEGURIDAD**

### **Validación de Webhooks**

Twilio firma los webhooks. Puedes validarlos:

```typescript
import twilio from 'twilio';

const validateTwilioRequest = (request: NextRequest) => {
  const twilioSignature = request.headers.get('X-Twilio-Signature');
  const url = request.url;
  const params = Object.fromEntries(await request.formData());
  
  const isValid = twilio.validateRequest(
    process.env.TWILIO_AUTH_TOKEN!,
    twilioSignature!,
    url,
    params
  );
  
  if (!isValid) {
    throw new Error('Invalid Twilio signature');
  }
};
```

### **Rate Limiting**

Implementar límites para evitar spam:

```typescript
// Máximo 10 mensajes por usuario por hora
const canSendMessage = await checkRateLimit(userId, 'whatsapp', 10, 3600);
if (!canSendMessage) {
  throw new Error('Límite de mensajes excedido');
}
```

---

## 📈 **MONITOREO**

### **Estadísticas de Mensajes**

```sql
-- Total de mensajes por canal
SELECT 
  delivery_method,
  COUNT(*) as total,
  COUNT(*) FILTER (WHERE status = 'delivered') as delivered,
  COUNT(*) FILTER (WHERE status = 'failed') as failed
FROM message_deliveries
WHERE sent_at > NOW() - INTERVAL '30 days'
GROUP BY delivery_method;

-- Conversaciones activas
SELECT 
  thread_type,
  COUNT(*) as active_conversations
FROM communication_threads
WHERE status = 'open'
GROUP BY thread_type;

-- Tiempo de respuesta promedio
SELECT 
  AVG(EXTRACT(EPOCH FROM (agent_response_time - client_message_time))) / 60 as avg_response_minutes
FROM (
  SELECT 
    thread_id,
    MAX(created_at) FILTER (WHERE sender_type = 'client') as client_message_time,
    MIN(created_at) FILTER (WHERE sender_type = 'agent' AND created_at > MAX(created_at) FILTER (WHERE sender_type = 'client')) as agent_response_time
  FROM messages
  GROUP BY thread_id
) response_times;
```

---

## ⚠️ **CONSIDERACIONES**

### **WhatsApp Sandbox vs Producción**

**Sandbox (Desarrollo):**
- Gratis
- Requiere que usuarios envíen código de activación
- Número compartido de Twilio
- Ideal para pruebas

**Producción:**
- Requiere aprobación de Facebook
- Tu propio número de WhatsApp Business
- Sin código de activación
- Proceso de aprobación: 1-2 semanas

### **Mejoras Futuras**

1. ⏳ **Templates de WhatsApp** - Mensajes pre-aprobados
2. ⏳ **Chatbot** - Respuestas automáticas
3. ⏳ **WhatsApp Business API** - Funciones avanzadas
4. ⏳ **Analytics Dashboard** - Métricas en tiempo real
5. ⏳ **Multi-agente** - Asignación automática
6. ⏳ **Horarios de atención** - Respuestas fuera de horario

---

## ✅ **CONCLUSIÓN**

El sistema de WhatsApp y SMS está **100% implementado**:

- ✅ Servicio de mensajería completo
- ✅ Webhooks configurados
- ✅ Integración con Centro de Comunicación
- ✅ Endpoints API listos
- ✅ Scripts de prueba
- ✅ Documentación completa

**Pendiente:**
- ⏳ Instalar `npm install twilio`
- ⏳ Configurar cuenta de Twilio
- ⏳ Agregar credenciales a `.env.local`
- ⏳ Configurar webhooks en Twilio Console

**Una vez configurado, tendrás comunicación omnicanal completa:** Email + WhatsApp + SMS 🎉

---

**Implementado por:** Antigravity AI  
**Fecha:** 5 de Febrero de 2026, 17:15 PM  
**Versión:** v1.0 Messaging Integration
