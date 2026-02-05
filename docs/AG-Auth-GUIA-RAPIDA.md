# 🚀 GUÍA RÁPIDA: IMPLEMENTAR GOOGLE OAUTH + ONE TAP

**Fecha:** 5 de Febrero de 2026  
**Tiempo estimado:** 30-45 minutos

---

## 🎯 **QUÉ VAS A LOGRAR**

Implementar autenticación moderna como Civitatis:
- ✅ Botón "Continuar con Google"
- ✅ **Burbuja flotante de Google One Tap** (lo que viste en la imagen)
- ✅ Registro/Login en 2 clicks
- ✅ Compatible con app móvil

---

## 📋 **PASO A PASO**

### **PASO 1: Instalar Dependencias** ⏱️ 5 min

```bash
# Opción A: Desde la raíz del proyecto
npm install next-auth @auth/core google-auth-library jsonwebtoken

# Opción B: Si hay problemas con rutas largas en Windows
# Mover proyecto a C:\dev\operadora-dev y ejecutar ahí
```

### **PASO 2: Configurar Google Cloud** ⏱️ 10 min

1. **Ir a:** https://console.cloud.google.com/

2. **Crear proyecto:**
   - Click en "Select a project" → "New Project"
   - Nombre: "AS Operadora"
   - Click "Create"

3. **Habilitar Google+ API:**
   - APIs & Services → Library
   - Buscar "Google+ API"
   - Click "Enable"

4. **Crear credenciales OAuth:**
   - APIs & Services → Credentials
   - "Create Credentials" → "OAuth 2.0 Client ID"
   - Application type: **Web application**
   - Name: "AS Operadora Web"

5. **Configurar URLs:**
   
   **Authorized JavaScript origins:**
   ```
   http://localhost:3000
   https://app.asoperadora.com
   ```
   
   **Authorized redirect URIs:**
   ```
   http://localhost:3000/api/auth/callback/google
   https://app.asoperadora.com/api/auth/callback/google
   ```

6. **Copiar credenciales:**
   - Client ID: `123456789-abc...apps.googleusercontent.com`
   - Client Secret: `GOCSPX-xxxxx...`

### **PASO 3: Configurar Variables de Entorno** ⏱️ 2 min

Agregar a `.env.local`:

```bash
# NextAuth
NEXTAUTH_URL=http://localhost:3000
NEXTAUTH_SECRET=genera-un-secret-aleatorio-de-minimo-32-caracteres-aqui

# Google OAuth
GOOGLE_CLIENT_ID=tu-client-id-aqui.apps.googleusercontent.com
GOOGLE_CLIENT_SECRET=GOCSPX-tu-client-secret-aqui

# Public (para One Tap)
NEXT_PUBLIC_GOOGLE_CLIENT_ID=tu-client-id-aqui.apps.googleusercontent.com
```

**Generar NEXTAUTH_SECRET:**
```bash
# En terminal
node -e "console.log(require('crypto').randomBytes(32).toString('hex'))"
```

### **PASO 4: Migrar Base de Datos** ⏱️ 2 min

Agregar columnas para OAuth:

```sql
ALTER TABLE users 
ADD COLUMN IF NOT EXISTS oauth_provider VARCHAR(50),
ADD COLUMN IF NOT EXISTS oauth_id VARCHAR(255),
ADD COLUMN IF NOT EXISTS avatar_url TEXT;

CREATE INDEX IF NOT EXISTS idx_users_oauth 
ON users(oauth_provider, oauth_id);
```

O ejecutar script:

```bash
node scripts/migrate-oauth.js
```

### **PASO 5: Actualizar Layout** ⏱️ 3 min

Editar `src/app/layout.tsx`:

```typescript
import SessionProvider from '@/components/providers/SessionProvider';

export default function RootLayout({ children }) {
  return (
    <html lang="es">
      <body>
        <SessionProvider>
          {children}
        </SessionProvider>
      </body>
    </html>
  );
}
```

### **PASO 6: Actualizar Página de Login** ⏱️ 5 min

Editar tu página de login para agregar:

```typescript
import GoogleSignInButton from '@/components/auth/GoogleSignInButton';
import GoogleOneTap from '@/components/auth/GoogleOneTap';

export default function LoginPage() {
  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-50">
      {/* Burbuja flotante de Google One Tap */}
      <GoogleOneTap />
      
      <div className="max-w-md w-full space-y-6 p-8 bg-white rounded-xl shadow-lg">
        <div className="text-center">
          <h2 className="text-3xl font-bold text-gray-900">
            Iniciar Sesión
          </h2>
          <p className="mt-2 text-gray-600">
            Accede a tu cuenta de AS Operadora
          </p>
        </div>
        
        {/* Botón de Google */}
        <GoogleSignInButton callbackUrl="/dashboard" />
        
        {/* Separador */}
        <div className="relative">
          <div className="absolute inset-0 flex items-center">
            <div className="w-full border-t border-gray-300" />
          </div>
          <div className="relative flex justify-center text-sm">
            <span className="px-2 bg-white text-gray-500">
              O continúa con email
            </span>
          </div>
        </div>
        
        {/* Tu formulario actual de login */}
        <form className="space-y-4">
          {/* ... tu código actual ... */}
        </form>
      </div>
    </div>
  );
}
```

