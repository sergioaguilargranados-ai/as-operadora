# 🔗 Servicio Mega Conexión - Extracción Completa de Datos

**Fecha:** 05 de Febrero de 2026  
**Versión:** v2.301  
**Estado:** ✅ Implementado

---

## 🎯 **OBJETIVO**

Complementar el scraping de MegaTravel extrayendo datos que están más completos en las URLs de **Mega Conexión** (vi.php), especialmente:

1. **Itinerarios completos** (día por día)
2. **Ciudades** (para mostrar mapas)
3. **Precios faltantes**
4. **"No Incluye"** (actualmente solo 5.8% de tours lo tienen)

---

## 📊 **PROBLEMA IDENTIFICADO**

### Estado Actual (03 Feb 2026):
- ✅ 325 tours en base de datos
- ✅ 90.8% con precios (295 tours)
- ❌ 5.8% con "No Incluye" (19 tours)
- ⚠️ Itinerarios incompletos (HTML mezclado con tags)
- ⚠️ Muchos tours sin ciudades (mapas no se muestran)

### Causa Raíz:
El sitio público de MegaTravel tiene limitaciones técnicas:
- Solo muestra los primeros 3 días del itinerario
- HTML mezclado con JavaScript dificulta el parsing
- Algunos datos no están disponibles en todas las páginas

---

## 💡 **SOLUCIÓN: MEGA CONEXIÓN**

MegaTravel proporciona URLs especiales para agencias (`vi.php`) que contienen:
- ✅ Itinerarios completos
- ✅ Todas las ciudades
- ✅ Precios actualizados
- ✅ Lo que incluye Y lo que NO incluye
- ✅ Información más estructurada

### URLs de Mega Conexión:

```javascript
const MEGA_CONEXION_URLS = {
    ofertas: 'https://www.megatravel.com.mx/tools/ofertas-viaje.php',
    promociones: 'https://www.megatravel.com.mx/tools/vi.php',
    europa: 'https://www.megatravel.com.mx/tools/vi.php?Dest=1',
    medio_oriente: 'https://www.megatravel.com.mx/tools/vi.php?Dest=2',
    canada: 'https://www.megatravel.com.mx/tools/vi.php?Dest=3',
    asia: 'https://www.megatravel.com.mx/tools/vi.php?Dest=4',
    africa: 'https://www.megatravel.com.mx/tools/vi.php?Dest=5',
    pacifico: 'https://www.megatravel.com.mx/tools/vi.php?Dest=6',
    sudamerica: 'https://www.megatravel.com.mx/tools/vi.php?Dest=7',
    estados_unidos: 'https://www.megatravel.com.mx/tools/vi.php?Dest=8',
    centroamerica: 'https://www.megatravel.com.mx/tools/vi.php?Dest=9',
    cuba_caribe: 'https://www.megatravel.com.mx/tools/vi.php?Dest=10',
    nacionales: 'https://www.megatravel.com.mx/tools/vi.php?Dest=11',
    eventos: 'https://www.megatravel.com.mx/tools/vi.php?Dest=12',
    cruceros: 'https://www.megatravel.com.mx/tools/vi.php?Dest=13'
};
```

---

## 🔧 **IMPLEMENTACIÓN**

### Archivo Principal:
**`src/services/MegaConexionService.ts`**

### Funciones Principales:

#### 1. `scrapeFromMegaConexion(mtCode: string)`
Busca un tour específico en todas las categorías de Mega Conexión y extrae todos los datos.

```typescript
const data = await MegaConexionService.scrapeFromMegaConexion('MT-12534');
// Retorna: { itinerary, cities, countries, price_usd, taxes_usd, includes, not_includes }
```

#### 2. `updateTourFromMegaConexion(mtCode: string)`
Actualiza un tour en la base de datos con datos de Mega Conexión.

```typescript
const success = await MegaConexionService.updateTourFromMegaConexion('MT-12534');
// Actualiza: cities, countries, price_usd, taxes_usd, includes, not_includes, itinerary
```

#### 3. `updateAllToursFromMegaConexion()`
Actualiza todos los tours que necesitan datos (sin ciudades, sin "No Incluye", sin precio).

```typescript
await MegaConexionService.updateAllToursFromMegaConexion();
// Procesa hasta 50 tours que necesitan actualización
```

---

## 🚀 **USO**

### Opción 1: Actualizar un tour específico

```bash
npx tsx scripts/update-from-mega-conexion.js MT-12534
```

### Opción 2: Actualizar todos los tours que necesitan datos

```bash
npx tsx scripts/update-from-mega-conexion.js
```

### Opción 3: Probar extracción (sin guardar)

```bash
npx tsx scripts/test-mega-conexion.js
```

---

## 📋 **DATOS QUE EXTRAE**

### 1. **Itinerario Completo** ✅
- Día por día con número, título y descripción
- Detección automática de comidas (Desayuno, Almuerzo, Cena)
- Parser mejorado que maneja HTML mezclado

**Ejemplo:**
```javascript
{
  day_number: 1,
  title: "MÉXICO – CASABLANCA",
  description: "Presentarse en el aeropuerto...",
  meals: "Desayuno, Cena"
}
```

### 2. **Ciudades** ✅
- Extracción desde múltiples fuentes (título, descripción, secciones)
- Filtrado de nombres válidos (2-50 caracteres)
- Deduplicación automática

**Ejemplo:**
```javascript
cities: ["Madrid", "París", "Roma", "Barcelona", "Venecia"]
```

### 3. **Países** ✅
- Detección automática de 30+ países comunes
- Búsqueda en todo el contenido del tour

