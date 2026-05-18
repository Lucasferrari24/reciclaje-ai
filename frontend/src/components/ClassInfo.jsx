import { CLASS_ICONS, ScanIcon } from '../icons'
import styles from './ClassInfo.module.css'

const CLASS_DATA = {
  cardboard: {
    color: '#C8A96E',
    bin: 'Contenedor Azul',
    tip: 'Cajas y cartón corrugado. Doblá las cajas para reducir volumen.',
  },
  glass: {
    color: '#a8d8ea',
    bin: 'Contenedor Verde',
    tip: 'Botellas y frascos de vidrio. Quitá las tapas antes de reciclar.',
  },
  metal: {
    color: '#FFFF00',
    bin: 'Contenedor Amarillo',
    tip: 'Latas, tapas y papel aluminio. Aplastá las latas para ahorrar espacio.',
  },
  paper: {
    color: '#8BC34A',
    bin: 'Contenedor Azul',
    tip: 'Diarios, revistas y hojas. Mantenelos secos para reciclar correctamente.',
  },
  plastic: {
    color: '#FF6B6B',
    bin: 'Contenedor Amarillo',
    tip: 'Botellas PET, envases y bolsas. Enjuagalos antes de reciclar.',
  },
  trash: {
    color: '#969696',
    bin: 'Residuo General',
    tip: 'Residuo no reciclable. Depositalo en el contenedor gris o negro.',
  },
}

export function ClassInfo({ detection, isLocked = false }) {
  if (!detection) {
    return (
      <div className={styles.empty}>
        <div className={styles.emptyIconWrap}>
          <ScanIcon />
        </div>
        <p className={styles.emptyText}>Apuntá la cámara a un residuo</p>
        <p className={styles.emptyHint}>El sistema clasificará automáticamente</p>
      </div>
    )
  }

  const info = CLASS_DATA[detection.clsName]
  if (!info) return null

  const Icon = CLASS_ICONS[detection.clsName]
  const conf = Math.round(detection.conf * 100)

  return (
    <div key={detection.clsName} className={styles.card} style={{ '--cls-color': info.color }}>

      {/* ── Header ── */}
      <div className={styles.header}>
        <div className={styles.iconWrap} style={{ color: info.color, backgroundColor: info.color + '18' }}>
          {Icon && <Icon />}
        </div>

        <div className={styles.headerInfo}>
          <span className={styles.className}>{detection.clsName.toUpperCase()}</span>
          <div className={styles.confRow}>
            <span className={styles.confNum} style={{ color: info.color }}>{conf}<small>%</small></span>
            <span className={styles.confLabel}>CONFIANZA</span>
          </div>
        </div>

        {isLocked && (
          <span className={styles.lockBadge}>
            <span className={styles.lockDot} />
            RASTREANDO
          </span>
        )}
      </div>

      {/* ── Datos ── */}
      <div className={styles.body}>
        <div className={styles.field}>
          <span className={styles.fieldLabel}>CONTENEDOR</span>
          <span className={styles.fieldValue}>{info.bin}</span>
        </div>
        <div className={styles.divider} />
        <div className={styles.field}>
          <span className={styles.fieldLabel}>CONSEJO</span>
          <p className={styles.fieldText}>{info.tip}</p>
        </div>
      </div>

      {/* ── Barra de confianza ── */}
      <div className={styles.barTrack}>
        <div
          className={styles.barFill}
          style={{ width: `${conf}%`, backgroundColor: info.color }}
        />
      </div>
    </div>
  )
}
