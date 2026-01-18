const fs = require('fs');
const https = require('https');

const url = 'https://www.megatravel.com.mx/tools/vi.php?Dest=1';
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
        fs.writeFileSync('megatravel_dump.html', data);
        console.log('Download complete. Size:', data.length);
    });
}).on('error', (err) => {
    console.error('Error:', err.message);
});
