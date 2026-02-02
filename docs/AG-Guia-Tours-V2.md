# Guía Rápida - Nuevo Diseño Tours v2

## 🚀 Acceso

**URL Local:**
```
http://localhost:3000/tours-v2
```

**URL Producción (después del deploy):**
```
https://as-operadora.vercel.app/tours-v2
```

---

## 🎨 Características del Nuevo Diseño

### Layout
- **Sidebar izquierdo fijo** (320px) - Se mantiene visible al hacer scroll
- **Área principal** - Grid de 3 columnas (responsive)
- **Header sticky** - Siempre visible arriba

### Filtros Disponibles

#### 1. 🔍 **Palabra Clave**
- Busca en: nombre, descripción, países, ciudades
- Actualización en tiempo real
- Ejemplo: "Europa", "Crucero", "París"

#### 2. 🌍 **Seleccionar País**
- Dropdown con todos los países disponibles
- Filtra automáticamente al seleccionar
- Muestra solo tours de ese país

#### 3. 📍 **Seleccionar Ciudad**
- Aparece solo si hay país seleccionado
- Lista de ciudades del país seleccionado
- Refinamiento adicional

#### 4. 💰 **Tarifa**
- Slider de 0 a 100,000 MXN
- Muestra rango actual en tiempo real
- Filtra por precio total del tour

#### 5. ⏱️ **Duración**
- Slider de 1 a 30 días
- Muestra rango de días
- Filtra por duración del tour

#### 6. 📅 **Fecha ida**
- Lista de 12 meses (Enero - Diciembre)
- Selección única
- Filtra por mes de salida disponible

---

## 🎯 Cómo Usar los Filtros

### Ejemplo 1: Buscar tours a Europa en Julio
1. Escribir "Europa" en **Palabra Clave**
2. Hacer scroll en **Fecha ida**
3. Seleccionar "Salidas en Julio"
4. Ver resultados filtrados

### Ejemplo 2: Tours a Francia de 7-10 días
1. Seleccionar "Francia" en **País**
2. Ajustar **Duración** a 7-10 días
3. Ver resultados

### Ejemplo 3: Tours económicos
1. Ajustar **Tarifa** a 0-30,000 MXN
2. Ver tours dentro del presupuesto

---

## 🔄 Vistas Disponibles

### Vista Grid (Por defecto)
- 3 columnas en desktop
- 2 columnas en tablet
- 1 columna en móvil
- Cards verticales con imagen arriba

**Cambiar a Grid:**
- Click en botón con icono de cuadrícula (arriba derecha)

### Vista List
- 1 columna
- Cards horizontales
- Imagen a la izquierda
- Más información visible

**Cambiar a List:**
- Click en botón con icono de lista (arriba derecha)

---

## 🧹 Limpiar Filtros

**Botón "Limpiar"** (arriba del sidebar)
- Resetea todos los filtros
- Vuelve a mostrar todos los tours
- Útil para empezar búsqueda nueva

---

## 📊 Información Mostrada

### Header de Resultados
```
Tours y Viajes Grupales
Mostrando 1-20 de 325 resultados
```

### Cada Tour Card Muestra:
- **Imagen principal**
- **Nombre del tour**
- **Descripción breve**
- **Duración** (días)
- **País principal**
- **Precio total** (con moneda)
- **Botón "Ver más"**

---

## 🎨 Filtros Colapsables

Cada sección puede expandirse/contraerse:

**Abiertos por defecto:**
- ✅ Palabra Clave
- ✅ País
- ✅ Precio
- ✅ Duración

**Cerrados por defecto:**
- ⏹️ Fecha ida

**Para expandir/contraer:**
- Click en el título de la sección
- Icono de flecha indica estado

---

## 📱 Responsive

### Desktop (>1024px)
- Sidebar visible
- Grid de 3 columnas
- Todos los filtros visibles

### Tablet (768-1024px)
- Sidebar visible
- Grid de 2 columnas
- Filtros colapsables

### Móvil (<768px)
- Sidebar colapsable (próximamente)
- Grid de 1 columna
- Filtros en modal

---

## 🐛 Troubleshooting

### No veo resultados
1. Verificar que hay tours en la BD
2. Limpiar filtros con botón "Limpiar"
3. Revisar consola del navegador

### Filtros no funcionan
1. Verificar que el servidor está corriendo
2. Revisar que la API `/api/tours/packages` responde
3. Limpiar caché del navegador

### Imágenes no cargan
1. Verificar que `main_image` existe en BD
2. Revisar URLs de imágenes
3. Placeholder se muestra si falta imagen

---

## 🔄 Comparación con Versión Anterior

| Aspecto | `/tours` (Anterior) | `/tours-v2` (Nuevo) |
|---------|---------------------|---------------------|
| **Filtros** | Horizontales arriba | Sidebar izquierdo |
| **Cantidad** | 2 filtros | 6+ filtros |
| **Espacio** | Ocupa 2 filas | Sidebar fijo |
| **Diseño** | Propio | Estilo MegaTravel |
| **Funcionalidad** | Básica | Avanzada |
| **Vistas** | Solo Grid | Grid + List |

---

## 📝 Notas Importantes

1. **Datos en tiempo real** - Los filtros usan los datos actuales de la BD
2. **Paginación** - 20 tours por página
3. **Performance** - Filtrado del lado del cliente (rápido)
4. **Compatibilidad** - Funciona con datos actuales sin cambios en BD

---

## 🚀 Próximos Pasos

Si te gusta el diseño:
1. Reemplazar `/tours` con este diseño
2. Agregar más filtros (regiones, tags de eventos)
3. Mejorar responsive para móvil
4. Agregar ordenamiento (precio, duración, nombre)

Si prefieres el anterior:
1. Mantener `/tours` como está
2. Usar `/tours-v2` como alternativa
3. Combinar mejores características de ambos

---

**¡Pruébalo ahora!**
```
npm run dev
# Visitar: http://localhost:3000/tours-v2
```
