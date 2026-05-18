import { useState, useCallback } from 'react'

const STORAGE_KEY  = 'reciclaje_puntos'
const HISTORY_KEY  = 'reciclaje_historial'
const TOKEN_KEY    = 'reciclaje_token_activo'
const TOKEN_TTL_MS = 2 * 60 * 60 * 1000  // 2 horas

function loadPoints() {
  return parseInt(localStorage.getItem(STORAGE_KEY) || '0', 10)
}
function loadHistory() {
  try { return JSON.parse(localStorage.getItem(HISTORY_KEY) || '[]') } catch { return [] }
}

export function usePoints() {
  const [points,  setPoints]  = useState(loadPoints)
  const [history, setHistory] = useState(loadHistory)

  const addPoints = useCallback((amount, material, punto) => {
    const newTotal = loadPoints() + amount
    const entry    = { amount, material, punto, fecha: new Date().toISOString() }
    const newHist  = [entry, ...loadHistory()].slice(0, 50)
    localStorage.setItem(STORAGE_KEY, String(newTotal))
    localStorage.setItem(HISTORY_KEY, JSON.stringify(newHist))
    setPoints(newTotal)
    setHistory(newHist)
    return newTotal
  }, [])

  // Genera un token cuando el usuario confirma un objeto a reciclar
  const generarToken = useCallback((material) => {
    const token = {
      material,
      ts:      Date.now(),
      expiry:  Date.now() + TOKEN_TTL_MS,
      id:      Math.random().toString(36).slice(2),
    }
    localStorage.setItem(TOKEN_KEY, JSON.stringify(token))
    return token
  }, [])

  // Lee el token activo (null si expiró o no existe)
  const getToken = useCallback(() => {
    try {
      const t = JSON.parse(localStorage.getItem(TOKEN_KEY) || 'null')
      if (!t || Date.now() > t.expiry) { localStorage.removeItem(TOKEN_KEY); return null }
      return t
    } catch { return null }
  }, [])

  const consumirToken = useCallback(() => {
    localStorage.removeItem(TOKEN_KEY)
  }, [])

  return { points, history, addPoints, generarToken, getToken, consumirToken }
}
