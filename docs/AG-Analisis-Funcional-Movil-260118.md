# 📱 AG-Analisis-Funcional-Movil - AS Operadora

**Fecha:** 18 de Enero de 2026
**Basado en:** COMPARATIVA APP MÓVIL EXPEDIA vs AS OPERADORA y estado actual del proyecto Web.
**Objetivo:** Inventario exhaustivo de funcionalidades para la nueva App Móvil (React Native + Expo), diferenciando paridad con Expedia y exclusivas de AS Operadora.

---

## 📊 1. INVENTARIO DE FUNCIONALIDADES

### A. Funcionalidades Base (Paridad Expedia)
Estas son las funciones "table-stakes" que la aplicación móvil debe tener para ser competitiva, basadas en el análisis de Expedia.

| Módulo | Funcionalidad | Descripción | Estado Web Actual | Prioridad Móvil |
|--------|---------------|-------------|-------------------|-----------------|
| **Autenticación** | Login/Registro | Email/Password, Social Login. | ✅ | 🔴 Crítica |
| | Biometría | FaceID / TouchID / Huella. | ❌ | 🔴 Crítica |
| | Perfil de Usuario | Datos personales, pasaportes, viajeros guardados. | ✅ | 🟡 Alta |
| **Vuelos** | Búsqueda | Origen, destino, fechas, pasajeros (Adultos/Niños/Bebés). | ✅ | 🔴 Crítica |
| | Resultados | Lista, filtros (aerolínea, escalas, precio), ordenamiento. | ✅ | 🔴 Crítica |
| | Reserva | Selección de tarifa, asignación de asientos (si aplica). | ✅ | 🔴 Crítica |
| | Boarding Pass | Descarga a Wallet (Apple/Google). | ❌ | 🟡 Alta |
| **Hoteles** | Búsqueda | Destino, fechas, huéspedes. Auto-complete ciudades. | ✅ | 🔴 Crítica |
| | Detalle | Fotos, descripción, servicios, mapa, opiniones. | ✅ | 🔴 Crítica |
| | Reserva | Selección de habitación, pago. | ✅ | 🔴 Crítica |
| | Mapa Interactivo | Ver hoteles en mapa con precios. | ✅ | 🟡 Alta |
| **Autos** | Búsqueda/Reserva | Lugar de entrega/devolución, fechas. | ✅ | 🟡 Alta |
| **Actividades** | Tours/Experiencias | Búsqueda por destino y fecha. | ✅ | 🟡 Alta |
| **Mis Viajes** | Listado | Próximos, Pasados, Cancelados. | ✅ | 🔴 Crítica |
| | Detalle Offline | **Ver reservas sin internet (Vouchers, Claves).** | ❌ | 🔴 Crítica |
| | Tiempo Real | Alertas de cambio de puerta, retrasos (Push). | ❌ | 🟡 Alta |
| **Pagos** | Pasarela | Tarjeta (Stripe), PayPal. | ✅ | 🔴 Crítica |
| | Nativos | Apple Pay / Google Pay. | ❌ | 🟡 Alta |

### B. Funcionalidades Diferenciales (Exclusivas AS Operadora)
Estas funcionalidades NO suelen estar en apps genéricas de viajes (o son limitadas) y representan nuestra ventaja competitiva.

| Módulo | Funcionalidad | Descripción | Estado Web Actual | Estrategia Móvil |
|--------|---------------|-------------|-------------------|------------------|
| **Corporativo** | **Políticas de Viaje** | Visualización de reglas de la empresa (presupuestos, clases permitidas). | ✅ | Adaptar UI para fácil lectura. |
| | **Aprobaciones** | **(Manager)** Aprobar/Rechazar solicitudes de viaje desde el celular con Push Notification. | ✅ | **Killer Feature.** Agilidad total para aprobadores. |
| | Centros de Costo | Selección obligatoria al reservar. | ✅ | Integrar en el flujo de reserva móvil. |
| **Restaurantes** | Reservas | Búsqueda (Google Places v1), filtros (cocina, precio), mapa. | ✅ | Usar geolocalización nativa para "Restaurantes cerca de mí". |
| **AS Home** | Rentas Vacacionales | Casas, Villas, Departamentos (estilo Airbnb). | ✅ | UI inmersiva con galería de fotos swipeable. |
| **Viajes Grupales** | Cotizador | Formulario para grupos grandes, división de PNRs automática. | ✅ | Formulario simplificado o "Solicitar llamada". |
| **Seguros / E-Sim** | Add-ons | Venta cruzada de seguros y conectividad móvil. | ✅ | Integrar como "Upsell" en el checkout. |
| **Traslados** | Agendamiento | Aeropuerto-Hotel con vehículos específicos. | ✅ | Permitir reservar "el día de" usando ubicación actual. |
| **Social** | Compartir Viaje | Enviar itinerario a WhatsApp/Redes nativamente. | ❌ | Usar Share Sheet nativo del OS. |

