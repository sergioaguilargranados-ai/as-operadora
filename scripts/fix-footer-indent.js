const fs = require('fs');
const path = require('path');

const filePath = path.join(__dirname, '..', 'src', 'app', 'page.tsx');
let content = fs.readFileSync(filePath, 'utf8');

// Reemplazar </main> seguido de <footer> con la indentación correcta
content = content.replace(
    /      <\/main>\n<footer/g,
    '      </main>\n      <footer'
);

fs.writeFileSync(filePath, content, 'utf8');
console.log('✅ Indentación corregida entre </main> y <footer>');
