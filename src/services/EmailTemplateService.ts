/**
 * EMAIL TEMPLATE SERVICE
 * Servicio para renderizar templates de correo con el diseño institucional
 */

import fs from 'fs';
import path from 'path';

interface TemplateData {
    [key: string]: any;
}

export class EmailTemplateService {
    private static baseTemplatePath = path.join(process.cwd(), 'src', 'templates', 'email', 'base-template.html');
    private static templatesDir = path.join(process.cwd(), 'src', 'templates', 'email');

    /**
     * Renderizar template completo
     */
    static render(templateName: string, data: TemplateData): { html: string; subject: string } {
        try {
            // Leer template base
            const baseTemplate = fs.readFileSync(this.baseTemplatePath, 'utf-8');

            // Leer template de contenido
            const contentPath = path.join(this.templatesDir, `${templateName}.html`);
            const contentTemplate = fs.readFileSync(contentPath, 'utf-8');

            // Renderizar contenido con datos
            let renderedContent = this.replaceVariables(contentTemplate, data);

            // Insertar contenido en template base
            let finalHtml = baseTemplate.replace('{{CONTENT}}', renderedContent);

            // Reemplazar variables globales
            finalHtml = this.replaceVariables(finalHtml, {
                ...data,
                APP_URL: process.env.NEXT_PUBLIC_APP_URL || 'https://app.asoperadora.com',
                UNSUBSCRIBE_URL: `${process.env.NEXT_PUBLIC_APP_URL || 'https://app.asoperadora.com'}/unsubscribe?email=${data.EMAIL || ''}`,
                SUBJECT: data.SUBJECT || 'Notificación de AS Operadora'
            });

            return {
                html: finalHtml,
                subject: data.SUBJECT || 'Notificación de AS Operadora'
            };
        } catch (error) {
            console.error(`Error rendering template ${templateName}:`, error);
            throw new Error(`Failed to render email template: ${templateName}`);
        }
    }

    /**
     * Reemplazar variables en template
     */
    private static replaceVariables(template: string, data: TemplateData): string {
        let result = template;

        // Reemplazar variables simples {{VARIABLE}}
        Object.keys(data).forEach(key => {
            const regex = new RegExp(`{{${key}}}`, 'g');
            const value = data[key] !== undefined && data[key] !== null ? String(data[key]) : '';
            result = result.replace(regex, value);
        });

        // Manejar condicionales {{#if VARIABLE}}...{{/if}}
        result = this.handleConditionals(result, data);

        // Manejar loops {{#each ARRAY}}...{{/each}}
        result = this.handleLoops(result, data);

        return result;
    }

