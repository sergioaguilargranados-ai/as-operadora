# 📂 CARPETA CHATS — Guía de Uso

**Propósito:** Permitir retomar el trabajo con agentes AntiGravity desde cualquier equipo,
sin perder el contexto de lo que se estaba haciendo.

---

## 🧠 ¿Por qué esta carpeta?

Cada sesión de trabajo con un agente queda guardada localmente en la máquina donde se trabajó.
Al cambiar de equipo, el agente no sabe en qué punto quedaron las tareas.

Esta carpeta resuelve eso: al terminar cada sesión, el agente escribe un **resumen estructurado**
que puede leer en la siguiente sesión (desde cualquier máquina) para retomar exactamente donde quedó.

---

## 📋 Convención de Nombres

```
AG-sesion-YYMMDD-[tema].md
```

**Ejemplos:**
- `AG-sesion-260605-PWA-APIs-Local.md`
- `AG-sesion-260610-Duffel-Hotelbeds.md`
- `AG-sesion-260615-White-Label-Fix.md`

---

## 🚀 Cómo Iniciar una Sesión Nueva

Al comenzar trabajo en cualquier equipo, dile al agente:

> **"Lee el último archivo en chats/ y retoma desde donde quedamos"**

El agente leerá el archivo más reciente y sabrá exactamente:
- Qué versión se liberó
- En qué tarea se quedó
- Qué archivos se modificaron
- Cuáles son los próximos pasos

---

## ✍️ Cómo Terminar una Sesión

Al terminar una sesión de trabajo, dile al agente:

> **"Guarda el resumen de esta sesión en chats/"**

El agente creará un archivo con el resumen estructurado de la sesión.

---

## 📝 Formato del Resumen de Sesión

```markdown
# AG-sesion-YYMMDD-[tema]

**Fecha:** DD de MES de AAAA - HH:MM CST
**Versión al cerrar:** v2.XXX
**Equipo:** [nombre del equipo, ej: "Lenovo Casa" / "iMac Oficina"]
**Estado:** ✅ Completado / 🔄 En progreso / ⏸️ Pausado

## ✅ Lo que se hizo esta sesión
- Item 1
- Item 2

## 📁 Archivos Modificados
- `ruta/al/archivo.ts` — descripción del cambio
- `ruta/al/archivo2.tsx` — descripción del cambio

## ⏭️ Próximos pasos (continuar aquí)
1. Paso 1 concreto
2. Paso 2 concreto

## ⚠️ Pendientes / Bloqueadores
- Item bloqueado (requiere X del cliente)

## 🔧 Comandos para retomar
\`\`\`bash
# Iniciar servidor local
npm run dev
\`\`\`

## 🗒️ Notas importantes
- Nota 1
```

---

## ⚙️ Flujo Recomendado Multi-Equipo

```
Equipo A (ej: Lenovo)          Equipo B (ej: iMac)
─────────────────────          ────────────────────
1. git pull                    1. git pull
2. Abrir AntiGravity           2. Abrir AntiGravity
3. "Lee chats/ y retoma"  ←──  (lee mismo archivo)
4. Trabaja...                  4. Trabaja...
5. "Guarda sesión en chats/"   5. "Guarda sesión en chats/"
6. git add . && git commit     6. git add . && git commit
7. git push ──────────────►    7. git push
```

---

> 📌 **Esta carpeta está en Git** — cualquier resumen que escribas aquí
> quedará disponible en todos tus equipos después de un `git pull`.
>
> ⚠️ **NUNCA pongas API keys ni contraseñas** en estos archivos (ya están en `.env.local` que no va a Git).
