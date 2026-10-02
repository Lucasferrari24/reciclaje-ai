import { useEffect, useState, useRef } from 'react'
import { MapContainer, TileLayer, Marker, Popup, Circle, useMap } from 'react-leaflet'
import L from 'leaflet'
import 'leaflet/dist/leaflet.css'
import { PUNTOS_VERDES, estadoContenedor, tipoBadge, distKm } from '../data/puntosVerdes.js'
import { CATEGORIAS } from '../data/categorias.js'
import styles from './RecyclingMap.module.css'

delete L.Icon.Default.prototype._getIconUrl

const USER_ICON = new L.DivIcon({
  html: `<div style="width:20px;height:20px;border-radius:50%;background:#22c55e;border:3px solid #fff;box-shadow:0 0 10px #22c55e88"></div>`,
  className: '',
  iconSize: [20, 20],
  iconAnchor: [10, 10],
})

function makeMarkerIcon(punto) {
  const tb    = tipoBadge(punto.tipo)
  const e     = estadoContenedor(punto.capacidad)
  const color = e === 'lleno' ? '#ef4444' : e === 'por_llenarse' ? '#f59e0b' : tb.color
  return new L.DivIcon({
    html: `<div style="
      width:32px;height:32px;border-radius:50%;
      background:${color};border:2px solid #fff;
      display:flex;align-items:center;justify-content:center;
      font-size:14px;box-shadow:0 2px 6px ${color}66
    ">${punto.tipo==='raee'?'💻':punto.tipo==='voluminoso'?'🛋️':punto.tipo==='toxico'?'⚠️':'♻️'}</div>`,
    className: '',
    iconSize: [32, 32],
    iconAnchor: [16, 16],
    popupAnchor: [0, -18],
  })
}

function FlyTo({ center }) {
  const map = useMap()
  useEffect(() => { if (center) map.flyTo(center, 15, { duration: 1 }) }, [center, map])
  return null
}

