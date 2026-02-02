# 📊 REPORTE DE DIAGNÓSTICO: Tours MegaTravel

**Fecha:** 01 de Febrero de 2026 - 20:35 CST  
**Análisis:** Clasificaciones, Imágenes y Paginación

---

## 🏷️ CLASIFICACIONES Y TAGS

### ✅ **Clasificaciones Encontradas en Breadcrumbs:**

MegaTravel **SÍ** clasifica sus tours en los breadcrumbs del menú. Encontramos:

**Categorías Especiales:**
- ✅ **Quinceañeras 2026** (exacto)
- ✅ **Luna de miel** (bodas)
- ✅ **Ofertas de Semana Santa** (exacto)
- ✅ **Viajes en Oferta** (ofertas)
- ✅ **Preventa Viajes 2026** (ofertas)

**Categorías por Destino:**
- Viajes a Europa
- Viajes a Turquía
- Asia
- Viajes a Japón
- Viajes a Corea
- Europa Cat. Superior (EXA)
- Canadá
- Estados Unidos
- México
- Medio Oriente
- Sudamérica
- Cruceros
- África
- Centroamérica
- Caribe

**Categorías por Tipo:**
- Eventos Deportivos
- Pasión Futbolera 2026
- Grupos y FITS
- Salidas desde Guadalajara
- Salidas desde Monterrey
- Salidas desde Estados Unidos

### ❌ **NO Encontrado:**
- No hay badges/etiquetas visibles en las páginas de tour
- No hay Schema.org con categorías
- No hay clases CSS que indiquen clasificación
- Las clasificaciones solo están en la navegación (breadcrumbs)

### 🔍 **Cómo Identificar Clasificaciones:**

**Opción 1: Por URL de Origen**
- Si el tour viene de `/quinceañeras-2026` → Tag: Quinceañeras
- Si viene de `/ofertas-semana-santa` → Tag: Semana Santa
- Si viene de `/luna-de-miel` → Tag: Bodas

**Opción 2: Por Análisis de Texto**
- Buscar palabras clave en título/descripción
- Ejemplo: "quinceañera", "15 años", "boda", "luna de miel"

**Opción 3: Manual (Recomendado)**
- Crear campo `tags` en nuestra BD
- Asignar manualmente al importar/revisar tours
- Permite control total de clasificación

---

## 📸 IMÁGENES

### ✅ **Imágenes Encontradas:**

**Patrón de URLs:**
```
https://one.cdnmega.com/images/viajes/covers/[nombre]-[id].webp
```

**Ejemplo Tour "Mediterráneo Azamara Onward":**
- Imagen 1: `https://one.cdnmega.com/images/viajes/covers/16200-bellezasdeeuropa-1024x575_6614223e506d1.webp`
- Imagen 2: `https://one.cdnmega.com/images/viajes/covers/amazara-onward_623cbfee7aab2.webp`

**Total:** 2 imágenes por tour (promedio)

### ❌ **Problema Actual:**

El `MegaTravelScrapingService.ts` **NO extrae imágenes**. Solo extrae:
- Itinerario
- Fechas de salida
- Políticas
- Información adicional
- Tours opcionales

**FALTA:** Función `scrapeImages()` que busque:
```javascript
$('img[src*="cdnmega.com/images/viajes"]')
```

---

## 📄 PAGINACIÓN

### ✅ **Estado Actual:**

**API (`/api/groups`):**
- ✅ **Soporta paginación** con parámetros `limit` y `offset`
- ✅ Límite por defecto: **50 tours**
- ✅ Retorna metadata: `total`, `hasMore`

```typescript
const limit = parseInt(searchParams.get('limit') || '50')
const offset = parseInt(searchParams.get('offset') || '0')
```

**Frontend (`/tours/page.tsx`):**
- ❌ **NO implementa paginación**
- ❌ Muestra TODOS los tours en una sola página
- ❌ No hay controles "Siguiente/Anterior"
- ❌ No hay "Cargar más"

### 📊 **Impacto:**

Con 325 tours en BD:
- Sin filtro: Muestra 50 tours (límite del API)
- Con filtro región: Muestra todos los de esa región
- **Problema:** Si una región tiene >50 tours, solo muestra 50

### 🛠️ **Solución Recomendada:**

**Opción A: Paginación Clásica (Recomendado)**
```
[1] [2] [3] ... [7] [Siguiente >]
```
- Mostrar 20 tours por página
- Controles de navegación
- Mejor para SEO

**Opción B: Infinite Scroll**
```
[Cargar más tours...]
```
- Cargar 20 tours iniciales
- Botón "Cargar más" al final
- Mejor UX móvil

**Opción C: Híbrido**
```
Mostrar 20 iniciales + [Ver todos los 325 tours]
```
- Balance entre UX y performance

---

## 📋 RESUMEN Y RECOMENDACIONES

### 1️⃣ **CLASIFICACIONES**

**Acción Inmediata:**
- [ ] Agregar campo `classification_tags` (ARRAY) a `megatravel_packages`
- [ ] Crear función para extraer tags de breadcrumbs durante scraping
- [ ] Mapear breadcrumbs a nuestras categorías:
  ```
  "Quinceañeras 2026" → ["quinceañeras", "eventos-especiales"]
  "Luna de miel" → ["bodas", "luna-de-miel", "romantico"]
  "Ofertas de Semana Santa" → ["semana-santa", "ofertas"]
  ```

**Filtros en Frontend:**
- Usar tags para filtrar en `/tours`
- Mostrar badges en cards de tours
- Permitir búsqueda por tag

### 2️⃣ **IMÁGENES**

**Acción Inmediata:**
- [ ] Agregar función `scrapeImages()` a `MegaTravelScrapingService.ts`
- [ ] Selector: `$('img[src*="cdnmega.com/images/viajes"]')`
- [ ] Guardar en `main_image` y `gallery_images`
- [ ] Re-sincronizar 317 tours sin imágenes

### 3️⃣ **PAGINACIÓN**

**Acción Inmediata:**
- [ ] Implementar paginación en `/tours/page.tsx`
- [ ] Usar 20 tours por página (recomendado)
- [ ] Agregar controles de navegación
- [ ] Mantener filtros al cambiar página

---

## 🚀 PRÓXIMOS PASOS

**Prioridad ALTA:**
1. ✅ Agregar scraping de imágenes
2. ✅ Re-sincronizar tours sin imágenes
3. ✅ Implementar paginación

**Prioridad MEDIA:**
4. Agregar sistema de tags/clasificaciones
5. Migrar breadcrumbs a tags

**Prioridad BAJA:**
6. Optimizar carga de imágenes (lazy loading)
7. Agregar filtros avanzados

---

**¿Proceder con las correcciones?**
