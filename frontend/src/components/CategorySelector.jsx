import { useState } from 'react'
import { CATEGORIAS, CATEGORIAS_HARDCODED, CATEGORIAS_IA } from '../data/categorias.js'
import styles from './CategorySelector.module.css'

export function CategorySelector({ role = 'ciudadano', onSelect }) {
  const [expanded, setExpanded] = useState(null)

  const handle = (id) => {
    if (expanded === id) { setExpanded(null); return }
    setExpanded(id)
  }

  const handleIr = (id) => {
    onSelect(id)
    setExpanded(null)
  }

  const renderCard = (id) => {
    const cat = CATEGORIAS[id]
    const isOpen = expanded === id
    return (
      <div
        key={id}
        className={`${styles.card} ${isOpen ? styles.open : ''}`}
        style={{ '--cat-color': cat.color }}
        onClick={() => handle(id)}
      >
        <div className={styles.cardHead}>
          <span className={styles.emoji}>{cat.emoji}</span>
          <div className={styles.cardInfo}>
            <span className={styles.cardName}>{cat.nombre}</span>
            {cat.reciclable === true && <span className={styles.badge}>♻ Reciclable</span>}
            {cat.reciclable === false && <span className={`${styles.badge} ${styles.badgeNo}`}>✕ No reciclable</span>}
            {cat.reciclable === 'parcial' && <span className={`${styles.badge} ${styles.badgeParcial}`}>∼ Parcial</span>}
          </div>
          <span className={`${styles.chevron} ${isOpen ? styles.up : ''}`}>›</span>
        </div>

        {isOpen && (
          <div className={styles.detail} onClick={e => e.stopPropagation()}>
            <p className={styles.desc}>{cat.descripcion}</p>
            <div className={styles.infoRow}>
              <span className={styles.infoLabel}>Contenedor</span>
              <span className={styles.infoVal}>{cat.contenedor}</span>
            </div>
            <div className={styles.instrBox}>
              <span className={styles.instrIcon}>💡</span>
              <p className={styles.instrText}>{cat.instruccion}</p>
            </div>
            {cat.ejemplos && (
              <div className={styles.ejemplos}>
                {cat.ejemplos.map(e => <span key={e} className={styles.chip}>{e}</span>)}
              </div>
            )}
            {role === 'empresa' && cat.nota_empresa && (
              <div className={styles.notaEmpresa}>
                <span>⚠️</span>
                <p>{cat.nota_empresa}</p>
              </div>
            )}
            <button className={styles.btnMapa} onClick={() => handleIr(id)}>
              Ver puntos de descarte →
            </button>
          </div>
        )}
      </div>
    )
  }

  return (
    <div className={styles.wrap}>
      <p className={styles.sectionLabel}>Categorías principales</p>
      <div className={styles.list}>
        {CATEGORIAS_HARDCODED.map(renderCard)}
      </div>

      <p className={styles.sectionLabel} style={{ marginTop: 16 }}>Detectados por cámara</p>
      <div className={styles.iaGrid}>
        {CATEGORIAS_IA.map(id => {
          const cat = CATEGORIAS[id]
          return (
            <button
              key={id}
              className={styles.iaChip}
              style={{ '--cat-color': cat.color }}
              onClick={() => handleIr(id)}
            >
              <span>{cat.emoji}</span>
              <span>{cat.nombre}</span>
            </button>
          )
        })}
      </div>
    </div>
  )
}
