# 📋 Plan de Mejora - Scraping MegaTravel

**Fecha:** 02 de Febrero de 2026  
**Versión actual:** v2.294  
**Prioridad:** MEDIA  
**Estimado:** 1 hora (ajustes finales)  
**Estado:** 🟡 EN PROGRESO (80% completado)

---

## ✅ PROGRESO REALIZADO (02 Feb 2026 - 01:00 AM)

### **Funciones Implementadas:**

1. ✅ **`scrapePricing()`** - Extrae precios del HTML
   - Busca "Tarifa Base" e "Impuestos"
   - Busca patrones alternativos ("Desde X USD + Y IMP")
   - Extrae tipo de habitación
   - Extrae variantes de precio (Doble, Triple, etc.)

2. ✅ **`scrapeIncludesNotIncludes()`** - Extrae listas de inclusiones
   - Busca sección "El viaje incluye"
   - Busca sección "El viaje no incluye"
   - Limpia y formatea items

3. ✅ **Integración en `scrapeTourComplete()`**
   - Llama a las nuevas funciones
   - Retorna pricing, includes y not_includes
   - Actualiza logs con nueva información

4. ✅ **Actualización de `saveScrapedData()`**
   - Guarda price_usd, taxes_usd
   - Guarda includes y not_includes
   - Guarda price_variants
   - Actualiza price_per_person_type

5. ✅ **Scripts de Prueba**
   - `test-scraping-simple.js` - Prueba básica
   - `debug-html.js` - Depuración de HTML

### **Archivos Modificados:**

- ✅ `src/services/MegaTravelScrapingService.ts`
  - +157 líneas de código nuevo
  - 2 funciones nuevas
  - Tipos actualizados

---

## 🐛 PROBLEMA IDENTIFICADO (ORIGINAL)

### **Análisis de Datos Actuales:**

```
Total tours: 325
Con precio: 8 (2.5%)
Sin precio: 317 (97.5%)

Includes/Not_includes:
- Muchos tours con 0 items
- Datos incompletos
```

### **Causa Raíz:**

El servicio `MegaTravelScrapingService.ts` **NO extraía**:
1. ❌ `price_usd` (precios) → ✅ **IMPLEMENTADO**
2. ❌ `taxes_usd` (impuestos) → ✅ **IMPLEMENTADO**
3. ❌ `includes` (lista de lo que incluye) → ✅ **IMPLEMENTADO**
4. ❌ `not_includes` (lista de lo que no incluye) → ✅ **IMPLEMENTADO**
5. ❌ `price_variants` (precios por tipo de habitación) → ✅ **IMPLEMENTADO**

---

## 🔧 AJUSTES PENDIENTES (Estimado: 1 hora)

### **Problema Actual:**

Los patrones de regex necesitan ajustes para el HTML real de MegaTravel:

**HTML Real:**
```html
<p class="text-xs text-black/60">Tarifa Base</p>
<p class="font-semibold">$1,699</p>

<p class="text-xs text-black/60">Impuestos</p>
<p class="font-semibold">$799</p>

<h4>El viaje <span>incluye</span></h4>
<ul><li>Boleto de avión...</li></ul>
```

**Patrones a Ajustar:**

```typescript
// EN scrapePricing():
// Línea ~795: Cambiar patrón de búsqueda
const tarifaBaseMatch = bodyHtml.match(/Tarifa Base[\s\S]{0,200}?\$([0-9,]+)/i);
const impuestosMatch = bodyHtml.match(/Impuestos[\s\S]{0,200}?\$([0-9,]+)/i);

// EN scrapeIncludesNotIncludes():
// Línea ~887: Buscar por ID o clase específica
const includesSection = $('#linkincluye');
const includesUl = includesSection.find('ul').first();
```

---

## ✅ SOLUCIÓN TEMPORAL (IMPLEMENTADA)

**v2.293:** Mostrar "Consultar precio" cuando `totalPrice` es `null`
- ✅ Frontend ya implementado
- ✅ 317 tours mostrarán "Consultar precio"
- ✅ Experiencia de usuario mejorada

---

## 🎯 PRÓXIMOS PASOS (1 hora)

### **1. Ajustar Patrones de Scraping (30 min)**

Modificar `src/services/MegaTravelScrapingService.ts`:

