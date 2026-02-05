# 📧 SISTEMA DE CORREOS - TEMPLATES COMPLETOS

**Fecha:** 5 de Febrero de 2026, 14:30 PM  
**Estado:** ✅ **11 TEMPLATES CREADOS**  
**Versión:** v2.0 Extendida

---

## 📊 **RESUMEN EJECUTIVO**

Se han creado **11 templates profesionales** para cubrir todos los flujos de comunicación críticos de AS Operadora.

---

## ✅ **TEMPLATES COMPLETADOS**

### **ALTA PRIORIDAD** (8 templates)

#### **1. ✅ Bienvenida** (`welcome.html`)
**Cuándo:** Al registrarse un nuevo usuario  
**Estado:** ✅ Integrado en `/api/auth/register`  
**Variables:**
- `CUSTOMER_NAME` - Nombre del usuario
- `EMAIL` - Email del usuario

---

#### **2. ✅ Confirmación de Reserva** (`booking-confirmed.html`)
**Cuándo:** Al crear una reserva  
**Estado:** ✅ Integrado en `/api/bookings`  
**Variables:**
- `CUSTOMER_NAME`, `EMAIL`, `BOOKING_ID`
- `SERVICE_NAME`, `BOOKING_DATE`, `TRAVEL_DATE`
- `PASSENGERS`, `DESTINATION`
- `TOTAL_PRICE`, `CURRENCY`

---

#### **3. ✅ Confirmación de Pago** (`payment-confirmed.html`)
**Cuándo:** Al procesar un pago  
**Estado:** ✅ Integrado en `/api/payments/paypal/capture-order`  
**Variables:**
- `CUSTOMER_NAME`, `EMAIL`, `BOOKING_ID`
- `AMOUNT`, `CURRENCY`, `PAYMENT_DATE`
- `PAYMENT_METHOD`, `TRANSACTION_ID`
- `SERVICE_NAME`, `TRAVEL_DATE`
- `REMAINING_BALANCE`, `DUE_DATE`, `INVOICE_AVAILABLE`

---

#### **4. ✅ Cotización Enviada** (`quote-sent.html`)
**Cuándo:** Al generar una cotización  
**Estado:** ✅ Integrado en `/api/groups/quote`  
**Variables:**
- `CUSTOMER_NAME`, `EMAIL`, `QUOTE_ID`
- `DESTINATION`, `TRAVEL_DATES`, `DURATION`
- `PASSENGERS`, `ROOM_TYPE`, `INCLUSIONS`
- `TOTAL_PRICE`, `PRICE_PER_PERSON`, `CURRENCY`
- `EXPIRY_DATE`

---

#### **5. ✅ Recordatorio de Cotización** (`quote-reminder.html`)
**Cuándo:** 24-48 horas antes de que expire una cotización  
**Estado:** ⏳ Pendiente integración (cron job)  
**Variables:**
- `CUSTOMER_NAME`, `EMAIL`, `QUOTE_ID`
- `DESTINATION`, `TRAVEL_DATES`, `PASSENGERS`
- `TOTAL_PRICE`, `CURRENCY`, `EXPIRY_DATE`

**Función:**
```typescript
await sendQuoteReminderEmail({
  name: 'Juan Pérez',
  email: 'juan@example.com',
  quoteId: 'QT-2026-001',
  destination: 'París',
  travelDates: '15-25 Marzo',
  passengers: 2,
  totalPrice: 2500,
  currency: 'USD',
  expiryDate: '15 de Febrero'
});
```

---