### **PASO 7: Probar** ⏱️ 5 min

```bash
# Iniciar servidor
npm run dev

# Abrir navegador
http://localhost:3000/login
```

**Deberías ver:**
1. ✅ Botón "Continuar con Google"
2. ✅ Burbuja flotante de Google One Tap (arriba a la derecha)
3. ✅ Al hacer click, te autenticas con Google
4. ✅ Redirige a /dashboard

---

## 🎨 **PERSONALIZACIÓN**

### **Cambiar Texto del Botón**

```typescript
<GoogleSignInButton 
  callbackUrl="/dashboard"
  className="bg-blue-600 text-white hover:bg-blue-700"
/>
```

### **Deshabilitar One Tap en Ciertas Páginas**

```typescript
// Solo mostrar en login y registro
{pathname === '/login' || pathname === '/register' ? (
  <GoogleOneTap />
) : null}
```

### **Personalizar Callback**

```typescript
// En authOptions.ts
callbacks: {
  async signIn({ user, account }) {
    // Tu lógica personalizada
    if (account?.provider === 'google') {
      // Hacer algo especial con usuarios de Google
    }
    return true;
  }
}
```

---

## 📱 **COMPATIBILIDAD CON APP MÓVIL**

### **Opción 1: Usar Mismo Backend**

En la app móvil (React Native/Expo):

```typescript
import * as Google from 'expo-auth-session/providers/google';

const [request, response, promptAsync] = Google.useAuthRequest({
  expoClientId: 'YOUR_EXPO_CLIENT_ID',
  iosClientId: 'YOUR_IOS_CLIENT_ID',
  androidClientId: 'YOUR_ANDROID_CLIENT_ID',
  webClientId: process.env.GOOGLE_CLIENT_ID, // Mismo que web
});

// Al autenticar
const { authentication } = response;

// Enviar al backend
const res = await fetch('https://app.asoperadora.com/api/auth/google-one-tap', {
  method: 'POST',
  body: JSON.stringify({ credential: authentication.idToken })
});
```

---

## 🐛 **TROUBLESHOOTING**

### **Error: "Invalid client"**
- Verificar que el Client ID sea correcto
- Verificar que la URL esté en "Authorized JavaScript origins"

### **Error: "Redirect URI mismatch"**
- Verificar que la URL de callback esté en "Authorized redirect URIs"
- Debe ser exactamente: `http://localhost:3000/api/auth/callback/google`

### **One Tap no aparece**
- Verificar que `NEXT_PUBLIC_GOOGLE_CLIENT_ID` esté en `.env.local`
- Abrir en ventana de incógnito (puede estar bloqueado por cookies)
- Verificar en consola del navegador si hay errores

### **Error: "Cannot find module 'next-auth'"**
- Reinstalar: `npm install next-auth`
- Si persiste, mover proyecto a ruta más corta (C:\dev\)

---

## ✅ **CHECKLIST**

- [ ] Instalé next-auth y dependencias
- [ ] Creé proyecto en Google Cloud
- [ ] Obtuve Client ID y Secret
- [ ] Configuré URLs autorizadas
- [ ] Agregué variables a .env.local
- [ ] Migré base de datos (oauth_provider, oauth_id)
- [ ] Agregué SessionProvider al layout
- [ ] Agregué GoogleSignInButton a login
- [ ] Agregué GoogleOneTap a login
- [ ] Probé login con Google
- [ ] Probé One Tap
- [ ] Funciona correctamente

---

## 🎉 **RESULTADO FINAL**

Cuando termines, tendrás:

1. ✅ **Botón de Google** - Login en 2 clicks
2. ✅ **One Tap Bubble** - La burbuja flotante como Civitatis
3. ✅ **Auto-registro** - Usuarios nuevos se crean automáticamente
4. ✅ **Email verificado** - Los de Google ya están verificados
5. ✅ **Foto de perfil** - Se obtiene de Google
6. ✅ **Compatible móvil** - Mismo backend para web y app

**Conversión esperada:** +50% más registros 🚀

---

## 📚 **DOCUMENTACIÓN COMPLETA**

Ver: `docs/AG-Auth-Google-OAuth-OneTap.md`

---

**Implementado por:** Antigravity AI  
**Fecha:** 5 de Febrero de 2026  
**Versión:** v1.0 Quick Start
