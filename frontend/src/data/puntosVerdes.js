// tipo: 'verde' | 'raee' | 'voluminoso' | 'toxico'
// capacidad: 0-100 (% de ocupación)
// materiales: array de IDs de categorías que acepta

export const PUNTOS_VERDES = [
  // ── Puntos verdes (reciclables secos) ─────────────────────────────────────
  { id: 1,  tipo: 'verde', nombre: 'Parque Independencia',          direccion: 'Bv. Oroño y Av. Pellegrini',         lat: -32.9540, lng: -60.6470, materiales: ['plastico','papel','vidrio','metal','carton','domiciliario'], capacidad: 42, horario: 'Lun-Vie 7:00-20:00 · Sáb 8:00-14:00', cooperativa: 'El Recupero' },
  { id: 2,  tipo: 'verde', nombre: 'Plaza Sarmiento',               direccion: 'Córdoba y Presidente Roca',          lat: -32.9468, lng: -60.6385, materiales: ['plastico','papel','vidrio','domiciliario'],                   capacidad: 78, horario: 'Lun-Dom 7:00-22:00',                                cooperativa: 'Reciclando Futuro' },
  { id: 3,  tipo: 'verde', nombre: 'Mercado de Productores',        direccion: 'Av. Francia y Av. Circunvalación',   lat: -32.9271, lng: -60.6704, materiales: ['plastico','papel','vidrio','metal','carton','domiciliario'], capacidad: 25, horario: 'Mar-Dom 6:00-14:00',                                cooperativa: 'El Recupero' },
  { id: 4,  tipo: 'verde', nombre: 'Centro Cultural Parque España', direccion: 'Av. Belgrano y el Río',              lat: -32.9395, lng: -60.6217, materiales: ['plastico','vidrio','papel','domiciliario'],                   capacidad: 91, horario: 'Mié-Dom 10:00-21:00',                               cooperativa: 'Verde Rosario' },
  { id: 5,  tipo: 'verde', nombre: 'Plaza Italia',                  direccion: 'Salta y San Juan',                   lat: -32.9555, lng: -60.6456, materiales: ['plastico','papel','carton','domiciliario'],                   capacidad: 55, horario: 'Lun-Vie 8:00-18:00',                                cooperativa: 'Reciclando Futuro' },
  { id: 6,  tipo: 'verde', nombre: 'Costanera Norte',               direccion: 'Av. Estanislao López al 600',        lat: -32.9270, lng: -60.6260, materiales: ['plastico','vidrio','metal','domiciliario'],                   capacidad: 30, horario: 'Lun-Dom 8:00-20:00',                                cooperativa: 'Verde Rosario' },
  { id: 7,  tipo: 'verde', nombre: 'Terminal de Ómnibus',           direccion: 'Cafferata y Santa Fe',               lat: -32.9486, lng: -60.6572, materiales: ['plastico','papel','vidrio','carton','domiciliario'],           capacidad: 62, horario: 'Lun-Dom 6:00-23:00',                                cooperativa: 'El Recupero' },
  { id: 8,  tipo: 'verde', nombre: 'Barrio Pichincha',              direccion: 'Wheelwright y Presidente Roca',      lat: -32.9420, lng: -60.6510, materiales: ['plastico','papel','carton','domiciliario'],                   capacidad: 48, horario: 'Lun-Vie 7:00-19:00',                                cooperativa: 'Reciclando Futuro' },
  { id: 9,  tipo: 'verde', nombre: 'Plaza Del Trabajador',          direccion: 'Av. Alberdi y Cochabamba',           lat: -32.9642, lng: -60.6423, materiales: ['plastico','vidrio','metal','papel','domiciliario'],           capacidad: 15, horario: 'Lun-Sáb 7:00-18:00',                                cooperativa: 'Verde Rosario' },
  { id: 10, tipo: 'verde', nombre: 'Barrio Fisherton',              direccion: 'Av. Del Huerto y Presidente Wilson', lat: -32.9175, lng: -60.7085, materiales: ['plastico','papel','vidrio','carton','metal','domiciliario'], capacidad: 70, horario: 'Mar-Sáb 9:00-17:00',                                cooperativa: 'El Recupero' },
  { id: 11, tipo: 'verde', nombre: 'Barrio Arroyito',               direccion: 'Junín y Rueda',                      lat: -32.9215, lng: -60.6520, materiales: ['plastico','papel','vidrio','domiciliario'],                   capacidad: 85, horario: 'Lun-Vie 7:00-19:00',                                cooperativa: 'Reciclando Futuro' },
  { id: 12, tipo: 'verde', nombre: 'Av. San Martín y Francia',      direccion: 'Av. San Martín 2800',                lat: -32.9360, lng: -60.6640, materiales: ['plastico','vidrio','carton','domiciliario'],                   capacidad: 38, horario: 'Lun-Dom 8:00-20:00',                                cooperativa: 'Verde Rosario' },
  { id: 13, tipo: 'verde', nombre: 'Barrio Belgrano',               direccion: 'Av. Pellegrini y Gaboto',            lat: -32.9475, lng: -60.6710, materiales: ['plastico','papel','metal','domiciliario'],                   capacidad: 95, horario: 'Lun-Vie 8:00-18:00',                                cooperativa: 'El Recupero' },
  { id: 14, tipo: 'verde', nombre: 'Plaza Olmos',                   direccion: 'Corrientes y Maipú',                 lat: -32.9508, lng: -60.6358, materiales: ['plastico','papel','vidrio','carton','domiciliario'],           capacidad: 20, horario: 'Lun-Dom 7:00-22:00',                                cooperativa: 'Verde Rosario' },
  { id: 15, tipo: 'verde', nombre: 'Ciudad Universitaria UNR',      direccion: 'Av. Pellegrini 250',                 lat: -32.9392, lng: -60.6968, materiales: ['plastico','papel','carton','metal','domiciliario'],           capacidad: 58, horario: 'Lun-Vie 7:00-21:00 · Sáb 9:00-13:00',               cooperativa: 'Reciclando Futuro' },

  // ── Puntos RAEE (tecnológicos) ─────────────────────────────────────────────
  { id: 16, tipo: 'raee', nombre: 'RAEE Centro Cívico',             direccion: 'Santa Fe y Córdoba',                 lat: -32.9462, lng: -60.6350, materiales: ['tecnologico'],                                               capacidad: 55, horario: 'Lun-Vie 8:00-14:00',                                cooperativa: 'TecnoVerde' },
  { id: 17, tipo: 'raee', nombre: 'RAEE Shopping del Siglo',        direccion: 'Junín 501',                          lat: -32.9480, lng: -60.6308, materiales: ['tecnologico'],                                               capacidad: 30, horario: 'Lun-Dom 10:00-22:00',                               cooperativa: 'TecnoVerde' },
  { id: 18, tipo: 'raee', nombre: 'RAEE UNR – Fac. Ingeniería',     direccion: 'Av. Pellegrini 250',                 lat: -32.9400, lng: -60.6950, materiales: ['tecnologico'],                                               capacidad: 40, horario: 'Lun-Vie 8:00-18:00',                                cooperativa: 'TecnoVerde' },
  { id: 19, tipo: 'raee', nombre: 'RAEE Municipalidad Rosario',     direccion: 'Buenos Aires 711',                   lat: -32.9445, lng: -60.6298, materiales: ['tecnologico'],                                               capacidad: 65, horario: 'Lun-Vie 7:30-13:30',                                cooperativa: 'TecnoVerde' },

  // ── Puntos Voluminosos ─────────────────────────────────────────────────────
  { id: 20, tipo: 'voluminoso', nombre: 'Centro de Recepción Sur',  direccion: 'Av. Circunvalación y Provincias Unidas', lat: -32.9780, lng: -60.6500, materiales: ['voluminoso'],                                         capacidad: 50, horario: 'Mar·Jue·Sáb 8:00-14:00',                           cooperativa: 'Recolecta Sur' },
  { id: 21, tipo: 'voluminoso', nombre: 'Centro de Recepción Norte', direccion: 'Av. Francia 4200',                  lat: -32.9100, lng: -60.6600, materiales: ['voluminoso'],                                               capacidad: 35, horario: 'Lun·Mié·Vie 8:00-14:00',                           cooperativa: 'Recolecta Norte' },
  { id: 22, tipo: 'voluminoso', nombre: 'Planta de Transferencia',   direccion: 'Camino Negro y Ruta 9',             lat: -32.9650, lng: -60.7200, materiales: ['voluminoso'],                                               capacidad: 20, horario: 'Lun-Sáb 7:00-17:00',                               cooperativa: 'El Recupero' },

  // ── Puntos Tóxicos ─────────────────────────────────────────────────────────
  { id: 23, tipo: 'toxico', nombre: 'Ecopunto Oeste',               direccion: 'Av. Alberdi 4350',                   lat: -32.9550, lng: -60.6950, materiales: ['toxico'],                                                   capacidad: 45, horario: 'Lun-Vie 8:00-14:00 · Sáb 9:00-13:00',              cooperativa: 'HazMat Rosario' },
  { id: 24, tipo: 'toxico', nombre: 'Ecopunto Norte',               direccion: 'Av. Génova 5000',                    lat: -32.9050, lng: -60.6700, materiales: ['toxico'],                                                   capacidad: 60, horario: 'Mar-Sáb 8:00-14:00',                               cooperativa: 'HazMat Rosario' },
  { id: 25, tipo: 'toxico', nombre: 'Ecopunto Centro',              direccion: 'Jujuy 350',                          lat: -32.9490, lng: -60.6330, materiales: ['toxico'],                                                   capacidad: 30, horario: 'Lun-Vie 9:00-15:00',                               cooperativa: 'HazMat Rosario' },
]

