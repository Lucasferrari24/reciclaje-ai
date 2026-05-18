import { useEffect, useState, useRef } from 'react'
import { MapContainer, TileLayer, Marker, Popup, Circle, useMap } from 'react-leaflet'
import L from 'leaflet'
import 'leaflet/dist/leaflet.css'
import { PUNTOS_VERDES } from '../data/puntosVerdes.js'
import styles from './RecyclingMap.module.css'

// Fix default icon (Vite no resuelve los assets de Leaflet automáticamente)
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

const NEAR_ICON = new L.Icon({
  iconUrl: 'https://raw.githubusercontent.com/pointhi/leaflet-color-markers/master/img/marker-icon-2x-red.png',
  shadowUrl: 'https://unpkg.com/leaflet@1.9.4/dist/images/marker-shadow.png',
  iconSize: [25, 41], iconAnchor: [12, 41], popupAnchor: [1, -34],
})

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
        {cercanos.map((p, i) => (
          <div
            key={p.id}
            className={`${styles.puntoCard} ${selected?.id === p.id ? styles.activo : ''}`}
            onClick={() => { setSelected(p); setFlyTarget([p.lat, p.lng]) }}
          >
            <div className={styles.puntoBadge}>{i === 0 ? '⬤ MÁS CERCANO' : `⬤ ${p.dist ? p.dist.toFixed(1)+'km' : ''}`}</div>
            <div className={styles.puntoNombre}>{p.nombre}</div>
            <div className={styles.puntoDireccion}>{p.direccion}</div>
            <div className={styles.puntoMateriales}>
              {p.materiales.map(m => <span key={m} className={styles.chip}>{m}</span>)}
            </div>
            <div className={styles.puntoActions}>
              <button className={styles.btnIr}    onClick={e => { e.stopPropagation(); irAqui(p) }}>Cómo llegar</button>
              {onSeleccionar && (
                <button className={styles.btnSelect} onClick={e => { e.stopPropagation(); onSeleccionar(p) }}>
                  Confirmar depósito aquí
                </button>
              )}
            </div>
          </div>
        ))}
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

          {puntos.map(p => (
            <Marker
              key={p.id}
              position={[p.lat, p.lng]}
              icon={cercanos.includes(p) ? NEAR_ICON : undefined}
              eventHandlers={{ click: () => { setSelected(p); setFlyTarget([p.lat, p.lng]) } }}
            >
              <Popup>
                <strong>{p.nombre}</strong><br />
                {p.direccion}<br />
                <small>{p.materiales.join(' · ')}</small><br />
                {p.dist && <small>~{p.dist.toFixed(1)} km de vos</small>}
              </Popup>
            </Marker>
          ))}
        </MapContainer>
      </div>
    </div>
  )
}