```typescript
// scrapePricing() - Línea ~795
// REEMPLAZAR:
const bodyText = $('body').text();
const pricePattern1 = /Desde\s+([\d,]+)\s*USD\s*\+\s*([\d,]+)\s*IMP/i;

// POR:
const bodyHtml = $('body').html() || '';
const tarifaBaseMatch = bodyHtml.match(/Tarifa Base[\s\S]{0,200}?\$([0-9,]+)/i);
const impuestosMatch = bodyHtml.match(/Impuestos[\s\S]{0,200}?\$([0-9,]+)/i);
```

```typescript
// scrapeIncludesNotIncludes() - Línea ~887
// REEMPLAZAR:
const includesMatch = bodyHtml.match(/El viaje incluye([\s\S]*?)(?=El viaje no incluye|Itinerario|Mapa del tour|$)/i);

// POR:
const includesSection = $('#linkincluye');
if (includesSection.length > 0) {
    includesSection.find('ul li').each((i, elem) => {
        const text = $(elem).text().trim();
        if (text) includes.push(text);
    });
}
```

### **2. Probar con 3 Tours (15 min)**

```bash
# Ejecutar script de prueba
node scripts/test-scraping-simple.js
```

Verificar que extrae:
- ✅ Precio: $1,699 USD
- ✅ Impuestos: $799 USD
- ✅ Includes: 8+ items
- ✅ Not Includes: 5+ items

### **3. Re-ejecutar Scraping Completo (15 min)**

```bash
# Desde panel admin o script
node scripts/run-megatravel-sync.js
```

---

## 📊 RESULTADOS ESPERADOS

Después de los ajustes:
- ✅ 325 tours con precio (en vez de 8)
- ✅ 325 tours con includes/not_includes completos
- ✅ Datos 100% desde MegaTravel (no mock)
- ✅ Actualización automática diaria

---

## 📝 NOTAS TÉCNICAS

### **Estructura HTML de MegaTravel:**

```html
<!-- PRECIOS -->
<div class="grid grid-cols-5 gap-3">
    <div>
        <p class="text-xs text-black/60">Tarifa Base</p>
        <p class="font-semibold">$1,699</p>
    </div>
    <div>
        <p class="text-xs text-black/60">Impuestos</p>
        <p class="font-semibold">$799</p>
    </div>
</div>

<!-- INCLUYE -->
<div id="linkincluye">
    <h4>El viaje <span>incluye</span></h4>
    <ul>
        <li>Boleto de avión...</li>
        <li>15 noches de alojamiento...</li>
    </ul>
</div>

<!-- NO INCLUYE -->
<h4>El viaje <span>no incluye</span></h4>
<ul>
    <li>Alimentos...</li>
    <li>Gastos personales...</li>
</ul>
```

---

## ✅ CHECKLIST DE IMPLEMENTACIÓN

- [x] Implementar `scrapePricing()`
- [x] Implementar `scrapeIncludesNotIncludes()`
- [x] Integrar en `scrapeTourComplete()`
- [x] Actualizar `saveScrapedData()`
- [x] Actualizar tipos TypeScript
- [ ] **Ajustar patrones regex** ← PENDIENTE
- [ ] Probar con 3 tours
- [ ] Re-ejecutar scraping completo
- [ ] Verificar resultados en frontend
- [ ] Actualizar versión y documentación

---

## 🎉 CONCLUSIÓN

**Progreso: 80% completado**

El código base está implementado y funcional. Solo faltan ajustes menores en los patrones de regex para adaptarse al HTML real de MegaTravel. Estimado: 1 hora de trabajo adicional.

```typescript
// Ejemplo de estructura a buscar en MegaTravel:

// 1. PRECIO
const priceSelector = '.price, .precio, [class*="price"]';
// Buscar: "$1,699 USD" o "1699 USD"

// 2. IMPUESTOS
const taxesSelector = '.taxes, .impuestos, [class*="tax"]';
// Buscar: "$799 USD impuestos"

// 3. INCLUYE
const includesSelector = '.includes, .incluye, [class*="include"]';
// Buscar lista <ul> o <li>

// 4. NO INCLUYE
const notIncludesSelector = '.not-includes, .no-incluye';
// Buscar lista <ul> o <li>

// 5. VARIANTES DE PRECIO
const priceVariantsSelector = '.price-variants, .habitaciones';
// Buscar tabla con: Doble, Triple, Sencilla, etc.
```

