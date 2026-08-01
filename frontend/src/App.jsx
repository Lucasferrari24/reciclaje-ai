import { useState, useCallback, useRef } from 'react'
import { Camera }       from './components/Camera'
import { ClassInfo }    from './components/ClassInfo'
import { DatasetStats } from './components/DatasetStats'
import { RecyclingMap } from './components/RecyclingMap'
import { DepositFlow }  from './components/DepositFlow'
import { Dashboard }    from './components/Dashboard'
import { RecycleIcon, CLASS_ICONS } from './icons'
import { FRAME_W, FRAME_H } from './constants'
import { usePoints }    from './hooks/usePoints'
import { CO2_POR_MATERIAL } from './data/puntosVerdes.js'
import styles from './App.module.css'

// ── Tracker constants ─────────────────────────────────────────────────────────
const DIAG             = Math.hypot(FRAME_W, FRAME_H)
const FRAME_CX         = FRAME_W / 2
const FRAME_CY         = FRAME_H / 2
const MAX_DIST         = Math.hypot(FRAME_CX, FRAME_CY)
const MIN_HITS         = 3
const MAX_AGE          = 5
const IOU_THRESH       = 0.12
const DIST_THRESH      = 0.32
const MIN_AREA_FRAC    = 0.022
const LOCK_THRESHOLD   = 0.90
const LOCK_RELEASE_MS  = 2500

function iou(a, b) {
  const ix1 = Math.max(a.x1, b.x1), iy1 = Math.max(a.y1, b.y1)
  const ix2 = Math.min(a.x2, b.x2), iy2 = Math.min(a.y2, b.y2)
  const inter = Math.max(0, ix2-ix1) * Math.max(0, iy2-iy1)
  if (!inter) return 0
  const aA = (a.x2-a.x1)*(a.y2-a.y1), bA = (b.x2-b.x1)*(b.y2-b.y1)
  return inter / (aA + bA - inter)
}
function relDist(a, b) {
  return Math.hypot((a.x1+a.x2)/2-(b.x1+b.x2)/2, (a.y1+a.y2)/2-(b.y1+b.y2)/2) / DIAG
}
function centerScore(d) {
  const dist = Math.hypot((d.x1+d.x2)/2-FRAME_CX, (d.y1+d.y2)/2-FRAME_CY) / MAX_DIST
  return d.conf * 0.6 + (1-dist) * 0.4
}
function pickBest(cs) {
  return cs.reduce((a,b) => centerScore(a) >= centerScore(b) ? a : b)
}