#### **6. ✅ Cambio en Itinerario** (`itinerary-change.html`)
**Cuándo:** Al modificar una reserva (vuelo, hotel, fecha)  
**Estado:** ⏳ Pendiente integración  
**Variables:**
- `CUSTOMER_NAME`, `EMAIL`, `BOOKING_ID`
- `SERVICE_NAME`, `TRAVEL_DATE`, `PASSENGERS`
- `CHANGE_TYPE` (flight/hotel/date)
- `CHANGE_DESCRIPTION`, `CHANGE_REASON`
- `OLD_FLIGHT_INFO`, `NEW_FLIGHT_INFO`
- `OLD_HOTEL_INFO`, `NEW_HOTEL_INFO`
- `OLD_DATE`, `NEW_DATE`
- `PRICE_CHANGE`, `TOTAL_PRICE`, `PRICE_DIFFERENCE`
- `PRICE_INCREASE`, `PRICE_DECREASE`, `CURRENCY`

**Función:**
```typescript
await sendItineraryChangeEmail({
  name: 'Juan Pérez',
  email: 'juan@example.com',
  bookingId: 123,
  serviceName: 'Tour Europa',
  travelDate: '20 de Marzo',
  passengers: 2,
  changeType: 'flight',
  oldFlightInfo: 'AM 123 - 10:00 AM',
  newFlightInfo: 'AM 456 - 14:00 PM',
  changeReason: 'Cambio de aeronave por mantenimiento',
  priceChange: false,
  currency: 'USD'
});
```

---

#### **7. ✅ Documentos Listos** (`documents-ready.html`)
**Cuándo:** Cuando los documentos de viaje están disponibles  
**Estado:** ⏳ Pendiente integración  
**Variables:**
- `CUSTOMER_NAME`, `EMAIL`, `BOOKING_ID`
- `SERVICE_NAME`, `DESTINATION`
- `DEPARTURE_DATE`, `RETURN_DATE`, `PASSENGERS`
- `HAS_FLIGHT_TICKETS`, `HAS_HOTEL_VOUCHERS`
- `HAS_TOUR_VOUCHERS`, `HAS_TRANSFER_VOUCHERS`
- `HAS_INSURANCE`, `HAS_ITINERARY`

**Función:**
```typescript
await sendDocumentsReadyEmail({
  name: 'Juan Pérez',
  email: 'juan@example.com',
  bookingId: 123,
  serviceName: 'Tour Europa',
  destination: 'Europa',
  departureDate: '15 de Marzo',
  returnDate: '25 de Marzo',
  passengers: 2,
  hasFlightTickets: true,
  hasHotelVouchers: true,
  hasTourVouchers: true,
  hasInsurance: true,
  hasItinerary: true
});
```

---

#### **8. ✅ Recordatorio Pre-Viaje** (`pre-trip-reminder.html`)
**Cuándo:** 7, 3 y 1 día antes del viaje  
**Estado:** ⏳ Pendiente integración (cron job)  
**Variables:**
- `CUSTOMER_NAME`, `EMAIL`, `BOOKING_ID`
- `DESTINATION`, `DEPARTURE_DATE`, `DAYS_UNTIL_TRIP`
- `AIRLINE`, `FLIGHT_NUMBER`
- `DEPARTURE_TIME`, `DEPARTURE_AIRPORT`
- `ARRIVAL_TIME`, `ARRIVAL_AIRPORT`
- `CHECKIN_INFO`, `BAGGAGE_ALLOWANCE`
- `COVID_REQUIREMENTS`
- `WEATHER_INFO`, `TIMEZONE_INFO`
- `LANGUAGE_INFO`, `CURRENCY_INFO`, `SAFETY_TIPS`
- `HAS_HOTEL`, `HOTEL_NAME`, `HOTEL_ADDRESS`
- `HOTEL_CHECKIN_DATE`, `HOTEL_CHECKIN_TIME`
- `HOTEL_CHECKOUT_DATE`, `HOTEL_CHECKOUT_TIME`