    /**
     * Manejar condicionales en templates
     */
    private static handleConditionals(template: string, data: TemplateData): string {
        const conditionalRegex = /{{#if\s+(\w+)}}([\s\S]*?){{\/if}}/g;

        return template.replace(conditionalRegex, (match, variable, content) => {
            const value = data[variable];
            // Mostrar contenido si la variable existe y no es falsy
            if (value && value !== '' && value !== 'false' && value !== '0') {
                return this.replaceVariables(content, data);
            }
            return '';
        });
    }

    /**
     * Manejar loops en templates
     */
    private static handleLoops(template: string, data: TemplateData): string {
        const loopRegex = /{{#each\s+(\w+)}}([\s\S]*?){{\/each}}/g;

        return template.replace(loopRegex, (match, variable, content) => {
            const array = data[variable];

            if (!Array.isArray(array)) {
                return '';
            }

            return array.map((item, index) => {
                // Si el item es un objeto, usar sus propiedades
                if (typeof item === 'object') {
                    return this.replaceVariables(content, { ...item, INDEX: index });
                }
                // Si es un valor simple, usar 'this'
                return content.replace(/{{this}}/g, String(item));
            }).join('');
        });
    }

    /**
     * Templates predefinidos
     */

    static renderWelcome(data: {
        customerName: string;
        email: string;
    }) {
        return this.render('welcome', {
            SUBJECT: '¡Bienvenido a AS Operadora! 🎉',
            CUSTOMER_NAME: data.customerName,
            EMAIL: data.email
        });
    }

    static renderBookingConfirmed(data: {
        customerName: string;
        email: string;
        bookingId: number;
        serviceName: string;
        bookingDate: string;
        travelDate?: string;
        passengers?: number;
        destination?: string;
        totalPrice: number;
        currency: string;
    }) {
        return this.render('booking-confirmed', {
            SUBJECT: `Confirmación de Reserva #${data.bookingId} - AS Operadora`,
            CUSTOMER_NAME: data.customerName,
            EMAIL: data.email,
            BOOKING_ID: data.bookingId,
            SERVICE_NAME: data.serviceName,
            BOOKING_DATE: data.bookingDate,
            TRAVEL_DATE: data.travelDate,
            PASSENGERS: data.passengers,
            DESTINATION: data.destination,
            TOTAL_PRICE: this.formatCurrency(data.totalPrice),
            CURRENCY: data.currency
        });
    }

    static renderPaymentConfirmed(data: {
        customerName: string;
        email: string;
        bookingId: number;
        amount: number;
        currency: string;
        paymentDate: string;
        paymentMethod: string;
        transactionId: string;
        serviceName?: string;
        travelDate?: string;
        remainingBalance?: number;
        dueDate?: string;
        nextPaymentDate?: string;
        invoiceAvailable?: boolean;
    }) {
        return this.render('payment-confirmed', {
            SUBJECT: `Pago Confirmado - Reserva #${data.bookingId}`,
            CUSTOMER_NAME: data.customerName,
            EMAIL: data.email,
            BOOKING_ID: data.bookingId,
            AMOUNT: this.formatCurrency(data.amount),
            CURRENCY: data.currency,
            PAYMENT_DATE: data.paymentDate,
            PAYMENT_METHOD: data.paymentMethod,
            TRANSACTION_ID: data.transactionId,
            SERVICE_NAME: data.serviceName,
            TRAVEL_DATE: data.travelDate,
            REMAINING_BALANCE: data.remainingBalance ? this.formatCurrency(data.remainingBalance) : undefined,
            DUE_DATE: data.dueDate,
            NEXT_PAYMENT_DATE: data.nextPaymentDate,
            INVOICE_AVAILABLE: data.invoiceAvailable
        });
    }

    static renderQuoteSent(data: {
        customerName: string;
        email: string;
        quoteId: string;
        destination: string;
        travelDates: string;
        duration: string;
        passengers: number;
        roomType?: string;
        inclusions?: string[];
        totalPrice: number;
        pricePerPerson: number;
        currency: string;
        expiryDate: string;
        paymentPlan?: Array<{ label: string; amount: number }>;
    }) {
        return this.render('quote-sent', {
            SUBJECT: `Tu Cotización #${data.quoteId} - AS Operadora`,
            CUSTOMER_NAME: data.customerName,
            EMAIL: data.email,
            QUOTE_ID: data.quoteId,
            DESTINATION: data.destination,
            TRAVEL_DATES: data.travelDates,
            DURATION: data.duration,
            PASSENGERS: data.passengers,
            ROOM_TYPE: data.roomType,
            INCLUSIONS: data.inclusions,
            TOTAL_PRICE: this.formatCurrency(data.totalPrice),
            PRICE_PER_PERSON: this.formatCurrency(data.pricePerPerson),
            CURRENCY: data.currency,
            EXPIRY_DATE: data.expiryDate,
            PAYMENT_PLAN: data.paymentPlan?.map(p => ({
                ...p,
                amount: this.formatCurrency(p.amount)
            }))
        });
    }

    /**
     * Formatear moneda
     */
    private static formatCurrency(amount: number): string {
        return new Intl.NumberFormat('es-MX', {
            minimumFractionDigits: 2,
            maximumFractionDigits: 2
        }).format(amount);
    }

    /**
     * Formatear fecha
     */
    static formatDate(date: Date | string): string {
        const d = typeof date === 'string' ? new Date(date) : date;
        return new Intl.DateTimeFormat('es-MX', {
            weekday: 'long',
            year: 'numeric',
            month: 'long',
            day: 'numeric'
        }).format(d);
    }
}

// Exportar instancia singleton
export const emailTemplateService = EmailTemplateService;
