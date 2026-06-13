# AG-sesion-260612-Landing-Principal

**Fecha:** 12 de Junio de 2026 - 23:25 CST
**Versión:** v2.347
**Realizado por:** AntiGravity AI Assistant

## 📝 Resumen de la sesión
Se reestructuró la antigua "Landing Expo" para convertirla en la **Landing Page Principal Permanente** de AS Operadora bajo la ruta `/inicio`. El objetivo es tener una cara principal moderna y elegante para el sistema.

## 🛠️ Archivos modificados y creados
- **`src/app/inicio/page.tsx`**: Nueva interfaz principal con tipografía Playfair e Inter, modo monocromático y responsive.
- **`src/app/inicio/registro/page.tsx`**: Formulario de captura de prospectos con selección explícita del tipo de cliente (Viajero, Agencia, Empresa).
- **`src/app/api/inicio/register/route.ts`**: Lógica que inserta directamente en la tabla oficial de `crm_contacts` y envía el correo.
- **`src/lib/emailHelper.ts`**: Se agregó `sendLandingWelcomeEmail` que usa la plantilla base para informar del proceso de 30 días.
- **`src/templates/email/landing-welcome.html`**: Se creó la plantilla HTML del correo para la landing.
- **`src/components/admin/LandingContentManager.tsx`**: Interfaz en el panel de administrador para controlar la landing (hero title, subtitle, video_url).
- **`src/components/BrandFooter.tsx`**: Se actualizó a la versión `v2.347 | Build: 12 Jun 2026, 23:23 CST`
- **`docs/AG-Contexto-Proyecto.md`** y **`docs/AG-Historico-Cambios.md`**: Versión subida a v2.347.

## 🚀 Próximos pasos
- El frontend de `/inicio` está funcionando con datos quemados de las secciones ("Destinos", "Servicios"). Solo el Hero es editable en el panel Admin.
- Probar el ingreso de prospectos en el ambiente de liberación (operadora-dev) y confirmar recepción de correos electrónicos en SendGrid/Resend.
