# 🎯 ESTRATEGIA DE CLASIFICACIÓN POR URL DE ORIGEN

**Fecha:** 01 Feb 2026 - 21:05 CST

---

## ✅ HALLAZGO CONFIRMADO

MegaTravel **SÍ tiene páginas específicas** para clasificaciones:

### **URLs de Clasificación Encontradas:**

```
https://www.megatravel.com.mx/quinceaneras-2026
https://www.megatravel.com.mx/luna-de-miel
https://www.megatravel.com.mx/ofertas-semana-santa
https://www.megatravel.com.mx/eventos-deportivos
https://www.megatravel.com.mx/grupos-y-fits
https://www.megatravel.com.mx/cruceros
https://www.megatravel.com.mx/preventa-viajes-2026
https://www.megatravel.com.mx/viajes-europa
https://www.megatravel.com.mx/viajes-asia
https://www.megatravel.com.mx/medio-oriente
```

---

## 💡 SOLUCIÓN: Mapeo URL → Tags

### **Paso 1: Guardar URL de Origen**

Cuando descubrimos tours, guardamos la **página de listado** donde se encontró:

```javascript
// Durante scraping de listado
const tour = {
  mt_code: 'MT-12115',
  mt_url: 'https://www.megatravel.com.mx/viaje/...',
  source_url: 'https://www.megatravel.com.mx/quinceaneras-2026', // ← NUEVO
  name: 'Quinceañeras a Europa',
  // ... resto de datos
}
```

### **Paso 2: Mapeo de URLs a Tags**

```javascript
const URL_TO_TAGS = {
  '/quinceaneras-2026': {
    tags: ['quinceañeras', 'eventos-especiales', 'grupos'],
    event_type: 'quinceañeras',
    is_featured: true
  },
  '/luna-de-miel': {
    tags: ['bodas', 'luna-de-miel', 'romantico', 'parejas'],
    event_type: 'bodas',
    is_featured: false
  },
  '/ofertas-semana-santa': {
    tags: ['semana-santa', 'ofertas', 'vacaciones'],
    event_type: 'semana-santa',
    is_offer: true
  },
  '/eventos-deportivos': {
    tags: ['deportes', 'eventos-especiales'],
    event_type: 'deportes',
    is_featured: false
  },
  '/grupos-y-fits': {
    tags: ['grupos', 'viajes-grupales'],
    event_type: 'grupos',
    is_featured: false
  },
  '/cruceros': {
    tags: ['cruceros', 'todo-incluido'],
    category: 'cruceros',
    is_featured: false
  },
  '/preventa-viajes-2026': {
    tags: ['ofertas', 'preventa', '2026'],
    is_offer: true,
    is_featured: true
  },
  '/viajes-europa': {
    tags: ['europa'],
    region: 'Europa'
  },
  '/viajes-asia': {
    tags: ['asia'],
    region: 'Asia'
  },
  '/medio-oriente': {
    tags: ['medio-oriente'],
    region: 'Medio Oriente'
  }
}
```

### **Paso 3: Aplicar Tags Automáticamente**

```javascript
function applyTagsFromSourceUrl(tour) {
  const sourceUrl = tour.source_url || ''
  
  // Buscar coincidencia en el mapeo
  for (const [urlPattern, config] of Object.entries(URL_TO_TAGS)) {
    if (sourceUrl.includes(urlPattern)) {
      // Aplicar tags
      tour.tags = [...(tour.tags || []), ...(config.tags || [])]
      
      // Aplicar configuraciones
      if (config.event_type) tour.event_type = config.event_type
      if (config.is_offer !== undefined) tour.is_offer = config.is_offer
      if (config.is_featured !== undefined) tour.is_featured = config.is_featured
      if (config.category) tour.category = config.category
      if (config.region) tour.destination_region = config.region
      
      break // Solo aplicar el primer match
    }
  }
  
  return tour
}
```

---

## 📋 IMPLEMENTACIÓN

### **Cambios Necesarios:**

