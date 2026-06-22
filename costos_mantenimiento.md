# Análisis y Proyección de Costos de Mantenimiento - Operadora Dev

## 1. Proyección de Tráfico
- **Tráfico Inicial (Día 1)**: 500 visitas
- **Crecimiento Diario**: 10%
- **Fórmula de cálculo**: 500 * (1 - 1.1^30) / (1 - 1.1)
- **Total estimado (Mes 1)**: ~82,247 visitas.
- **Visitas al final del mes (Día 30)**: ~7,931 visitas por día.
- **Tasa de conversión asumida**: 1% de las visitas realizan una reserva (Aprox. 822 reservas al mes).

## 2. Infraestructura y Alojamiento
- **Vercel (Hosting, Edge Functions y Vercel Blob)**:
  - **Plan Pro recomendado**: $20 USD / mes por desarrollador.
  - Incluye 1 TB de ancho de banda y 1 millón de ejecuciones de Edge Functions.
  - *Vercel Blob* está incluido en los límites base para almacenamiento de documentos de usuarios, sin costos extra bajo este escenario.
  - **Costo estimado**: **$20.00 USD**
- **Neon PostgreSQL (Base de Datos)**:
  - Debido a la carga de tráfico (>7,000 usuarios al día para fin de mes) y las constantes lecturas para historial o sesiones, la capa *Free* (límite de 100 horas de cómputo) será insuficiente.
  - **Plan Scale / Launch**: Se recomienda presupuesto bajo demanda.
  - **Costo estimado**: **$50.00 USD**

## 3. APIs de Viajes y Proveedores de Terceros
- **Amadeus (Vuelos / Actividades)**:
  - En entorno *Self-Service*, se cobra entre €0.0025 y €0.025 por petición (búsqueda).
  - Si el 50% de las visitas del mes (~41,123) ejecutan 1 sola búsqueda en vivo: 41,123 * 0.025 = ~€1,028.
  - **Costo estimado**: **$1,100.00 USD** 
  - *(OJO: Es altamente recomendable usar sistemas de caché (Redis) o migrar a una cuenta comercial B2B de Amadeus (Enterprise) donde las búsquedas suelen no tener costo directo si hay un ratio razonable de reservas "Look-to-Book").*
- **Duffel / Kiwi / Hotelbeds / RateHawk**:
  - Generalmente gratuitos en búsquedas puras. Las ganancias se obtienen por comisiones pre-negociadas o por "Markup" sobre tarifas netas. Las integraciones para emitir tickets tienen fee por reserva, lo cual es deducible del ticket.
  - **Costo mensual base estimado**: **$0.00 USD**
- **Google Places / Maps API**:
  - $17 USD por cada 1,000 peticiones de autocompletado y detalles.
  - Estimando 20,000 autocompletados al mes = $340 USD.
  - Menos el crédito mensual de Google ($200 USD).
  - **Costo estimado**: **$140.00 USD**

## 4. IA, Comunicaciones y Operaciones
- **OpenAI (Inteligencia Artificial)**:
  - Suponiendo que el 10% de los usuarios usa interacciones con el bot/AI (8,225 sesiones) y utilizan 5 prompts de 1k tokens. Total = ~41 Millones de tokens usando el modelo eficiente `gpt-4o-mini`.
  - **Costo estimado**: **$15.00 USD**
- **Resend y SMTP (Correos Transaccionales)**:
  - Dejamos de usar SendGrid y ahora usamos SMTP directo de tu servidor (`mail.asoperadora.com`) como principal, que no tiene costo adicional. Como respaldo o alternativa (si hay bloqueos) integramos **Resend**.
  - **Resend** ofrece 3,000 correos gratis al mes. Si pasamos ese volumen (ej. a 15,000-20,000 por alta conversión), el plan pro cuesta **$20.00 USD/mes** por 50k correos.
  - **Costo estimado (Plan Pro)**: **$20.00 USD**
- **Facturama (Facturación Electrónica CFDI México)**:
  - Para ~822 reservas, se estima un consumo de 800 a 1,000 timbres.
  - **Paquete de 1,000 folios**: ~$1,500 MXN.
  - **Costo estimado**: **$90.00 USD**

## 5. Pasarelas de Pago (PayPal, Stripe, MercadoPago)
- Estas plataformas no generan costo mensual de mantenimiento fijo. Sin embargo, deben ser provisionadas en la estrategia financiera ya que cobrarán entre un **3.4% a 3.6% + un cargo fijo ($3 a $4 MXN)** por cada reservación pagada a través de la plataforma.

## 6. Resumen de Costos Estimados (Mes 1)

| Servicio | Proveedor | Costo Mensual Estimado (USD) |
| :--- | :--- | :--- |
| **Hosting y Almacenamiento** | Vercel | $20.00 |
| **Base de Datos** | Neon PostgreSQL | $50.00 |
| **Email Transaccional** | Resend / SMTP | $20.00 |
| **Facturación Electrónica** | Facturama | $90.00 |
| **Geolocalización** | Google Places | $140.00 |
| **Inteligencia Artificial**| OpenAI (`gpt-4o-mini`) | $15.00 |
| **API de Viajes** | Amadeus | $1,100.00* |
| **TOTAL ESTIMADO MANTENIMIENTO BASE** | | **$1,435.00** |

*(Nota de riesgo: El 76% del costo fijo proyectado se iría únicamente en las tarifas Self-Service de Amadeus. Se sugiere implementar una caché estricta para rutas populares o concretar un acuerdo Enterprise antes del lanzamiento masivo).*
