const fs = require('fs');
const path = require('path');

const filePath = path.join(__dirname, '..', 'src', 'app', 'page.tsx');
let content = fs.readFileSync(filePath, 'utf8');

// Corregir el problema: </main>{/* Footer */} debe tener salto de línea
content = content.replace('</main>{/* Footer */}', '</main>\n\n      {/* Footer */}');

fs.writeFileSync(filePath, content, 'utf8');
console.log('✅ Salto de línea agregado entre </main> y comentario');
