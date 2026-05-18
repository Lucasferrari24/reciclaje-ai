import { useState, useCallback, useRef } from 'react'
import { Camera } from './components/Camera'
import { ClassInfo } from './components/ClassInfo'
import { DatasetStats } from './components/DatasetStats'
import { RecycleIcon, CLASS_ICONS } from './icons'
import { FRAME_W, FRAME_H, VF_LEFT, VF_TOP, VF_RIGHT, VF_BOTTOM } from './constants'
import styles from './App.module.css'

const FRAME_CX = FRAME_W / 2
const FRAME_CY = FRAME_H / 2
const MAX_DIST  = Math.hypot(FRAME_CX, FRAME_CY)
const LOCK_THRESHOLD  = 0.90
const LOCK_RELEASE_MS = 2500

function centerScore(d) {
  const dist = Math.hypot((d.x1 + d.x2) / 2 - FRAME_CX, (d.y1 + d.y2) / 2 - FRAME_CY) / MAX_DIST
  return d.conf * 0.6 + (1 - dist) * 0.4
}

// Devuelve true si el centro del bbox cae dentro del viewfinder
function inViewfinder(d) {
  const cx = (d.x1 + d.x2) / 2 / FRAME_W
  const cy = (d.y1 + d.y2) / 2 / FRAME_H
  return cx >= VF_LEFT && cx <= VF_RIGHT && cy >= VF_TOP && cy <= VF_BOTTOM
}

export default function App() {
  const [topDetection, setTopDetection] = useState(null)
  const [isLocked, setIsLocked] = useState(false)
  const isLockedRef = useRef(false)
  const lockTimerRef = useRef(null)

  const handleDetections = useCallback((detections) => {
    clearTimeout(lockTimerRef.current)

    if (detections.length === 0) {
      if (isLockedRef.current) {
        // Mantener el lock un momento por si el objeto sale brevemente del frame
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

    // Priorizar detecciones dentro del viewfinder; si no hay, usar todas
    const pool = detections.filter(inViewfinder)
    const candidates = pool.length > 0 ? pool : detections
    const best = candidates.reduce((a, b) => centerScore(a) >= centerScore(b) ? a : b)

    if (best.conf >= LOCK_THRESHOLD) {
      // Nueva detección fuerte → bloquear (o actualizar si es la misma clase)
      isLockedRef.current = true
      setIsLocked(true)
      setTopDetection(best)
    } else if (!isLockedRef.current) {
      // Sin lock → mostrar la mejor detección actual normalmente
      setTopDetection(best)
    }
    // Si está bloqueado y conf < 90% → mantener la detección bloqueada sin actualizar
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