**Función:**
```typescript
await sendPreTripReminderEmail({
  name: 'Juan Pérez',
  email: 'juan@example.com',
  bookingId: 123,
  destination: 'París',
  departureDate: '15 de Marzo',
  daysUntilTrip: 3,
  airline: 'Air France',
  flightNumber: 'AF 438',
  departureTime: '10:00 AM',
  departureAirport: 'MEX',
  arrivalTime: '06:00 AM +1',
  arrivalAirport: 'CDG',
  checkinInfo: 'Online 24h antes',
  baggageAllowance: '23kg por persona',
  weatherInfo: '15-20°C, lluvias ocasionales',
  timezoneInfo: 'GMT+1 (7 horas adelante)',
  languageInfo: 'Francés (inglés limitado)',
  currencyInfo: 'Euro (€)',
  hasHotel: true,
  hotelName: 'Hotel Paris Centro',
  hotelAddress: 'Rue de Rivoli 123'
});
```

---

### **MEDIA PRIORIDAD** (3 templates)

#### **9. ✅ Recuperar Contraseña** (`password-reset.html`)
**Cuándo:** Al solicitar recuperación de contraseña  
**Estado:** ⏳ Pendiente integración en auth  
**Variables:**
- `CUSTOMER_NAME`, `EMAIL`
- `RESET_URL` - Link de recuperación
- `EXPIRY_TIME` - Tiempo de expiración

**Función:**
```typescript
await sendPasswordResetEmail({
  name: 'Juan Pérez',
  email: 'juan@example.com',
  resetUrl: 'https://app.asoperadora.com/reset-password?token=abc123',
  expiryTime: '1 hora'
});
```

---

#### **10. ✅ Verificación de Email** (`email-verification.html`)
**Cuándo:** Al registrarse (si se implementa verificación)  
**Estado:** ⏳ Pendiente integración en auth  
**Variables:**
- `CUSTOMER_NAME`, `EMAIL`
- `VERIFICATION_URL` - Link de verificación
- `EXPIRY_TIME` - Tiempo de expiración

**Función:**
```typescript
await sendEmailVerificationEmail({
  name: 'Juan Pérez',
  email: 'juan@example.com',
  verificationUrl: 'https://app.asoperadora.com/verify-email?token=abc123',
  expiryTime: '24 horas'
});
```

---

#### **11. ✅ Encuesta Post-Viaje** (`post-trip-survey.html`)
**Cuándo:** 2-3 días después del regreso  
**Estado:** ⏳ Pendiente integración (cron job)  
**Variables:**
- `CUSTOMER_NAME`, `EMAIL`
- `DESTINATION`, `TRAVEL_DATES`
- `SURVEY_URL` - Link a la encuesta

**Función:**
```typescript
await sendPostTripSurveyEmail({
  name: 'Juan Pérez',
  email: 'juan@example.com',
  destination: 'París',
  travelDates: '15-25 Marzo 2026',
  surveyUrl: 'https://app.asoperadora.com/encuesta/abc123'
});
```

---

## 📊 **ESTADO DE IMPLEMENTACIÓN**

| # | Template | Archivo | Estado | Integración |
|---|----------|---------|--------|-------------|
| 1 | Bienvenida | `welcome.html` | ✅ | ✅ `/api/auth/register` |
| 2 | Confirmación Reserva | `booking-confirmed.html` | ✅ | ✅ `/api/bookings` |
| 3 | Confirmación Pago | `payment-confirmed.html` | ✅ | ✅ `/api/payments/paypal` |
| 4 | Cotización Enviada | `quote-sent.html` | ✅ | ✅ `/api/groups/quote` |
| 5 | Recordatorio Cotización | `quote-reminder.html` | ✅ | ⏳ Cron job |
| 6 | Cambio Itinerario | `itinerary-change.html` | ✅ | ⏳ Manual |
| 7 | Documentos Listos | `documents-ready.html` | ✅ | ⏳ Manual |
| 8 | Recordatorio Pre-Viaje | `pre-trip-reminder.html` | ✅ | ⏳ Cron job |
| 9 | Recuperar Contraseña | `password-reset.html` | ✅ | ⏳ Auth |
| 10 | Verificación Email | `email-verification.html` | ✅ | ⏳ Auth |
| 11 | Encuesta Post-Viaje | `post-trip-survey.html` | ✅ | ⏳ Cron job |

---

