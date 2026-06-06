# 📖 AG-Manual-Detallado-Funciones - AS Operadora

**Última actualización:** 06 de Junio de 2026 - 10:25 CST  
**Versión actual:** v2.342  
**Propósito:** Documento exhaustivo que describe cada pantalla, botón y acción disponible en el sistema AS Operadora, desde la perspectiva del cliente final y los administradores.

---

## 🏠 1. LANDING PAGE (PÁGINA PRINCIPAL)

La página de inicio es el primer punto de contacto. Está diseñada para inspirar y facilitar la búsqueda de viajes.

### 1.1 Menú de Navegación (Header)
- **Logo AS Operadora:** Redirige a la página principal.
- **Botones de Navegación:** Enlaces a "Tours", "Vuelos", "Hoteles", "Viajes Grupales".
- **Botón "Iniciar Sesión":** Abre el portal de autenticación (`/login`).
- **Botón "Mi Cuenta" (Si ya inició sesión):** Despliega un menú con:
  - Mis Reservas
  - Mi Perfil
  - Dashboard (si tiene permisos)
  - Cerrar Sesión

### 1.2 Buscador Principal (Hero Section)
- **Campo "Destino / Palabra clave":** Permite escribir ciudades, países o nombres de paquetes (ej. "Europa", "París", "Turquía").
- **Selector de Fechas (Opcional):** Para buscar disponibilidad en un rango específico.
- **Botón "Buscar":** Ejecuta la consulta y redirige a la página de resultados o catálogo de tours filtrado (`/tours`).

### 1.3 Secciones Destacadas
- **Carrusel de Promociones:** Imágenes clickeables que redirigen a paquetes específicos en oferta.
- **Destinos Populares:** Tarjetas con foto y nombre de región. Al hacer clic (`Ver Tours`), filtra el catálogo por esa región.
- **Ventajas Competitivas:** Sección estática que detalla los beneficios de AS Operadora.

### 1.4 Footer (Pie de Página)
- **Enlaces Legales:** Términos y Condiciones, Aviso de Privacidad.
- **Contacto:** Redirección a WhatsApp, Email de soporte y Teléfonos.
- **Versión del Sistema:** Muestra la versión actual (ej. `v2.342`).

---

## 🗺️ 2. CATÁLOGO DE TOURS Y VIAJES GRUPALES (`/tours`)

Aquí el cliente puede explorar toda la oferta disponible.

### 2.1 Panel de Filtros (Izquierda / Superior en Móvil)
- **Buscador de texto:** Para afinar la búsqueda.
- **Filtro por Región/País:** Checkboxes para seleccionar Europa, Asia, Medio Oriente, etc.
- **Filtro por Rango de Precio:** Deslizador para ajustar presupuesto.
- **Botón "Limpiar Filtros":** Restablece el catálogo a su estado original.

### 2.2 Tarjetas de Tour (Resultados)
Cada tarjeta muestra:
- Imagen principal del destino.
- Título del Paquete y Código (`AS-XXXXX`).
- Duración (ej. "10 Días / 9 Noches").
- Precio "Desde".
- **Botón "Ver Detalles":** Redirige a la página de detalle del tour específico.

---

## 🔍 3. DETALLE DE TOUR (`/tours/[id]`)

La pantalla donde el usuario se convence y toma acción.

### 3.1 Información General
- **Galería de Imágenes:** Carrusel visual de los destinos.
- **Título, Código y Descripción corta.**
- **Etiquetas:** "Vuelos Incluidos", "Guía en Español", etc.

### 3.2 Pestañas de Navegación del Tour
- **Itinerario:** Muestra el plan día a día. Se puede expandir cada día para leer actividades.
- **Incluye / No Incluye:** Lista detallada de servicios amparados.
- **Fechas y Precios:** Tabla con las próximas salidas disponibles y sus costos en base a ocupación (Doble, Sencilla, etc.).

### 3.3 Acciones (Sidebar derecho o Sticky bar en Móvil)
- **Resumen de Precio.**
- **Botón "Cotizar Tour":** Redirige al formulario de cotización llevando el ID del paquete seleccionado.
- **Botón "Descargar PDF":** Genera un folleto digital del itinerario para que el cliente lo guarde o comparta.

---

## 📝 4. MÓDULO DE COTIZACIONES (`/cotizar-tour`)

### 4.1 Formulario de Cotización
- **Datos del Viajero:** Nombre, Email, Teléfono (se autocompletan si el usuario tiene sesión).
- **Detalles del Viaje:** 
  - Fecha de salida deseada (selector).
  - Número de pasajeros (Adultos, Menores).
  - Tipo de habitación.