export function estadoContenedor(capacidad) {
  if (capacidad >= 85) return 'lleno'
  if (capacidad >= 60) return 'por_llenarse'
  return 'disponible'
}

export function tipoBadge(tipo) {
  switch (tipo) {
    case 'raee':       return { label: 'RAEE', color: '#60a5fa' }
    case 'voluminoso': return { label: 'Voluminoso', color: '#f59e0b' }
    case 'toxico':     return { label: 'Tóxico', color: '#f87171' }
    default:           return { label: 'Punto Verde', color: '#22c55e' }
  }
}

export function distKm(lat1, lng1, lat2, lng2) {
  const R = 6371
  const dL = (lat2 - lat1) * Math.PI / 180
  const dG = (lng2 - lng1) * Math.PI / 180
  const a = Math.sin(dL/2)**2 + Math.cos(lat1*Math.PI/180)*Math.cos(lat2*Math.PI/180)*Math.sin(dG/2)**2
  return R * 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1-a))
}

export const PUNTOS_POR_MATERIAL = {
  vidrio:   15,
  metal:    20,
  plastico: 10,
  papel:     8,
  carton:    8,
  basura:    0,
  domiciliario: 5,
  tecnologico:  12,
}

export const CO2_POR_MATERIAL = {
  vidrio:   0.31,
  metal:    0.85,
  plastico: 1.20,
  papel:    0.90,
  carton:   0.78,
  basura:   0.05,
  tecnologico: 2.10,
}