## 🔧 **CÓMO INTEGRAR LOS TEMPLATES PENDIENTES**

### **Paso 1: Copiar Funciones al emailHelper.ts**

Las funciones están en `src/lib/emailHelper-new-functions.ts`. Copiar al final de `emailHelper.ts`:

```typescript
// Copiar las funciones 5-11 desde emailHelper-new-functions.ts
```

### **Paso 2: Crear Cron Jobs**

Para los recordatorios automáticos, crear:

```typescript
// src/cron/email-reminders.ts
import { sendQuoteReminderEmail, sendPreTripReminderEmail, sendPostTripSurveyEmail } from '@/lib/emailHelper';

// Ejecutar diariamente
export async function sendDailyReminders() {
  // 1. Buscar cotizaciones próximas a expirar
  // 2. Buscar viajes próximos (7, 3, 1 día)
  // 3. Buscar viajes completados hace 2-3 días
}
```

### **Paso 3: Integrar en Flujos Manuales**

```typescript
// Cuando se modifican documentos
await sendDocumentsReadyEmail({ ... });

// Cuando se cambia un itinerario
await sendItineraryChangeEmail({ ... });
```

---

## 📁 **ESTRUCTURA DE ARCHIVOS**

```
src/
├── templates/
│   └── email/
│       ├── base-template.html          ✅
│       ├── welcome.html                ✅
│       ├── booking-confirmed.html      ✅
│       ├── payment-confirmed.html      ✅
│       ├── quote-sent.html             ✅
│       ├── quote-reminder.html         ✅ NUEVO
│       ├── itinerary-change.html       ✅ NUEVO
│       ├── documents-ready.html        ✅ NUEVO
│       ├── pre-trip-reminder.html      ✅ NUEVO
│       ├── password-reset.html         ✅ NUEVO
│       ├── email-verification.html     ✅ NUEVO
│       └── post-trip-survey.html       ✅ NUEVO
├── lib/
│   ├── emailHelper.ts                  ✅ (4 funciones)
│   └── emailHelper-new-functions.ts    ✅ (7 funciones nuevas)
└── cron/
    └── email-reminders.ts              ⏳ Por crear
```

---

## 🎯 **PRÓXIMOS PASOS**

### **Inmediato**
1. ⏳ Copiar funciones nuevas a `emailHelper.ts`
2. ⏳ Crear cron jobs para recordatorios automáticos
3. ⏳ Integrar recuperación de contraseña en auth
4. ⏳ Integrar verificación de email en registro

### **Corto Plazo**
5. ⏳ Implementar sistema de documentos
6. ⏳ Implementar sistema de encuestas
7. ⏳ Dashboard de correos enviados
8. ⏳ Analytics de apertura/clics

### **Largo Plazo (Baja Prioridad)**
9. ⏳ Newsletter template
10. ⏳ Ofertas especiales template
11. ⏳ Alertas de precio template

---

## 📊 **MÉTRICAS**

### **Templates Creados**
- **Total:** 11 templates
- **Alta Prioridad:** 8/8 ✅
- **Media Prioridad:** 3/3 ✅
- **Baja Prioridad:** 0/3 ⏳

### **Integraciones**
- **Completadas:** 4/11 (36%)
- **Pendientes:** 7/11 (64%)

### **Tiempo Estimado Restante**
- Copiar funciones: 10 min
- Cron jobs: 2 horas
- Auth integration: 1 hora
- **Total:** ~3 horas

---

## 🎉 **CONCLUSIÓN**

Se han creado **11 templates profesionales** que cubren todos los flujos de comunicación críticos. 4 ya están integrados y funcionando. Los 7 restantes solo necesitan integración en sus respectivos flujos.

**Estado:** ✅ **TEMPLATES COMPLETOS - LISTOS PARA INTEGRAR**

---

**Creado por:** Antigravity AI  
**Aprobado por:** Sergio Aguilar  
**Fecha:** 5 de Febrero de 2026, 14:30 PM  
**Versión:** v2.0 Extendida
