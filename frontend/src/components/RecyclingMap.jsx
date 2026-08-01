import { useEffect, useState, useRef } from 'react'
import { MapContainer, TileLayer, Marker, Popup, Circle, useMap } from 'react-leaflet'
import L from 'leaflet'
import 'leaflet/dist/leaflet.css'
import { PUNTOS_VERDES, estadoContenedor } from '../data/puntosVerdes.js'
import styles from './RecyclingMap.module.css'

delete L.Icon.Default.prototype._getIconUrl
L.Icon.Default.mergeOptions({
  iconRetinaUrl: 'https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon-2x.png',
  iconUrl:       'https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon.png',
  shadowUrl:     'https://unpkg.com/leaflet@1.9.4/dist/images/marker-shadow.png',
})

const USER_ICON = new L.Icon({
  iconUrl: 'https://raw.githubusercontent.com/pointhi/leaflet-color-markers/master/img/marker-icon-2x-green.png',
  shadowUrl: 'https://unpkg.com/leaflet@1.9.4/dist/images/marker-shadow.png',
  iconSize: [25, 41], iconAnchor: [12, 41], popupAnchor: [1, -34],
})

function makeCapIcon(capacidad) {
  const e = estadoContenedor(capacidad)
  const color = e === 'lleno' ? '#ef4444' : e === 'por_llenarse' ? '#f59e0b' : '#22c55e'
  return new L.DivIcon({
    html: `<div style="position:relative;width:28px;height:40px">
      <svg viewBox="0 0 28 40" xmlns="http://www.w3.org/2000/svg">
        <path d="M14 0C6.27 0 0 6.27 0 14c0 9.33 14 26 14 26S28 23.33 28 14C28 6.27 21.73 0 14 0z" fill="${color}"/>
        <circle cx="14" cy="14" r="8" fill="white" opacity="0.9"/>
        <text x="14" y="18" text-anchor="middle" font-size="9" font-weight="bold" fill="${color}">${capacidad}%</text>
      </svg>
    </div>`,
    className: '',
    iconSize: [28, 40],
    iconAnchor: [14, 40],
    popupAnchor: [0, -40],
  })
}

function distKm(lat1, lng1, lat2, lng2) {
  const R  = 6371
  const dL = (lat2 - lat1) * Math.PI / 180
  const dG = (lng2 - lng1) * Math.PI / 180
  const a  = Math.sin(dL/2)**2 + Math.cos(lat1*Math.PI/180) * Math.cos(lat2*Math.PI/180) * Math.sin(dG/2)**2
  return R * 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1-a))
}

function FlyTo({ center }) {
  const map = useMap()
  useEffect(() => { if (center) map.flyTo(center, 15, { duration: 1.2 }) }, [center, map])
  return null
}

export function RecyclingMap({ materialFiltro, onSeleccionar }) {
  const [userPos,   setUserPos]   = useState(null)
  const [flyTarget, setFlyTarget] = useState(null)
  const [selected,  setSelected]  = useState(null)
  const ROSARIO = [-32.9468, -60.6393]

  useEffect(() => {
    navigator.geolocation?.getCurrentPosition(
      pos => setUserPos([pos.coords.latitude, pos.coords.longitude]),
      () => {}
    )
  }, [])

  const puntos = PUNTOS_VERDES
    .filter(p => !materialFiltro || p.materiales.includes(materialFiltro))
    .map(p => ({
      ...p,
      dist: userPos ? distKm(userPos[0], userPos[1], p.lat, p.lng) : null,
    }))
    .sort((a, b) => (a.dist ?? 999) - (b.dist ?? 999))

  const cercanos = puntos.slice(0, 3)

  const irAqui = (punto) => {
    const url = `https://www.google.com/maps/dir/?api=1&destination=${punto.lat},${punto.lng}&travelmode=walking`
    window.open(url, '_blank')
  }

  return (
    <div className={styles.wrap}>
      {/* Lista lateral de puntos más cercanos */}
      <div className={styles.sidebar}>
        <p className={styles.sideTitle}>
          {materialFiltro ? `Puntos para: ${materialFiltro}` : 'Puntos verdes cercanos'}
        </p>
        {cercanos.map((p, i) => {
          const e = estadoContenedor(p.capacidad)
          const capColor = e === 'lleno' ? '#ef4444' : e === 'por_llenarse' ? '#f59e0b' : '#22c55e'
          return (
            <div
              key={p.id}
              className={`${styles.puntoCard} ${selected?.id === p.id ? styles.activo : ''}`}
              onClick={() => { setSelected(p); setFlyTarget([p.lat, p.lng]) }}
            >
              <div className={styles.puntoBadge}>{i === 0 ? '⬤ MÁS CERCANO' : `⬤ ${p.dist ? p.dist.toFixed(1)+'km' : ''}`}</div>
              <div className={styles.puntoNombre}>{p.nombre}</div>
              <div className={styles.puntoDireccion}>{p.direccion}</div>
              <div className={styles.capRow}>
                <div className={styles.capTrack}>
                  <div className={styles.capFill} style={{ width: `${p.capacidad}%`, background: capColor }} />
                </div>
                <span className={styles.capLabel} style={{ color: capColor }}>{p.capacidad}%</span>
              </div>
              <div className={styles.horario}>{p.horario}</div>
              <div className={styles.puntoMateriales}>
                {p.materiales.map(m => <span key={m} className={styles.chip}>{m}</span>)}
              </div>
              <div className={styles.puntoActions}>
                <button className={styles.btnIr}    onClick={ev => { ev.stopPropagation(); irAqui(p) }}>Cómo llegar</button>
                {onSeleccionar && (
                  <button className={styles.btnSelect} onClick={ev => { ev.stopPropagation(); onSeleccionar(p) }}>
                    Confirmar depósito aquí
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
            attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a>'
            url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
          />
          {flyTarget && <FlyTo center={flyTarget} />}

          {userPos && (
            <>
              <Marker position={userPos} icon={USER_ICON}>
                <Popup>Tu ubicación</Popup>
              </Marker>
              <Circle center={userPos} radius={1500} pathOptions={{ color: '#22c55e', fillOpacity: 0.05 }} />
            </>
          )}

          {puntos.map(p => {
            const e = estadoContenedor(p.capacidad)
            const capColor = e === 'lleno' ? '#ef4444' : e === 'por_llenarse' ? '#f59e0b' : '#22c55e'
            return (
              <Marker
                key={p.id}
                position={[p.lat, p.lng]}
                icon={makeCapIcon(p.capacidad)}
                eventHandlers={{ click: () => { setSelected(p); setFlyTarget([p.lat, p.lng]) } }}
              >
                <Popup>
                  <strong>{p.nombre}</strong><br />
                  {p.direccion}<br />
                  <small style={{ color: capColor }}>Capacidad: {p.capacidad}% · {e === 'disponible' ? 'Disponible' : e === 'por_llenarse' ? 'Por llenarse' : '⚠ LLENO'}</small><br />
                  <small>{p.horario}</small><br />
                  <small>{p.materiales.join(' · ')}</small><br />
                  {p.dist && <small>~{p.dist.toFixed(1)} km de vos</small>}
                </Popup>
              </Marker>
            )
          })}
        </MapContainer>
      </div>
    </div>
  )
}
