import { useEffect, useRef, useState } from 'react'
import { useDetection } from '../hooks/useDetection'
import { VF_W, VF_H, VF_LEFT, VF_TOP, VF_RIGHT, VF_BOTTOM } from '../constants'
import styles from './Camera.module.css'

const FONT_LABEL    = 'bold 13px Inter, sans-serif'
const LERP_MIN      = 0.30
const LERP_MAX      = 0.72
const GRACE_FRAMES  = 5   // frames que el box persiste cuando la detección desaparece momentáneamente

export function Camera({ onDetections, isLocked = false }) {
  const videoRef = useRef(null)
  const canvasRef = useRef(null)
  const streamRef = useRef(null)
  const lerpedRef  = useRef([])   // posiciones interpoladas actuales
  const targetRef  = useRef([])   // posiciones objetivo (del modelo)
  const graceRef   = useRef(0)    // contador de frames sin detección
  const rAFRef     = useRef(null)

  const [cameras, setCameras] = useState([])
  const [cameraId, setCameraId] = useState('')
  const isLockedRef = useRef(false)
  const { detections, connected, latency, fps, reconnect } = useDetection(videoRef)

  // Mantener ref sincronizada para que el rAF loop pueda leerla
  isLockedRef.current = isLocked

  // Permisos + stream inicial + enumeración de cámaras
  useEffect(() => {
    navigator.mediaDevices
      .getUserMedia({ video: { width: 1280, height: 720 } })
      .then((stream) => {
        streamRef.current = stream
        if (videoRef.current) videoRef.current.srcObject = stream
        const id = stream.getVideoTracks()[0]?.getSettings()?.deviceId ?? ''
        setCameraId(id)
        return navigator.mediaDevices.enumerateDevices()
      })
      .then((devices) => setCameras(devices.filter(d => d.kind === 'videoinput')))
      .catch(console.error)

    return () => streamRef.current?.getTracks().forEach(t => t.stop())
  }, [])

  // Cambio de cámara
  useEffect(() => {
    if (!cameraId || !streamRef.current) return
    const current = streamRef.current.getVideoTracks()[0]?.getSettings()?.deviceId
    if (current === cameraId) return
    streamRef.current.getTracks().forEach(t => t.stop())
    navigator.mediaDevices
      .getUserMedia({ video: { deviceId: { exact: cameraId }, width: 1280, height: 720 } })
      .then((stream) => {
        streamRef.current = stream
        if (videoRef.current) videoRef.current.srcObject = stream
      })
      .catch(console.error)
  }, [cameraId])

  // Actualizar target cuando llegan nuevas detecciones
  useEffect(() => {
    targetRef.current = detections
    onDetections(detections)
  }, [detections, onDetections])

  // rAF loop — 60fps con lerp suave de bounding boxes
  useEffect(() => {
    const drawFrame = () => {
      const canvas = canvasRef.current
      const video = videoRef.current
      if (!canvas || !video) { rAFRef.current = requestAnimationFrame(drawFrame); return }

      const targets = targetRef.current
      const cw = canvas.width
      const ch = canvas.height

      // Interpolar posiciones
      if (targets.length === 0) {
        graceRef.current++
        if (graceRef.current > GRACE_FRAMES) lerpedRef.current = []
        // Si estamos en gracia, seguir lerpando hacia la última posición conocida
      } else {
        graceRef.current = 0
        lerpedRef.current = targets.map(t => {
          // Buscar el box previo más cercano (por centro) en lugar de por clase
          const tcx = (t.x1 + t.x2) / 2, tcy = (t.y1 + t.y2) / 2
          let prev = null, minD = Infinity
          for (const b of lerpedRef.current) {
            const d = Math.hypot((b.x1 + b.x2) / 2 - tcx, (b.y1 + b.y2) / 2 - tcy)
            if (d < minD) { minD = d; prev = b }
          }
          if (!prev) return { ...t }

          // Lerp adaptativo: más rápido cuando el objeto se mueve rápido
          const speed = Math.hypot(t.x1 - prev.x1, t.y1 - prev.y1)
          const alpha = Math.min(LERP_MIN + speed * 0.0035, LERP_MAX)
          return {
            ...t,
            x1: prev.x1 + (t.x1 - prev.x1) * alpha,
            y1: prev.y1 + (t.y1 - prev.y1) * alpha,
            x2: prev.x2 + (t.x2 - prev.x2) * alpha,
            y2: prev.y2 + (t.y2 - prev.y2) * alpha,
          }
        })
      }

      const ctx = canvas.getContext('2d')
      ctx.clearRect(0, 0, cw, ch)

      const scaleX = cw / (video.videoWidth || 1280)
      const scaleY = ch / (video.videoHeight || 720)
      const hasDetection = lerpedRef.current.length > 0
      const locked = isLockedRef.current

      // ── Viewfinder ────────────────────────────────────────────────────────
      const vfW = cw * VF_W
      const vfH = ch * VF_H
      const vfX = cw * VF_LEFT
      const vfY = ch * VF_TOP
      const corner = 28
      const vfColor = locked
        ? 'rgba(251,191,36,0.95)'           // dorado — bloqueado
        : hasDetection
          ? 'rgba(34,197,94,0.9)'           // verde — detectando
          : 'rgba(255,255,255,0.35)'         // blanco — buscando

      ctx.strokeStyle = vfColor
      ctx.lineWidth = 2.5
      ctx.setLineDash([])

      const corners = [
        [vfX,        vfY,        1,  1],
        [vfX + vfW,  vfY,       -1,  1],
        [vfX,        vfY + vfH,  1, -1],
        [vfX + vfW,  vfY + vfH, -1, -1],
      ]
      for (const [x, y, dx, dy] of corners) {
        ctx.beginPath()
        ctx.moveTo(x + dx * corner, y)
        ctx.lineTo(x, y)
        ctx.lineTo(x, y + dy * corner)
        ctx.stroke()
      }

      // Cruz central
      ctx.strokeStyle = locked ? 'rgba(251,191,36,0.5)' : hasDetection ? 'rgba(34,197,94,0.45)' : 'rgba(255,255,255,0.18)'
      ctx.lineWidth = 1
      ctx.beginPath()
      ctx.moveTo(cw / 2 - 14, ch / 2); ctx.lineTo(cw / 2 + 14, ch / 2)
      ctx.moveTo(cw / 2, ch / 2 - 14); ctx.lineTo(cw / 2, ch / 2 + 14)
      ctx.stroke()

      if (!hasDetection) {
        ctx.font = '12px Inter, sans-serif'
        ctx.fillStyle = 'rgba(255,255,255,0.35)'
        ctx.textAlign = 'center'
        ctx.fillText('Centrá el objeto aquí', cw / 2, vfY + vfH + 20)
        ctx.textAlign = 'left'
      }

      // ── Bounding boxes interpoladas ───────────────────────────────────────
      for (const det of lerpedRef.current) {
        const { x1, y1, x2, y2, clsName, conf, color } = det
        const sx1 = x1 * scaleX
        const sy1 = y1 * scaleY
        const sw = (x2 - x1) * scaleX
        const sh = (y2 - y1) * scaleY

        // Sombra sutil
        ctx.shadowColor = color
        ctx.shadowBlur = 6
        ctx.strokeStyle = color
        ctx.lineWidth = 2
        ctx.strokeRect(sx1, sy1, sw, sh)
        ctx.shadowBlur = 0

        // Label
        const label = `${clsName}  ${Math.round(conf * 100)}%`
        ctx.font = FONT_LABEL
        const textW = ctx.measureText(label).width
        const textH = 18
        const lx = sx1
        const ly = sy1 > textH + 6 ? sy1 - textH - 6 : sy1 + sh + 4

        ctx.fillStyle = color
        ctx.globalAlpha = 0.85
        ctx.fillRect(lx, ly, textW + 10, textH + 4)
        ctx.globalAlpha = 1
        ctx.fillStyle = '#000'
        ctx.fillText(label, lx + 5, ly + textH - 2)
      }

      rAFRef.current = requestAnimationFrame(drawFrame)
    }

    rAFRef.current = requestAnimationFrame(drawFrame)
    return () => cancelAnimationFrame(rAFRef.current)
  }, [])

  return (
    <div className={styles.container}>
      <div className={styles.wrapper}>
        <video ref={videoRef} autoPlay playsInline muted className={styles.video} />
        <canvas ref={canvasRef} width={1280} height={720} className={styles.canvas} />

        <div className={`${styles.badge} ${connected ? styles.on : styles.off}`}>
          {connected ? 'Conectado' : 'Desconectado'}
        </div>

        {connected && (
          <div className={styles.stats}>
            <span>{fps} <small>FPS</small></span>
            <span className={styles.statDivider}>·</span>
            <span>{latency} <small>ms</small></span>
          </div>
        )}
      </div>

      <div className={styles.controls}>
        {cameras.length > 1 && (
          <select
            className={styles.select}
            value={cameraId}
            onChange={(e) => setCameraId(e.target.value)}
          >
            {cameras.map((cam, i) => (
              <option key={cam.deviceId} value={cam.deviceId}>
                {cam.label || `Cámara ${i + 1}`}
              </option>
            ))}
          </select>
        )}
        <button className={styles.resetBtn} onClick={reconnect}>
          Reiniciar detección
        </button>
      </div>
    </div>
  )
}
