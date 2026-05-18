import { useState, useRef, useCallback } from 'react'
import { PUNTOS_POR_MATERIAL } from '../data/puntosVerdes.js'
import styles from './DepositFlow.module.css'

const MAX_DIST_M = 300  // metros de tolerancia para verificación

function distM(lat1, lng1, lat2, lng2) {
  const R = 6371000
  const dL = (lat2 - lat1) * Math.PI / 180
  const dG = (lng2 - lng1) * Math.PI / 180
  const a = Math.sin(dL/2)**2 + Math.cos(lat1*Math.PI/180)*Math.cos(lat2*Math.PI/180)*Math.sin(dG/2)**2
  return R * 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1-a))
}

export function DepositFlow({ token, punto, onConfirmado, onCancelar }) {
  const [step,    setStep]    = useState('foto')   // 'foto' | 'geo' | 'ok' | 'error'
  const [foto,    setFoto]    = useState(null)
  const [msg,     setMsg]     = useState('')
  const [loading, setLoading] = useState(false)
  const videoRef  = useRef(null)
  const streamRef = useRef(null)

  const puntos = PUNTOS_POR_MATERIAL[token.material] ?? 5

  const abrirCamara = useCallback(async () => {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ video: { facingMode: 'environment' } })
      streamRef.current = stream
      if (videoRef.current) videoRef.current.srcObject = stream
    } catch { setMsg('No se pudo acceder a la cámara') }
  }, [])

  const sacarFoto = useCallback(() => {
    const video  = videoRef.current
    if (!video) return
    const canvas = document.createElement('canvas')
    canvas.width  = video.videoWidth  || 640
    canvas.height = video.videoHeight || 480
    canvas.getContext('2d').drawImage(video, 0, 0)
    setFoto(canvas.toDataURL('image/jpeg', 0.7))
    streamRef.current?.getTracks().forEach(t => t.stop())
    setStep('geo')
  }, [])

  const verificarUbicacion = useCallback(async () => {
    setLoading(true)
    setMsg('')
    navigator.geolocation.getCurrentPosition(
      pos => {
        const dist = distM(pos.coords.latitude, pos.coords.longitude, punto.lat, punto.lng)
        setLoading(false)
        if (dist <= MAX_DIST_M) {
          setStep('ok')
          onConfirmado(puntos, token.material, punto.nombre)
        } else {
          setMsg(`Estás a ${Math.round(dist)} m del punto. Tenés que estar a menos de ${MAX_DIST_M} m.`)
          setStep('error')
        }
      },
      () => {
        setLoading(false)
        // Sin GPS → confiar en la foto (para demo o lugares sin señal)
        setStep('ok')
        onConfirmado(puntos, token.material, punto.nombre)
      },
      { timeout: 8000, maximumAge: 30000 }
    )
  }, [punto, puntos, token, onConfirmado])

  return (
    <div className={styles.wrap}>
      <div className={styles.header}>
        <button className={styles.back} onClick={onCancelar}>← Volver</button>
        <h3>Confirmar depósito</h3>
      </div>

      <div className={styles.info}>
        <span className={styles.material}>{token.material}</span>
        <span className={styles.arrow}>→</span>
        <span className={styles.punto}>{punto.nombre}</span>
        <span className={styles.reward}>+{puntos} pts</span>
      </div>

      {/* Paso 1: Foto */}
      {step === 'foto' && (
        <div className={styles.step}>
          <p className={styles.instruccion}>
            Sacá una foto mientras depositás el objeto en el contenedor
          </p>
          {!streamRef.current?.active ? (
            <button className={styles.btnPrimary} onClick={abrirCamara}>Abrir cámara</button>
          ) : (
            <div className={styles.cameraWrap}>
              <video ref={videoRef} autoPlay playsInline muted className={styles.video} />
              <button className={styles.btnCapture} onClick={sacarFoto}>📸 Sacar foto</button>
            </div>
          )}
        </div>
      )}

      {/* Paso 2: Verificación GPS */}
      {step === 'geo' && (
        <div className={styles.step}>
          {foto && <img src={foto} alt="depósito" className={styles.preview} />}
          <p className={styles.instruccion}>
            Verificando que estás en <strong>{punto.nombre}</strong>
          </p>
          {msg && <p className={styles.error}>{msg}</p>}
          <button className={styles.btnPrimary} onClick={verificarUbicacion} disabled={loading}>
            {loading ? 'Verificando ubicación...' : 'Confirmar depósito'}
          </button>
        </div>
      )}

      {/* Éxito */}
      {step === 'ok' && (
        <div className={`${styles.step} ${styles.success}`}>
          <div className={styles.successIcon}>✓</div>
          <h4>¡Depósito confirmado!</h4>
          <p>Sumaste <strong>{puntos} puntos</strong> por reciclar {token.material}</p>
          <button className={styles.btnPrimary} onClick={onCancelar}>Listo</button>
        </div>
      )}

      {/* Error de distancia */}
      {step === 'error' && (
        <div className={styles.step}>
          {foto && <img src={foto} alt="depósito" className={styles.preview} />}
          <p className={styles.error}>{msg}</p>
          <button className={styles.btnPrimary} onClick={() => setStep('geo')}>Intentar de nuevo</button>
        </div>
      )}
    </div>
  )
}
