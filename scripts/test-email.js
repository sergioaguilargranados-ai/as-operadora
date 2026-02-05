// test-email.js - Script para probar envío de correos
import dotenv from 'dotenv';
import nodemailer from 'nodemailer';
import fs from 'fs';
import path from 'path';

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

    // Email de destino - USA TU EMAIL PERSONAL PARA RECIBIR LAS PRUEBAS
    const testEmail = 'info@asoperadora.com'; // ⚠️ Este es el email que RECIBIRÁ los correos de prueba

    // Validación deshabilitada para permitir pruebas
    // if (testEmail === 'info@asoperadora.com') {
    //     console.log('\n⚠️  ADVERTENCIA: Debes cambiar el email de destino en el script');
    //     console.log('   Edita scripts/test-email.js línea 33');
    //     return;
    // }

    // Menú de opciones
    console.log('\n📧 Selecciona qué template probar:\n');
    console.log('   1. Bienvenida');
    console.log('   2. Confirmación de Reserva');
    console.log('   3. Confirmación de Pago');
    console.log('   4. Cotización Enviada');
    console.log('   5. Todos (enviar los 4)\n');

    const option = process.argv[2] || '1';

    console.log(`Opción seleccionada: ${option}\n`);
    console.log('='.repeat(60));

    const tests = [];

    // Preparar tests según opción
    if (option === '1' || option === '5') {
        tests.push({
            name: 'Bienvenida',
            template: EmailTemplateService.renderWelcome({
                customerName: 'Sergio Aguilar',
                email: testEmail
            })
        });
    }

    if (option === '2' || option === '5') {
        tests.push({
            name: 'Confirmación de Reserva',
            template: EmailTemplateService.renderBookingConfirmed({
                customerName: 'Sergio Aguilar',
                email: testEmail,
                bookingId: 12345,
                serviceName: 'Gran Tour de Europa - 15 días',
                bookingDate: new Date().toLocaleDateString('es-MX', {
                    weekday: 'long',
                    year: 'numeric',
                    month: 'long',
                    day: 'numeric'
                }),
                travelDate: '15 de Marzo de 2026',
                passengers: 2,
                destination: 'Europa (París, Roma, Barcelona)',
                totalPrice: 2500,
                currency: 'USD'
            })
        });
    }

    if (option === '3' || option === '5') {
        tests.push({
            name: 'Confirmación de Pago',
            template: EmailTemplateService.renderPaymentConfirmed({
                customerName: 'Sergio Aguilar',
                email: testEmail,
                bookingId: 12345,
                amount: 1250,
                currency: 'USD',
                paymentDate: new Date().toLocaleDateString('es-MX', {
                    weekday: 'long',
                    year: 'numeric',
                    month: 'long',
                    day: 'numeric'
                }),
                paymentMethod: 'Tarjeta de Crédito Visa ****1234',
                transactionId: 'TXN-2026-02-05-001',
                serviceName: 'Gran Tour de Europa - 15 días',
                travelDate: '15 de Marzo de 2026',
                remainingBalance: 1250,
                dueDate: '1 de Marzo de 2026',
                invoiceAvailable: true
            })
        });
    }

    if (option === '4' || option === '5') {
        tests.push({
            name: 'Cotización Enviada',
            template: EmailTemplateService.renderQuoteSent({
                customerName: 'Sergio Aguilar',
                email: testEmail,
                quoteId: 'QT-2026-001',
                destination: 'París, Francia',
                travelDates: '15 - 25 de Marzo de 2026',
                duration: '10 días / 9 noches',
                passengers: 2,
                roomType: 'Habitación Doble Superior',
                inclusions: [
                    'Vuelos redondos México - París',
                    'Hotel 4 estrellas en zona céntrica',
                    'Desayunos buffet incluidos',
                    'Tour por la ciudad con guía en español',
                    'Entrada a la Torre Eiffel',
                    'Crucero por el Sena',
                    'Seguro de viaje'
                ],
                totalPrice: 2500,
                pricePerPerson: 1250,
                currency: 'USD',
                expiryDate: '15 de Febrero de 2026',
                paymentPlan: [
                    { label: 'Anticipo (30%)', amount: 750 },
                    { label: 'Segundo pago (40%)', amount: 1000 },
                    { label: 'Pago final (30%)', amount: 750 }
                ]
            })
        });
    }

    // Ejecutar tests
    let successCount = 0;
    let failCount = 0;

    for (const test of tests) {
        console.log(`\n📤 Enviando: ${test.name}...`);

        try {
            const success = await emailService.sendEmail({
                to: testEmail,
                subject: test.template.subject,
                html: test.template.html
            });

            if (success) {
                console.log(`   ✅ ${test.name} enviado exitosamente`);
                successCount++;
            } else {
                console.log(`   ❌ ${test.name} falló al enviar`);
                failCount++;
            }
        } catch (error) {
            console.log(`   ❌ Error: ${error.message}`);
            failCount++;
        }

        // Pausa entre envíos
        if (tests.length > 1) {
            await new Promise(resolve => setTimeout(resolve, 2000));
        }
    }

    // Resumen
    console.log('\n' + '='.repeat(60));
    console.log('\n📊 RESUMEN:');
    console.log(`   ✅ Exitosos: ${successCount}`);
    console.log(`   ❌ Fallidos: ${failCount}`);
    console.log(`   📧 Destinatario: ${testEmail}`);

    if (successCount > 0) {
        console.log('\n🎉 ¡Correos enviados! Revisa tu bandeja de entrada');
        console.log('   (También revisa spam/promociones por si acaso)');
    }

    if (failCount > 0) {
        console.log('\n⚠️  Algunos correos fallaron. Verifica:');
        console.log('   1. Configuración SMTP en .env.local');
        console.log('   2. Que el servidor SMTP esté accesible');
        console.log('   3. Que las credenciales sean correctas');
        console.log('   4. Logs del servidor para más detalles');
    }

    console.log('\n' + '='.repeat(60));
}

// Ejecutar
testEmail().catch(error => {
    console.error('\n❌ ERROR FATAL:', error);
    process.exit(1);
});
