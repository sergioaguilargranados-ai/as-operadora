# Plan de Corrección - Problemas Tours v2.291

**Fecha:** 01 Feb 2026 - 22:45 CST

## 🐛 PROBLEMAS IDENTIFICADOS

### 1. ✅ Solo muestra 50 tours (hay 325 en DB)
**Problema:** El API `/api/groups` devuelve solo 50 por defecto
**Causa:** Paginación en línea 105: `formattedPackages.slice(offset, offset + limit)`
**Solución:** 
- Cambiar `limit` default de 50 a 1000 (o eliminar paginación)
- O implementar scroll infinito en frontend

### 2. ✅ Filtros de región muestran (0) y están deshabilitados
**Problema:** Cuenta tours en `allPackages` pero solo tiene 50 tours cargados
**Causa:** Línea 304 usa `p.region` pero debería usar `p.destination_region`
**Solución:**
- Cambiar `p.region` → `p.destination_region`
- Quitar `disabled` para permitir selección siempre
- Hacer query a DB en vez de contar en memoria

### 3. ✅ Filtros de eventos muestran (0)
**Problema:** Mismo que #2, cuenta en memoria con solo 50 tours
**Solución:**
- Quitar `disabled`
- Permitir selección siempre

### 4. ✅ Error al escribir en búsqueda
**Problema:** "Application error: a client-side exception has occurred"
**Causa:** Probablemente error en `applyAllFilters()` cuando `search` cambia
**Solución:**
- Revisar función `applyAllFilters()`
- Agregar try/catch
- Ver console.log del error

### 5. ✅ Solo 5 de 50 tours tienen precio
**Problema:** Campo `sale_price_usd` está null en la mayoría
**Causa:** Re-sync no extrajo todos los precios
**Solución:**
- Verificar en DB cuántos tienen precio
- Re-ejecutar scraping de precios
- Mostrar "Consultar precio" si es null

### 6. ✅ "Ver itinerario completo" dice "Por implementar"
**Problema:** Modal no implementado
**Causa:** Código placeholder
**Solución:**
- Implementar modal con itinerario completo
- Mostrar todos los días del array `itinerary`

### 7. ✅ Listas cortas de incluye/no incluye
**Problema:** Solo muestra 6-7 items
**Causa:** Array `includes` y `not_includes` tienen pocos items
**Solución:**
- Verificar en DB si están completos
- Re-ejecutar scraping de includes/not_includes
- Verificar que el scraper extraiga todo el HTML

---

## 📝 ORDEN DE IMPLEMENTACIÓN

1. **CRÍTICO** - Problema #1: Cargar todos los tours (325)
2. **CRÍTICO** - Problema #4: Fix error de búsqueda
3. **ALTO** - Problema #2 y #3: Fix filtros de región/eventos
4. **MEDIO** - Problema #5: Mostrar "Consultar precio" si null
5. **MEDIO** - Problema #6: Implementar modal itinerario
6. **BAJO** - Problema #7: Verificar scraping de includes

---

## 🔧 CAMBIOS A REALIZAR

### Archivo: `src/app/api/groups/route.ts`
```typescript
// Línea 21: Cambiar limit default
const limit = parseInt(searchParams.get('limit') || '1000'); // Era 50
```

### Archivo: `src/app/tours/page.tsx`

#### Fix #1: Cargar todos los tours
```typescript
// Línea 282: Agregar limit=1000
let url = '/api/groups?limit=1000&'
```

#### Fix #2: Región usa campo correcto
```typescript
// Línea 304: Cambiar region → destination_region
const uniqueRegions = [...new Set(pkgs.map((p: TourPackage) => p.destination_region))].filter(Boolean)
```

#### Fix #3: Quitar disabled en filtros
```typescript
// Líneas 719-724: Quitar disabled
<button
    onClick={() => setSelectedRegion(region)}
    // disabled={count === 0}  // QUITAR ESTA LÍNEA
>
```

#### Fix #4: Try/catch en applyAllFilters
```typescript
// Agregar try/catch en función applyAllFilters
const applyAllFilters = () => {
    try {
        // ... código existente
    } catch (error) {
        console.error('Error en filtros:', error)
        setPackages(allPackages)
    }
}
```

#### Fix #5: Mostrar "Consultar precio"
```typescript
// En el card de tour, verificar si hay precio
{pkg.pricing?.totalPrice ? (
    <p className="text-2xl font-bold text-blue-600">
        ${pkg.pricing.totalPrice.toLocaleString()} USD
    </p>
) : (
    <p className="text-lg font-semibold text-gray-600">
        Consultar precio
    </p>
)}
```

---

## ✅ VERIFICACIONES POST-FIX

- [ ] Se cargan 325 tours
- [ ] Filtros de región funcionan
- [ ] Filtros de eventos funcionan
- [ ] Búsqueda no da error
- [ ] Tours sin precio muestran "Consultar precio"
- [ ] Modal de itinerario funciona
- [ ] Includes/not_includes completos
