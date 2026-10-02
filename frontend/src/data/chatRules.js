// ── Motor de chat sin API ────────────────────────────────────────────────────
// Árbol de decisión + matching por keywords para clasificación de residuos

const rand = (arr) => arr[Math.floor(Math.random() * arr.length)]

// ── Respuestas por material ────────────────────────────────────────────────

const MAT = {
  plastico: {
    msgs: [
      '♻️ Plástico — va al Contenedor Amarillo o al punto verde más cercano.\n\nEnjuagalo, aplastalo para ahorrar espacio y sacá las tapas de metal. Te suma +10 pts y ahorrás 1.2 kg de CO₂.',
      '🥤 Es plástico. Antes de tirarlo: enjuagalo, aplastalo y retirá etiquetas o tapas metálicas.\n\nContenedor Amarillo · +10 pts · -1.20 kg CO₂',
    ],
    chips: ['¿Cómo preparo el envase?', '¿Dónde queda el punto verde?', 'Escanear otro objeto'],
  },
  carton: {
    msgs: [
      '📦 Cartón — va al Contenedor Azul.\n\nDoblálo para reducir volumen, que esté seco y sin restos de grasa o comida. +8 pts · -0.78 kg CO₂',
      '📦 Es cartón. Doblá las cajas, que estén limpias y secas.\n\nContenedor Azul · +8 pts · -0.78 kg CO₂',
    ],
    chips: ['¿Y las cajas con grasa (pizza)?', '¿Dónde queda el punto verde?', 'Escanear otro objeto'],
  },
  vidrio: {
    msgs: [
      '🫙 Vidrio — va al Contenedor Verde.\n\nRetirá la tapa antes de tirarlo. Sin cerámicas, espejos ni porcelana. +15 pts · -0.31 kg CO₂',
      '🫙 Es vidrio. Sacá la tapa, enjuagalo y listo.\n\nContenedor Verde · +15 pts · -0.31 kg CO₂',
    ],
    chips: ['¿Puedo tirar espejos acá?', '¿Dónde queda el punto verde?', 'Escanear otro objeto'],
  },
  papel: {
    msgs: [
      '📄 Papel — va al Contenedor Azul junto con el cartón.\n\nQue esté seco. No va papel carbónico, tisú ni papel encerado. +8 pts · -0.90 kg CO₂',
      '📄 Es papel. Guardalo seco, sin arrugarlo demasiado.\n\nContenedor Azul · +8 pts · -0.90 kg CO₂',
    ],
    chips: ['¿Y las revistas con plástico?', '¿Dónde queda el punto verde?', 'Escanear otro objeto'],
  },
  metal: {
    msgs: [
      '🥫 Metal — va al Contenedor Amarillo.\n\nAplastá las latas y limpiá los restos de comida. El papel aluminio va doblado. +20 pts · -0.85 kg CO₂',
      '🥫 Es metal/aluminio. Aplastalo, limpialo y listo.\n\nContenedor Amarillo · +20 pts · -0.85 kg CO₂',
    ],
    chips: ['¿Y las tapitas de metal?', '¿Dónde queda el punto verde?', 'Escanear otro objeto'],
  },
  basura: {
    msgs: [
      '🗑️ Es basura general — va al Contenedor Negro o gris.\n\nNo tiene valor reciclable porque está sucio, mezclado o es un material no recuperable. No lo tires en el punto verde.',
      '🗑️ Basura general. Contenedor Negro. Si tenés dudas sobre si algo es reciclable, siempre preguntame.',
    ],
    chips: ['¿Qué puedo separar antes?', 'Escanear otro objeto'],
  },
  raee: {
    msgs: [
      '💻 Tecnológico / RAEE — NUNCA en la basura común.\n\nLlevalo a un Punto RAEE habilitado:\n• RAEE Centro Cívico (Santa Fe y Córdoba) Lun-Vie 8-14h\n• RAEE Shopping del Siglo (Junín 501) Lun-Dom 10-22h\n• RAEE Municipalidad (Buenos Aires 711) Lun-Vie 7:30-13:30h',
      '💻 Es un residuo tecnológico (RAEE). Las pilas, celulares y cables tienen sustancias tóxicas — van a un punto especializado, nunca al tacho.\n\nPuntos RAEE en Rosario: Centro Cívico, Shopping del Siglo, UNR Ingeniería o Municipalidad.',
    ],
    chips: ['¿Dónde está el RAEE más cercano?', '¿Las pilas también van ahí?', 'Escanear otro objeto'],
  },
  toxico: {
    msgs: [
      '⚠️ Residuo tóxico / peligroso — al Ecopunto, nunca al tacho común ni al desagüe.\n\nEcopuntos en Rosario:\n• Ecopunto Centro (Jujuy 350) Lun-Vie 9-15h\n• Ecopunto Oeste (Av. Alberdi 4350) Lun-Vie 8-14h\n• Ecopunto Norte (Av. Génova 5000) Mar-Sáb 8-14h',
      '⚠️ Ojo — eso es tóxico o peligroso. Aceites, pinturas, medicamentos y aerosoles van al Ecopunto, nunca al tacho ni a la pileta. Tres Ecopuntos disponibles en Rosario.',
    ],
    chips: ['¿Los medicamentos también?', '¿Y el aceite de cocina?', 'Escanear otro objeto'],
  },
  voluminoso: {
    msgs: [
      '🛋️ Residuo voluminoso (mueble, colchón, heladera).\n\nTres opciones:\n1. Pedí retiro domiciliario al 0800-555-ROSARIO\n2. Llevalo al Centro de Recepción Sur (Av. Circunvalación)\n3. Centro de Recepción Norte (Av. Francia 4200)',
      '🛋️ Los voluminosos no van al punto verde. Pedí retiro gratuito al 0800-555-ROSARIO o llevalo a uno de los centros de recepción.',
    ],
    chips: ['¿Es gratis el retiro?', '¿Horarios de los centros?', 'Escanear otro objeto'],
  },
}

