# Plan de Integración - Filtros Sidebar a Tours Principal

## 🎯 Objetivo
Integrar los filtros avanzados del sidebar a la página principal `/tours`, manteniendo su diseño hero y mejorando el responsive móvil.

## ✅ Qué Mantener de la Página Actual
1. ✅ **Hero Section** - Video/imagen de fondo con búsqueda
2. ✅ **Header** - Navegación por categorías (Ofertas, Bloqueos, etc.)
3. ✅ **Diseño de cards** - Grid actual de tours
4. ✅ **Paginación** - Sistema actual de 20 tours/página
5. ✅ **Filtros horizontales** - Regiones y eventos (moverlos al sidebar)

## 🆕 Qué Agregar
1. ✅ **Sidebar izquierdo** - Filtros avanzados estilo MegaTravel
2. ✅ **Filtros adicionales:**
   - Palabra clave (ya existe en hero, duplicar en sidebar)
   - País (dropdown)
   - Ciudad (dropdown condicional)
   - **Tarifa en USD** (slider 0-10,000 USD)
   - Duración (slider 1-30 días)
   - Fecha de salida (meses)
3. ✅ **Responsive móvil:**
   - Botón flotante "Filtros" en móvil
   - Sidebar como modal/drawer en móvil
   - Colapsa automáticamente en pantallas < 1024px

## 📐 Estructura Propuesta

```
┌─────────────────────────────────────────────────┐
│ Header (Sticky) - Categorías                    │
└─────────────────────────────────────────────────┘
┌─────────────────────────────────────────────────┐
│ Hero Section - Video + Búsqueda                 │
└─────────────────────────────────────────────────┘
┌──────────┬──────────────────────────────────────┐
│ SIDEBAR  │   CONTENT AREA                       │
│ (280px)  │                                       │
│          │   Filtros horizontales (Regiones)    │
│ Filtros: │   ────────────────────────────────   │
│          │                                       │
│ 🔍 Buscar│   ┌─────┬─────┬─────┬─────┐         │
│ 🌍 País  │   │Tour │Tour │Tour │Tour │         │
│ 📍 Ciudad│   │Card │Card │Card │Card │         │
│ 💰 Tarifa│   └─────┴─────┴─────┴─────┘         │
│ ⏱️ Duración│                                     │
│ 📅 Fechas│   Paginación [1][2][3]...            │
│          │                                       │
└──────────┴──────────────────────────────────────┘

MÓVIL (<1024px):
┌─────────────────────────────────────────────────┐
│ Header                                           │
│ Hero                                             │
│ [🔍 Filtros] ← Botón flotante                   │
│ ┌─────┐                                         │
│ │Tour │                                         │
│ │Card │                                         │
│ └─────┘                                         │
└─────────────────────────────────────────────────┘
```

## 🔧 Cambios Técnicos

### 1. Estados Adicionales
```typescript
// Filtros avanzados
const [selectedCountry, setSelectedCountry] = useState<string | null>(null)
const [selectedCity, setSelectedCity] = useState<string | null>(null)
const [priceRange, setPriceRange] = useState<[number, number]>([0, 10000]) // USD
const [durationRange, setDurationRange] = useState<[number, number]>([1, 30])
const [selectedMonth, setSelectedMonth] = useState<string | null>(null)

// UI móvil
const [showMobileFilters, setShowMobileFilters] = useState(false)
```

### 2. Función de Filtrado Unificada
```typescript
const applyAllFilters = () => {
  let filtered = [...allPackages]
  
  // Filtro de categoría (existente)
  if (selectedCategory !== 'todos') { ... }
  
  // Filtro de búsqueda (existente)
  if (search) { ... }
  
  // Filtro de región (existente)
  if (selectedRegion) { ... }
  
  // NUEVOS FILTROS
  if (selectedCountry) {
    filtered = filtered.filter(p => p.countries.includes(selectedCountry))
  }
  
  if (selectedCity) {
    filtered = filtered.filter(p => p.cities.includes(selectedCity))
  }
  
  // Precio en USD
  filtered = filtered.filter(p => {
    const priceUSD = p.pricing.currency === 'USD' 
      ? p.pricing.totalPrice 
      : p.pricing.totalPrice / 18 // Conversión aproximada
    return priceUSD >= priceRange[0] && priceUSD <= priceRange[1]
  })
  
  if (durationRange) {
    filtered = filtered.filter(p => 
      p.days >= durationRange[0] && p.days <= durationRange[1]
    )
  }
  
  setPackages(filtered)
}
```

### 3. Componente Sidebar
```typescript
<aside className={`
  w-80 flex-shrink-0
  lg:block ${showMobileFilters ? 'block' : 'hidden'}
  lg:static fixed inset-0 z-50 bg-white
  lg:bg-transparent
`}>
  <div className="sticky top-24 space-y-4 p-4 lg:p-0">
    {/* Filtros aquí */}
  </div>
</aside>
```

### 4. Botón Móvil de Filtros
```typescript
<button
  onClick={() => setShowMobileFilters(true)}
  className="lg:hidden fixed bottom-6 right-6 z-40 
    bg-blue-600 text-white rounded-full p-4 shadow-2xl"
>
  <Filter className="w-6 h-6" />
</button>
```

## 📱 Responsive Breakpoints

- **Desktop (≥1024px):** Sidebar visible, layout de 2 columnas
- **Tablet (768-1023px):** Sidebar como drawer, botón flotante
- **Móvil (<768px):** Sidebar fullscreen modal, botón flotante

## 🎨 Ajustes de Diseño

### Sidebar
- Ancho: 280px (en vez de 320px para más espacio a tours)
- Sticky top: 96px (debajo del header)
- Padding: 16px
- Background: white con border-right

### Filtros
- Colapsables por defecto en móvil
- Expandidos en desktop
- Iconos de colores para cada tipo

### Cards de Tours
- Grid: 4 columnas en desktop grande
- Grid: 3 columnas en desktop
- Grid: 2 columnas en tablet
- Grid: 1 columna en móvil

## ⚡ Optimizaciones

1. **Lazy loading** de imágenes
2. **Debounce** en búsqueda de texto (300ms)
3. **Memoización** de listas filtradas
4. **Virtual scrolling** si hay >100 tours (futuro)

## 🚀 Plan de Implementación

### Fase 1: Estructura (30 min)
1. Agregar estados de filtros
2. Crear componente Sidebar
3. Agregar botón móvil

### Fase 2: Filtros (45 min)
1. Implementar filtro de país
2. Implementar filtro de ciudad
3. Implementar slider de precio (USD)
4. Implementar slider de duración
5. Implementar filtro de fechas

### Fase 3: Integración (30 min)
1. Unificar función de filtrado
2. Conectar todos los filtros
3. Mover filtros horizontales al sidebar

### Fase 4: Responsive (30 min)
1. Implementar drawer móvil
2. Ajustar breakpoints
3. Probar en diferentes tamaños

### Fase 5: Pulido (15 min)
1. Animaciones
2. Loading states
3. Empty states

**Tiempo total estimado:** 2.5 horas

## ✅ Checklist de Validación

- [ ] Sidebar visible en desktop
- [ ] Sidebar colapsable en móvil
- [ ] Todos los filtros funcionan
- [ ] Precios en USD
- [ ] Filtros se combinan correctamente
- [ ] Botón "Limpiar filtros" funciona
- [ ] Responsive en todos los tamaños
- [ ] Paginación funciona con filtros
- [ ] Performance aceptable (<100ms filtrado)

---

**¿Proceder con la implementación?**
