# 🚀 Plan de Implementación: Scraping Completo de MegaTravel

**Fecha:** 31 Ene 2026 - 22:10 CST  
**Objetivo:** Obtener TODA la información de MegaTravel mediante scraping mejorado  
**Deadline:** Presentación la próxima semana

---

## 📋 INFORMACIÓN FALTANTE A OBTENER

### 1. ✅ Itinerario Completo (PRIORIDAD ALTA)
**Qué necesitamos:**
- Día por día del tour
- Título de cada día
- Descripción detallada de actividades
- Comidas incluidas por día (D/A/C)
- Hotel de cada noche
- Ciudades visitadas por día

**Dónde está:**
- En la página de detalle de cada tour
- Sección "Itinerario" o "Día a Día"
- HTML: `<div class="itinerary">` o similar

**Tabla nueva:** `megatravel_itinerary`
```sql
CREATE TABLE megatravel_itinerary (
    id SERIAL PRIMARY KEY,
    package_id INTEGER REFERENCES megatravel_packages(id),
    day_number INTEGER NOT NULL,
    title VARCHAR(500),
    description TEXT,
    meals VARCHAR(50), -- 'D,A,C' o 'D,A' etc
    hotel VARCHAR(500),
    city VARCHAR(200),
    activities TEXT[], -- Array de actividades
    created_at TIMESTAMP DEFAULT NOW(),
    updated_at TIMESTAMP DEFAULT NOW()
);
```

---

### 2. ✅ Fechas de Salida (PRIORIDAD ALTA)
**Qué necesitamos:**
- Calendario de salidas disponibles
- Fecha de inicio
- Fecha de fin
- Precio específico por fecha (si varía)
- Disponibilidad (cupos)
- Estado (confirmada, por confirmar, agotada)

**Dónde está:**
- En la página de detalle
- Sección "Fechas de salida" o "Calendario"
- Puede ser un calendario interactivo o tabla

**Tabla nueva:** `megatravel_departures`
```sql
CREATE TABLE megatravel_departures (
    id SERIAL PRIMARY KEY,
    package_id INTEGER REFERENCES megatravel_packages(id),
    departure_date DATE NOT NULL,
    return_date DATE,
    price_usd DECIMAL(10,2),
    price_variation DECIMAL(10,2), -- Diferencia vs precio base
    availability VARCHAR(50), -- 'available', 'limited', 'sold_out'
    status VARCHAR(50), -- 'confirmed', 'pending', 'cancelled'
    min_passengers INTEGER,
    max_passengers INTEGER,
    current_passengers INTEGER,
    notes TEXT,
    created_at TIMESTAMP DEFAULT NOW(),
    updated_at TIMESTAMP DEFAULT NOW()
);
```

---

### 3. ✅ Políticas (PRIORIDAD MEDIA)
**Qué necesitamos:**
- Política de cancelación
- Política de cambios
- Política de pagos
- Términos y condiciones
- Requisitos de documentos

**Dónde está:**
- En la página de detalle
- Sección "Políticas" o "Términos y Condiciones"
- Puede estar en un PDF o en HTML

**Tabla nueva:** `megatravel_policies`
```sql
CREATE TABLE megatravel_policies (
    id SERIAL PRIMARY KEY,
    package_id INTEGER REFERENCES megatravel_packages(id),
    cancellation_policy TEXT,
    change_policy TEXT,
    payment_policy TEXT,
    terms_conditions TEXT,
    document_requirements TEXT[],
    visa_requirements TEXT[],
    vaccine_requirements TEXT[],
    insurance_requirements TEXT,
    age_restrictions TEXT,
    health_requirements TEXT,
    created_at TIMESTAMP DEFAULT NOW(),
    updated_at TIMESTAMP DEFAULT NOW()
);
```

---

### 4. ✅ Información Adicional (PRIORIDAD MEDIA)
**Qué necesitamos:**
- Notas importantes
- Recomendaciones
- Qué llevar
- Clima esperado
- Moneda local
- Idioma
- Zona horaria