// ── Respuestas extras ──────────────────────────────────────────────────────

const EXTRAS = {
  pizza_box: '🍕 Las cajas de pizza con grasa van a la basura general — la grasa contamina el proceso de reciclado del cartón. Solo las cajas limpias van al Contenedor Azul.',
  espejos: '🪞 No — los espejos, cerámica y porcelana tienen composición diferente al vidrio de envases y arruinan el proceso. Van a la basura general.',
  revistas: '📚 Si las revistas vienen con folio plástico (celofán), sacáselo primero. Las páginas van al Contenedor Azul, el plástico al Amarillo.',
  tapitas: '🔵 Las tapitas metálicas son reciclables, pero tan pequeñas que se pierden en el proceso. Juntá varias en una lata aplastada antes de tirarlas.',
  pila: '🔋 Sí, todas las pilas y baterías (incluso las domésticas) van al Punto RAEE. Nunca al tacho — son altamente tóxicas.',
  aceite: '🫙 El aceite de cocina usado va a los Ecopuntos en un recipiente cerrado. Jamás al desagüe — tapa las cañerías y contamina el agua.',
  remedio: '💊 Los medicamentos vencidos o sin usar van al Ecopunto o a farmacias con punto de recolección. Nunca al tacho común.',
  retiro: '📞 El retiro domiciliario de voluminosos es gratuito en Rosario. Llamá al 0800-555-ROSARIO o pedilo online en el sitio de la Municipalidad.',
  horarios_vol: '🕐 Centros de Recepción:\n• Sur (Av. Circunvalación): Mar · Jue · Sáb 8-14h\n• Norte (Av. Francia 4200): Lun · Mié · Vie 8-14h',
  separar: '♻️ Lo primero que podés hacer:\n1. Separá secos de húmedos\n2. Enjuagá los envases antes de tirar\n3. Nunca mezcles reciclables con restos de comida\nCon eso ya ayudás un montón.',
  scanner_help: [
    '📷 Algunos tips para que el escáner funcione mejor:\n\n• Buena luz (luz natural o lámpara directa)\n• Fondo liso y claro\n• Distancia de 20-30 cm del objeto\n• Que el objeto ocupe bastante del encuadre',
    '📷 Para mejorar la detección:\n\n• Acercate más (20-30cm)\n• Limpiá el objeto si tiene suciedad\n• Probá desde otro ángulo\n• Usá luz directa, evitá sombras',
  ],
  where_verde: '🗺️ Usá la pantalla de Mapa en la app — te muestra los puntos más cercanos ordenados por distancia y con el nivel de ocupación en tiempo real.',
  scanner_otro: '🔄 Perfecto, apuntá la cámara al objeto con buena luz y a unos 25cm de distancia.',
}

