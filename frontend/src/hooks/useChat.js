import { useState, useCallback, useRef } from 'react'
import { getResponse, FLOWS, WELCOME_MSG, SCAN_FAILED_MSG } from '../data/chatRules.js'

let msgId = 0
const mkId = () => ++msgId

function botMsg(msg, chips = [], extra = {}) {
  return { id: mkId(), role: 'bot', msg, chips, ...extra }
}
function userMsg(text) {
  return { id: mkId(), role: 'user', msg: text }
}

export function useChat() {
  const [messages,  setMessages]  = useState([botMsg(WELCOME_MSG.msg, WELCOME_MSG.chips)])
  const [isOpen,    setIsOpen]    = useState(false)
  const [flowState, setFlowState] = useState(null)  // key en FLOWS o null
  const [thinking,  setThinking]  = useState(false)
  const [hasNotif,  setHasNotif]  = useState(false)

  const detectionRef = useRef(null)

  const push = useCallback((msgs) => {
    setMessages(prev => [...prev, ...msgs])
  }, [])

  const resolveFlow = useCallback((chipLabel) => {
    // Buscar en los chips del flow actual si el label coincide con alguna transición
    const node = flowState ? FLOWS[flowState] : FLOWS.root
    if (!node?.chips) return false

    const match = node.chips.find(c => c.label === chipLabel)
    if (!match) return false

    const next = FLOWS[match.flow]
    if (!next) return false

    if (next.mat) {
      // Terminal: responder con info del material
      const res = getResponse(next.mat, null)
      push([userMsg(chipLabel), botMsg(res.msg, res.chips)])
      setFlowState(null)
      return true
    }

    if (next.msg) {
      // Nodo intermedio del flujo
      push([userMsg(chipLabel), botMsg(next.msg, next.chips?.map(c => c.label) ?? [])])
      setFlowState(match.flow)
      return true
    }

    return false
  }, [flowState, push])

  const sendMessage = useCallback((text, isChip = false) => {
    if (thinking) return

    // Chip especial: abrir flujo guiado
    if (text === 'Iniciar guía paso a paso' || text === 'No detecta nada el escáner') {
      const root = FLOWS.root
      push([userMsg(text), botMsg(root.msg, root.chips.map(c => c.label))])
      setFlowState('root')
      return
    }

    // Si estamos en un flujo y el chip matchea una transición
    if (isChip && flowState && resolveFlow(text)) return

    // Volver al escáner (chip especial)
    if (text === 'Escanear otro objeto') {
      push([userMsg(text), botMsg('¡Dale! Apuntá la cámara al objeto con buena luz, a unos 20-30cm. ¿Necesitás algo más?', ['Ayuda con el escáner', 'Iniciar guía paso a paso'])])
      setFlowState(null)
      return
    }

    // Ver el mapa (chip especial)
    if (text === 'Ver el mapa') {
      push([userMsg(text), botMsg('Abrí la pestaña "Mapa" en la barra de navegación — te muestra los puntos más cercanos ordenados por distancia con su nivel de capacidad actual.', [])])
      setFlowState(null)
      return
    }

    // ¿Qué materiales reciclás? — resumen rápido
    if (text === '¿Qué materiales reciclás?' || text === '¿Qué va al punto verde?') {
      push([
        userMsg(text),
        botMsg(
          'En los puntos verdes de Rosario podés tirar:\n\n♻️ Plástico — Contenedor Amarillo\n📦 Cartón — Contenedor Azul\n🫙 Vidrio — Contenedor Verde\n📄 Papel — Contenedor Azul\n🥫 Metal/Latas — Contenedor Amarillo\n\n💡 Lo que NO va al punto verde: basura orgánica, electrónicos (RAEE), tóxicos ni voluminosos.',
          ['¿Dónde tiro las pilas?', '¿Y los muebles?', 'Escanear otro objeto'],
        ),
      ])
      setFlowState(null)
      return
    }

    // ¿Cómo reciclo mejor?
    if (text === '¿Cómo reciclo mejor?') {
      push([
        userMsg(text),
        botMsg(
          '♻️ Tres pasos clave:\n\n1. Enjuagá los envases antes de tirar\n2. Separá secos de húmedos\n3. Nunca mezcles reciclables con restos de comida\n\nCon eso ya mejorás muchísimo la calidad del reciclaje.',
          ['¿Qué materiales reciclás?', 'Escanear otro objeto'],
        ),
      ])
      setFlowState(null)
      return
    }

    // Ayuda con el escáner
    if (text === 'Ayuda con el escáner') {
      push([
        userMsg(text),
        botMsg(
          '📷 Tips para que el escáner funcione mejor:\n\n• Buena iluminación (luz directa)\n• Fondo liso y claro\n• Distancia de 20-30cm del objeto\n• Que el objeto ocupe bien el encuadre\n• Evitá reflejos o sombras fuertes',
          ['Iniciar guía paso a paso', 'Escanear otro objeto'],
        ),
      ])
      setFlowState(null)
      return
    }

    // Mensaje libre — pasar al motor de reglas
    push([userMsg(text)])
    setThinking(true)

    setTimeout(() => {
      setThinking(false)
      const res = getResponse(text, detectionRef.current)
      setFlowState(null)
      push([botMsg(res.msg, res.chips)])
    }, 420)
  }, [thinking, flowState, resolveFlow, push])

  // Llamado desde App.jsx cuando el scanner lleva N segundos sin detectar
  const triggerScanFailed = useCallback(() => {
    if (isOpen) return
    setHasNotif(true)
    setMessages(prev => {
      const last = prev[prev.length - 1]
      if (last?.scanFailed) return prev
      return [...prev, botMsg(SCAN_FAILED_MSG.msg, ['Iniciar guía paso a paso'], { scanFailed: true })]
    })
  }, [isOpen])

  // Actualiza el contexto de detección actual para respuestas contextuales
  const setDetectionContext = useCallback((det) => {
    detectionRef.current = det
  }, [])

  const open = useCallback(() => { setIsOpen(true); setHasNotif(false) }, [])
  const close = useCallback(() => setIsOpen(false), [])

  return {
    messages,
    isOpen, open, close,
    thinking,
    hasNotif,
    sendMessage,
    triggerScanFailed,
    setDetectionContext,
  }
}