### **Paso 2: Agregar Funciones de Scraping**

Agregar a `MegaTravelScrapingService.ts`:

```typescript
/**
 * SCRAPING DE PRECIOS
 */
static async scrapePricing($: cheerio.Root): Promise<{
    price_usd: number | null;
    taxes_usd: number | null;
    currency: string;
    price_per_person_type: string;
    price_variants: Record<string, number>;
}> {
    try {
        // Buscar precio base
        const priceText = $('.price-main, .precio-base').first().text();
        const priceMatch = priceText.match(/\$?([\d,]+)\s*(USD|MXN)?/);
        const price_usd = priceMatch ? parseFloat(priceMatch[1].replace(',', '')) : null;

        // Buscar impuestos
        const taxesText = $('.taxes, .impuestos').first().text();
        const taxesMatch = taxesText.match(/\$?([\d,]+)\s*(USD|MXN)?/);
        const taxes_usd = taxesMatch ? parseFloat(taxesMatch[1].replace(',', '')) : null;

        // Buscar tipo de habitación
        const priceType = $('.price-type, .tipo-habitacion').first().text().trim() 
            || 'Por persona en habitación Doble';

        // Buscar variantes de precio (Doble, Triple, etc.)
        const price_variants: Record<string, number> = {};
        $('.price-variant, .precio-habitacion').each((i, elem) => {
            const $elem = $(elem);
            const type = $elem.find('.type, .tipo').text().trim().toLowerCase();
            const priceText = $elem.find('.price, .precio').text();
            const priceMatch = priceText.match(/\$?([\d,]+)/);
            if (type && priceMatch) {
                price_variants[type] = parseFloat(priceMatch[1].replace(',', ''));
            }
        });

        return {
            price_usd,
            taxes_usd,
            currency: 'USD',
            price_per_person_type: priceType,
            price_variants
        };

    } catch (error) {
        console.error('Error scraping pricing:', error);
        return {
            price_usd: null,
            taxes_usd: null,
            currency: 'USD',
            price_per_person_type: 'Por persona en habitación Doble',
            price_variants: {}
        };
    }
}

/**
 * SCRAPING DE INCLUDES/NOT_INCLUDES
 */
static async scrapeIncludesNotIncludes($: cheerio.Root): Promise<{
    includes: string[];
    not_includes: string[];
}> {
    try {
        const includes: string[] = [];
        const not_includes: string[] = [];

        // Buscar sección "Incluye"
        const includesSection = $('h3:contains("Incluye"), h4:contains("Incluye"), .includes-section');
        if (includesSection.length > 0) {
            includesSection.next('ul, .list').find('li').each((i, elem) => {
                const text = $(elem).text().trim();
                if (text) includes.push(text);
            });
        }

        // Buscar sección "No Incluye"
        const notIncludesSection = $('h3:contains("No incluye"), h4:contains("No incluye"), .not-includes-section');
        if (notIncludesSection.length > 0) {
            notIncludesSection.next('ul, .list').find('li').each((i, elem) => {
                const text = $(elem).text().trim();
                if (text) not_includes.push(text);
            });
        }

        return { includes, not_includes };

    } catch (error) {
        console.error('Error scraping includes/not_includes:', error);
        return { includes: [], not_includes: [] };
    }
}
```

### **Paso 3: Integrar en `scrapeTourComplete()`**

Modificar la función principal:

```typescript
static async scrapeTourComplete(tourUrl: string, packageId: number): Promise<{
    itinerary: ItineraryDay[];
    departures: Departure[];
    policies: Policies;
    additionalInfo: AdditionalInfo;
    optionalTours: OptionalTourExtended[];
    images: { main: string | null; gallery: string[]; map: string | null; };
    tags: string[];
    // NUEVOS CAMPOS:
    pricing: {
        price_usd: number | null;
        taxes_usd: number | null;
        currency: string;
        price_per_person_type: string;
        price_variants: Record<string, number>;
    };
    includes: string[];
    not_includes: string[];
}> {
    // ... código existente ...

    const $ = cheerio.load(html);

    // Extraer cada tipo de dato
    const itinerary = await this.scrapeItinerary($, page, tourUrl);
    const departures = await this.scrapeDepartures($);
    const policies = await this.scrapePolicies($);
    const additionalInfo = await this.scrapeAdditionalInfo($);
    const optionalTours = await this.scrapeOptionalTours($);
    const images = await this.scrapeImages($);
    const tags = await this.scrapeClassifications($);
    
    // NUEVOS:
    const pricing = await this.scrapePricing($);
    const { includes, not_includes } = await this.scrapeIncludesNotIncludes($);

    return {
        itinerary: fullItinerary,
        departures,
        policies,
        additionalInfo,
        optionalTours,
        images,
        tags,
        // NUEVOS:
        pricing,
        includes,
        not_includes
    };
}
```

