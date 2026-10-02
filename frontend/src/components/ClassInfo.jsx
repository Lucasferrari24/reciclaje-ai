import { CATEGORIAS, AI_CLASS_MAP } from '../data/categorias.js'
import styles from './ClassInfo.module.css'

const ICONOS = {
  plastico:  '🥤',
  carton:    '📦',
  vidrio:    '🫙',
  papel:     '📄',
  metal:     '🥫',
  basura:    '🗑️',
}

export function ClassInfo({ detection, isLocked = false }) {
  if (!detection) {
    return (
      <div className={styles.empty}>
        <div className={styles.emptyIconWrap}>
          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.75" width="100%" height="100%">
            <path d="M3 7V5a2 2 0 012-2h2"/><path d="M17 3h2a2 2 0 012 2v2"/>
            <path d="M21 17v2a2 2 0 01-2 2h-2"/><path d="M7 21H5a2 2 0 01-2-2v-2"/>
            <line x1="3" y1="12" x2="21" y2="12"/>
          </svg>
        </div>
        <p className={styles.emptyText}>Apuntá la cámara a un residuo</p>
        <p className={styles.emptyHint}>El sistema lo clasificará automáticamente</p>
      </div>
    )
  }

  const catId = AI_CLASS_MAP[detection.clsName] ?? detection.clsName
  const cat   = CATEGORIAS[catId]
  if (!cat) return null

  const conf = Math.round(detection.conf * 100)

  return (
    <div key={catId} className={styles.card} style={{ '--cls-color': cat.color }}>
      <div className={styles.header}>
        <div className={styles.iconWrap} style={{ color: cat.color, backgroundColor: cat.color + '18' }}>
          <span style={{ fontSize: 22 }}>{ICONOS[catId] ?? '♻️'}</span>
        </div>

        <div className={styles.headerInfo}>
          <span className={styles.className}>{cat.nombre.toUpperCase()}</span>
          <div className={styles.confRow}>
            <span className={styles.confNum} style={{ color: cat.color }}>{conf}<small>%</small></span>
            <span className={styles.confLabel}>CONFIANZA</span>
          </div>
        </div>

        <div className={styles.badges}>
          {isLocked && (
            <span className={styles.lockBadge}>
              <span className={styles.lockDot} />
              RASTREANDO
            </span>
          )}
          {cat.reciclable === true && <span className={styles.recycleBadge}>♻ Reciclable</span>}
        </div>
      </div>

      <div className={styles.body}>
        <div className={styles.field}>
          <span className={styles.fieldLabel}>CONTENEDOR</span>
          <span className={styles.fieldValue}>{cat.contenedor}</span>
        </div>
        <div className={styles.divider} />
        <div className={styles.field}>
          <span className={styles.fieldLabel}>CONSEJO</span>
          <p className={styles.fieldText}>{cat.instruccion}</p>
        </div>
        {cat.puntos > 0 && (
          <>
            <div className={styles.divider} />
            <div className={styles.field}>
              <span className={styles.fieldLabel}>RECOMPENSA</span>
              <span className={styles.fieldValue} style={{ color: '#fbbf24' }}>+{cat.puntos} puntos · -{cat.co2} kg CO₂</span>
            </div>
          </>
        )}
      </div>

      <div className={styles.barTrack}>
        <div className={styles.barFill} style={{ width: `${conf}%`, backgroundColor: cat.color }} />
      </div>
    </div>
  )
}
