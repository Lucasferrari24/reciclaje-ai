import { useEffect, useRef, useState, useCallback } from 'react'

const WS_URL            = import.meta.env.VITE_WS_URL ?? 'ws://localhost:8001/ws/detect'
const FRAME_INTERVAL_MS = 100
const JPEG_QUALITY      = 0.92
const SEND_WIDTH        = 640
const WS_TIMEOUT_MS     = 5000   // si no conecta en 5s → modo demo

// Secuencia de detecciones simuladas para la demo
const DEMO_SEQUENCE = [
  { cls: 4, clsName: 'plastic', conf: 0.91, color: '#FF6B6B' },
  { cls: 4, clsName: 'plastic', conf: 0.87, color: '#FF6B6B' },
  { cls: 1, clsName: 'glass',   conf: 0.83, color: '#a8d8ea' },
  { cls: 1, clsName: 'glass',   conf: 0.89, color: '#a8d8ea' },
  { cls: 2, clsName: 'metal',   conf: 0.78, color: '#FFFF00' },
  { cls: 0, clsName: 'cardboard', conf: 0.85, color: '#C8A96E' },
  { cls: 3, clsName: 'paper',   conf: 0.82, color: '#8BC34A' },
]
let demoIdx = 0

function makeDemoDetection() {
  const d = DEMO_SEQUENCE[demoIdx % DEMO_SEQUENCE.length]
  demoIdx++
  return [{
    ...d,
    x1: 320, y1: 180, x2: 960, y2: 540,
    conf: d.conf + (Math.random() - 0.5) * 0.04,
  }]
}

export function useDetection(videoRef) {
  const [detections, setDetections] = useState([])
  const [connected, setConnected]   = useState(false)
  const [demoMode, setDemoMode]     = useState(false)
  const [latency, setLatency]       = useState(0)
  const [fps, setFps]               = useState(0)
  const [key, setKey]               = useState(0)

  const wsRef       = useRef(null)
  const intervalRef = useRef(null)
  const canvasRef   = useRef(document.createElement('canvas'))
  const scaleRef    = useRef(1)
  const sendTimeRef = useRef(null)
  const fpsRef      = useRef({ count: 0, time: Date.now() })

  const captureAndSend = useCallback(() => {
    const video = videoRef.current
    const ws    = wsRef.current
    if (!video || !ws || ws.readyState !== WebSocket.OPEN) return

    const vw = video.videoWidth  || 1280
    const vh = video.videoHeight || 720

    // Redimensionar al tamaño nativo de YOLO (640×360 para 16:9)
    // — el modelo recibe input en la escala para la que fue entrenado
    const scale = SEND_WIDTH / vw
    const sw = SEND_WIDTH
    const sh = Math.round(vh * scale)
    scaleRef.current = vw / SEND_WIDTH   // guardamos el inverso para escalar de vuelta

    const canvas = canvasRef.current
    canvas.width  = sw
    canvas.height = sh
    const ctx = canvas.getContext('2d')
    ctx.drawImage(video, 0, 0, sw, sh)

    sendTimeRef.current = Date.now()
    canvas.toBlob(
      (blob) => {
        if (blob) blob.arrayBuffer().then((buf) => ws.send(buf))
      },
      'image/jpeg',
      JPEG_QUALITY
    )
  }, [videoRef])

  useEffect(() => {
    setDetections([])
    setDemoMode(false)
    fpsRef.current = { count: 0, time: Date.now() }

    let usedDemo = false

    // Timeout: si no conecta en WS_TIMEOUT_MS → modo demo
    const timeoutId = setTimeout(() => {
      if (!usedDemo && wsRef.current?.readyState !== WebSocket.OPEN) {
        usedDemo = true
        setDemoMode(true)
        setConnected(true)
        // Simular detecciones cada 1.8s
        intervalRef.current = setInterval(() => {
          setLatency(Math.floor(Math.random() * 30 + 18))
          fpsRef.current.count++
          const now = Date.now()
          if (now - fpsRef.current.time >= 1000) {
            setFps(fpsRef.current.count)
            fpsRef.current = { count: 0, time: now }
          }
          setDetections(makeDemoDetection())
        }, 1800)
      }
    }, WS_TIMEOUT_MS)

    const ws = new WebSocket(WS_URL)
    wsRef.current = ws

    ws.onopen = () => {
      clearTimeout(timeoutId)
      if (usedDemo) return
      setConnected(true)
      intervalRef.current = setInterval(captureAndSend, FRAME_INTERVAL_MS)
    }

    ws.onmessage = (event) => {
      if (sendTimeRef.current) setLatency(Date.now() - sendTimeRef.current)
      fpsRef.current.count++
      const now = Date.now()
      if (now - fpsRef.current.time >= 1000) {
        setFps(fpsRef.current.count)
        fpsRef.current = { count: 0, time: now }
      }
      try {
        const s   = scaleRef.current
        const raw = JSON.parse(event.data)
        setDetections(raw.map(d => ({
          ...d,
          x1: Math.round(d.x1 * s),
          y1: Math.round(d.y1 * s),
          x2: Math.round(d.x2 * s),
          y2: Math.round(d.y2 * s),
        })))
      } catch {}
    }

    ws.onclose = () => {
      if (!usedDemo) {
        setConnected(false)
        clearInterval(intervalRef.current)
        setFps(0)
        setLatency(0)
      }
    }

    ws.onerror = () => {}

    return () => {
      clearTimeout(timeoutId)
      clearInterval(intervalRef.current)
      ws.close()
    }
  }, [captureAndSend, key])

  const reconnect = useCallback(() => setKey(k => k + 1), [])

  return { detections, connected, demoMode, latency, fps, reconnect }
}