// ── Flujo guiado cuando el scanner falla ─────────────────────────────────

export const FLOWS = {
  root: {
    msg: '¿Qué tipo de objeto tenés? Elegí el que más se parezca:',
    chips: [
      { label: '🍶 Botella / Envase', flow: 'botella' },
      { label: '📦 Caja / Papel', flow: 'caja' },
      { label: '🥫 Lata / Metal', flow: 'metal_confirm' },
      { label: '💻 Electrónico', flow: 'raee_confirm' },
      { label: '🛋️ Mueble / Electrodoméstico', flow: 'voluminoso_confirm' },
      { label: '⚠️ Químico / Aceite', flow: 'toxico_confirm' },
    ],
  },
  botella: {
    msg: '¿De qué material es?',
    chips: [
      { label: '🥤 Plástico (PET)', flow: 'plastico_confirm' },
      { label: '🫙 Vidrio', flow: 'vidrio_confirm' },
      { label: '🧃 Brick / Tetrapak', flow: 'tetrapak_confirm' },
    ],
  },
  caja: {
    msg: '¿Tiene grasa o restos de comida?',
    chips: [
      { label: '✅ Está limpia', flow: 'carton_confirm' },
      { label: '🍕 Tiene grasa / suciedad', flow: 'caja_sucia' },
    ],
  },
  plastico_confirm: { mat: 'plastico' },
  vidrio_confirm:   { mat: 'vidrio' },
  carton_confirm:   { mat: 'carton' },
  metal_confirm:    { mat: 'metal' },
  raee_confirm:     { mat: 'raee' },
  voluminoso_confirm: { mat: 'voluminoso' },
  toxico_confirm:   { mat: 'toxico' },
  tetrapak_confirm: {
    msg: '📦 Los envases Tetrapak / brick van al Contenedor Azul si están vacíos y doblados. Aplastalo bien para reducir el volumen.',
    chips: ['¿Dónde queda el punto verde?', 'Escanear otro objeto'],
  },
  caja_sucia: {
    msg: '🍕 Si tiene grasa o restos de comida va a la basura general — contamina el proceso.\n\nSi solo tiene una parte sucia, podés recortar y tirar el trozo limpio al Contenedor Azul.',
    chips: ['Escanear otro objeto'],
  },
}

// ── Detección de intención ──────────────────────────────────────────────────

const PATTERNS = [
  // Materiales
  { mat: 'plastico',    kw: ['plástico','plastico','botella','pet','envase','bolsa','contenedor plástico','nylon'] },
  { mat: 'carton',      kw: ['cartón','carton','caja','corrugado','embalaje','brick','tetrapak','tetra'] },
  { mat: 'vidrio',      kw: ['vidrio','frasco','botella de vidrio','tarro','cristal'] },
  { mat: 'papel',       kw: ['papel','diario','revista','hoja','cuaderno','impreso'] },
  { mat: 'metal',       kw: ['metal','lata','aluminio','hojalata','tapa','chapa'] },
  { mat: 'basura',      kw: ['basura','sucio','mezclado','no reciclable','servilleta','pañal','chicle'] },
  { mat: 'raee',        kw: ['electrónico','electronico','celular','compu','computadora','laptop','pila','batería','bateria','cable','tele','televisor','tablet','impresora'] },
  { mat: 'toxico',      kw: ['tóxico','toxico','aceite','pintura','solvente','medicamento','remedio','pastilla','aerosol','agroquímico','fertilizante','bateria de auto','nafta'] },
  { mat: 'voluminoso',  kw: ['mueble','sofá','sillón','silla','colchón','heladera','lavarropas','microondas','estufa','termotanque'] },
  // Extras
  { extra: 'pizza_box', kw: ['pizza','grasienta','grasa','caja sucia','con comida'] },
  { extra: 'espejos',   kw: ['espejo','cerámica','ceramica','porcelana'] },
  { extra: 'revistas',  kw: ['revista','celofán','plastico en revista'] },
  { extra: 'tapitas',   kw: ['tapita','tapa metálica','capuchón'] },
  { extra: 'pila',      kw: ['pila','batería doméstica','aaa','aa','alcalina'] },
  { extra: 'aceite',    kw: ['aceite de cocina','aceite usado','fritura'] },
  { extra: 'remedio',   kw: ['remedio','medicamento','pastilla','jarabe','vencido'] },
  { extra: 'retiro',    kw: ['retiro','0800','camión','gratis','domicilio'] },
  { extra: 'horarios_vol', kw: ['horario centro','horario voluminoso'] },
  { extra: 'separar',   kw: ['cómo empezar','empezar','separar','reciclar mejor','primer paso'] },
  { extra: 'scanner_help', kw: ['no detecta','falla','no funciona','no reconoce','error cámara','no ve','mal'] },
  { extra: 'where_verde',  kw: ['dónde','donde','punto verde','queda','cerca','mapa','ubicación'] },
  { extra: 'scanner_otro', kw: ['otro','escanear','volver','nueva','siguiente'] },
]

