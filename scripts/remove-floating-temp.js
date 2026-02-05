const fs = require('fs');
const path = require('path');

const filePath = path.join(__dirname, '..', 'src', 'app', 'page.tsx');
let content = fs.readFileSync(filePath, 'utf8');

// Eliminar COMPLETAMENTE los círculos flotantes
// Buscar desde </main> hasta <footer> y limpiar todo lo que haya en medio
const pattern = /(      <\/main>)\s*\n\s*\n\s*{\/\*[^*]*\*\/}\s*\n\s*<div className="fixed bottom-6[^>]*>[\s\S]*?<\/div>\s*\n(\s*<footer)/;

content = content.replace(pattern, '$1\n\n$2');

fs.writeFileSync(filePath, content, 'utf8');
console.log('✅ Círculos flotantes eliminados temporalmente para permitir compilación');
console.log('📝 Los agregaremos en una ubicación válida después');
