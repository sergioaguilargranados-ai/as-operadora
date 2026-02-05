const fs = require('fs');
const path = require('path');

const filePath = path.join(__dirname, '..', 'src', 'app', 'page.tsx');
let content = fs.readFileSync(filePath, 'utf8');

// Eliminar líneas vacías entre </main> y <footer>
content = content.replace(/(<\/main>)\s*\n\s*\n\s*(<footer)/g, '$1\n$2');

fs.writeFileSync(filePath, content, 'utf8');
console.log('✅ Línea vacía eliminada entre </main> y <footer>');
