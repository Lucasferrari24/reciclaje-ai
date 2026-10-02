import { useState, useCallback, useRef, useEffect } from 'react'
import { Camera }           from './components/Camera'
import { ClassInfo }        from './components/ClassInfo'
import { DatasetStats }     from './components/DatasetStats'
import { RecyclingMap }     from './components/RecyclingMap'
import { DepositFlow }      from './components/DepositFlow'
import { Dashboard }        from './components/Dashboard'
import { CategorySelector } from './components/CategorySelector'
import { RoleSelector }     from './components/RoleSelector'
import { ChatBot }          from './components/ChatBot'
import { FRAME_W, FRAME_H } from './constants'
import { usePoints }         from './hooks/usePoints'
import { useChat }           from './hooks/useChat'
import { AI_CLASS_MAP, CATEGORIAS } from './data/categorias.js'
import { CO2_POR_MATERIAL, PUNTOS_POR_MATERIAL } from './data/puntosVerdes.js'
import styles from './App.module.css'

// ── Tracker constants ────────────────────────────────────────────────────────
const DIAG          = Math.hypot(FRAME_W, FRAME_H)
const FRAME_CX      = FRAME_W / 2
const FRAME_CY      = FRAME_H / 2
const MAX_DIST      = Math.hypot(FRAME_CX, FRAME_CY)
const MIN_HITS      = 3
const MAX_AGE       = 5
const IOU_THRESH    = 0.12
const DIST_THRESH   = 0.32
const MIN_AREA_FRAC = 0.022
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
  return cs.reduce((a, b) => centerScore(a) >= centerScore(b) ? a : b)
}

const ROLE_KEY  = 'scrap_user_role'
const loadRole  = () => localStorage.getItem(ROLE_KEY)
const saveRole  = (r) => localStorage.setItem(ROLE_KEY, r)

const NAV_ITEMS = [
  { id: 'scan',   label: 'Escáner', icon: '📷' },
  { id: 'mapa',   label: 'Mapa',    icon: '🗺️' },
  { id: 'perfil', label: 'Perfil',  icon: '👤' },
  { id: 'panel',  label: 'Panel',   icon: '⚙️' },
]

