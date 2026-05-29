// Script para generar iconos PWA como archivos SVG (se pueden reemplazar con PNGs reales después)
const fs = require('fs')
const path = require('path')

const iconsDir = path.join(process.cwd(), 'public', 'icons')

const sizes = [72, 96, 128, 144, 152, 192, 384, 512]

function generateSVGIcon(size, maskable = false) {
  const padding = maskable ? size * 0.1 : 0
  const innerSize = size - padding * 2
  const fontSize = Math.round(innerSize * 0.28)
  const subtitleSize = Math.round(innerSize * 0.1)

  return `<svg xmlns="http://www.w3.org/2000/svg" width="${size}" height="${size}" viewBox="0 0 ${size} ${size}">
  <defs>
    <linearGradient id="bg" x1="0%" y1="0%" x2="100%" y2="100%">
      <stop offset="0%" style="stop-color:#0066FF"/>
      <stop offset="100%" style="stop-color:#0044CC"/>
    </linearGradient>
  </defs>
  ${maskable ? `<rect width="${size}" height="${size}" fill="url(#bg)"/>` : `<rect x="${padding}" y="${padding}" width="${innerSize}" height="${innerSize}" rx="${innerSize * 0.18}" fill="url(#bg)"/>`}
  <text x="50%" y="45%" text-anchor="middle" dominant-baseline="middle" font-family="Arial, Helvetica, sans-serif" font-weight="bold" font-size="${fontSize}" fill="white">AS</text>
  <text x="50%" y="68%" text-anchor="middle" dominant-baseline="middle" font-family="Arial, Helvetica, sans-serif" font-weight="500" font-size="${subtitleSize}" fill="rgba(255,255,255,0.8)">VIAJANDO</text>
</svg>`
}

// Generar iconos normales
sizes.forEach(size => {
  const svg = generateSVGIcon(size, false)
  // Guardar como SVG (los navegadores aceptan SVG como iconos PWA en muchos casos)
  // Para producción se deberían convertir a PNG con sharp o canvas
  fs.writeFileSync(path.join(iconsDir, `icon-${size}x${size}.png`), svg)
  console.log(`✅ Generado icon-${size}x${size}.png`)
})

// Generar iconos maskable
const maskableSizes = [192, 512]
maskableSizes.forEach(size => {
  const svg = generateSVGIcon(size, true)
  fs.writeFileSync(path.join(iconsDir, `icon-maskable-${size}x${size}.png`), svg)
  console.log(`✅ Generado icon-maskable-${size}x${size}.png`)
})

console.log('\n🎉 Todos los iconos generados en public/icons/')
console.log('⚠️  NOTA: Son SVG temporales. Para producción, reemplazar con PNGs reales del logo de AS Operadora.')
