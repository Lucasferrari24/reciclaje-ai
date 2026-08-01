import { useState, useEffect } from 'react'
import { MapContainer, TileLayer, Marker, Popup, Circle } from 'react-leaflet'
import L from 'leaflet'
import { PUNTOS_VERDES, estadoContenedor } from '../data/puntosVerdes.js'
import styles from './Dashboard.module.css'

// Iconos de contenedores por estado
const makeIcon = (color) => new L.DivIcon({
  html: `<div style="width:16px;height:16px;border-radius:50%;background:${color};border:2px solid #fff;box-shadow:0 0 6px ${color}88"></div>`,
  className: '',
  iconSize: [16, 16],
  iconAnchor: [8, 8],
})
const ICON_OK   = makeIcon('#22c55e')
const ICON_WARN = makeIcon('#f59e0b')
const ICON_FULL = makeIcon('#ef4444')

function getIcon(capacidad) {
  const e = estadoContenedor(capacidad)
  if (e === 'lleno') return ICON_FULL
  if (e === 'por_llenarse') return ICON_WARN
  return ICON_OK
}

// Datos simulados realistas
const ACTIVIDAD_RECIENTE = [
  { id: 1, usuario: 'María G.',    material: 'plastico', punto: 'Parque Independencia',   pts: 10, hace: '2 min' },
  { id: 2, usuario: 'Carlos R.',   material: 'vidrio',   punto: 'Plaza Sarmiento',         pts: 15, hace: '8 min' },
  { id: 3, usuario: 'Ana L.',      material: 'metal',    punto: 'Costanera Norte',          pts: 20, hace: '14 min' },
  { id: 4, usuario: 'Pedro M.',    material: 'carton',   punto: 'Terminal de Ómnibus',      pts:  8, hace: '21 min' },
  { id: 5, usuario: 'Sofía V.',    material: 'papel',    punto: 'Plaza Italia',             pts:  8, hace: '35 min' },
  { id: 6, usuario: 'Luis T.',     material: 'plastico', punto: 'UNR - Ciudad Universitaria', pts: 10, hace: '48 min' },
  { id: 7, usuario: 'Martina F.',  material: 'vidrio',   punto: 'Mercado de Productores',   pts: 15, hace: '1 h' },
]

const MAT_COLORS = {
  plastico: '#FF6B6B',
  vidrio:   '#a8d8ea',
  metal:    '#FFFF00',
  papel:    '#8BC34A',
  carton:   '#C8A96E',
  trash:    '#969696',
}

const BARRAS_SEMANA = [
  { dia: 'Lun', val: 68 },
  { dia: 'Mar', val: 85 },
  { dia: 'Mié', val: 72 },
  { dia: 'Jue', val: 91 },
  { dia: 'Vie', val: 78 },
  { dia: 'Sáb', val: 55 },
  { dia: 'Dom', val: 40 },
]

const MATERIALES_CHART = [
  { nombre: 'Plástico', pct: 38, color: '#FF6B6B' },
  { nombre: 'Vidrio',   pct: 22, color: '#a8d8ea' },
  { nombre: 'Papel',    pct: 18, color: '#8BC34A' },
  { nombre: 'Metal',    pct: 13, color: '#FFFF00' },
  { nombre: 'Cartón',   pct:  9, color: '#C8A96E' },
]

function CapacidadBar({ valor, showLabel = true }) {
  const e = estadoContenedor(valor)
  const color = e === 'lleno' ? '#ef4444' : e === 'por_llenarse' ? '#f59e0b' : '#22c55e'
  return (
    <div className={styles.capBarWrap}>
      <div className={styles.capBarTrack}>
        <div className={styles.capBarFill} style={{ width: `${valor}%`, background: color }} />
      </div>
      {showLabel && <span className={styles.capNum} style={{ color }}>{valor}%</span>}
    </div>
  )
}

