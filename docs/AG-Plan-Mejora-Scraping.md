# 📋 Plan de Mejora - Scraping MegaTravel

**Fecha:** 01 de Febrero de 2026  
**Versión actual:** v2.294  
**Prioridad:** MEDIA  
**Estimado:** 3-4 horas  

---

## 🐛 PROBLEMA IDENTIFICADO

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

El servicio `MegaTravelScrapingService.ts` actualmente **NO extrae**:
1. ❌ `price_usd` (precios)
2. ❌ `taxes_usd` (impuestos)
3. ❌ `includes` (lista de lo que incluye)
4. ❌ `not_includes` (lista de lo que no incluye)
5. ❌ `price_variants` (precios por tipo de habitación)

**Función actual `scrapeTourComplete()` solo extrae:**
- ✅ Itinerario completo
- ✅ Fechas de salida (departures)
- ✅ Políticas
- ✅ Información adicional
- ✅ Tours opcionales
- ✅ Imágenes
- ✅ Tags/clasificaciones

**Los datos de precio e includes vienen de:**
- Paquetes MOCK hardcodeados en `SAMPLE_PACKAGES` (solo 6 tours)
- Por eso solo 8 de 325 tours tienen precio

---

## ✅ SOLUCIÓN TEMPORAL (IMPLEMENTADA)

**v2.293:** Mostrar "Consultar precio" cuando `totalPrice` es `null`
- ✅ Frontend ya implementado
- ✅ 317 tours mostrarán "Consultar precio"
- ✅ Experiencia de usuario mejorada

---

## 🎯 SOLUCIÓN DEFINITIVA (PENDIENTE)

### **Paso 1: Analizar HTML de MegaTravel**

Necesitamos identificar los selectores CSS para:

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