- **Requerimientos Especiales:** Caja de texto libre para alergias, solicitudes de asientos, etc.
- **Botón "Solicitar Cotización":** Envía la petición a la base de datos y al administrador.

### 4.2 Confirmación (`/cotizacion/[folio]`)
- Muestra el **Folio de Cotización** (ej. `COT-10293`).
- **Estado de Cotización:** "Pendiente", "Aprobada", "Rechazada".
- **Botón "Descargar PDF":** Genera un documento formal de cotización con diseño institucional.
- **Si requiere Aprobación (Usuarios Corporativos):** Muestra el flujo de autorización pendiente por su Manager.

---

## 💳 5. GESTIÓN DE RESERVAS Y PAGOS (`/mis-reservas`)

### 5.1 Listado de Reservas
- Tarjetas con el estado actual: "Pendiente de Pago", "Confirmada", "Viaje Activo", "Completado".
- **Botón "Ver Detalles":** Abre la vista profunda de la reserva.

### 5.2 Detalle de Reserva (`/reserva/[id]`)
- **Resumen Financiero:** Total a pagar, monto pagado, saldo pendiente.
- **Botón "Descargar PDF Oficial":** Documento premium con Logo AS, sello dorado y términos.
- **Botón "Pagar Ahora":** Abre el portal de Checkout.

### 5.3 Checkout (`/checkout/[id]`)
- **Selección de Método:** Stripe (Tarjeta de Crédito), PayPal, MercadoPago.
- **Botón "Procesar Pago":** Ejecuta la transacción en entorno seguro.
- Tras el éxito, se habilita el **Botón "Descargar Comprobante"** (PDF con sello verde de "PAGADO").

---

## 🏢 6. PORTAL ADMINISTRATIVO Y CORPORATIVO

Acceso restringido según el rol (MANAGER, ADMIN, SUPER_ADMIN).

### 6.1 Aprobaciones (`/approvals`) - *Para MANAGER y ADMIN*
- Lista de cotizaciones de empleados esperando Visto Bueno.
- **Botón "Aprobar":** Cambia el estado, crea la reserva formal y notifica al empleado.
- **Botón "Rechazar":** Abre modal para escribir motivo de rechazo y notifica.

### 6.2 Dashboard Ejecutivo (`/dashboard`) - *Para ADMIN*
- **Tarjetas de KPIs:** Gasto total, Presupuesto consumido, Viajes activos.
- **Gráficas (Recharts):** Gasto por Centro de Costo, Viajes por mes.
- **Gestión de Empleados:** Botones para `Agregar Usuario`, `Editar Rol`.
- **Políticas de Viaje:** Configurar límites de gasto y flujos de aprobación.

### 6.3 CRM y Comunicación Omnicanal (`/admin/comunicacion`)
- Bandeja de entrada de solicitudes.
- **Botón "Enviar Mensaje":** Abre selector para mandar un Email, WhatsApp o SMS al cliente, utilizando plantillas predefinidas.
- **Historial de Interacciones:** Línea de tiempo que muestra todo lo enviado al cliente.

---

## ⚙️ 7. GESTOR DE CONTENIDO Y SCRAPING (`/admin/megatravel-scraping`)

*Exclusivo para SUPER_ADMIN.*

### 7.1 Panel de Sincronización
- **Botón "Sincronización Total":** Inicia la actualización masiva de todos los catálogos del proveedor. *Muestra barra de progreso.*
- **Botón "Sincronizar por ID":** Campo de texto para poner un código (`MT-12345`) y actualizar solo ese tour.
- **Logs del Sistema:** Caja de texto en vivo que muestra qué paquetes se están insertando/actualizando.

### 7.2 Gestión de Paquetes
- **Tabla de Tours:** Lista de todo lo guardado en la base de datos.
- **Toggle (Switch) "Activo/Inactivo":** Para ocultar manualmente un paquete que no se desea vender.
- **Botón "Forzar Normalización":** Asegura que todos los códigos de proveedor se conviertan al estándar `AS-XXXXX` en visualización.

---

## 📱 8. COMPORTAMIENTO MÓVIL (RESPONSIVE)
Todas las vistas anteriores están optimizadas.
- El menú principal colapsa en un **Menú de Hamburguesa**.
- Los filtros del catálogo (`/tours`) se ocultan en un botón flotante **"Filtros"** que abre un modal desde abajo (BottomSheet).
- Las tablas en los Dashboards se transforman en listas apiladas o tarjetas para lectura fácil en vertical.

---
*Fin del Manual de Funciones*
