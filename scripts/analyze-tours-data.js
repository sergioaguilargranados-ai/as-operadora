// Script para analizar includes/not_includes y precios
require('dotenv').config({ path: '.env.local' })
const { neon } = require('@neondatabase/serverless')

const sql = neon(process.env.DATABASE_URL)

async function analyzeData() {
    try {
        // Análisis de includes/not_includes
        const includesAnalysis = await sql`
            SELECT 
                id,
                name,
                array_length(includes, 1) as includes_count,
                array_length(not_includes, 1) as not_includes_count
            FROM megatravel_packages
            ORDER BY includes_count ASC NULLS FIRST
            LIMIT 20
        `

        console.log('\n📋 ANÁLISIS DE INCLUDES/NOT_INCLUDES:')
        console.log('=====================================\n')
        console.log('Tours con menos items en "incluye":')
        includesAnalysis.forEach(t => {
            console.log(`- ${t.name}`)
            console.log(`  Incluye: ${t.includes_count || 0} items`)
            console.log(`  No incluye: ${t.not_includes_count || 0} items\n`)
        })

        // Análisis de precios
        const priceAnalysis = await sql`
            SELECT 
                COUNT(*) FILTER (WHERE price_usd IS NULL OR price_usd = 0) as sin_precio,
                COUNT(*) FILTER (WHERE price_usd > 0) as con_precio,
                COUNT(*) as total
            FROM megatravel_packages
        `

        console.log('\n💰 ANÁLISIS DE PRECIOS:')
        console.log('=======================\n')
        console.log(`Total tours: ${priceAnalysis[0].total}`)
        console.log(`Con precio: ${priceAnalysis[0].con_precio}`)
        console.log(`Sin precio: ${priceAnalysis[0].sin_precio}`)
        console.log(`Porcentaje sin precio: ${((priceAnalysis[0].sin_precio / priceAnalysis[0].total) * 100).toFixed(1)}%\n`)

        // Ejemplos de tours sin precio
        const noPriceExamples = await sql`
            SELECT id, name, price_usd
            FROM megatravel_packages
            WHERE price_usd IS NULL OR price_usd = 0
            LIMIT 10
        `

        console.log('Ejemplos de tours sin precio:')
        noPriceExamples.forEach(t => {
            console.log(`- ${t.name} (${t.id}) - Precio: ${t.price_usd}`)
        })

    } catch (error) {
        console.error('Error:', error)
    }
}

analyzeData()
