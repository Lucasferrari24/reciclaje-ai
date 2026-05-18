import { useEffect, useState } from 'react'
import styles from './DatasetStats.module.css'

const API = import.meta.env.VITE_API_URL ?? 'http://localhost:8001'
const POLL_MS = 3000

const CLASS_COLORS = {
  cardboard: '#C8A96E',
  glass:     '#a8d8ea',
  metal:     '#FFFF00',
  paper:     '#8BC34A',
  plastic:   '#FF6B6B',
  trash:     '#969696',
}

export function DatasetStats() {
  const [stats, setStats] = useState(null)
  const [downloading, setDownloading] = useState(false)
  const [resetting, setResetting] = useState(false)

  useEffect(() => {
    const poll = async () => {
      try {
        const res = await fetch(`${API}/api/dataset/stats`)
        if (res.ok) setStats(await res.json())
      } catch {}
    }
    poll()
    const id = setInterval(poll, POLL_MS)
    return () => clearInterval(id)
  }, [])

  const handleDownload = async () => {
    setDownloading(true)
    try {
      const res = await fetch(`${API}/api/dataset/download`)
      const blob = await res.blob()
      const url = URL.createObjectURL(blob)
      const a = document.createElement('a')
      a.href = url
      a.download = 'dataset_reciclaje.zip'
      a.click()
      URL.revokeObjectURL(url)
    } finally {
      setDownloading(false)
    }
  }

  const handleReset = async () => {
    if (!confirm('¿Borrar todas las muestras recolectadas?')) return
    setResetting(true)
    try {
      await fetch(`${API}/api/dataset/reset`, { method: 'DELETE' })
      setStats(s => s ? { ...s, counts: Object.fromEntries(Object.keys(s.counts).map(k => [k, 0])), total: 0, ready: false } : s)
    } finally {
      setResetting(false)
    }
  }

  if (!stats) return null

  return (
    <div className={styles.card}>
      <div className={styles.titleRow}>
        <h3 className={styles.title}>Auto-recolección</h3>
        <span className={`${styles.badge} ${stats.ready ? styles.ready : styles.collecting}`}>
          {stats.ready ? 'Listo para entrenar' : 'Recolectando...'}
        </span>
      </div>

      <div className={styles.total}>
        <span className={styles.totalNum}>{stats.total}</span>
        <span className={styles.totalLabel}>muestras reales</span>
      </div>

      <div className={styles.classes}>
        {Object.entries(stats.counts).map(([name, count]) => (
          <div key={name} className={styles.classRow}>
            <span className={styles.dot} style={{ backgroundColor: CLASS_COLORS[name] ?? '#888' }} />
            <span className={styles.className}>{name}</span>
            <div className={styles.bar}>
              <div
                className={styles.barFill}
                style={{
                  width: `${Math.min(100, (count / stats.max_per_class) * 100)}%`,
                  backgroundColor: CLASS_COLORS[name] ?? '#888',
                }}
              />
            </div>
            <span className={styles.count}>{count}</span>
          </div>
        ))}
      </div>

      {stats.ready && (
        <p className={styles.hint}>
          Descargá el dataset y usá el notebook de Colab para reentrenar.
        </p>
      )}

      <div className={styles.actions}>
        <button
          className={styles.downloadBtn}
          onClick={handleDownload}
          disabled={stats.total === 0 || downloading}
        >
          {downloading ? 'Descargando...' : `Descargar dataset`}
        </button>
        <button
          className={styles.resetBtn}
          onClick={handleReset}
          disabled={stats.total === 0 || resetting}
        >
          Limpiar
        </button>
      </div>
    </div>
  )
}
