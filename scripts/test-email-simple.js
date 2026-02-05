// test-email-simple.js - Script simple para probar envío de correos
import dotenv from 'dotenv';
import pkg from 'nodemailer';
const { createTransport } = pkg;
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

dotenv.config({ path: '.env.local' });

async function testEmail() {
    console.log('🧪 PRUEBA DE ENVÍO DE CORREOS\n');
    console.log('='.repeat(60));

    // Verificar configuración
    console.log('\n📋 Configuración SMTP:');
    console.log(`   Host: ${process.env.SMTP_HOST || 'NO CONFIGURADO'}`);
    console.log(`   Port: ${process.env.SMTP_PORT || 'NO CONFIGURADO'}`);
    console.log(`   User: ${process.env.SMTP_USER || 'NO CONFIGURADO'}`);
    console.log(`   Pass: ${process.env.SMTP_PASS ? '***' + process.env.SMTP_PASS.slice(-4) : 'NO CONFIGURADO'}`);

    if (!process.env.SMTP_HOST || !process.env.SMTP_USER || !process.env.SMTP_PASS) {
        console.log('\n❌ ERROR: Configuración SMTP incompleta');
        console.log('   Por favor configura las variables en .env.local:');
        console.log('   - SMTP_HOST');
        console.log('   - SMTP_PORT');
        console.log('   - SMTP_USER');
        console.log('   - SMTP_PASS');
        return;
    }

    console.log('\n✅ Configuración SMTP completa\n');
    console.log('='.repeat(60));

    // Email de destino
    const testEmail = 'sergio.aguilar.granados@gmail.com';

    console.log(`\n📧 Destinatario: ${testEmail}`);
    console.log(`📤 Remitente: ${process.env.SMTP_USER}\n`);
    console.log('='.repeat(60));

    // Crear transporter
    const transporter = createTransport({
        host: process.env.SMTP_HOST,
        port: parseInt(process.env.SMTP_PORT || '587'),
        secure: process.env.SMTP_PORT === '465',
        auth: {
            user: process.env.SMTP_USER,
            pass: process.env.SMTP_PASS
        }
    });

    // Leer template base
    const basePath = path.join(__dirname, '..', 'src', 'templates', 'email', 'base-template.html');
    const welcomePath = path.join(__dirname, '..', 'src', 'templates', 'email', 'welcome.html');

    let baseTemplate = fs.readFileSync(basePath, 'utf-8');
    let welcomeContent = fs.readFileSync(welcomePath, 'utf-8');

    // Reemplazar variables en welcome
    welcomeContent = welcomeContent.replace(/{{CUSTOMER_NAME}}/g, 'Sergio Aguilar');
    welcomeContent = welcomeContent.replace(/{{APP_URL}}/g, process.env.NEXT_PUBLIC_APP_URL || 'https://app.asoperadora.com');

    // Insertar en base
    let finalHtml = baseTemplate.replace('{{CONTENT}}', welcomeContent);
    finalHtml = finalHtml.replace(/{{SUBJECT}}/g, '¡Bienvenido a AS Operadora!');
    finalHtml = finalHtml.replace(/{{APP_URL}}/g, process.env.NEXT_PUBLIC_APP_URL || 'https://app.asoperadora.com');
    finalHtml = finalHtml.replace(/{{UNSUBSCRIBE_URL}}/g, `${process.env.NEXT_PUBLIC_APP_URL || 'https://app.asoperadora.com'}/unsubscribe?email=${testEmail}`);
    finalHtml = finalHtml.replace(/{{EMAIL}}/g, testEmail);

    // Enviar correo
    console.log('\n📤 Enviando correo de bienvenida...\n');

    try {
        const info = await transporter.sendMail({
            from: `"AS Operadora" <${process.env.SMTP_USER}>`,
            to: testEmail,
            subject: '¡Bienvenido a AS Operadora! 🎉',
            html: finalHtml,
            text: 'Bienvenido a AS Operadora - Experiencias que inspiran'
        });

        console.log('✅ ¡Correo enviado exitosamente!');
        console.log(`   Message ID: ${info.messageId}`);
        console.log(`   Response: ${info.response}`);
        console.log('\n📧 Revisa tu bandeja de entrada en: ' + testEmail);
        console.log('   (También revisa spam/promociones por si acaso)');
        console.log('\n' + '='.repeat(60));

    } catch (error) {
        console.log('❌ Error al enviar correo:');
        console.log(`   ${error.message}`);
        console.log('\n⚠️  Verifica:');
        console.log('   1. Que las credenciales SMTP sean correctas');
        console.log('   2. Que el servidor SMTP esté accesible');
        console.log('   3. Que el puerto sea el correcto (587 o 465)');
        console.log('\n' + '='.repeat(60));
    }
}

// Ejecutar
testEmail().catch(error => {
    console.error('\n❌ ERROR FATAL:', error);
    process.exit(1);
});