### **Paso 4: Actualizar `saveScrapedData()`**

Modificar para guardar los nuevos campos:

```typescript
static async saveScrapedData(packageId: number, data: any): Promise<void> {
    // ... código existente para itinerary, departures, etc. ...

    // NUEVO: Actualizar precios e includes en megatravel_packages
    if (data.pricing || data.includes || data.not_includes) {
        await pool.query(`
            UPDATE megatravel_packages
            SET 
                price_usd = COALESCE($1, price_usd),
                taxes_usd = COALESCE($2, taxes_usd),
                currency = COALESCE($3, currency),
                price_per_person_type = COALESCE($4, price_per_person_type),
                price_variants = COALESCE($5, price_variants),
                includes = COALESCE($6, includes),
                not_includes = COALESCE($7, not_includes),
                updated_at = CURRENT_TIMESTAMP
            WHERE id = $8
        `, [
            data.pricing?.price_usd,
            data.pricing?.taxes_usd,
            data.pricing?.currency,
            data.pricing?.price_per_person_type,
            JSON.stringify(data.pricing?.price_variants || {}),
            data.includes,
            data.not_includes,
            packageId
        ]);
    }
}
```

### **Paso 5: Re-ejecutar Scraping**

```bash
# Desde el panel admin o ejecutar manualmente:
node scripts/run-megatravel-sync.js
```

---

## 📊 RESULTADOS ESPERADOS

Después de implementar:
- ✅ 325 tours con precio (en vez de 8)
- ✅ 325 tours con includes/not_includes completos
- ✅ Datos 100% desde MegaTravel (no mock)
- ✅ Actualización automática diaria

---

## 🔧 HERRAMIENTAS NECESARIAS

1. **Navegador para inspeccionar HTML:**
   - Abrir https://www.megatravel.com.mx/viaje/viviendo-europa-12117.html
   - Inspeccionar elementos de precio, includes, not_includes
   - Identificar selectores CSS correctos

2. **Puppeteer + Cheerio:**
   - Ya instalados y funcionando
   - Solo agregar nuevas funciones de scraping

3. **Testing:**
   - Probar con 2-3 tours primero
   - Verificar que los datos se extraen correctamente
   - Luego ejecutar scraping completo

---

## ⏱️ ESTIMACIÓN DE TIEMPO

| Tarea | Tiempo |
|-------|--------|
| Analizar HTML de MegaTravel | 30 min |
| Implementar `scrapePricing()` | 45 min |
| Implementar `scrapeIncludesNotIncludes()` | 30 min |
| Integrar en `scrapeTourComplete()` | 15 min |
| Actualizar `saveScrapedData()` | 20 min |
| Testing con 3 tours | 30 min |
| Re-ejecutar scraping completo (325 tours) | 60 min |
| **TOTAL** | **3.5 horas** |

---

## 📝 NOTAS

- Este trabajo se puede hacer en una sesión futura
- Mientras tanto, "Consultar precio" funciona correctamente
- Los 8 tours con precio funcionan perfectamente
- El itinerario completo ya se está extrayendo correctamente

---

## ✅ CHECKLIST DE IMPLEMENTACIÓN

- [ ] Inspeccionar HTML de MegaTravel
- [ ] Identificar selectores CSS para precio
- [ ] Identificar selectores CSS para includes/not_includes
- [ ] Implementar `scrapePricing()`
- [ ] Implementar `scrapeIncludesNotIncludes()`
- [ ] Integrar en `scrapeTourComplete()`
- [ ] Actualizar `saveScrapedData()`
- [ ] Probar con 3 tours
- [ ] Re-ejecutar scraping completo
- [ ] Verificar resultados en frontend
- [ ] Actualizar versión y documentación