#### **1. Base de Datos**
```sql
-- Agregar campo para guardar URL de origen
ALTER TABLE megatravel_packages 
ADD COLUMN source_url TEXT;

-- Agregar campo para tipo de evento
ALTER TABLE megatravel_packages 
ADD COLUMN event_type TEXT;

-- Índice para búsquedas rápidas
CREATE INDEX idx_megatravel_event_type ON megatravel_packages(event_type);
CREATE INDEX idx_megatravel_source_url ON megatravel_packages(source_url);
```

#### **2. Script de Scraping**

Modificar el scraping para:
1. Recorrer cada URL de clasificación
2. Guardar `source_url` para cada tour encontrado
3. Aplicar tags automáticamente

```javascript
const CLASSIFICATION_URLS = [
  'https://www.megatravel.com.mx/quinceaneras-2026',
  'https://www.megatravel.com.mx/luna-de-miel',
  'https://www.megatravel.com.mx/ofertas-semana-santa',
  'https://www.megatravel.com.mx/eventos-deportivos',
  'https://www.megatravel.com.mx/grupos-y-fits',
  'https://www.megatravel.com.mx/cruceros',
  'https://www.megatravel.com.mx/preventa-viajes-2026'
]

for (const classificationUrl of CLASSIFICATION_URLS) {
  const tours = await scrapeTourList(classificationUrl)
  
  for (const tour of tours) {
    tour.source_url = classificationUrl // ← Guardar origen
    tour = applyTagsFromSourceUrl(tour) // ← Aplicar tags
    await saveTour(tour)
  }
}
```

#### **3. Frontend - Filtros**

```typescript
// En /tours/page.tsx
const [eventFilter, setEventFilter] = useState<string | null>(null)

// Filtrar por evento
const filteredByEvent = eventFilter 
  ? packages.filter(p => p.event_type === eventFilter)
  : packages

// Tabs de eventos
<Tabs value={eventFilter} onValueChange={setEventFilter}>
  <TabsList>
    <TabsTrigger value={null}>Todos los Tours</TabsTrigger>
    <TabsTrigger value="ofertas">OFERTAS Especiales</TabsTrigger>
    <TabsTrigger value="quinceañeras">Quinceañeras</TabsTrigger>
    <TabsTrigger value="bodas">Luna de Miel</TabsTrigger>
    <TabsTrigger value="semana-santa">Semana Santa</TabsTrigger>
  </TabsList>
</Tabs>
```

---

## 🎯 VENTAJAS DE ESTA ESTRATEGIA

✅ **Automático** - No requiere clasificación manual
✅ **Preciso** - Usa la clasificación de MegaTravel
✅ **Escalable** - Funciona para todos los tours
✅ **Mantenible** - Fácil agregar nuevas clasificaciones
✅ **Confiable** - Basado en datos reales de MegaTravel

---

## 📊 EJEMPLO REAL

**Tour encontrado en:**
```
https://www.megatravel.com.mx/quinceaneras-2026
```

**Tour individual:**
```
MT-12115: Quinceañeras a Europa
https://www.megatravel.com.mx/viaje/quinceaneras-europa-12115.html
```

**Tags aplicados automáticamente:**
```javascript
{
  mt_code: 'MT-12115',
  source_url: 'https://www.megatravel.com.mx/quinceaneras-2026',
  tags: ['quinceañeras', 'eventos-especiales', 'grupos', 'europa'],
  event_type: 'quinceañeras',
  is_featured: true
}
```

---

## ⚡ PRÓXIMOS PASOS

1. **Agregar campos a BD** (`source_url`, `event_type`)
2. **Actualizar script de scraping** para recorrer URLs de clasificación
3. **Implementar mapeo** URL → Tags
4. **Re-sincronizar tours** con nueva lógica
5. **Implementar filtros** en frontend

---

## ❓ PREGUNTA

**¿Proceder con esta estrategia?**

**A)** SÍ - Implementar ahora (1-2 horas de trabajo)
**B)** Primero hacer prueba con 5 tours
**C)** Ajustar algo antes de implementar

**Mi recomendación:** Opción **B** - Probar primero con muestra pequeña