// ── App ───────────────────────────────────────────────────────────────────────
export default function App() {
  const [screen,       setScreen]       = useState('scan')  // 'scan' | 'mapa' | 'perfil' | 'panel'
  const [topDetection, setTopDetection] = useState(null)
  const [isLocked,     setIsLocked]     = useState(false)
  const [depositPunto, setDepositPunto] = useState(null)    // punto verde seleccionado para depósito
  const isLockedRef  = useRef(false)
  const lockTimerRef = useRef(null)
  const trackRef     = useRef(null)

  const { points, history, addPoints, generarToken, getToken, consumirToken } = usePoints()

  // ── Tracker ────────────────────────────────────────────────────────────────
  const handleDetections = useCallback((rawDetections) => {
    const minArea    = FRAME_W * FRAME_H * MIN_AREA_FRAC
    const candidates = rawDetections.filter(d => (d.x2-d.x1)*(d.y2-d.y1) >= minArea)
    const prev       = trackRef.current
    let   next       = null

    if (prev) {
      let bestDet = null, bestScore = -1
      for (const d of candidates) {
        const overlap = iou(d, prev.det), dist = relDist(d, prev.det)
        if (overlap >= IOU_THRESH || dist <= DIST_THRESH) {
          const score = overlap * 0.6 + (1-dist) * 0.4
          if (score > bestScore) { bestScore = score; bestDet = d }
        }
      }
      if (bestDet) {
        next = { det: bestDet, hits: Math.min(prev.hits+1, MIN_HITS+5), age: 0 }
      } else if (prev.age < MAX_AGE) {
        next = { ...prev, age: prev.age+1 }
      } else {
        next = candidates.length > 0 ? { det: pickBest(candidates), hits: 1, age: 0 } : null
      }
    } else if (candidates.length > 0) {
      next = { det: pickBest(candidates), hits: 1, age: 0 }
    }
    trackRef.current = next

    const confirmed = next && next.hits >= MIN_HITS ? next.det : null
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
    setTopDetection(confirmed)
  }, [])

  // ── Depósito ───────────────────────────────────────────────────────────────
  const token = getToken()

  const handleQuieroReciclar = useCallback(() => {
    if (!topDetection) return
    generarToken(topDetection.clsName)
    setScreen('mapa')
  }, [topDetection, generarToken])

  const handleSeleccionarPunto = useCallback((punto) => {
    setDepositPunto(punto)
  }, [])

  const handleConfirmado = useCallback((pts, material, puntoNombre) => {
    consumirToken()
    addPoints(pts, material, puntoNombre)
    setDepositPunto(null)
    setScreen('perfil')
  }, [addPoints, consumirToken])

  // ── Render ─────────────────────────────────────────────────────────────────
  return (
    <div className={styles.app}>
      <header className={styles.header}>
        <div className={styles.headerInner}>
          <div className={styles.logo}><RecycleIcon /></div>
          <div>
            <h1>SCRAP <span className={styles.logoAI}>2.0</span></h1>
            <p>Clasificación de residuos con IA · Rosario</p>
          </div>
          <div className={styles.pointsBadge} onClick={() => setScreen('perfil')}>
            <span className={styles.pointsNum}>{points}</span>
            <span className={styles.pointsLabel}>pts</span>
          </div>
        </div>
      </header>

      {/* Navegación */}
      <nav className={styles.nav}>
        {[
          { id: 'scan',   label: 'Escáner' },
          { id: 'mapa',   label: 'Puntos verdes' },
          { id: 'perfil', label: 'Mi perfil' },
          { id: 'panel',  label: '⚙ Panel municipal' },
        ].map(t => (
          <button
            key={t.id}
            className={`${styles.navBtn} ${screen === t.id ? styles.navActive : ''} ${t.id === 'panel' ? styles.navPanel : ''}`}
            onClick={() => { setDepositPunto(null); setScreen(t.id) }}
          >
            {t.label}
          </button>
        ))}
      </nav>

      <main className={styles.main}>
        {/* ── ESCÁNER ── */}
        {screen === 'scan' && (
          <>
            <section className={styles.cameraSection}>
              <Camera onDetections={handleDetections} isLocked={isLocked} />
            </section>
            <aside className={styles.infoSection}>
              <h2 className={styles.sectionTitle}>Clasificación</h2>
              <ClassInfo detection={topDetection} isLocked={isLocked} />

              {topDetection && (
                <button className={styles.btnReciclar} onClick={handleQuieroReciclar}>
                  ¿Dónde lo tiro? →
                </button>
              )}

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
          </>
        )}

        {/* ── MAPA ── */}
        {screen === 'mapa' && (
          <div className={styles.fullSection}>
            {depositPunto ? (
              <DepositFlow
                token={token ?? { material: topDetection?.clsName ?? 'plastico' }}
                punto={depositPunto}
                onConfirmado={handleConfirmado}
                onCancelar={() => setDepositPunto(null)}
              />
            ) : (
              <>
                {token && (
                  <div className={styles.tokenBanner}>
                    Tenés un depósito pendiente de <strong>{token.material}</strong> — seleccioná el punto donde lo vas a tirar
                  </div>
                )}
                <RecyclingMap
                  materialFiltro={token?.material ?? null}
                  onSeleccionar={token ? handleSeleccionarPunto : null}
                />
              </>
            )}
          </div>
        )}

        {/* ── PERFIL ── */}
        {screen === 'perfil' && (() => {
          const co2Total = history.reduce((acc, e) => acc + (CO2_POR_MATERIAL[e.material] ?? 0.1), 0)
          const totalItems = history.length
          const nivel = points < 50 ? { nombre: 'Semilla', next: 50 }
            : points < 200 ? { nombre: 'Reciclador', next: 200 }
            : points < 500 ? { nombre: 'Eco-Guardián', next: 500 }
            : points < 1500 ? { nombre: 'Héroe Verde', next: 1500 }
            : { nombre: 'Maestro del Reciclaje', next: null }
          const logros = [
            { id: 'primer',   label: 'Primera vez',       desc: 'Tu primer reciclaje',        ok: totalItems >= 1,  icon: '🌱' },
            { id: 'x5',       label: 'Constante',         desc: '5 reciclajes',                ok: totalItems >= 5,  icon: '♻️' },
            { id: 'vidrio',   label: 'Cristal limpio',    desc: 'Reciclaste vidrio',           ok: history.some(h => h.material === 'vidrio'),   icon: '🫙' },
            { id: 'metal',    label: 'Metal hero',        desc: 'Reciclaste metal',            ok: history.some(h => h.material === 'metal'),    icon: '🥫' },
            { id: 'co2',      label: 'Eco warrior',       desc: '1 kg de CO₂ ahorrado',       ok: co2Total >= 1,    icon: '🌍' },
            { id: 'pts100',   label: 'Centenario',        desc: '100 puntos acumulados',       ok: points >= 100,    icon: '⭐' },
          ]
          return (
            <div className={styles.fullSection}>
              {/* Cabecera del perfil */}
              <div className={styles.profileCard}>
                <div className={styles.profileTop}>
                  <div className={styles.profilePoints}>
                    <span className={styles.profileNum}>{points}</span>
                    <span className={styles.profileLabel}>puntos acumulados</span>
                  </div>
                  <div className={styles.profileStats}>
                    <div className={styles.profileStat}>
                      <span className={styles.statVal}>{totalItems}</span>
                      <span className={styles.statLbl}>Reciclajes</span>
                    </div>
                    <div className={styles.profileStat}>
                      <span className={styles.statVal} style={{ color: '#22c55e' }}>{co2Total.toFixed(2)} kg</span>
                      <span className={styles.statLbl}>CO₂ ahorrado</span>
                    </div>
                    <div className={styles.profileStat}>
                      <span className={styles.statVal} style={{ color: '#a78bfa' }}>{nivel.nombre}</span>
                      <span className={styles.statLbl}>Nivel</span>
                    </div>
                  </div>
                </div>

                {nivel.next && (
                  <div className={styles.nivelProgress}>
                    <div className={styles.nivelLabel}>
                      <span>Progreso al siguiente nivel</span>
                      <span>{points}/{nivel.next} pts</span>
                    </div>
                    <div className={styles.nivelTrack}>
                      <div className={styles.nivelFill} style={{ width: `${Math.min(100, points / nivel.next * 100)}%` }} />
                    </div>
                  </div>
                )}

                <div className={styles.canjesGrid}>
                  <div className={styles.canje}>
                    <span className={styles.canjeNum}>100 pts</span>
                    <span className={styles.canjeDesc}>1 viaje en colectivo SEMTUR</span>
                  </div>
                  <div className={styles.canje}>
                    <span className={styles.canjeNum}>500 pts</span>
                    <span className={styles.canjeDesc}>Descuento en comercio adherido</span>
                  </div>
                  <div className={styles.canje}>
                    <span className={styles.canjeNum}>2000 pts</span>
                    <span className={styles.canjeDesc}>10% descuento en ABL municipal</span>
                  </div>
                </div>
              </div>

              {/* Logros */}
              <div className={styles.logrosSection}>
                <h3 className={styles.logrosTitle}>Logros</h3>
                <div className={styles.logrosGrid}>
                  {logros.map(l => (
                    <div key={l.id} className={`${styles.logro} ${l.ok ? styles.logroOk : styles.logroPending}`}>
                      <span className={styles.logroIcon}>{l.icon}</span>
                      <span className={styles.logroLabel}>{l.label}</span>
                      <span className={styles.logroDesc}>{l.desc}</span>
                    </div>
                  ))}
                </div>
              </div>

              {/* Historial */}
              {history.length > 0 && (
                <div className={styles.historial}>
                  <h3>Historial</h3>
                  {history.map((e, i) => (
                    <div key={i} className={styles.histRow}>
                      <span className={styles.histMaterial}>{e.material}</span>
                      <span className={styles.histPunto}>{e.punto}</span>
                      <span className={styles.histPts}>+{e.amount} pts</span>
                      <span className={styles.histCo2}>-{(CO2_POR_MATERIAL[e.material] ?? 0.1).toFixed(2)} kg CO₂</span>
                      <span className={styles.histFecha}>{new Date(e.fecha).toLocaleDateString('es-AR')}</span>
                    </div>
                  ))}
                </div>
              )}

              {history.length === 0 && (
                <p className={styles.emptyHistory}>
                  Todavía no confirmaste ningún depósito. Escaneá un objeto y buscá el punto verde más cercano.
                </p>
              )}
            </div>
          )
        })()}

        {/* ── PANEL MUNICIPAL ── */}
        {screen === 'panel' && (
          <div className={styles.fullSection}>
            <Dashboard />
          </div>
        )}
      </main>
    </div>
  )
}