**Ejemplo:**
```javascript
countries: ["España", "Francia", "Italia"]
```

### 4. **Precios** ✅
- Precio base en USD
- Impuestos separados
- Múltiples formatos soportados

**Ejemplo:**
```javascript
{
  price_usd: 699,
  taxes_usd: 999
}
```

### 5. **Incluye** ✅
- Lista completa de servicios incluidos
- Extracción desde listas o texto

**Ejemplo:**
```javascript
includes: [
  "Boleto de avión México – Casablanca",
  "8 noches de alojamiento",
  "Desayunos diarios"
]
```

### 6. **No Incluye** ✅ (NUEVO)
- Lista de servicios NO incluidos
- Múltiples formatos soportados

**Ejemplo:**
```javascript
not_includes: [
  "Propinas",
  "Comidas no especificadas",
  "Gastos personales"
]
```

---

## 🎯 **ESTRATEGIA DE ACTUALIZACIÓN**

### Fase 1: Tours Prioritarios (Inmediato)
Actualizar tours que:
- No tienen ciudades (mapas no se muestran)
- No tienen "No Incluye"
- No tienen precio

```bash
npx tsx scripts/update-from-mega-conexion.js
```

### Fase 2: Tours con Itinerario Incompleto
Actualizar tours que solo tienen 1-2 días de itinerario cuando deberían tener más.

```sql
SELECT mt_code, name, days
FROM megatravel_packages p
WHERE days > 5
AND (
    SELECT COUNT(*) FROM megatravel_itinerary WHERE package_id = p.id
) < 3;
```

### Fase 3: Verificación y Validación
Comparar datos extraídos con datos existentes para asegurar calidad.

---

## 📊 **RESULTADOS ESPERADOS**

### Antes:
- ✅ 90.8% con precios (295/325)
- ❌ 5.8% con "No Incluye" (19/325)
- ⚠️ ~40% con ciudades incompletas
- ⚠️ ~30% con itinerarios incompletos

### Después (Estimado):
- ✅ 95%+ con precios (310+/325)
- ✅ 80%+ con "No Incluye" (260+/325)
- ✅ 90%+ con ciudades completas (290+/325)
- ✅ 85%+ con itinerarios completos (275+/325)

---

## ⚠️ **CONSIDERACIONES**

### Limitaciones:
1. **Velocidad:** Procesa ~1 tour cada 3-5 segundos (para no saturar servidor)
2. **Cobertura:** No todos los tours están en Mega Conexión
3. **Estructura:** Algunos tours pueden tener HTML muy diferente

### Recomendaciones:
1. **Ejecutar en horarios de baja carga** (noche/madrugada)
2. **Procesar en batches** (50 tours a la vez)
3. **Verificar resultados** antes de actualización masiva
4. **Mantener backup** de datos anteriores

---

## 🧪 **PRUEBAS**

### Test 1: Extracción Individual
```bash
npx tsx scripts/test-mega-conexion.js
```

**Tours de prueba:**
- MT-12534 (Marruecos - 10 días)
- MT-20043 (Turquía + Dubai - 15 días)
- MT-12117 (Europa - 17 días)

### Test 2: Actualización Individual
```bash
npx tsx scripts/update-from-mega-conexion.js MT-12534
```

### Test 3: Actualización Masiva (Limitada)
```bash
# Modificar límite en MegaConexionService.updateAllToursFromMegaConexion()
# De LIMIT 50 a LIMIT 10 para prueba
npx tsx scripts/update-from-mega-conexion.js
```

---

## 📝 **ARCHIVOS CREADOS**

1. **`src/services/MegaConexionService.ts`** - Servicio principal
2. **`scripts/update-from-mega-conexion.js`** - Script de actualización
3. **`scripts/test-mega-conexion.js`** - Script de prueba
4. **`docs/AG-Mega-Conexion-Servicio.md`** - Esta documentación

---

## 🔄 **INTEGRACIÓN CON SCRAPING EXISTENTE**

Este servicio **complementa** (no reemplaza) `MegaTravelScrapingService`:

### Flujo Recomendado:
1. **Scraping inicial:** `MegaTravelScrapingService` extrae datos básicos de 325 tours
2. **Enriquecimiento:** `MegaConexionService` completa datos faltantes
3. **Mantenimiento:** Ejecutar ambos periódicamente

### Ejemplo de Uso Combinado:
```javascript
// 1. Scraping inicial (ya ejecutado)
await MegaTravelScrapingService.startFullSync();

// 2. Completar datos faltantes
await MegaConexionService.updateAllToursFromMegaConexion();

// 3. Verificar resultados
await verifyDataCompleteness();
```

---

## ✅ **PRÓXIMOS PASOS**

### Inmediato:
1. ✅ Probar con 3 tours de ejemplo
2. ⏳ Verificar que los datos se guardan correctamente
3. ⏳ Ejecutar actualización de 50 tours prioritarios

### Corto Plazo:
4. ⏳ Analizar resultados y ajustar parsers si es necesario
5. ⏳ Ejecutar actualización completa (325 tours)
6. ⏳ Documentar mejoras en AG-Historico-Cambios.md

### Mediano Plazo:
7. ⏳ Integrar en proceso de sincronización automática
8. ⏳ Crear dashboard de calidad de datos
9. ⏳ Implementar alertas para datos faltantes

---

## 📞 **SOPORTE**

Si encuentras problemas:
1. Revisar logs de consola
2. Verificar conectividad a megatravel.com.mx
3. Comprobar que Puppeteer está instalado
4. Revisar estructura HTML de tours problemáticos

---

¡Servicio listo para mejorar la calidad de datos de MegaTravel! 🚀