---

## 🛠️ 2. ESTRATEGIA TÉCNICA

### Stack Tecnológico
Se ha decidido usar **React Native + Expo** para maximizar la reutilización de lógica y acelerar el desarrollo.

*   **Framework:** React Native con Expo (Managed Workflow recomendado).
*   **Lenguaje:** TypeScript (compartido con Web).
*   **Backend:** Next.js API Routes (Serverless). **No se crea un backend nuevo.**
    *   *Acción:* Se optimizarán los endpoints existentes para devolver JSONs más ligeros (e.g., usando `FieldMask` o DTOs específicos para móvil) si es necesario.
*   **Estado Global:** Zustand (compartido lógica/stores si se extraen a paquete común).
*   **Mapas:** `react-native-maps` (Google Maps nativo en móvil).
*   **UI:** React Native Paper o Tamagui (para estilos similares a Tailwind/shadcn).

### Arquitectura de Integración
La App Móvil consumirá exactamente las mismas APIs que la Web.

```mermaid
graph TD
    UserMobile[Usuario App Móvil] -->|HTTPS / JSON| API[Next.js API Routes (Backend)]
    UserWeb[Usuario Web] -->|HTTPS / JSON| API
    API -->|Query| DB[(PostgreSQL Neon)]
    API -->|Request| Amadeus[Amadeus API]
    API -->|Request| Google[Google Places API]
    API -->|Request| Stripe[Stripe/PayPal]
```

### Funciones Nativas a Explotar
1.  **Geolocalización:** Para "Hoteles/Restaurantes cerca de mí".
2.  **Push Notifications:** (Expo Notifications) Para cambios de estado en vuelos y **solicitudes de aprobación corporativa**.
3.  **Almacenamiento Seguro:** (Expo SecureStore) Para tokens de sesión y datos biométricos.
4.  **Share Sheet:** Compartir itinerarios y confirmaciones.

---

## 📅 3. LISTADO MAESTRO DE TAREAS (ROADMAP INICIAL)

### Fase 1: Fundamentos (Semanas 1-2)
*   [ ] Inicializar proyecto Expo + TypeScript.
*   [ ] Configurar navegación (Expo Router o React Navigation).
*   [ ] Configurar cliente HTTP (Axios) apuntando a API local/dev.
*   [ ] Implementar Login (consumiendo `/api/auth/login`).
*   [ ] Implementar almacenamiento de sesión (JWT en SecureStore).

### Fase 2: Módulos Core - Lectura (Semanas 3-5)
*   [ ] Home Screen (Dashboard simplificado).
*   [ ] Módulo de Búsqueda de Vuelos (UI Nátiva).
    *   [ ] Integración con `/api/flights/search`.
*   [ ] Módulo de Búsqueda de Hoteles (UI Nativa).
    *   [ ] Integración con `/api/hotels/search`.
*   [ ] Listado de Resultados (Optimizados para scroll infinito).

### Fase 3: Módulo Corporativo - El Diferenciador (Semana 6-7)
*   [ ] Pantalla de "Solicitudes Pendientes" (para Managers).
*   [ ] Acción de Aprobar/Rechazar reserva.
*   [ ] Pantalla de "Mis Reservas" con estado de aprobación.

### Fase 4: Checkout y Pagos (Semana 8-9)
*   [ ] Pasarela de pagos (integración Stripe SDK o WebView para start).
*   [ ] Creación de reserva (`POST /api/bookings`).

### Fase 5: Exclusivos y Pulido (Semana 10+)
*   [ ] Módulo Restaurantes (Mapas nativos).
*   [ ] Módulo AS Home (Galerías táctiles).
*   [ ] Push Notifications.
*   [ ] Modo Offline (Cache de viajes).

---

## 📝 NOTAS DE CAMBIOS EN BACKEND (REQUERIDOS)
Aunque el backend está listo, se prevén estos ajustes para la App Móvil:
1.  **Lightweight Endpoints:** Crear versiones lite de endpoints de búsqueda si los actuales envían demasiada data HTML/innecesaria.
2.  **Push Token Registration:** Crear endpoint para asociar `push_token` (Expo) con `user_id` en base de datos.
3.  **Mobile Auth:** Asegurar que el manejo de JWT funcione correctamente fuera de cookies (Header `Authorization: Bearer`).

---
**Este documento servirá como la hoja de ruta para la construcción de la aplicación.**
