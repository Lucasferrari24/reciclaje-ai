# ♻️ SCRAP 2.0

> **Apuntás la cámara a cualquier residuo. La IA te dice qué es, cómo prepararlo y dónde tirarlo — en tiempo real.**

---

## ❓ Una pregunta antes de empezar

### ¿Sabés dónde se tira una caja de pizza?

> Si dijiste **cartón**... te equivocaste.

El aceite penetra las fibras del cartón y lo hace **imposible de reciclar**. Una caja de pizza va al **contenedor negro** (basura general).

| ❌ Lo que la gente hace | ✅ Lo correcto |
|---|---|
| La meten al contenedor azul (cartón reciclable) | Va al contenedor negro (basura general) |
| Contamina **toda** la bolsa de reciclables | La parte limpia de la tapa sí puede ir al azul |

> Y esto es solo *uno* de los errores de clasificación más comunes en Argentina.

---

## 🚨 El problema

Reciclamos mal. Y eso tiene un costo.

| Dato | Detalle |
|---|---|
| **9 de cada 10** personas | no saben en qué contenedor va cada residuo |
| **1 solo elemento** mal clasificado | puede contaminar y arruinar toda una bolsa de reciclables |
| **0 apps** en Argentina | que usen IA en tiempo real para guiar el descarte |

> El problema no es la falta de voluntad. Es la falta de información en el momento justo.

---

## 💡 La solución

### SCRAP 2.0

| Stat | Valor |
|---|---|
| Materiales detectables | **6** |
| Puntos de descarte mapeados | **25** |
| Tipos de usuario | **3** |
| APIs de pago necesarias | **0** |

---

## ⚙️ Cómo funciona

**Tres pasos. Cero confusión.**

```
📷 Escaneás  →  🤖 La IA clasifica  →  🗺️ Descartás
```

1. **Escaneás** — Apuntás la cámara al residuo. El modelo YOLO11m detecta el material en tiempo real vía WebSocket.

2. **La IA clasifica** — Plástico, cartón, vidrio, papel, metal o basura — con % de confianza. Si supera el 95%: overlay de alta confianza.

3. **Descartás** — El mapa te muestra el punto de descarte más cercano con capacidad disponible. Navegás directo desde la app.

> 🔌 **Modo Demo incluido** — si el backend no está disponible, la app simula detecciones automáticamente. Siempre funciona en presentaciones.

---

## 🚀 Features

### 🤖 IA con YOLO11m
Modelo entrenado sobre residuos reales. Se auto-mejora guardando detecciones de alta confianza como nuevas muestras de entrenamiento.

### 🗺️ Mapa inteligente
25 puntos de descarte en Rosario con geolocalización automática, capacidad en tiempo real y navegación a Google Maps.

### 🏆 Gamificación real
Puntos por cada descarte, 5 niveles, logros desbloqueables, canjes con beneficios municipales (SEMTUR, ABL).

### 💬 Scrap Bot — chat asistente
Árbol de decisión inteligente. Si el scanner no detecta nada en 8 segundos, el bot pregunta y guía al usuario paso a paso.

### 👥 3 tipos de usuario
- **Ciudadano** — gamificación y puntos
- **Empresa** — gestión de residuos especiales
- **Cooperativa / Municipio** — panel de control con KPIs

### 📱 Cámara fullscreen
Expansión a pantalla completa con barra de detección activa. Overlay de alta confianza cuando supera el 95%.

---

## 📊 Impacto potencial

El mercado ya existe. Solo falta la herramienta.

| Métrica | Valor |
|---|---|
| Habitantes en Rosario | **1.2M** |
| CO₂ ahorrado | por cada descarte correcto vs. incorrecto |
| Reciclajes diarios simulados en el panel | **148** |

### Beneficios por actor

**🏙️ Municipio**
Dashboard en tiempo real del estado de los contenedores. Reducción de costos operativos por mejor separación en origen.

**🏭 Cooperativas**
Más material limpio = más valor recuperado. Menos tiempo de clasificación manual en planta.

**🌍 Ciudadanos**
Aprenden mientras usan. Gamificación que convierte el reciclaje en un hábito, no una obligación.

---

## 🛠️ Stack técnico

**Frontend**
- React 18 + Vite
- CSS Modules
- Leaflet (mapas)

**Backend**
- FastAPI + WebSocket
- Python 3.11

**IA**
- YOLO11m
- OpenCV
- CLAHE preprocessing

**Infraestructura**
- Vercel (frontend)
- Render / Railway (backend)
- Docker

### Detalles técnicos

- 🔁 **Auto-reentrenamiento:** cada detección con confianza ≥ 85% se guarda automáticamente con su anotación YOLO. El dataset crece mientras la gente usa la app.
- ⚡ **Latencia:** el frontend captura y envía frames a 640px de ancho cada 100ms. Latencia típica: 18–45ms en local.
- 🔒 **Sin auth:** CORS abierto, sin cookies. Todo el estado de usuario vive en `localStorage`.

---

## 🗺️ Roadmap

| Fase | Estado | Descripción |
|---|---|---|
| **V1 — Demo** | ✅ Ya | Escáner IA · mapa Rosario · gamificación · Scrap Bot · panel municipal |
| **V2 — Q3** | 🔜 Próximo | Auth con Supabase · puntos sincronizados · canjes reales con QR · API municipal |
| **V3 — Q4** | 🔜 Planificado | Buenos Aires · Córdoba · Santa Fe · sistema de puntos interoperable |
| **V4** | 🔜 Futuro | Dataset propio con miles de imágenes argentinas · integración con cooperativas y municipios |

---

## 🏁 Cierre

```
📷 Apuntá  →  🤖 Clasificá  →  🗺️ Descartá  →  🏆 Ganás
```

**Porque reciclar bien importa. Y ahora hay una forma de hacerlo fácil.**

---

*Rosario, Argentina · 2025 · React + FastAPI + YOLO11m*
