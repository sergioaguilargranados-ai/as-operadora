// test-all-emails.js - Probar todos los templates
import dotenv from 'dotenv';
import pkg from 'nodemailer';
const { createTransport } = pkg;
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

dotenv.config({ path: '.env.local' });

// Email de destino
const testEmail = 'sergio.aguilar.granados@gmail.com';

// Crear transporter
const createEmailTransporter = () => {
    return createTransport({
        host: process.env.SMTP_HOST,
        port: parseInt(process.env.SMTP_PORT || '465'),
        secure: process.env.SMTP_PORT === '465',
        auth: {
            user: process.env.SMTP_USER,
            pass: process.env.SMTP_PASS?.replace(/^"|"$/g, '')
        }
    });
};

// Renderizar template
const renderTemplate = (templateName, variables) => {
    const basePath = path.join(__dirname, '..', 'src', 'templates', 'email', 'base-template.html');
    const contentPath = path.join(__dirname, '..', 'src', 'templates', 'email', `${templateName}.html`);

    let baseTemplate = fs.readFileSync(basePath, 'utf-8');
    let contentTemplate = fs.readFileSync(contentPath, 'utf-8');

    // Reemplazar variables en contenido
    Object.keys(variables).forEach(key => {
        const regex = new RegExp(`{{${key}}}`, 'g');
        contentTemplate = contentTemplate.replace(regex, String(variables[key] || ''));
    });

    // Manejar condicionales simples {{#if VAR}}...{{/if}}
    contentTemplate = contentTemplate.replace(/{{#if\s+(\w+)}}([\s\S]*?){{\/if}}/g, (match, varName, content) => {
        return variables[varName] ? content : '';
    });

    // Manejar loops simples {{#each ARRAY}}...{{/each}}
    contentTemplate = contentTemplate.replace(/{{#each\s+(\w+)}}([\s\S]*?){{\/each}}/g, (match, varName, itemTemplate) => {
        const array = variables[varName];
        if (!Array.isArray(array)) return '';
        return array.map(item => {
            let rendered = itemTemplate;
            if (typeof item === 'object') {
                Object.keys(item).forEach(key => {
                    const regex = new RegExp(`{{${key}}}`, 'g');
                    rendered = rendered.replace(regex, String(item[key] || ''));
                });
            } else {
                rendered = itemTemplate.replace(/{{this}}/g, String(item));
            }
            return rendered;
        }).join('');
    });

    // Insertar contenido en base
    let finalHtml = baseTemplate.replace('{{CONTENT}}', contentTemplate);

    // Reemplazar variables globales
    const globalVars = {
        ...variables,
        APP_URL: process.env.NEXT_PUBLIC_APP_URL || 'https://app.asoperadora.com',
        UNSUBSCRIBE_URL: `${process.env.NEXT_PUBLIC_APP_URL || 'https://app.asoperadora.com'}/unsubscribe?email=${variables.EMAIL || ''}`,
        SUBJECT: variables.SUBJECT || 'Notificación de AS Operadora'
    };

    Object.keys(globalVars).forEach(key => {
        const regex = new RegExp(`{{${key}}}`, 'g');
        finalHtml = finalHtml.replace(regex, String(globalVars[key] || ''));
    });

    return finalHtml;
};

// Enviar correo
const sendEmail = async (to, subject, html) => {
    const transporter = createEmailTransporter();
    await transporter.sendMail({
        from: `"AS Operadora" <${process.env.SMTP_USER}>`,
        to,
        subject,
        html,
        text: subject
    });
};

// Tests
const tests = [
    {
        name: '1. Bienvenida',
        template: 'welcome',
        subject: '¡Bienvenido a AS Operadora! 🎉',
        data: {
            CUSTOMER_NAME: 'Sergio Aguilar',
            EMAIL: testEmail,
            SUBJECT: '¡Bienvenido a AS Operadora!'
        }
    },
    {
        name: '2. Confirmación de Reserva',
        template: 'booking-confirmed',
        subject: 'Confirmación de Reserva #12345 - AS Operadora',
        data: {
            CUSTOMER_NAME: 'Sergio Aguilar',
            EMAIL: testEmail,
            BOOKING_ID: '12345',
            SERVICE_NAME: 'Gran Tour de Europa - 15 días',
            BOOKING_DATE: '5 de Febrero de 2026',
            TRAVEL_DATE: '15 de Marzo de 2026',
            PASSENGERS: '2',
            DESTINATION: 'Europa (París, Roma, Barcelona)',
            TOTAL_PRICE: '2,500.00',
            CURRENCY: 'USD',
            SUBJECT: 'Confirmación de Reserva #12345'
        }
    },
    {
        name: '3. Confirmación de Pago',
        template: 'payment-confirmed',
        subject: 'Pago Confirmado - Reserva #12345',
        data: {
            CUSTOMER_NAME: 'Sergio Aguilar',
            EMAIL: testEmail,
            BOOKING_ID: '12345',
            AMOUNT: '1,250.00',
            CURRENCY: 'USD',
            PAYMENT_DATE: '5 de Febrero de 2026',
            PAYMENT_METHOD: 'Tarjeta de Crédito Visa ****1234',
            TRANSACTION_ID: 'TXN-2026-02-05-001',
            SERVICE_NAME: 'Gran Tour de Europa - 15 días',
            TRAVEL_DATE: '15 de Marzo de 2026',
            REMAINING_BALANCE: '1,250.00',
            DUE_DATE: '1 de Marzo de 2026',
            INVOICE_AVAILABLE: true,
            SUBJECT: 'Pago Confirmado - Reserva #12345'
        }
    },
    {
        name: '4. Cotización Enviada',
        template: 'quote-sent',
        subject: 'Tu Cotización #QT-2026-001 - AS Operadora',
        data: {
            CUSTOMER_NAME: 'Sergio Aguilar',
            EMAIL: testEmail,
            QUOTE_ID: 'QT-2026-001',
            DESTINATION: 'París, Francia',
            TRAVEL_DATES: '15 - 25 de Marzo de 2026',
            DURATION: '10 días / 9 noches',
            PASSENGERS: '2',
            ROOM_TYPE: 'Habitación Doble Superior',
            INCLUSIONS: [
                'Vuelos redondos México - París',
                'Hotel 4 estrellas en zona céntrica',
                'Desayunos buffet incluidos',
                'Tour por la ciudad con guía en español',
                'Entrada a la Torre Eiffel',
                'Crucero por el Sena',
                'Seguro de viaje'
            ],
            TOTAL_PRICE: '2,500.00',
            PRICE_PER_PERSON: '1,250.00',
            CURRENCY: 'USD',
            EXPIRY_DATE: '15 de Febrero de 2026',
            SUBJECT: 'Tu Cotización #QT-2026-001'
        }
    }
];

async function runTests() {
    console.log('🧪 PRUEBA DE TODOS LOS TEMPLATES\n');
    console.log('='.repeat(60));
    console.log(`\n📧 Destinatario: ${testEmail}\n`);
    console.log('='.repeat(60));

    let successCount = 0;
    let failCount = 0;

    for (const test of tests) {
        console.log(`\n📤 ${test.name}...`);

        try {
            const html = renderTemplate(test.template, test.data);
            await sendEmail(testEmail, test.subject, html);
            console.log(`   ✅ Enviado exitosamente`);
            successCount++;

            // Pausa entre envíos
            await new Promise(resolve => setTimeout(resolve, 2000));
        } catch (error) {
            console.log(`   ❌ Error: ${error.message}`);
            failCount++;
        }
    }

    // Resumen
    console.log('\n' + '='.repeat(60));
    console.log('\n📊 RESUMEN:');
    console.log(`   ✅ Exitosos: ${successCount}/4`);
    console.log(`   ❌ Fallidos: ${failCount}/4`);
    console.log(`   📧 Destinatario: ${testEmail}`);

    if (successCount === 4) {
        console.log('\n🎉 ¡Todos los templates funcionan correctamente!');
        console.log('   Revisa tu bandeja de entrada');
    } else {
        console.log('\n⚠️  Algunos templates fallaron');
    }

    console.log('\n' + '='.repeat(60));
}

runTests().catch(error => {
    console.error('\n❌ ERROR FATAL:', error);
    process.exit(1);
});