**Tabla nueva:** `megatravel_additional_info`
```sql
CREATE TABLE megatravel_additional_info (
    id SERIAL PRIMARY KEY,
    package_id INTEGER REFERENCES megatravel_packages(id),
    important_notes TEXT[],
    recommendations TEXT[],
    what_to_bring TEXT[],
    climate_info TEXT,
    local_currency VARCHAR(50),
    language VARCHAR(100),
    timezone VARCHAR(100),
    voltage VARCHAR(50),
    emergency_contacts JSONB,
    created_at TIMESTAMP DEFAULT NOW(),
    updated_at TIMESTAMP DEFAULT NOW()
);
```

---

## 🛠️ MODIFICACIONES NECESARIAS

### 1. `MegaTravelSyncService.ts`

**Funciones nuevas a agregar:**

```typescript
// Scraping de itinerario
async function scrapeItinerary(tourUrl: string): Promise<ItineraryDay[]>

// Scraping de fechas de salida
async function scrapeDepartures(tourUrl: string): Promise<Departure[]>

// Scraping de políticas
async function scrapePolicies(tourUrl: string): Promise<Policies>

// Scraping de información adicional
async function scrapeAdditionalInfo(tourUrl: string): Promise<AdditionalInfo>

// Función principal mejorada
async function syncPackageComplete(packageCode: string): Promise<void>
```

**Estrategia de scraping:**
1. Usar `cheerio` para parsear HTML
2. Identificar selectores CSS para cada sección
3. Extraer datos estructurados
4. Validar y limpiar datos
5. Almacenar en base de datos

---

### 2. Migraciones de Base de Datos

**Archivos a crear:**
- `migrations/020_create_megatravel_itinerary.sql`
- `migrations/021_create_megatravel_departures.sql`
- `migrations/022_create_megatravel_policies.sql`
- `migrations/023_create_megatravel_additional_info.sql`

---

### 3. Frontend

**Componentes a modificar:**

**`/tours/[code]/page.tsx`:**
- ✅ Sección de itinerario completo (ya existe preview)
- ✅ Calendario de fechas de salida
- ✅ Sección de políticas
- ✅ Información adicional

**Nuevos componentes:**
- `TourItineraryFull.tsx` - Itinerario completo expandible
- `TourDeparturesCalendar.tsx` - Calendario de salidas
- `TourPolicies.tsx` - Políticas y términos
- `TourAdditionalInfo.tsx` - Información adicional

---

## 📅 CRONOGRAMA

### Día 1 (Hoy - 31 Ene)
- ✅ Crear migraciones de base de datos
- ✅ Ejecutar migraciones
- ✅ Modificar `MegaTravelSyncService.ts` - Parte 1 (Itinerario)

### Día 2 (1 Feb)
- ✅ Modificar `MegaTravelSyncService.ts` - Parte 2 (Fechas y Políticas)
- ✅ Probar scraping con tours reales
- ✅ Ajustar selectores CSS según sea necesario

### Día 3 (2 Feb)
- ✅ Crear componentes de frontend
- ✅ Integrar con API
- ✅ Probar visualización

### Día 4 (3 Feb)
- ✅ Sincronizar todos los tours
- ✅ Verificar datos
- ✅ Ajustes finales

---

## 🎯 ENTREGABLES

1. **Base de datos actualizada** con 4 nuevas tablas
2. **Servicio de scraping mejorado** que obtiene toda la información
3. **Frontend actualizado** mostrando todos los datos
4. **Documentación** de cómo funciona el sistema

---

## ⚠️ RIESGOS Y MITIGACIONES

**Riesgo 1:** MegaTravel cambia estructura HTML
- **Mitigación:** Usar múltiples selectores alternativos
- **Plan B:** Datos de ejemplo para demo

**Riesgo 2:** Scraping es muy lento
- **Mitigación:** Hacer scraping en background
- **Mitigación:** Cachear resultados

**Riesgo 3:** Algunos datos no están en HTML
- **Mitigación:** Marcar como "No disponible"
- **Plan B:** Entrada manual para tours importantes

---

## 🚀 EMPEZAMOS AHORA

¿Listo para empezar? Voy a:
1. Crear las migraciones
2. Ejecutarlas
3. Modificar el servicio de scraping
4. Probar con un tour real
5. Actualizar frontend

**¿Procedemos?** 🚀
