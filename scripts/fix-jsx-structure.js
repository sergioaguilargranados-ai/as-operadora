const fs = require('fs');
const path = require('path');

const filePath = path.join(__dirname, '..', 'src', 'app', 'page.tsx');
let lines = fs.readFileSync(filePath, 'utf8').split('\n');

// Encontrar la línea donde está </main>
let mainEndLine = -1;
for (let i = 0; i < lines.length; i++) {
    if (lines[i].trim() === '</main>') {
        mainEndLine = i;
        break;
    }
}

if (mainEndLine === -1) {
    console.error('❌ No se encontró </main>');
    process.exit(1);
}

console.log(`✓ Encontrado </main> en línea ${mainEndLine + 1}`);

// Eliminar líneas vacías y comentarios sueltos después de </main>
// hasta encontrar el footer real
let linesToRemove = [];
for (let i = mainEndLine + 1; i < Math.min(mainEndLine + 50, lines.length); i++) {
    const line = lines[i].trim();
    if (line === '' || line === '{/* Footer */}' || line.includes('Círculos flotantes')) {
        linesToRemove.push(i);
    } else if (line.startsWith('<footer') || line.startsWith('{/* Footer */}') && lines[i + 1] && lines[i + 1].trim().startsWith('<footer')) {
        break;
    } else if (line.startsWith('<div className="fixed bottom-6')) {
        // Encontramos círculos flotantes mal ubicados, marcar para eliminar hasta su cierre
        let depth = 1;
        linesToRemove.push(i);
        for (let j = i + 1; j < lines.length && depth > 0; j++) {
            linesToRemove.push(j);
            if (lines[j].includes('<div')) depth++;
            if (lines[j].includes('</div>')) depth--;
        }
        break;
    }
}

// Eliminar líneas marcadas (de atrás hacia adelante para no afectar índices)
for (let i = linesToRemove.length - 1; i >= 0; i--) {
    lines.splice(linesToRemove[i], 1);
}

console.log(`✓ Eliminadas ${linesToRemove.length} líneas problemáticas`);

// Ahora insertar los círculos flotantes en la posición correcta (después de </main>)
const floatingButtons = [
    '',
    '      {/* Círculos flotantes - Chat y WhatsApp */}',
    '      <div className="fixed bottom-6 right-6 flex flex-col gap-3 z-50">',
    '        {/* Botón de WhatsApp */}',
    '        <a',
    '          href="https://wa.me/5215512345678"',
    '          target="_blank"',
    '          rel="noopener noreferrer"',
    '          className="w-14 h-14 bg-green-500 hover:bg-green-600 rounded-full flex items-center justify-center shadow-lg transition-all duration-300 hover:scale-110 group"',
    '          title="Contactar por WhatsApp"',
    '        >',
    '          <svg className="w-7 h-7 text-white" fill="currentColor" viewBox="0 0 24 24">',
    '            <path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347m-5.421 7.403h-.004a9.87 9.87 0 01-5.031-1.378l-.361-.214-3.741.982.998-3.648-.235-.374a9.86 9.86 0 01-1.51-5.26c.001-5.45 4.436-9.884 9.888-9.884 2.64 0 5.122 1.03 6.988 2.898a9.825 9.825 0 012.893 6.994c-.003 5.45-4.437 9.884-9.885 9.884m8.413-18.297A11.815 11.815 0 0012.05 0C5.495 0 .16 5.335.157 11.892c0 2.096.547 4.142 1.588 5.945L0 24l6.305-1.654a11.882 11.882 0 005.683 1.448h.005c6.554 0 11.89-5.335 11.893-11.893a11.821 11.821 0 00-3.48-8.413Z"/>',
    '          </svg>',
    '        </a>',
    '        ',
    '        {/* Botón de Chat de Asistencia */}',
    '        <button',
    '          onClick={() => router.push(\'/ayuda\')}',
    '          className="w-14 h-14 bg-[#0066FF] hover:bg-[#0052CC] rounded-full flex items-center justify-center shadow-lg transition-all duration-300 hover:scale-110 group"',
    '          title="Chat de asistencia"',
    '        >',
    '          <svg className="w-7 h-7 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">',
    '            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 12h.01M12 12h.01M16 12h.01M21 12c0 4.418-4.03 8-9 8a9.863 9.863 0 01-4.255-.949L3 20l1.395-3.72C3.512 15.042 3 13.574 3 12c0-4.418 4.03-8 9-8s9 3.582 9 8z" />',
    '          </svg>',
    '        </button>',
    '      </div>',
    ''
];

// Recalcular mainEndLine después de eliminar líneas
mainEndLine = -1;
for (let i = 0; i < lines.length; i++) {
    if (lines[i].trim() === '</main>') {
        mainEndLine = i;
        break;
    }
}

// Insertar después de </main>
lines.splice(mainEndLine + 1, 0, ...floatingButtons);

console.log(`✓ Círculos flotantes insertados después de </main> (línea ${mainEndLine + 1})`);

// Guardar archivo
fs.writeFileSync(filePath, lines.join('\n'), 'utf8');
console.log('✅ Estructura JSX corregida correctamente');
