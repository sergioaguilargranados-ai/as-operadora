const fs = require('fs')
const cheerio = require('cheerio')

const html = fs.readFileSync('debug-tour.html', 'utf8')
const $ = cheerio.load(html)

console.log('\n🖼️ IMÁGENES DEL TOUR (cdnmega.com/images/viajes):')
console.log('=================================================\n')

const tourImages = []
$('img').each((i, elem) => {
    const src = $(elem).attr('src')
    if (src && src.includes('cdnmega.com/images/viajes')) {
        tourImages.push(src)
        console.log(`${tourImages.length}. ${src}`)
    }
})

console.log(`\n✅ Total: ${tourImages.length} imágenes del tour`)

// Identificar la imagen principal (cover)
const mainImage = tourImages.find(img => img.includes('/covers/'))
if (mainImage) {
    console.log(`\n📸 IMAGEN PRINCIPAL (cover):`)
    console.log(mainImage)
}

// Identificar galería
const galleryImages = tourImages.filter(img => !img.includes('/covers/'))
console.log(`\n🖼️ GALERÍA (${galleryImages.length} imágenes):`)
galleryImages.forEach((img, i) => {
    console.log(`${i + 1}. ${img}`)
})