export default function App() {
  const [role,         setRole]         = useState(loadRole)
  const [screen,       setScreen]       = useState('scan')
  const [scanMode,     setScanMode]     = useState('camara')   // 'camara' | 'manual'
  const [topDetection, setTopDetection] = useState(null)
  const [isLocked,     setIsLocked]     = useState(false)
  const [selectedCat,  setSelectedCat]  = useState(null)      // categoría manual
  const [depositPunto, setDepositPunto] = useState(null)

  const isLockedRef  = useRef(false)
  const lockTimerRef = useRef(null)
  const trackRef     = useRef(null)

  const { points, history, addPoints, generarToken, getToken, consumirToken } = usePoints()
  const chatHook = useChat()

  // ── Alta confianza (≥ 95%) → overlay en cámara ────────────────────────────
  const [highConfDetection, setHighConfDetection] = useState(null)
  const clearHighConfRef = useRef(null)

  useEffect(() => {
    const HIGH_CONF = 0.95
    const isHigh = isLocked && topDetection && topDetection.conf >= HIGH_CONF

    if (isHigh) {
      clearTimeout(clearHighConfRef.current)
      const catId = AI_CLASS_MAP[topDetection.clsName]
      const cat   = CATEGORIAS[catId]
      if (cat) {
        setHighConfDetection(prev =>
          prev?.catId === catId ? prev : {   // no re-anima si es el mismo material
            catId,
            clsName:    topDetection.clsName,
            conf:       topDetection.conf,
            nombre:     cat.nombre,
            emoji:      cat.emoji,
            color:      cat.color,
            contenedor: cat.contenedor,
            puntos:     cat.puntos  ?? 0,
            co2:        cat.co2     ?? 0,
          }
        )
      }
    } else {
      clearHighConfRef.current = setTimeout(() => setHighConfDetection(null), 2000)
    }

    return () => clearTimeout(clearHighConfRef.current)
  }, [topDetection, isLocked]) // eslint-disable-line

  // Trigger chat cuando el scanner lleva 8s sin detectar nada en modo cámara
  const noDetectTimerRef = useRef(null)
  useEffect(() => {
    if (screen !== 'scan' || scanMode !== 'camara') return
    if (topDetection) {
      clearTimeout(noDetectTimerRef.current)
      chatHook.setDetectionContext(topDetection)
    } else {
      noDetectTimerRef.current = setTimeout(() => chatHook.triggerScanFailed(), 8000)
    }
    return () => clearTimeout(noDetectTimerRef.current)
  }, [topDetection, screen, scanMode]) // eslint-disable-line

  // ── Seleccionar rol ────────────────────────────────────────────────────────
  const handleRoleSelect = (r) => { saveRole(r); setRole(r) }
  const handleChangeRole = () => { localStorage.removeItem(ROLE_KEY); setRole(null) }

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
      if (bestDet)              next = { det: bestDet, hits: Math.min(prev.hits+1, MIN_HITS+5), age: 0 }
      else if (prev.age < MAX_AGE) next = { ...prev, age: prev.age+1 }
      else                       next = candidates.length > 0 ? { det: pickBest(candidates), hits: 1, age: 0 } : null
    } else if (candidates.length > 0) {
      next = { det: pickBest(candidates), hits: 1, age: 0 }
    }
    trackRef.current = next

    const confirmed = next && next.hits >= MIN_HITS ? next.det : null
    clearTimeout(lockTimerRef.current)

    if (!confirmed) {
      if (isLockedRef.current) {
        lockTimerRef.current = setTimeout(() => {
          isLockedRef.current = false; setIsLocked(false); setTopDetection(null)
        }, LOCK_RELEASE_MS)
      } else {
        setTopDetection(null)
      }
      return
    }
    if (confirmed.conf >= LOCK_THRESHOLD) { isLockedRef.current = true; setIsLocked(true) }
    setTopDetection(confirmed)
  }, [])

  // ── Flujo depositar ────────────────────────────────────────────────────────
  const token = getToken()

  const getCatId = () => {
    if (selectedCat)           return selectedCat
    if (topDetection)          return AI_CLASS_MAP[topDetection.clsName] ?? topDetection.clsName
    return null
  }

  const handleQuieroReciclar = useCallback(() => {
    const catId = getCatId()
    if (!catId) return
    generarToken(catId)
    setScreen('mapa')
  }, [topDetection, selectedCat, generarToken])

  const handleCategoriaManual = (catId) => {
    setSelectedCat(catId)
    generarToken(catId)
    setScreen('mapa')
  }

  const handleSeleccionarPunto = useCallback((punto) => setDepositPunto(punto), [])

  const handleConfirmado = useCallback((pts, material, puntoNombre) => {
    consumirToken()
    addPoints(pts, material, puntoNombre)
    setDepositPunto(null)
    setScreen('perfil')
  }, [addPoints, consumirToken])

  const goTo = (s) => { setDepositPunto(null); setScreen(s) }

  // ── Perfil stats ───────────────────────────────────────────────────────────
  const co2Total  = history.reduce((acc, e) => acc + (CO2_POR_MATERIAL[e.material] ?? 0.1), 0)
  const totalItems = history.length
  const nivel = points < 50   ? { nombre: 'Semilla',              next: 50 }
    : points < 200  ? { nombre: 'Reciclador',            next: 200 }
    : points < 500  ? { nombre: 'Eco-Guardián',           next: 500 }
    : points < 1500 ? { nombre: 'Héroe Verde',            next: 1500 }
    : { nombre: 'Maestro del Reciclaje', next: null }

  const logros = [
    { id: 'primer', label: 'Primera vez',    desc: 'Tu primer reciclaje',      ok: totalItems >= 1,  icon: '🌱' },
    { id: 'x5',     label: 'Constante',      desc: '5 reciclajes',              ok: totalItems >= 5,  icon: '♻️' },
    { id: 'vidrio', label: 'Cristal limpio', desc: 'Reciclaste vidrio',         ok: history.some(h => h.material === 'vidrio'),    icon: '🫙' },
    { id: 'metal',  label: 'Metal hero',     desc: 'Reciclaste metal',          ok: history.some(h => h.material === 'metal'),     icon: '🥫' },
    { id: 'co2',    label: 'Eco warrior',    desc: '1 kg de CO₂ ahorrado',     ok: co2Total >= 1,    icon: '🌍' },
    { id: 'pts100', label: 'Centenario',     desc: '100 puntos acumulados',     ok: points >= 100,    icon: '⭐' },
  ]

  // ── Render ─────────────────────────────────────────────────────────────────
  if (!role) return <RoleSelector onSelect={handleRoleSelect} />

  return (
    <div className={styles.app}>

      {/* Header */}
      <header className={styles.header}>
        <div className={styles.logo}>♻</div>
        <div className={styles.headerText}>
          <h1>SCRAP <span className={styles.logoAI}>2.0</span></h1>
          <p>Clasificación de residuos con IA · Rosario</p>
        </div>
        <div className={styles.headerRight}>
          {role === 'ciudadano' && (
            <div className={styles.pointsBadge} onClick={() => goTo('perfil')}>
              <span className={styles.pointsNum}>{points}</span>
              <span className={styles.pointsLabel}>pts</span>
            </div>
          )}
          <div className={styles.rolePill} onClick={handleChangeRole} title="Cambiar rol">
            {role === 'ciudadano' ? '🏠' : role === 'empresa' ? '💼' : '♻️'}
            <span>{role === 'ciudadano' ? 'Ciudadano' : role === 'empresa' ? 'Empresa' : 'Cooperativa'}</span>
          </div>
        </div>
      </header>

      {/* Nav desktop (top) */}
      <nav className={styles.nav}>
        {NAV_ITEMS.map(t => (
          <button
            key={t.id}
            className={`${styles.navBtn} ${screen === t.id ? styles.navActive : ''} ${t.id === 'panel' ? styles.navPanel : ''}`}
            onClick={() => goTo(t.id)}
          >
            <span className={styles.navIcon}>{t.icon}</span>
            <span>{t.label}</span>
          </button>
        ))}
      </nav>

      {/* Main content */}
      <main className={styles.main}>

        {/* ── ESCÁNER ─────────────────────────────────────────── */}
        {screen === 'scan' && (
          <>
            {/* Tabs camara/manual */}
            <div className={styles.scanTabs}>
              <button
                className={`${styles.scanTab} ${scanMode === 'camara' ? styles.scanTabActive : ''}`}
                onClick={() => { setScanMode('camara'); setSelectedCat(null) }}
              >
                📷 Detectar con IA
              </button>
              <button
                className={`${styles.scanTab} ${scanMode === 'manual' ? styles.scanTabActive : ''}`}
                onClick={() => setScanMode('manual')}
              >
                📋 Seleccionar tipo
              </button>
            </div>

            {scanMode === 'camara' ? (
              <div className={styles.scanLayout}>
                <section className={styles.cameraSection}>
                  <Camera
                    onDetections={handleDetections}
                    isLocked={isLocked}
                    highConfDetection={highConfDetection}
                    classInfo={(() => {
                      const catId = topDetection ? AI_CLASS_MAP[topDetection.clsName] : null
                      const cat   = catId ? CATEGORIAS[catId] : null
                      return cat ? { ...cat, conf: topDetection.conf } : null
                    })()}
                    onReciclar={topDetection ? handleQuieroReciclar : null}
                  />
                </section>
                <aside className={styles.infoSection}>
                  <h2 className={styles.sectionTitle}>Clasificación</h2>
                  <ClassInfo detection={topDetection} isLocked={isLocked} />
                  {topDetection && (
                    <button className={styles.btnReciclar} onClick={handleQuieroReciclar}>
                      Ver dónde desecharlo →
                    </button>
                  )}
                  <DatasetStats />
                  <div className={styles.legend}>
                    <h3>Categorías detectables</h3>
                    <div className={styles.legendGrid}>
                      {['plastico','carton','vidrio','papel','metal','basura'].map(id => {
                        const c = CATEGORIAS[id]
                        return (
                          <div key={id} className={styles.legendItem}>
                            <span>{c.emoji}</span>
                            <span style={{ color: c.color }}>{c.nombre}</span>
                          </div>
                        )
                      })}
                    </div>
                  </div>
                </aside>
              </div>
            ) : (
              <div className={styles.manualWrap}>
                <CategorySelector role={role} onSelect={handleCategoriaManual} />
              </div>
            )}
          </>
        )}

        {/* ── MAPA ─────────────────────────────────────────────── */}
        {screen === 'mapa' && (
          <div className={styles.fullSection}>
            {depositPunto ? (
              <DepositFlow
                token={token ?? { material: getCatId() ?? 'plastico' }}
                punto={depositPunto}
                onConfirmado={handleConfirmado}
                onCancelar={() => setDepositPunto(null)}
              />
            ) : (
              <>
                {token && (
                  <div className={styles.tokenBanner}>
                    Tenés un descarte pendiente de <strong>{CATEGORIAS[token.material]?.nombre ?? token.material}</strong> — seleccioná el punto más cercano
                  </div>
                )}
                <RecyclingMap
                  categoriaFiltro={token?.material ?? null}
                  onSeleccionar={token ? handleSeleccionarPunto : null}
                />
              </>
            )}
          </div>
        )}

        {/* ── PERFIL ────────────────────────────────────────────── */}
        {screen === 'perfil' && (
          <div className={styles.fullSection}>
            <div className={styles.profileCard}>
              <div className={styles.profileTop}>
                <div className={styles.profilePoints}>
                  <span className={styles.profileNum}>{points}</span>
                  <span className={styles.profileLabel}>puntos</span>
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
                    <span className={styles.statVal} style={{ color: '#a78bfa', fontSize: 14 }}>{nivel.nombre}</span>
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

              {role === 'ciudadano' && (
                <div className={styles.canjesGrid}>
                  {[
                    { pts: 100,  desc: '1 viaje en colectivo SEMTUR' },
                    { pts: 500,  desc: 'Descuento en comercio adherido' },
                    { pts: 2000, desc: '10% de descuento en ABL' },
                  ].map(c => (
                    <div key={c.pts} className={styles.canje}>
                      <span className={styles.canjeNum}>{c.pts} pts</span>
                      <span className={styles.canjeDesc}>{c.desc}</span>
                    </div>
                  ))}
                </div>
              )}
            </div>

            {role === 'ciudadano' && (
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
            )}

            {history.length > 0 && (
              <div className={styles.historial}>
                <h3>Historial de descartes</h3>
                {history.map((e, i) => {
                  const cat = CATEGORIAS[e.material]
                  return (
                    <div key={i} className={styles.histRow}>
                      <span className={styles.histEmoji}>{cat?.emoji ?? '♻️'}</span>
                      <span className={styles.histMaterial} style={{ color: cat?.color }}>{cat?.nombre ?? e.material}</span>
                      <span className={styles.histPunto}>{e.punto}</span>
                      {e.amount > 0 && <span className={styles.histPts}>+{e.amount} pts</span>}
                      <span className={styles.histFecha}>{new Date(e.fecha).toLocaleDateString('es-AR')}</span>
                    </div>
                  )
                })}
              </div>
            )}

            {history.length === 0 && (
              <p className={styles.emptyHistory}>
                Todavía no registraste ningún descarte. Escaneá un residuo o seleccioná su tipo.
              </p>
            )}

            <button className={styles.btnChangeRole} onClick={handleChangeRole}>
              Cambiar tipo de usuario
            </button>
          </div>
        )}

        {/* ── PANEL MUNICIPAL ──────────────────────────────────── */}
        {screen === 'panel' && (
          <div className={styles.fullSection}>
            <Dashboard />
          </div>
        )}
      </main>

      {/* Nav mobile (bottom bar) */}
      <nav className={styles.navMobile}>
        {NAV_ITEMS.map(t => (
          <button
            key={t.id}
            className={`${styles.navMobileBtn} ${screen === t.id ? styles.navMobileActive : ''}`}
            onClick={() => goTo(t.id)}
          >
            <span className={styles.navMobileIcon}>{t.icon}</span>
            <span className={styles.navMobileLabel}>{t.label}</span>
          </button>
        ))}
      </nav>

      {/* Chat asistente flotante */}
      <ChatBot hook={chatHook} />
    </div>
  )
}
