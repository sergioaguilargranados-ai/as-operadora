/**
 * Monitor de progreso de re-sincronización
 * Lee el archivo de log y muestra estadísticas
 */

const fs = require('fs')

const logFile = 'resync-progress.log'

function monitorProgress() {
    console.log('\n📊 MONITOR DE PROGRESO - RE-SINCRONIZACIÓN\n')
    console.log(`Hora: ${new Date().toLocaleString('es-MX', { timeZone: 'America/Mexico_City' })}\n`)

    if (!fs.existsSync(logFile)) {
        console.log('❌ Archivo de log no encontrado')
        return
    }

    const logContent = fs.readFileSync(logFile, 'utf-8')
    const lines = logContent.split('\n')

    // Contar tours procesados
    const processedLines = lines.filter(l => l.includes('[') && l.includes('/325]'))
    const lastProcessed = processedLines[processedLines.length - 1]

    if (lastProcessed) {
        const match = lastProcessed.match(/\[(\d+)\/325\]/)
        if (match) {
            const current = parseInt(match[1])
            const percentage = ((current / 325) * 100).toFixed(1)

            console.log(`✅ Tours procesados: ${current} / 325 (${percentage}%)`)
            console.log(`📈 Progreso: ${'█'.repeat(Math.floor(current / 6.5))}${'░'.repeat(50 - Math.floor(current / 6.5))}\n`)
        }
    }

    // Contar éxitos y errores
    const succeeded = lines.filter(l => l.includes('✅ Actualizado en BD')).length
    const failed = lines.filter(l => l.includes('❌ Error:')).length

    console.log(`Exitosos: ${succeeded}`)
    console.log(`Fallidos: ${failed}\n`)

    // Últimos 5 tours procesados
    console.log('📋 Últimos 5 tours procesados:\n')
    const tourLines = lines.filter(l => l.includes('[') && l.includes('/325]'))
    const last5 = tourLines.slice(-5)

    last5.forEach(line => {
        const tourMatch = line.match(/\[(\d+)\/325\] (MT-\d+) - (.+)/)
        if (tourMatch) {
            console.log(`   ${tourMatch[1]}. ${tourMatch[2]}: ${tourMatch[3]}`)
        }
    })

    console.log('\n')

    // Estadísticas de tags
    const tagsLines = lines.filter(l => l.includes('🏷️  Tags:'))
    const withTags = tagsLines.filter(l => !l.includes('ninguno')).length
    const withoutTags = tagsLines.filter(l => l.includes('ninguno')).length

    console.log('🏷️  Estadísticas de Tags:')
    console.log(`   Con tags: ${withTags}`)
    console.log(`   Sin tags: ${withoutTags}\n`)

    // Estadísticas de imágenes
    const imagesLines = lines.filter(l => l.includes('📸 Imágenes:'))
    const withMain = imagesLines.filter(l => l.includes('Main=Sí')).length
    const withoutMain = imagesLines.filter(l => l.includes('Main=No')).length

    console.log('📸 Estadísticas de Imágenes:')
    console.log(`   Con imagen principal: ${withMain}`)
    console.log(`   Sin imagen principal: ${withoutMain}\n`)

    console.log('─'.repeat(60))
    console.log('💡 El proceso continúa en segundo plano...\n')
}

monitorProgress()
