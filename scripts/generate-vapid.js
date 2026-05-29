const webpush = require('web-push');
const fs = require('fs');
const path = require('path');

const vapidKeys = webpush.generateVAPIDKeys();

const envContent = `\n# Web Push VAPID Keys\nNEXT_PUBLIC_VAPID_PUBLIC_KEY=${vapidKeys.publicKey}\nVAPID_PRIVATE_KEY=${vapidKeys.privateKey}\nVAPID_SUBJECT=mailto:soporte@asoperadora.com\n`;

const envPath = path.join(__dirname, '../.env.local');
fs.appendFileSync(envPath, envContent);

console.log('VAPID Keys generadas y añadidas a .env.local');
console.log('Public Key:', vapidKeys.publicKey);
console.log('Private Key:', vapidKeys.privateKey);
