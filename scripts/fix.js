const fs = require('fs');
const filePath = 'c:/operadora-dev/src/app/page.tsx';
let lines = fs.readFileSync(filePath, 'utf8').split('\n');

// Find </main> line
for (let i = 0; i < lines.length; i++) {
    if (lines[i].includes('</main>')) {
        // Ensure next line is <footer with proper indentation
        if (i + 1 < lines.length && lines[i + 1].includes('<footer')) {
            lines[i + 1] = '      <footer className="bg-[#F7F7F7] mt-16 py-12">';
        }
        break;
    }
}

fs.writeFileSync(filePath, lines.join('\n'), 'utf8');
console.log('OK');
