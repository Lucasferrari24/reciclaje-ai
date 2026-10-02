import styles from './RoleSelector.module.css'

const ROLES = [
  {
    id: 'ciudadano',
    emoji: '🏠',
    nombre: 'Ciudadano',
    desc: 'Reciclá en casa y ganá puntos canjeables.',
    color: '#22c55e',
  },
  {
    id: 'empresa',
    emoji: '💼',
    nombre: 'Empresa',
    desc: 'Gestión de residuos industriales y comerciales.',
    color: '#60a5fa',
  },
  {
    id: 'cooperativa',
    emoji: '♻️',
    nombre: 'Cooperativa / Municipio',
    desc: 'Panel de control, estadísticas y gestión de puntos.',
    color: '#a78bfa',
  },
]

export function RoleSelector({ onSelect }) {
  return (
    <div className={styles.overlay}>
      <div className={styles.modal}>
        <div className={styles.logo}>♻</div>
        <h1 className={styles.title}>Scrap <span className={styles.accent}>2.0</span></h1>
        <p className={styles.sub}>¿Con quién estamos hablando?</p>

        <div className={styles.grid}>
          {ROLES.map(r => (
            <button
              key={r.id}
              className={styles.roleCard}
              style={{ '--role-color': r.color }}
              onClick={() => onSelect(r.id)}
            >
              <span className={styles.roleEmoji}>{r.emoji}</span>
              <span className={styles.roleName}>{r.nombre}</span>
              <span className={styles.roleDesc}>{r.desc}</span>
            </button>
          ))}
        </div>

        <p className={styles.footer}>Podés cambiarlo desde tu perfil</p>
      </div>
    </div>
  )
}
