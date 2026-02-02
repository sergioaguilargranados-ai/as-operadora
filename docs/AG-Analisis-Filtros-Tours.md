# 📊 ANÁLISIS DE VIABILIDAD: Filtros para Página de Tours

**Fecha:** 01 Feb 2026 - 20:50 CST

---

## 🎯 FILTROS REQUERIDOS (según imagen)

### **1. BLOQUES SUPERIORES**
- 🌍 Todos los Tours
- 🔥 OFERTAS Especiales
- 🎯 Bloqueos, aparta tu lugar
- 🌴 Ofertas de Semana Santa
- ⭐ Favoritos, los imperdibles

### **2. BÚSQUEDA**
- Buscador por palabras clave

### **3. FILTRAR POR DESTINO**
- Europa, Asia, Medio Oriente, etc.

### **4. VIAJES PARA EVENTOS ESPECIALES**
- 💒 Bodas
- 👗 Quinceañeras
- 🎓 Graduaciones
- 🏢 Viajes Corporativos
- 👥 Grupos Especiales

---

## ✅ VALIDACIÓN: ¿QUÉ PODEMOS HACER?

### **DATOS DISPONIBLES EN MEGATRAVEL:**

| Dato | Disponible | Fuente | Confiabilidad |
|------|-----------|--------|---------------|
| **Nombre del tour** | ✅ SÍ | Scraping | 100% |
| **Descripción** | ✅ SÍ | Scraping | 100% |
| **Región/Destino** | ✅ SÍ | Campo `destination_region` | 100% |
| **Precio** | ✅ SÍ | Campo `sale_price_usd` | 100% |
| **Imágenes** | ✅ SÍ | Scraping (nuevo) | 95% |
| **Tipo de tour** | ⚠️ PARCIAL | Inferencia | 60% |
| **Evento específico** | ❌ NO | No disponible | 0% |

---

## ⚠️ PROBLEMA PRINCIPAL

**Los tours de MegaTravel NO están clasificados por evento (quinceañeras, bodas, etc.)**

**Ejemplo de tours encontrados:**
```
MT-60968: Mediterráneo Azamara Onward
MT-60967: Australia Y Nueva Zelanda Azamara Pursuit
MT-60966: Asia Azamara Quest
MT-60965: Bahamas Scarlet Lady
MT-60959: Mediterráneo Legend Of The Seas
```

**Ninguno menciona:**
- Quinceañeras
- Bodas
- Graduaciones
- Eventos corporativos

**Son tours GENERALES de cruceros/viajes.**

---

## 💡 SOLUCIONES PROPUESTAS

### **OPCIÓN A: CLASIFICACIÓN MANUAL (Recomendado)**

**Ventajas:**
- ✅ Control total
- ✅ Precisión 100%
- ✅ Puedes crear paquetes específicos

**Implementación:**
1. Agregar campo `event_type` a la BD
2. Crear interfaz en dashboard para clasificar tours
3. Permitir múltiples eventos por tour

**Ejemplo:**
```sql
ALTER TABLE megatravel_packages 
ADD COLUMN event_types TEXT[] DEFAULT '{}';

-- Clasificar manualmente:
UPDATE megatravel_packages 
SET event_types = ARRAY['quinceañeras', 'grupos']
WHERE mt_code = 'MT-12345';
```

---

### **OPCIÓN B: CLASIFICACIÓN AUTOMÁTICA POR CARACTERÍSTICAS**

**Basada en:**
- Duración (tours largos → graduaciones, quinceañeras)
- Destino (Europa → quinceañeras, Caribe → bodas)
- Precio (alto → bodas, medio → quinceañeras)
- Tipo (cruceros → grupos)

**Ventajas:**
- ⚡ Automático
- 🔄 Se aplica a todos los tours

**Desventajas:**
- ⚠️ Menos preciso (70-80%)
- ❌ Puede clasificar mal

**Ejemplo de reglas:**
```javascript
if (days >= 10 && region === 'Europa' && price > 2000) {
  tags.push('quinceañeras')
}
if (days <= 7 && region === 'Caribe') {
  tags.push('bodas', 'luna-de-miel')
}
if (category === 'crucero') {
  tags.push('grupos')
}
```

---

### **OPCIÓN C: HÍBRIDO (Mejor opción)**

**Combinación:**
1. **Automático inicial:** Clasificar por características
2. **Manual posterior:** Ajustar en dashboard
3. **Tags adicionales:** Permitir agregar manualmente

**Ventajas:**
- ✅ Rápido inicio
- ✅ Precisión mejorable
- ✅ Flexible

---

## 🎯 RECOMENDACIÓN FINAL

### **PARA IMPLEMENTAR AHORA:**

**1. FILTROS QUE SÍ FUNCIONAN (100%):**
- ✅ Todos los Tours
- ✅ Por Destino (Europa, Asia, etc.)
- ✅ Búsqueda por nombre

**2. FILTROS QUE NECESITAN TRABAJO MANUAL:**
- ⚠️ OFERTAS → Marcar manualmente `is_offer = true`
- ⚠️ Semana Santa → Marcar manualmente `tags = ['semana-santa']`
- ⚠️ Favoritos → Marcar manualmente `is_featured = true`
- ⚠️ Bloqueos → Agregar campo `is_blocked = true`

**3. FILTROS QUE REQUIEREN CLASIFICACIÓN:**
- ❌ Quinceañeras → Clasificar manualmente
- ❌ Bodas → Clasificar manualmente
- ❌ Graduaciones → Clasificar manualmente
- ❌ Corporativo → Clasificar manualmente

---

## 📋 PLAN DE ACCIÓN

### **FASE 1: INMEDIATA (Hoy)**
1. ✅ Implementar paginación (HECHO)
2. ✅ Scraping de imágenes (HECHO)
3. ✅ Filtros por destino (YA EXISTE)
4. ✅ Búsqueda (YA EXISTE)

### **FASE 2: CORTO PLAZO (Esta semana)**
1. Agregar campo `event_types` a BD
2. Crear interfaz en dashboard para clasificar
3. Clasificar manualmente 20-30 tours principales
4. Implementar filtros de eventos en frontend

### **FASE 3: MEDIANO PLAZO (Próxima semana)**
1. Implementar clasificación automática por reglas
2. Revisar y ajustar clasificaciones
3. Agregar campo `is_blocked` para bloqueos
4. Marcar ofertas y favoritos

---

## ❓ PREGUNTA PARA TI

**¿Cómo quieres proceder?**

**A)** Implementar clasificación manual ahora (dashboard para marcar eventos)
**B)** Implementar clasificación automática por reglas (menos preciso pero rápido)
**C)** Dejar filtros de eventos para después y enfocarnos en destinos/búsqueda
**D)** Otra opción que prefieras

**Mi recomendación:** Opción **C** para lanzar rápido, luego **A** para mejorar.
