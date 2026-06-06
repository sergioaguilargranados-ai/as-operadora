# 📖 AG-Guia-Practica-Usuarios - AS Operadora

**Última actualización:** 06 de Junio de 2026 - 09:30 CST  
**Versión actual:** v2.342 (Referencia)  
**Propósito:** Guía práctica detallada para usuarios y administradores, diseñada para facilitar las pruebas del aplicativo, mostrar todas las funcionalidades y explicar la configuración en el gestor de contenido.

---

## 👥 1. NIVELES DE USUARIO Y ALCANCE PROGRAMADO

El sistema maneja 4 niveles de acceso principales, cada uno con alcances y permisos específicos:

### 1.1 SUPER_ADMIN (Acceso Total)
- **Alcance:** Control absoluto de la plataforma.
- **Qué puede ver y operar:**
  - Todas las configuraciones del sistema (gestor de contenido, scraping, sincronización).
  - Todos los reportes corporativos y financieros.
  - Creación y edición de cuentas de cualquier nivel.
  - Centro de comunicación omnicanal completo.
  - Gestión integral de bases de datos de viajes, cotizaciones y pagos.

### 1.2 ADMIN (Administrador Corporativo)
- **Alcance:** Gestión a nivel empresa / corporativo.
- **Qué puede ver y operar:**
  - Dashboard corporativo completo (métricas de gastos, viajes activos).
  - Gestión de empleados y configuración de políticas de viaje de la empresa.
  - Visualización de todas las reservas y cotizaciones de su empresa.
  - Aprobación o rechazo de viajes de sus empleados.
  - Gestión de centros de costo.

### 1.3 MANAGER (Aprobador)
- **Alcance:** Gestión de su equipo directo.
- **Qué puede ver y operar:**
  - Dashboard resumido de su equipo.
  - Aprobaciones de solicitudes de viaje de sus subordinados.
  - Visualización de reservas de los empleados a su cargo.
  - No puede cambiar configuraciones del sistema ni de la empresa en general.

### 1.4 EMPLOYEE (Empleado / Viajero)
- **Alcance:** Autogestión de viajes individuales.
- **Qué puede ver y operar:**
  - Búsqueda de tours y vuelos en el catálogo general.
  - Módulo "Mis Reservas" (historial, detalles, descarga de PDFs).
  - Solicitudes de cotización de tours (que requieren aprobación si aplica la política).
  - Realizar pagos (Stripe, PayPal, MercadoPago) y descargar comprobantes.

---

## 🚀 2. GUÍA DE PRUEBAS DEL APLICATIVO

A continuación, los flujos recomendados para probar la plataforma completa:

### Flujo 1: Búsqueda y Cotización (Empleado)
1. Iniciar sesión con un usuario **EMPLOYEE**.
2. Ir a la sección de **Tours** (`/tours`).
3. Utilizar los filtros de búsqueda (nombre, país, región) para encontrar un paquete.
4. Entrar al detalle del tour y hacer clic en **Cotizar**.
5. Llenar el formulario de cotización (los datos personales deberían autocompletarse en parte).
6. Revisar en su panel de "Mis Cotizaciones" el estado de la solicitud.

### Flujo 2: Aprobación (Manager / Admin)
1. Iniciar sesión con un **MANAGER** o **ADMIN**.
2. Ir al apartado de **Aprobaciones Pendientes**.
3. Revisar la cotización recién generada por el Empleado.
4. Aprobar la solicitud.
5. El sistema automáticamente generará una Reserva a partir de la cotización y enviará un correo (Communication Center).

### Flujo 3: Pagos y Reservas (Empleado)
1. Volver a iniciar sesión como **EMPLOYEE**.
2. Ir a **Mis Reservas** (`/mis-reservas`).
3. Seleccionar la reserva recién aprobada (`/reserva/[id]`).
4. Descargar el **PDF Oficial de Reserva** para verificar el diseño (Logo AS, sellos, T&C).
5. Proceder al pago usando cualquiera de las pasarelas integradas.
6. Descargar el **PDF de Comprobante de Pago** con el sello verde "PAGO COMPLETADO".

### Flujo 4: Dashboard y Reportes (Admin)
1. Iniciar sesión como **ADMIN**.
2. Ir al **Dashboard Ejecutivo**.
3. Verificar que las gráficas y métricas de gastos se hayan actualizado con la nueva reserva.
4. Probar la gestión de **Políticas de Viaje** y **Centros de Costo**.

---

## ⚙️ 3. CONFIGURACIÓN EN EL GESTOR DE CONTENIDO (NIVEL ADMIN/SUPER ADMIN)

El Gestor de Contenido y Sincronización es el motor que alimenta los paquetes turísticos. Está pensado para uso exclusivo del **SUPER_ADMIN** y **ADMIN**.

### 3.1 Sincronización (Scraping de MegaTravel)
1. En el panel de Administración, ir a **Gestor de Contenido / Scraping**.
2. **Acciones Disponibles:**
   - **Sincronización Total:** Fuerza una actualización completa de todos los tours, itinerarios y precios (esto puede tomar varios minutos).
   - **Sincronización Parcial/Por Tour:** Permite actualizar un ID específico si hay cambios urgentes en precios.
3. **Puntos a Validar:**
   - Que los IDs de los tours de proveedor (ej. `MT-12345`) se muestren al cliente como `AS-12345` en toda la plataforma (catálogo, PDFs, correos).

### 3.2 Gestión del Catálogo
1. Ir a la sección de **Gestión de Tours/Paquetes**.
2. **Acciones:**
   - **Ocultar/Mostrar:** Si un paquete ya no está disponible, se puede desactivar para que no aparezca en el catálogo público.
   - **Editar Descripciones (Opcional):** Modificar detalles adicionales o notas importantes que deban aparecer en el PDF o en la web.
   - **Precios Dinámicos:** Verificar que el sistema esté aplicando correctamente cualquier margen de ganancia o ajuste definido a nivel sistema.

### 3.3 Centro de Comunicación Omnicanal
1. En el panel Admin, ir a **Comunicaciones** o **CRM**.
2. Configurar las plantillas de correos.
3. Verificar el historial de mensajes (Email, WhatsApp, SMS) enviados a los clientes.
4. **Prueba:** Enviar un mensaje manual o reenviar una confirmación de reserva a un cliente desde este panel y verificar la recepción.

---

## 📝 4. NOTAS ADICIONALES PARA LAS PRUEBAS
- **Datos Reales:** Al probar pasarelas de pago, usar siempre las tarjetas de prueba provistas por Stripe/PayPal (modo sandbox) a menos que se indique explícitamente estar en producción.
- **Correos:** El envío de correos está habilitado (SendGrid). Si prueba con su correo personal, revise la carpeta de SPAM por si acaso.
- **Credenciales por defecto:** Recuerde usar la contraseña estándar de pruebas `Password123!` si necesita acceder a cuentas ya generadas en la base de datos (Neon).

---
*Este documento es parte de la base de conocimientos viva de AS Operadora.*
