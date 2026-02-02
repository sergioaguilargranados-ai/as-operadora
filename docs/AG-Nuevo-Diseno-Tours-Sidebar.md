# Nuevo Diseño de Tours - Sidebar Lateral

**Fecha:** 2026-02-01
**Versión:** v2.290

## 🎨 Diseño Inspirado en Hoteles + MegaTravel

### Características Principales

#### 1. **Sidebar Izquierdo (Estilo Hoteles)**
- Fijo en scroll
- Filtros colapsables
- Diseño limpio y moderno
- Botón "Limpiar filtros"

#### 2. **Filtros Implementados (Estilo MegaTravel)**

**✅ Palabra Clave**
- Búsqueda de texto libre
- Busca en: nombre, descripción, países, ciudades

**✅ Seleccionar País**
- Dropdown con todos los países disponibles
- Actualiza automáticamente

**✅ Seleccionar Ciudad**
- Aparece solo si hay país seleccionado
- Filtra ciudades del país seleccionado

**✅ Tarifa (Rango de Precios)**
- Slider de 0 a 100,000 MXN
- Muestra rango actual
- Filtrado en tiempo real

**✅ Duración**
- Slider de 1 a 30 días
- Muestra rango actual
- Filtrado en tiempo real

**✅ Fecha ida (Salidas por Mes)**
- Lista de 12 meses
- Selección única
- Scrollable

## 📐 Estructura del Layout

```
┌─────────────────────────────────────────────┐
│           Header (Sticky)                    │
└─────────────────────────────────────────────┘
┌──────────┬──────────────────────────────────┐
│          │                                   │
│ Sidebar  │   Main Content                    │
│ (320px)  │                                   │
│          │   ┌─────────────────────────┐    │
│ Filtros: │   │ Results Header          │    │
│          │   │ - Conteo                │    │
│ • Buscar │   │ - Vista Grid/List       │    │
│ • País   │   └─────────────────────────┘    │
│ • Ciudad │                                   │
│ • Precio │   ┌─────┬─────┬─────┐           │
│ • Duración│  │Tour │Tour │Tour │           │
│ • Fechas │   │Card │Card │Card │           │
│          │   └─────┴─────┴─────┘           │
│          │                                   │
│          │   Paginación                      │
└──────────┴──────────────────────────────────┘
```

## 🎯 Filtros Colapsables

Cada sección de filtros puede expandirse/colapsarse:
- ✅ Búsqueda (abierta por defecto)
- ✅ País (abierta por defecto)
- ✅ Precio (abierta por defecto)
- ✅ Duración (abierta por defecto)
- ⏹️ Fechas (cerrada por defecto)
- ⏹️ Región (cerrada por defecto)
- ⏹️ Tags (cerrada por defecto)

## 🔄 Vistas Disponibles

### Vista Grid (Por defecto)
- 3 columnas en desktop
- 2 columnas en tablet
- 1 columna en móvil
- Cards verticales con imagen arriba

### Vista List
- 1 columna
- Cards horizontales
- Imagen a la izquierda
- Más información visible

## 🚀 Cómo Probar

### Opción 1: Reemplazar archivo actual
```bash
# Backup del actual
cp src/app/tours/page.tsx src/app/tours/page-old.tsx

# Usar nueva versión
cp src/app/tours/page-v2-sidebar.tsx src/app/tours/page.tsx

# Iniciar dev server
npm run dev
```

### Opción 2: Ruta temporal
```bash
# Crear ruta /tours-v2
mkdir -p src/app/tours-v2
cp src/app/tours/page-v2-sidebar.tsx src/app/tours-v2/page.tsx

# Visitar http://localhost:3000/tours-v2
```

## 📊 Comparación con Diseño Anterior

| Aspecto | Anterior | Nuevo |
|---------|----------|-------|
| **Filtros** | Horizontales arriba | Sidebar izquierdo |
| **Espacio** | Ocupa 2 filas | Sidebar fijo |
| **Filtros** | 2 (Destino, Eventos) | 6+ (Palabra, País, Ciudad, Precio, Duración, Fechas) |
| **Funcionalidad** | Básica | Avanzada |
| **Diseño** | Propio | Estilo MegaTravel |
| **Responsive** | Sí | Sí (sidebar colapsa en móvil) |

## 🎨 Paleta de Colores

```css
Azul primario: #2563eb (blue-600)
Verde precio: #16a34a (green-600)
Púrpura duración: #9333ea (purple-600)
Naranja fechas: #ea580c (orange-600)
Gris texto: #4b5563 (gray-600)
```

## ✨ Mejoras Adicionales

1. **Sticky Sidebar** - Se mantiene visible al hacer scroll
2. **Contadores en tiempo real** - Muestra cuántos tours cumplen cada filtro
3. **Limpiar filtros** - Botón para resetear todo
4. **Vista Grid/List** - Toggle para cambiar visualización
5. **Animaciones suaves** - Transiciones en hover y cambios

## 🐛 Pendientes

- [ ] Agregar filtro de regiones (Europa, Asia, etc.)
- [ ] Agregar filtro de tags (Quinceañeras, Bodas, etc.)
- [ ] Responsive para móvil (sidebar colapsable)
- [ ] Guardar filtros en URL (query params)
- [ ] Ordenamiento (precio, duración, nombre)

## 📝 Notas

- El diseño está basado en la página de hoteles existente
- Los filtros son los mismos que MegaTravel
- Se mantiene la paginación de 20 tours por página
- Compatible con los datos actuales de la BD

---

**Archivo:** `src/app/tours/page-v2-sidebar.tsx`
**Estado:** Listo para probar
**Próximo paso:** Decidir si reemplazar o crear ruta temporal
