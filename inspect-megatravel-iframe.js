const fs = require('fs');
const https = require('https');

// Cambiamos a la URL del iframe 'legacy' que es más probable que sea HTML simple
const url = 'https://cafe.megatravel.com.mx/mega-conexion/iframe-php.php?Dest=1';
const options = {
    headers: {
        'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/91.0.4472.124 Safari/537.36'
    }
};

https.get(url, options, (res) => {
    let data = '';
    res.on('data', (chunk) => {
        data += chunk;
    });
    res.on('end', () => {
        fs.writeFileSync('megatravel_iframe_dump.html', data);
        console.log('Download complete. Size:', data.length);
    });
}).on('error', (err) => {
    console.error('Error:', err.message);
});
