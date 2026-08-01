// capacidad: 0-100 (% de ocupación del contenedor)
// estado: 'disponible' | 'por_llenarse' | 'lleno'
// horario: string legible
// cooperativa: nombre de la cooperativa responsable
export const PUNTOS_VERDES = [
  { id: 1,  nombre: 'Parque Independencia',          direccion: 'Bv. Oroño y Av. Pellegrini',        lat: -32.9540, lng: -60.6470, materiales: ['plastico','papel','vidrio','metal','carton'], capacidad: 42, horario: 'Lun-Vie 7:00-20:00 · Sáb 8:00-14:00', cooperativa: 'El Recupero' },
  { id: 2,  nombre: 'Plaza Sarmiento',               direccion: 'Córdoba y Presidente Roca',          lat: -32.9468, lng: -60.6385, materiales: ['plastico','papel','vidrio'],                   capacidad: 78, horario: 'Lun-Dom 7:00-22:00',                                cooperativa: 'Reciclando Futuro' },
  { id: 3,  nombre: 'Mercado de Productores',        direccion: 'Av. Francia y Av. Circunvalación',   lat: -32.9271, lng: -60.6704, materiales: ['plastico','papel','vidrio','metal','carton'], capacidad: 25, horario: 'Mar-Dom 6:00-14:00',                                cooperativa: 'El Recupero' },
  { id: 4,  nombre: 'Centro Cultural Parque España', direccion: 'Av. Belgrano y el Río',              lat: -32.9395, lng: -60.6217, materiales: ['plastico','vidrio','papel'],                   capacidad: 91, horario: 'Mié-Dom 10:00-21:00',                               cooperativa: 'Verde Rosario' },
  { id: 5,  nombre: 'Plaza Italia',                  direccion: 'Salta y San Juan',                   lat: -32.9555, lng: -60.6456, materiales: ['plastico','papel','carton'],                   capacidad: 55, horario: 'Lun-Vie 8:00-18:00',                                cooperativa: 'Reciclando Futuro' },
  { id: 6,  nombre: 'Costanera Norte',               direccion: 'Av. Estanislao López al 600',        lat: -32.9270, lng: -60.6260, materiales: ['plastico','vidrio','metal'],                   capacidad: 30, horario: 'Lun-Dom 8:00-20:00',                                cooperativa: 'Verde Rosario' },
  { id: 7,  nombre: 'Terminal de Ómnibus',           direccion: 'Cafferata y Santa Fe',               lat: -32.9486, lng: -60.6572, materiales: ['plastico','papel','vidrio','carton'],           capacidad: 62, horario: 'Lun-Dom 6:00-23:00',                                cooperativa: 'El Recupero' },
  { id: 8,  nombre: 'Barrio Pichincha',              direccion: 'Wheelwright y Presidente Roca',      lat: -32.9420, lng: -60.6510, materiales: ['plastico','papel','carton'],                   capacidad: 48, horario: 'Lun-Vie 7:00-19:00',                                cooperativa: 'Reciclando Futuro' },
  { id: 9,  nombre: 'Plaza Del Trabajador',          direccion: 'Av. Alberdi y Cochabamba',           lat: -32.9642, lng: -60.6423, materiales: ['plastico','vidrio','metal','papel'],           capacidad: 15, horario: 'Lun-Sáb 7:00-18:00',                                cooperativa: 'Verde Rosario' },
  { id: 10, nombre: 'Barrio Fisherton',              direccion: 'Av. Del Huerto y Presidente Wilson', lat: -32.9175, lng: -60.7085, materiales: ['plastico','papel','vidrio','carton','metal'], capacidad: 70, horario: 'Mar-Sáb 9:00-17:00',                                cooperativa: 'El Recupero' },
  { id: 11, nombre: 'Barrio Arroyito',               direccion: 'Junín y Rueda',                      lat: -32.9215, lng: -60.6520, materiales: ['plastico','papel','vidrio'],                   capacidad: 85, horario: 'Lun-Vie 7:00-19:00',                                cooperativa: 'Reciclando Futuro' },
  { id: 12, nombre: 'Av. San Martín y Francia',      direccion: 'Av. San Martín 2800',                lat: -32.9360, lng: -60.6640, materiales: ['plastico','vidrio','carton'],                   capacidad: 38, horario: 'Lun-Dom 8:00-20:00',                                cooperativa: 'Verde Rosario' },
  { id: 13, nombre: 'Barrio Belgrano',               direccion: 'Av. Pellegrini y Gaboto',            lat: -32.9475, lng: -60.6710, materiales: ['plastico','papel','metal'],                   capacidad: 95, horario: 'Lun-Vie 8:00-18:00',                                cooperativa: 'El Recupero' },
  { id: 14, nombre: 'Plaza Olmos',                   direccion: 'Corrientes y Maipú',                 lat: -32.9508, lng: -60.6358, materiales: ['plastico','papel','vidrio','carton'],           capacidad: 20, horario: 'Lun-Dom 7:00-22:00',                                cooperativa: 'Verde Rosario' },
  { id: 15, nombre: 'Ciudad Universitaria UNR',      direccion: 'Av. Pellegrini 250',                 lat: -32.9392, lng: -60.6968, materiales: ['plastico','papel','carton','metal'],           capacidad: 58, horario: 'Lun-Vie 7:00-21:00 · Sáb 9:00-13:00',               cooperativa: 'Reciclando Futuro' },
]

export function estadoContenedor(capacidad) {
  if (capacidad >= 85) return 'lleno'
  if (capacidad >= 60) return 'por_llenarse'
  return 'disponible'
}

export const PUNTOS_POR_MATERIAL = {
  vidrio:   15,
  metal:    20,
  plastico: 10,
  papel:     8,
  carton:    8,
  trash:     5,
}

// kg de CO₂ equivalente ahorrado por unidad reciclada
export const CO2_POR_MATERIAL = {
  vidrio:   0.31,
  metal:    0.85,
  plastico: 1.20,
  papel:    0.90,
  carton:   0.78,
  trash:    0.10,
}