export function RecyclingMap({ categoriaFiltro, onSeleccionar }) {
  const [userPos,   setUserPos]   = useState(null)
  const [flyTarget, setFlyTarget] = useState(null)
  const [selected,  setSelected]  = useState(null)
  const [geoError,  setGeoError]  = useState(false)
  const ROSARIO = [-32.9468, -60.6393]

  // Auto-geolocalización al montar
  useEffect(() => {
    if (!navigator.geolocation) { setGeoError(true); return }
    navigator.geolocation.getCurrentPosition(
      pos => {
        const coords = [pos.coords.latitude, pos.coords.longitude]
        setUserPos(coords)
      },
      () => setGeoError(true),
      { timeout: 8000, maximumAge: 60000 }
    )
  }, [])

  // Filtrar puntos por tipo de categoría
  const cat = categoriaFiltro ? CATEGORIAS[categoriaFiltro] : null
  const tipoPunto = cat?.tipoPunto ?? null

  const puntos = PUNTOS_VERDES
    .filter(p => {
      if (!tipoPunto) return true
      if (tipoPunto === 'verde') return p.tipo === 'verde'
      return p.tipo === tipoPunto
    })
    .filter(p => {
      if (!categoriaFiltro) return true
      return p.materiales.includes(categoriaFiltro) || p.tipo === tipoPunto
    })
    .map(p => ({
      ...p,
      dist: userPos ? distKm(userPos[0], userPos[1], p.lat, p.lng) : null,
    }))
    .sort((a, b) => (a.dist ?? 999) - (b.dist ?? 999))

  // Auto-seleccionar el más cercano cuando llega la ubicación
  useEffect(() => {
    if (userPos && puntos.length > 0 && !selected) {
      const nearest = puntos[0]
      setSelected(nearest)
      setFlyTarget([nearest.lat, nearest.lng])
    }
  }, [userPos]) // eslint-disable-line

  const irAqui = (punto) => {
    window.open(`https://www.google.com/maps/dir/?api=1&destination=${punto.lat},${punto.lng}&travelmode=walking`, '_blank')
  }

  const handleSelect = (punto) => {
    setSelected(punto)
    setFlyTarget([punto.lat, punto.lng])
  }

  return (
    <div className={styles.wrap}>
      {/* Sidebar */}
      <div className={styles.sidebar}>
        <p className={styles.sideTitle}>
          {categoriaFiltro && cat ? `Puntos para: ${cat.nombre}` : 'Puntos de descarte cercanos'}
          {userPos && <span className={styles.geoOk}> · Ubicación activa</span>}
          {geoError && <span className={styles.geoErr}> · Sin ubicación</span>}
        </p>

        {puntos.length === 0 && (
          <p className={styles.noPoints}>No hay puntos disponibles para esta categoría.</p>
        )}

        {puntos.slice(0, 5).map((p, i) => {
          const tb    = tipoBadge(p.tipo)
          const e     = estadoContenedor(p.capacidad)
          const capColor = e === 'lleno' ? '#ef4444' : e === 'por_llenarse' ? '#f59e0b' : '#22c55e'
          const isNear   = i === 0 && userPos
          return (
            <div
              key={p.id}
              className={`${styles.puntoCard} ${selected?.id === p.id ? styles.activo : ''}`}
              onClick={() => handleSelect(p)}
            >
              {isNear && <div className={styles.nearestBadge}>📍 Más cercano</div>}
              <div className={styles.puntoHead}>
                <span className={styles.tipoBadge} style={{ color: tb.color, borderColor: tb.color + '44', background: tb.color + '11' }}>{tb.label}</span>
                {p.dist && <span className={styles.dist}>{p.dist < 1 ? `${Math.round(p.dist * 1000)} m` : `${p.dist.toFixed(1)} km`}</span>}
              </div>
              <div className={styles.puntoNombre}>{p.nombre}</div>
              <div className={styles.puntoDireccion}>{p.direccion}</div>

              <div className={styles.capRow}>
                <div className={styles.capTrack}>
                  <div className={styles.capFill} style={{ width: `${p.capacidad}%`, background: capColor }} />
                </div>
                <span className={styles.capLabel} style={{ color: capColor }}>{p.capacidad}%</span>
              </div>
              <div className={styles.horario}>{p.horario}</div>

              <div className={styles.puntoActions}>
                <button className={styles.btnIr} onClick={ev => { ev.stopPropagation(); irAqui(p) }}>Cómo llegar</button>
                {onSeleccionar && p.tipo === 'verde' && (
                  <button className={styles.btnSelect} onClick={ev => { ev.stopPropagation(); onSeleccionar(p) }}>
                    Confirmar aquí
                  </button>
                )}
              </div>
            </div>
          )
        })}
      </div>

      {/* Mapa */}
      <div className={styles.mapWrap}>
        <MapContainer center={userPos ?? ROSARIO} zoom={13} className={styles.map}>
          <TileLayer
            attribution='&copy; OpenStreetMap'
            url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
          />
          {flyTarget && <FlyTo center={flyTarget} />}

          {userPos && (
            <>
              <Marker position={userPos} icon={USER_ICON}>
                <Popup>Tu ubicación</Popup>
              </Marker>
              <Circle center={userPos} radius={1500} pathOptions={{ color: '#22c55e', fillOpacity: 0.04, weight: 1 }} />
            </>
          )}

          {puntos.map(p => {
            const tb = tipoBadge(p.tipo)
            const e  = estadoContenedor(p.capacidad)
            const capColor = e === 'lleno' ? '#ef4444' : e === 'por_llenarse' ? '#f59e0b' : tb.color
            return (
              <Marker
                key={p.id}
                position={[p.lat, p.lng]}
                icon={makeMarkerIcon(p)}
                eventHandlers={{ click: () => handleSelect(p) }}
              >
                <Popup>
                  <strong>{p.nombre}</strong><br />
                  {p.direccion}<br />
                  <span style={{ color: capColor }}>Ocupación: {p.capacidad}%</span><br />
                  <small>{p.horario}</small>
                </Popup>
              </Marker>
            )
          })}
        </MapContainer>
      </div>
    </div>
  )
}
