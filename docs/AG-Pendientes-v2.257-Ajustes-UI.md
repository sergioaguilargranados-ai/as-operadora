# Pendientes v2.257 - Ajustes Finales UI

**Fecha:** 31 Ene 2026 - 18:05 CST  
**Estado:** PENDIENTE DE IMPLEMENTACIÓN

---

## 🎯 CAMBIOS SOLICITADOS

### 1. ✅ Cenefa blanca traslúcida más alta (FÁCIL)

**Problema:** El header en `/tours/[code]` tiene menos altura que el de la página principal.

**Solución:**
- Archivo: `src/app/tours/[code]/page.tsx`
- Línea: ~229
- Cambiar: `className="bg-white/95 backdrop-blur-md border-b border-gray-200 sticky top-0 z-50 shadow-sm"`
- A: Agregar `py-6` en el contenedor del header

**Código actual:**
```tsx
<header className="bg-white/95 backdrop-blur-md border-b border-gray-200 sticky top-0 z-50 shadow-sm">
    <div className="container mx-auto px-4 py-4">
```

**Código nuevo:**
```tsx
<header className="bg-white/95 backdrop-blur-md border-b border-gray-200 sticky top-0 z-50 shadow-sm">
    <div className="container mx-auto px-4 py-6">
```

---

### 2. 🗺️ Mapa del Tour (REQUIERE DECISIÓN)

**Problema:** Actualmente se muestra una imagen estática de Unsplash. Se necesita un mapa real.

**Opciones:**

#### Opción A: Google Maps Embed (RECOMENDADO)
- **Ventaja:** Mapa interactivo, zoom, street view
- **Desventaja:** Requiere API Key de Google Maps
- **Costo:** Gratis hasta 28,000 cargas/mes

**Implementación:**
```tsx
{tour.mapImage && (
    <Card className="p-6">
        <h2 className="text-2xl font-bold mb-4 flex items-center gap-2">
            <MapIcon className="w-6 h-6 text-blue-600" />
            Mapa del Tour
        </h2>
        <div className="relative h-96 bg-gray-100 rounded-xl overflow-hidden">
            <iframe
                src={`https://www.google.com/maps/embed/v1/place?key=YOUR_API_KEY&q=${encodeURIComponent(tour.mainCountry)}`}
                width="100%"
                height="100%"
                style={{ border: 0 }}
                allowFullScreen
                loading="lazy"
            />
        </div>
    </Card>
)}
```

#### Opción B: Imagen de mapa estática
- **Ventaja:** Sin costo, sin API
- **Desventaja:** No es interactivo
- **Implementación:** Subir imágenes de mapas a Cloudinary/S3

#### Opción C: Leaflet (Open Source)
- **Ventaja:** Gratis, open source
- **Desventaja:** Requiere más configuración
- **Implementación:** Usar `react-leaflet`

**DECISIÓN REQUERIDA:** ¿Qué opción prefieres?

---

### 3. 🔍 Buscador en Página Principal (MEDIANO)

**Problema:** No hay buscador en la sección de "Tours y Viajes Grupales" de la página principal.

**Solución:** Agregar un input de búsqueda que redirija a `/tours?search=TEXTO`

**Ubicación:** Página principal, sección de tours (necesito ubicarla primero)

**Implementación:**

1. **Encontrar la sección de tours en `src/app/page.tsx`**
2. **Agregar componente de búsqueda:**

```tsx
{/* Buscador de Tours */}
<div className="mb-8">
    <div className="max-w-2xl mx-auto">
        <div className="relative">
            <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
            <Input
                type="text"
                placeholder="Buscar destino, país o tour..."
                value={tourSearch}
                onChange={(e) => setTourSearch(e.target.value)}
                onKeyPress={(e) => {
                    if (e.key === 'Enter' && tourSearch.trim()) {
                        router.push(`/tours?search=${encodeURIComponent(tourSearch)}`)
                    }
                }}
                className="pl-12 pr-32 py-6 text-lg rounded-full border-2 border-gray-200 focus:border-blue-500"
            />
            <Button
                onClick={() => {
                    if (tourSearch.trim()) {
                        router.push(`/tours?search=${encodeURIComponent(tourSearch)}`)
                    }
                }}
                className="absolute right-2 top-1/2 -translate-y-1/2 rounded-full px-8 py-5 bg-blue-600 hover:bg-blue-700"
            >
                Buscar
            </Button>
        </div>
    </div>
</div>
```

3. **Agregar estado en el componente:**
```tsx
const [tourSearch, setTourSearch] = useState('')
```

---

## 📋 PASOS PARA IMPLEMENTAR

### Paso 1: Cenefa más alta (2 minutos)
```bash
# Editar src/app/tours/[code]/page.tsx
# Línea ~231: cambiar py-4 a py-6
```

### Paso 2: Decidir opción de mapa
- [ ] Opción A: Google Maps (requiere API key)
- [ ] Opción B: Imagen estática
- [ ] Opción C: Leaflet

### Paso 3: Implementar buscador
1. Ubicar sección de tours en página principal
2. Agregar estado `tourSearch`
3. Agregar componente de búsqueda
4. Probar redirección a `/tours?search=...`

---

## 🚀 PRIORIDAD

1. **ALTA:** Cenefa más alta (fácil, 2 min)
2. **MEDIA:** Buscador en página principal (15-20 min)
3. **BAJA:** Mapa interactivo (requiere decisión + API key)

---

## ❓ PREGUNTAS PARA EL USUARIO

1. **Mapa:** ¿Prefieres Google Maps interactivo (requiere API key) o imagen estática?
2. **Buscador:** ¿Dónde exactamente quieres el buscador en la página principal? (necesito ver screenshot o descripción)

---

¿Quieres que implemente primero el cambio #1 (cenefa) y #3 (buscador), y luego decidimos sobre el mapa?