function normalize(text) {
  return text.toLowerCase()
    .normalize('NFD').replace(/[̀-ͯ]/g, '')
    .replace(/[^a-z0-9\s]/g, ' ')
}

export function detectIntent(text) {
  const norm = normalize(text)
  for (const p of PATTERNS) {
    if (p.kw.some(k => norm.includes(normalize(k)))) {
      return { mat: p.mat, extra: p.extra }
    }
  }
  return null
}

// ── Respuesta principal ────────────────────────────────────────────────────

export function getResponse(text, detectionContext = null) {
  const intent = detectIntent(text)

  // Contexto del scanner activo
  if (!intent && detectionContext?.clsName) {
    const matMap = { plastic:'plastico', cardboard:'carton', glass:'vidrio', paper:'papel', metal:'metal', trash:'basura' }
    const mat = matMap[detectionContext.clsName]
    if (mat && MAT[mat]) {
      return {
        msg: `Veo que el escáner detectó **${detectionContext.clsName}** (${Math.round(detectionContext.conf*100)}% de confianza). ¿Querés saber más sobre este material?\n\n` + rand(MAT[mat].msgs),
        chips: MAT[mat].chips,
      }
    }
  }

  if (!intent) {
    return {
      msg: rand([
        'No estoy seguro de entender. ¿Podés decirme qué objeto o material tenés? Por ejemplo: "botella de plástico", "caja de cartón", "celular viejo"...',
        'Contame qué objeto tenés y te digo dónde tirarlo. Por ejemplo: "tengo una lata", "¿qué hago con las pilas?", "botella de vidrio"...',
      ]),
      chips: ['Ayuda con el escáner', '¿Qué materiales reciclás?', 'Iniciar guía'],
    }
  }

  if (intent.mat && MAT[intent.mat]) {
    return {
      msg: rand(MAT[intent.mat].msgs),
      chips: MAT[intent.mat].chips,
    }
  }

  if (intent.extra) {
    const val = EXTRAS[intent.extra]
    const msg = Array.isArray(val) ? rand(val) : val
    return {
      msg,
      chips: intent.extra === 'where_verde'
        ? ['Ver el mapa', 'Escanear otro objeto']
        : intent.extra === 'scanner_otro'
          ? []
          : ['Escanear otro objeto'],
    }
  }

  return {
    msg: 'No estoy seguro. ¿Podés darme más detalles del objeto o material?',
    chips: ['Iniciar guía paso a paso'],
  }
}

// ── Mensajes iniciales / bienvenida ───────────────────────────────────────

export const WELCOME_MSG = {
  msg: '¡Hola! Soy Scrap Bot 🤖♻️\n\nTe ayudo a clasificar residuos y a encontrar dónde tirarlos en Rosario. ¿En qué te puedo ayudar?',
  chips: ['No detecta nada el escáner', '¿Dónde tiro las pilas?', '¿Qué va al punto verde?', '¿Cómo reciclo mejor?'],
}

export const SCAN_FAILED_MSG = {
  msg: '📷 Vi que el escáner no está detectando nada. No te preocupes, te ayudo a identificar el residuo manualmente.',
  chips: ['Iniciar guía paso a paso'],
  openFlow: true,
}
