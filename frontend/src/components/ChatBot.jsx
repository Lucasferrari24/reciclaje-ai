import { useEffect, useRef, useState } from 'react'
import styles from './ChatBot.module.css'

function Bubble({ msg, role, chips, thinking, onChip }) {
  const isBot = role === 'bot'

  // Convertir \n a <br> para mostrar saltos de línea
  const lines = (msg ?? '').split('\n')

  return (
    <div className={`${styles.bubble} ${isBot ? styles.bubbleBot : styles.bubbleUser}`}>
      {isBot && <span className={styles.avatar}>🤖</span>}
      <div className={styles.bubbleInner}>
        <div className={styles.bubbleText}>
          {lines.map((line, i) => (
            <span key={i}>
              {line}
              {i < lines.length - 1 && <br />}
            </span>
          ))}
        </div>
        {chips?.length > 0 && (
          <div className={styles.chips}>
            {chips.map((c) => (
              <button key={c} className={styles.chip} onClick={() => onChip(c)}>
                {c}
              </button>
            ))}
          </div>
        )}
      </div>
    </div>
  )
}

function ThinkingBubble() {
  return (
    <div className={`${styles.bubble} ${styles.bubbleBot}`}>
      <span className={styles.avatar}>🤖</span>
      <div className={styles.bubbleInner}>
        <div className={styles.thinking}>
          <span /><span /><span />
        </div>
      </div>
    </div>
  )
}

export function ChatBot({ hook }) {
  const { messages, isOpen, open, close, thinking, hasNotif, sendMessage } = hook

  const [input, setInput] = useState('')
  const bottomRef = useRef(null)
  const inputRef  = useRef(null)

  // Auto-scroll al último mensaje
  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: 'smooth' })
  }, [messages, thinking])

  // Focus al input cuando abre
  useEffect(() => {
    if (isOpen) setTimeout(() => inputRef.current?.focus(), 150)
  }, [isOpen])

  const handleSend = (text = input.trim(), isChip = false) => {
    if (!text) return
    sendMessage(text, isChip)
    setInput('')
  }

  const handleKey = (e) => {
    if (e.key === 'Enter' && !e.shiftKey) { e.preventDefault(); handleSend() }
  }

  return (
    <>
      {/* Panel de chat */}
      {isOpen && (
        <div className={styles.panel}>
          {/* Header */}
          <div className={styles.header}>
            <span className={styles.headerIcon}>♻️</span>
            <div className={styles.headerInfo}>
              <span className={styles.headerName}>Scrap Bot</span>
              <span className={styles.headerSub}>Clasificación de residuos · Rosario</span>
            </div>
            <button className={styles.closeBtn} onClick={close}>✕</button>
          </div>

          {/* Mensajes */}
          <div className={styles.messages}>
            {messages.map((m) =>
              m.role ? (
                <Bubble
                  key={m.id}
                  msg={m.msg}
                  role={m.role}
                  chips={m.chips}
                  onChip={(c) => handleSend(c, true)}
                />
              ) : null
            )}
            {thinking && <ThinkingBubble />}
            <div ref={bottomRef} />
          </div>

          {/* Input */}
          <div className={styles.inputRow}>
            <input
              ref={inputRef}
              className={styles.input}
              value={input}
              onChange={(e) => setInput(e.target.value)}
              onKeyDown={handleKey}
              placeholder="Escribí tu pregunta..."
              maxLength={200}
            />
            <button
              className={styles.sendBtn}
              onClick={() => handleSend()}
              disabled={!input.trim()}
            >
              ➤
            </button>
          </div>
        </div>
      )}

      {/* Botón flotante */}
      <button
        className={`${styles.fab} ${hasNotif ? styles.fabNotif : ''}`}
        onClick={isOpen ? close : open}
        aria-label="Abrir asistente"
      >
        {isOpen ? '✕' : '🤖'}
        {hasNotif && !isOpen && <span className={styles.notifDot} />}
      </button>
    </>
  )
}
