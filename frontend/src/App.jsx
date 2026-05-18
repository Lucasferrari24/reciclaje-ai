import { useState, useCallback, useRef } from 'react'
import { Camera } from './components/Camera'
import { ClassInfo } from './components/ClassInfo'
import { DatasetStats } from './components/DatasetStats'
import { RecycleIcon, CLASS_ICONS } from './icons'
import { FRAME_W, FRAME_H } from './constants'
import styles from './App.module.css'

const DIAG             = Math.hypot(FRAME_W, FRAME_H)
const FRAME_CX         = FRAME_W / 2
const FRAME_CY         = FRAME_H / 2
const MAX_DIST         = Math.hypot(FRAME_CX, FRAME_CY)

const MIN_HITS         = 3      // frames consecutivos para confirmar nueva detección
const MAX_AGE          = 5      // frames de gracia cuando el objeto desaparece
const IOU_THRESH       = 0.12   // overlap mínimo para considerar mismo objeto
const DIST_THRESH      = 0.32   // distancia relativa máxima (respecto a diagonal)
const MIN_AREA_FRAC    = 0.022  // ignorar objetos < 2.2% del área del frame
const LOCK_THRESHOLD   = 0.90
const LOCK_RELEASE_MS  = 2500

function iou(a, b) {
  const ix1 = Math.max(a.x1, b.x1), iy1 = Math.max(a.y1, b.y1)
  const ix2 = Math.min(a.x2, b.x2), iy2 = Math.min(a.y2, b.y2)
  const inter = Math.max(0, ix2 - ix1) * Math.max(0, iy2 - iy1)
  if (!inter) return 0
  const aA = (a.x2 - a.x1) * (a.y2 - a.y1)
  const bA = (b.x2 - b.x1) * (b.y2 - b.y1)
  return inter / (aA + bA - inter)
}

function relDist(a, b) {
  const acx = (a.x1 + a.x2) / 2, acy = (a.y1 + a.y2) / 2
  const bcx = (b.x1 + b.x2) / 2, bcy = (b.y1 + b.y2) / 2
  return Math.hypot(acx - bcx, acy - bcy) / DIAG
}

function centerScore(d) {
  const dist = Math.hypot((d.x1 + d.x2) / 2 - FRAME_CX, (d.y1 + d.y2) / 2 - FRAME_CY) / MAX_DIST
  return d.conf * 0.6 + (1 - dist) * 0.4
}

function pickBest(candidates) {
  return candidates.reduce((a, b) => centerScore(a) >= centerScore(b) ? a : b)
}

export default function App() {
  const [topDetection, setTopDetection] = useState(null)
  const [isLocked, setIsLocked]         = useState(false)
  const isLockedRef  = useRef(false)
  const lockTimerRef = useRef(null)
  const trackRef     = useRef(null)   // { det, hits, age }

  const handleDetections = useCallback((rawDetections) => {
    // 1. Filtrar por tamaño mínimo (elimina ruido de fondo)
    const minArea  = FRAME_W * FRAME_H * MIN_AREA_FRAC
    const candidates = rawDetections.filter(
      d => (d.x2 - d.x1) * (d.y2 - d.y1) >= minArea
    )

    // 2. Actualizar tracker con IoU + distancia
    const prev = trackRef.current
    let next   = null

    if (prev) {
      let bestDet = null, bestScore = -1
      for (const d of candidates) {
        const overlap = iou(d, prev.det)
        const dist    = relDist(d, prev.det)
        if (overlap >= IOU_THRESH || dist <= DIST_THRESH) {
          const score = overlap * 0.6 + (1 - dist) * 0.4
          if (score > bestScore) { bestScore = score; bestDet = d }
        }
      }

      if (bestDet) {
        next = { det: bestDet, hits: Math.min(prev.hits + 1, MIN_HITS + 5), age: 0 }
      } else if (prev.age < MAX_AGE) {
        // Gracia: mantener el track aunque no haya match este frame
        next = { ...prev, age: prev.age + 1 }
      } else {
        // Track perdido — iniciar con nuevo candidato si hay
        next = candidates.length > 0
          ? { det: pickBest(candidates), hits: 1, age: 0 }
          : null
      }
    } else if (candidates.length > 0) {
      next = { det: pickBest(candidates), hits: 1, age: 0 }
    }

    trackRef.current = next

    // 3. Solo mostrar tras MIN_HITS confirmaciones (elimina falsos positivos de 1 frame)
    const confirmed = next && next.hits >= MIN_HITS ? next.det : null

    // 4. Lock-on: actualizar SIEMPRE la posición (incluso bloqueado) para seguir el objeto
    clearTimeout(lockTimerRef.current)
    if (!confirmed) {
      if (isLockedRef.current) {
        lockTimerRef.current = setTimeout(() => {
          isLockedRef.current = false
          setIsLocked(false)
          setTopDetection(null)
        }, LOCK_RELEASE_MS)
      } else {
        setTopDetection(null)
      }
      return
    }

    if (confirmed.conf >= LOCK_THRESHOLD) {
      isLockedRef.current = true
      setIsLocked(true)
    }
    // Actualizar posición siempre (corrige el bug donde el box se congelaba al moverse)
    setTopDetection(confirmed)
  }, [])

  return (
    <div className={styles.app}>
      <header className={styles.header}>
        <div className={styles.headerInner}>
          <div className={styles.logo}>
            <RecycleIcon />
          </div>
          <div>
            <h1>RECICLAJE <span className={styles.logoAI}>AI</span></h1>
            <p>Sistema de detección de residuos en tiempo real</p>
          </div>
        </div>
      </header>

      <main className={styles.main}>
        <section className={styles.cameraSection}>
          <Camera onDetections={handleDetections} isLocked={isLocked} />
        </section>

        <aside className={styles.infoSection}>
          <h2 className={styles.sectionTitle}>Clasificación</h2>
          <ClassInfo detection={topDetection} isLocked={isLocked} />

          <DatasetStats />

          <div className={styles.legend}>
            <h3>Categorías</h3>
            <ul>
              {[
                { name: 'cardboard', color: '#C8A96E' },
                { name: 'glass',     color: '#a8d8ea' },
                { name: 'metal',     color: '#FFFF00' },
                { name: 'paper',     color: '#8BC34A' },
                { name: 'plastic',   color: '#FF6B6B' },
                { name: 'trash',     color: '#969696' },
              ].map(({ name, color }) => {
                const Icon = CLASS_ICONS[name]
                return (
                  <li key={name}>
                    <span className={styles.legendIcon} style={{ color }}>
                      {Icon && <Icon />}
                    </span>
                    {name}
                  </li>
                )
              })}
            </ul>
          </div>
        </aside>
      </main>
    </div>
  )
}