export function Dashboard() {
  const [tab, setTab] = useState('resumen')
  const [tick, setTick] = useState(0)

  // Simula actualizaciones en tiempo real
  useEffect(() => {
    const id = setInterval(() => setTick(t => t + 1), 8000)
    return () => clearInterval(id)
  }, [])

  const llenos     = PUNTOS_VERDES.filter(p => estadoContenedor(p.capacidad) === 'lleno').length
  const porLlenarse = PUNTOS_VERDES.filter(p => estadoContenedor(p.capacidad) === 'por_llenarse').length
  const disponibles = PUNTOS_VERDES.filter(p => estadoContenedor(p.capacidad) === 'disponible').length

  return (
    <div className={styles.wrap}>
      {/* Header del panel */}
      <div className={styles.panelHeader}>
        <div>
          <h2 className={styles.panelTitle}>Panel de Control Municipal</h2>
          <p className={styles.panelSub}>Rosario · Secretaría de Ambiente · Actualizado hace {tick * 8}s</p>
        </div>
        <div className={styles.statusRow}>
          <span className={styles.dot} style={{ background: '#22c55e' }} />
          <span className={styles.statusLabel}>Sistema activo</span>
        </div>
      </div>

      {/* KPIs */}
      <div className={styles.kpiGrid}>
        <div className={styles.kpi}>
          <span className={styles.kpiNum}>2.847</span>
          <span className={styles.kpiLabel}>Reciclajes hoy</span>
          <span className={styles.kpiDelta}>▲ 12% vs ayer</span>
        </div>
        <div className={styles.kpi}>
          <span className={styles.kpiNum} style={{ color: '#22c55e' }}>1.243 kg</span>
          <span className={styles.kpiLabel}>CO₂ ahorrado</span>
          <span className={styles.kpiDelta}>este mes</span>
        </div>
        <div className={styles.kpi}>
          <span className={styles.kpiNum} style={{ color: '#fbbf24' }}>438</span>
          <span className={styles.kpiLabel}>Usuarios activos</span>
          <span className={styles.kpiDelta}>▲ 8% esta semana</span>
        </div>
        <div className={styles.kpi}>
          <span className={styles.kpiNum} style={{ color: '#ef4444' }}>{llenos}</span>
          <span className={styles.kpiLabel}>Contenedores llenos</span>
          <span className={styles.kpiDelta}>requieren recolección</span>
        </div>
      </div>

      {/* Tabs */}
      <div className={styles.tabs}>
        {['resumen', 'contenedores', 'mapa', 'actividad'].map(t => (
          <button
            key={t}
            className={`${styles.tabBtn} ${tab === t ? styles.tabActive : ''}`}
            onClick={() => setTab(t)}
          >
            {t.charAt(0).toUpperCase() + t.slice(1)}
          </button>
        ))}
      </div>

      {/* ── RESUMEN ── */}
      {tab === 'resumen' && (
        <div className={styles.grid2}>
          {/* Gráfico semanal */}
          <div className={styles.card}>
            <h3 className={styles.cardTitle}>Reciclajes por día</h3>
            <div className={styles.barChart}>
              {BARRAS_SEMANA.map(b => (
                <div key={b.dia} className={styles.barCol}>
                  <div className={styles.barWrap}>
                    <div className={styles.barFill} style={{ height: `${b.val}%` }} />
                  </div>
                  <span className={styles.barLabel}>{b.dia}</span>
                </div>
              ))}
            </div>
          </div>

          {/* Materiales */}
          <div className={styles.card}>
            <h3 className={styles.cardTitle}>Distribución por material</h3>
            <div className={styles.matList}>
              {MATERIALES_CHART.map(m => (
                <div key={m.nombre} className={styles.matRow}>
                  <div className={styles.matDot} style={{ background: m.color }} />
                  <span className={styles.matNom}>{m.nombre}</span>
                  <div className={styles.matBarTrack}>
                    <div className={styles.matBarFill} style={{ width: `${m.pct}%`, background: m.color }} />
                  </div>
                  <span className={styles.matPct}>{m.pct}%</span>
                </div>
              ))}
            </div>
          </div>

          {/* Estado contenedores */}
          <div className={styles.card}>
            <h3 className={styles.cardTitle}>Estado de la red</h3>
            <div className={styles.estadoGrid}>
              <div className={styles.estadoItem}>
                <span className={styles.estadoNum} style={{ color: '#22c55e' }}>{disponibles}</span>
                <span className={styles.estadoLabel}>Disponibles</span>
              </div>
              <div className={styles.estadoItem}>
                <span className={styles.estadoNum} style={{ color: '#f59e0b' }}>{porLlenarse}</span>
                <span className={styles.estadoLabel}>Por llenarse</span>
              </div>
              <div className={styles.estadoItem}>
                <span className={styles.estadoNum} style={{ color: '#ef4444' }}>{llenos}</span>
                <span className={styles.estadoLabel}>Llenos</span>
              </div>
              <div className={styles.estadoItem}>
                <span className={styles.estadoNum} style={{ color: '#6b7280' }}>15</span>
                <span className={styles.estadoLabel}>Total puntos</span>
              </div>
            </div>
          </div>

          {/* Cooperativas */}
          <div className={styles.card}>
            <h3 className={styles.cardTitle}>Cooperativas activas</h3>
            <div className={styles.coopList}>
              {[
                { nombre: 'El Recupero',       recolecciones: 48, kg: 312 },
                { nombre: 'Verde Rosario',      recolecciones: 35, kg: 227 },
                { nombre: 'Reciclando Futuro',  recolecciones: 29, kg: 189 },
              ].map(c => (
                <div key={c.nombre} className={styles.coopRow}>
                  <div>
                    <div className={styles.coopNombre}>{c.nombre}</div>
                    <div className={styles.coopSub}>{c.recolecciones} recolecciones este mes</div>
                  </div>
                  <div className={styles.coopKg}>{c.kg} kg</div>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}

      {/* ── CONTENEDORES ── */}
      {tab === 'contenedores' && (
        <div className={styles.card}>
          <h3 className={styles.cardTitle}>Estado de contenedores en tiempo real</h3>
          <div className={styles.contTable}>
            <div className={styles.contHeader}>
              <span>Punto verde</span>
              <span>Cooperativa</span>
              <span>Materiales</span>
              <span>Ocupación</span>
              <span>Estado</span>
            </div>
            {[...PUNTOS_VERDES].sort((a,b) => b.capacidad - a.capacidad).map(p => {
              const e = estadoContenedor(p.capacidad)
              return (
                <div key={p.id} className={styles.contRow}>
                  <div>
                    <div className={styles.contNombre}>{p.nombre}</div>
                    <div className={styles.contDir}>{p.direccion}</div>
                  </div>
                  <span className={styles.contCoop}>{p.cooperativa}</span>
                  <div className={styles.contMats}>
                    {p.materiales.slice(0, 3).map(m => (
                      <span key={m} className={styles.matChip} style={{ borderColor: MAT_COLORS[m] + '66', color: MAT_COLORS[m] }}>{m}</span>
                    ))}
                    {p.materiales.length > 3 && <span className={styles.matChipMore}>+{p.materiales.length - 3}</span>}
                  </div>
                  <CapacidadBar valor={p.capacidad} />
                  <span className={`${styles.estadoBadge} ${styles['estado_' + e]}`}>
                    {e === 'disponible' ? 'OK' : e === 'por_llenarse' ? 'Alerta' : 'LLENO'}
                  </span>
                </div>
              )
            })}
          </div>
        </div>
      )}

      {/* ── MAPA ── */}
      {tab === 'mapa' && (
        <div className={styles.card} style={{ padding: 0, overflow: 'hidden' }}>
          <div className={styles.mapLegend}>
            <span><span className={styles.legendDot} style={{ background: '#22c55e' }} />Disponible</span>
            <span><span className={styles.legendDot} style={{ background: '#f59e0b' }} />Por llenarse</span>
            <span><span className={styles.legendDot} style={{ background: '#ef4444' }} />Lleno</span>
          </div>
          <MapContainer center={[-32.9468, -60.6393]} zoom={13} style={{ height: '520px', width: '100%' }}>
            <TileLayer
              attribution='&copy; OpenStreetMap'
              url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
            />
            {PUNTOS_VERDES.map(p => (
              <Marker key={p.id} position={[p.lat, p.lng]} icon={getIcon(p.capacidad)}>
                <Popup>
                  <strong>{p.nombre}</strong><br />
                  {p.direccion}<br />
                  <span style={{ color: estadoContenedor(p.capacidad) === 'lleno' ? '#ef4444' : estadoContenedor(p.capacidad) === 'por_llenarse' ? '#f59e0b' : '#22c55e' }}>
                    Ocupación: {p.capacidad}%
                  </span><br />
                  <small>{p.horario}</small>
                </Popup>
              </Marker>
            ))}
          </MapContainer>
        </div>
      )}

      {/* ── ACTIVIDAD ── */}
      {tab === 'actividad' && (
        <div className={styles.card}>
          <h3 className={styles.cardTitle}>Actividad reciente</h3>
          <div className={styles.actList}>
            {ACTIVIDAD_RECIENTE.map(a => (
              <div key={a.id} className={styles.actRow}>
                <div className={styles.actDot} style={{ background: MAT_COLORS[a.material] }} />
                <div className={styles.actInfo}>
                  <span className={styles.actUsuario}>{a.usuario}</span>
                  <span className={styles.actMat} style={{ color: MAT_COLORS[a.material] }}>{a.material}</span>
                  <span className={styles.actPunto}>{a.punto}</span>
                </div>
                <div className={styles.actRight}>
                  <span className={styles.actPts}>+{a.pts} pts</span>
                  <span className={styles.actHace}>{a.hace}</span>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  )
}
