import { useEffect, useRef, useState, useCallback } from 'react'

const WS_URL       = import.meta.env.VITE_WS_URL ?? 'ws://localhost:8001/ws/detect'
const FRAME_INTERVAL_MS = 100   // 10 FPS
const JPEG_QUALITY = 0.92
const SEND_WIDTH   = 640        // tamaño nativo de YOLO — no cropear, solo redimensionar

export function useDetection(videoRef) {
  const [detections, setDetections] = useState([])
  const [connected, setConnected]   = useState(false)
  const [latency, setLatency]       = useState(0)
  const [fps, setFps]               = useState(0)
  const [key, setKey]               = useState(0)

  const wsRef       = useRef(null)
  const intervalRef = useRef(null)
  const canvasRef   = useRef(document.createElement('canvas'))
  const scaleRef    = useRef(1)          // inverse scale para restaurar coordenadas
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
    fpsRef.current = { count: 0, time: Date.now() }

    const ws = new WebSocket(WS_URL)
    wsRef.current = ws

    ws.onopen = () => {
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
        // Escalar coordenadas del espacio 640px de vuelta al espacio 1280px del canvas
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
      setConnected(false)
      clearInterval(intervalRef.current)
      setFps(0)
      setLatency(0)
    }

    ws.onerror = () => setConnected(false)

    return () => {
      clearInterval(intervalRef.current)
      ws.close()
    }
  }, [captureAndSend, key])

  const reconnect = useCallback(() => setKey(k => k + 1), [])

  return { detections, connected, latency, fps, reconnect }
}
