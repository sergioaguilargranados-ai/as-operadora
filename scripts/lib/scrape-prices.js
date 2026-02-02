/**
 * Función para extraer precios desde circuito.php
 */

async function scrapePricesFromCircuito(tourCode, $circuito) {
    try {
        const prices = {
            currency: null,
            base_price: null,
            price_ranges: [],
            taxes: null,
            notes: null
        }

        // Buscar sección de precios
        const priceSection = $circuito('h5:contains("Precio")').next()

        if (!priceSection.length) {
            return prices
        }

        // Buscar tabla de precios
        const table = priceSection.find('table')

        if (!table.length) {
            return prices
        }

        // Detectar moneda del encabezado
        const headerText = table.find('tr').first().text()
        if (headerText.includes('USD')) {
            prices.currency = 'USD'
        } else if (headerText.includes('MXN') || headerText.includes('PESOS')) {
            prices.currency = 'MXN'
        }

        // Extraer filas de precios
        const priceRows = []
        table.find('tr').each((i, row) => {
            const cells = []
            $circuito(row).find('td').each((j, cell) => {
                const text = $circuito(cell).text().trim()
                cells.push(text)
            })

            if (cells.length >= 2) {
                const category = cells[0]
                const priceText = cells[1]

                // Extraer número del precio
                const priceMatch = priceText.match(/\$?\s*([\d,]+\.?\d*)/)
                if (priceMatch) {
                    const price = parseFloat(priceMatch[1].replace(/,/g, ''))

                    // Clasificar el precio
                    if (category.toLowerCase().includes('impuesto') ||
                        category.toLowerCase().includes('tax')) {
                        prices.taxes = price
                    } else if (!category.toLowerCase().includes('tarifa') &&
                        !category.toLowerCase().includes('precio') &&
                        !category.toLowerCase().includes('suplemento')) {
                        priceRows.push({
                            category: category,
                            price: price
                        })
                    }
                }
            }
        })

        // Asignar precio base (el más bajo)
        if (priceRows.length > 0) {
            const minPrice = Math.min(...priceRows.map(p => p.price))
            prices.base_price = minPrice
            prices.price_ranges = priceRows
        }

        return prices

    } catch (error) {
        console.error(`   ⚠️  Error extrayendo precios:`, error.message)
        return {
            currency: null,
            base_price: null,
            price_ranges: [],
            taxes: null,
            notes: null
        }
    }
}

module.exports = { scrapePricesFromCircuito }
