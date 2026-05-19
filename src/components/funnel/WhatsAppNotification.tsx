'use client'

import { useEffect, useRef, useState } from 'react'
import { motion } from 'framer-motion'

interface WhatsAppNotificationProps {
  onComplete: () => void
}

export default function WhatsAppNotification({ onComplete }: WhatsAppNotificationProps) {
  const [currentTime, setCurrentTime] = useState('')
  const [currentDate, setCurrentDate] = useState('')
  const notificationPlayedRef = useRef(false)
  const completedRef = useRef(false)
  const onCompleteRef = useRef(onComplete)
  const audioRef = useRef<HTMLAudioElement | null>(null)

  useEffect(() => {
    onCompleteRef.current = onComplete
  }, [onComplete])

  // Update time every second
  useEffect(() => {
    const updateTime = () => {
      const now = new Date()
      const hours = now.getHours().toString().padStart(2, '0')
      const minutes = now.getMinutes().toString().padStart(2, '0')
      setCurrentTime(`${hours}:${minutes}`)

      const days = ['DOMINGO', 'LUNES', 'MARTES', 'MIÉRCOLES', 'JUEVES', 'VIERNES', 'SÁBADO']
      const months = ['ENERO', 'FEBRERO', 'MARZO', 'ABRIL', 'MAYO', 'JUNIO', 'JULIO', 'AGOSTO', 'SEPTIEMBRE', 'OCTUBRE', 'NOVIEMBRE', 'DICIEMBRE']
      setCurrentDate(`${days[now.getDay()]} ${now.getDate()} DE ${months[now.getMonth()]}`)
    }

    updateTime()
    const interval = setInterval(updateTime, 1000)
    return () => clearInterval(interval)
  }, [])

  // Play notification sound + vibrate on mount (NO auto-advance)
  useEffect(() => {
    if (notificationPlayedRef.current) return
    notificationPlayedRef.current = true

    const audio = new Audio('/audio/notificacion.aac')
    audio.volume = 1.0
    audio.play().catch(() => {})
    audioRef.current = audio

    if (navigator.vibrate) {
      navigator.vibrate([400, 200, 600, 300, 400, 200, 600, 300])
    }

    return () => {
      if (navigator.vibrate) navigator.vibrate(0)
      if (audioRef.current) {
        audioRef.current.pause()
        audioRef.current.src = ''
      }
    }
  }, [])

  const handleNotificationClick = () => {
    if (completedRef.current) return
    completedRef.current = true
    if (navigator.vibrate) navigator.vibrate(0)
    onCompleteRef.current()
  }

  return (
    <motion.div
      className="fixed inset-0 z-50 select-none overflow-hidden"
      style={{
        fontFamily: '-apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif',
      }}
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      transition={{ duration: 0.3 }}
    >
      {/* ── Wallpaper background (dark forest) ── */}
      <div
        style={{
          position: 'absolute',
          inset: 0,
          backgroundImage: 'url(/images/notification/wallpaper.jpg)',
          backgroundSize: 'cover',
          backgroundPosition: 'center',
        }}
      />

      {/* ── Dark overlay (lock screen tint) ── */}
      <div
        style={{
          position: 'absolute',
          inset: 0,
          background: 'rgba(0,0,0,0.25)',
        }}
      />

      {/* ── Status bar ── */}
      <div
        style={{
          position: 'absolute',
          top: 0,
          left: 0,
          right: 0,
          padding: '10px 18px 6px',
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center',
          color: '#fff',
          fontSize: '0.72rem',
          fontWeight: 600,
          zIndex: 10,
        }}
      >
        <span>{currentTime}</span>
        <div style={{ display: 'flex', gap: 5, alignItems: 'center' }}>
          <svg width="14" height="11" viewBox="0 0 16 12" fill="white">
            <rect x="0" y="8" width="3" height="4" rx="0.5" />
            <rect x="4" y="5" width="3" height="7" rx="0.5" />
            <rect x="8" y="2" width="3" height="10" rx="0.5" />
            <rect x="12" y="0" width="3" height="12" rx="0.5" />
          </svg>
          <svg width="14" height="11" viewBox="0 0 24 24" fill="white">
            <path d="M1 9l2 2c4.97-4.97 13.03-4.97 18 0l2-2C16.93 2.93 7.08 2.93 1 9zm8 8l3 3 3-3c-1.65-1.66-4.34-1.66-6 0zm-4-4l2 2c2.76-2.76 7.24-2.76 10 0l2-2C15.14 9.14 8.87 9.14 5 13z" />
          </svg>
          <svg width="20" height="11" viewBox="0 0 22 12" fill="none">
            <rect x="0.5" y="0.5" width="18" height="11" rx="2" stroke="white" strokeWidth="1" />
            <rect x="2" y="2" width="14" height="8" rx="1" fill="white" />
            <rect x="19" y="3" width="2" height="6" rx="0.5" fill="white" />
          </svg>
        </div>
      </div>

      {/* ── Lock icon + Large Time + Date (center) ── */}
      <div
        style={{
          position: 'absolute',
          top: '10%',
          left: 0,
          right: 0,
          textAlign: 'center',
          zIndex: 10,
        }}
      >
        <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" style={{ margin: '0 auto 10px', display: 'block', opacity: 0.7 }}>
          <rect x="3" y="11" width="18" height="11" rx="2" ry="2" />
          <path d="M7 11V7a5 5 0 0 1 10 0v4" />
        </svg>
        <div style={{
          color: '#fff',
          fontSize: 'clamp(3.5rem, 14vw, 5rem)',
          fontWeight: 200,
          lineHeight: 1,
          letterSpacing: '-0.03em',
          fontFamily: '-apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif',
          textShadow: '0 2px 20px rgba(0,0,0,0.5)',
        }}>
          {currentTime}
        </div>
        <div style={{
          color: 'rgba(255,255,255,0.8)',
          fontSize: 'clamp(0.72rem, 2.2vw, 0.85rem)',
          fontWeight: 400,
          marginTop: 8,
          letterSpacing: '0.08em',
          textShadow: '0 1px 10px rgba(0,0,0,0.5)',
        }}>
          {currentDate}
        </div>
      </div>

      {/* ── WhatsApp Notification Card — CLICKABLE with bounce + glow ── */}
      <motion.div
        initial={{ y: -20, opacity: 0, scale: 0.96 }}
        animate={{
          y: 0,
          opacity: 1,
          scale: 1,
        }}
        transition={{ delay: 0.4, duration: 0.5, ease: 'easeOut' }}
        onAnimationComplete={() => {
          // After entry animation, add CSS bounce class
          const el = document.getElementById('notif-card')
          if (el) el.style.animation = 'notifBounce 2.5s ease-in-out 1.5s infinite'
        }}
        onClick={handleNotificationClick}
        id="notif-card"
        style={{
          position: 'absolute',
          top: '36%',
          left: '4%',
          right: '4%',
          background: 'rgba(32, 32, 32, 0.96)',
          borderRadius: '18px',
          padding: '14px 16px',
          zIndex: 20,
          backdropFilter: 'blur(30px)',
          WebkitBackdropFilter: 'blur(30px)',
          boxShadow: '0 4px 30px rgba(0,0,0,0.5), 0 0 20px rgba(37,211,102,0.12)',
          border: '1px solid rgba(37,211,102,0.15)',
          cursor: 'pointer',
          WebkitTapHighlightColor: 'transparent',
        }}
      >
        {/* Pulsing green glow border — CSS animation */}
        <div style={{
          position: 'absolute',
          inset: -2,
          borderRadius: '20px',
          border: '2px solid rgba(37,211,102,0.3)',
          animation: 'notifPulse 2s ease-in-out infinite',
          pointerEvents: 'none',
        }} />

        {/* Notification header row */}
        <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 12 }}>
          <div style={{
            width: 20,
            height: 20,
            borderRadius: 4,
            background: '#25D366',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            flexShrink: 0,
          }}>
            <svg width="12" height="12" viewBox="0 0 24 24" fill="white">
              <path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347m-5.421 7.403h-.004a9.87 9.87 0 01-5.031-1.378l-.361-.214-3.741.982.998-3.648-.235-.374a9.86 9.86 0 01-1.51-5.26c.001-5.45 4.436-9.884 9.888-9.884 2.64 0 5.122 1.03 6.988 2.898a9.825 9.825 0 012.893 6.994c-.003 5.45-4.437 9.884-9.885 9.884m8.413-18.297A11.815 11.815 0 0012.05 0C5.495 0 .16 5.335.157 11.892c0 2.096.547 4.142 1.588 5.945L.057 24l6.305-1.654a11.882 11.882 0 005.683 1.448h.005c6.554 0 11.89-5.335 11.893-11.893a11.821 11.821 0 00-3.48-8.413z" />
            </svg>
          </div>
          <span style={{ color: 'rgba(255,255,255,0.65)', fontSize: '0.68rem', fontWeight: 600, textTransform: 'uppercase', letterSpacing: '0.06em' }}>
            WhatsApp
          </span>
          <span style={{ color: 'rgba(255,255,255,0.4)', fontSize: '0.62rem', marginLeft: 'auto', fontWeight: 400 }}>
            ahora
          </span>
        </div>

        {/* Message content row */}
        <div style={{ display: 'flex', gap: 10, alignItems: 'center' }}>
          <div style={{
            width: 44,
            height: 44,
            borderRadius: '50%',
            overflow: 'hidden',
            flexShrink: 0,
            border: '1.5px solid rgba(255,255,255,0.1)',
          }}>
            <img
              src="/images/notification/zyra-profile.png"
              alt="Zyra"
              style={{
                width: '100%',
                height: '100%',
                objectFit: 'cover',
              }}
            />
          </div>

          <div style={{ flex: 1, minWidth: 0 }}>
            <div style={{ color: '#fff', fontSize: '0.88rem', fontWeight: 600, marginBottom: 3, lineHeight: 1.2 }}>
              Zyra
            </div>
            <div style={{ display: 'flex', alignItems: 'center', gap: 5 }}>
              <svg width="13" height="13" viewBox="0 0 24 24" fill="rgba(255,255,255,0.45)" style={{ flexShrink: 0 }}>
                <path d="M12 14c1.66 0 3-1.34 3-3V5c0-1.66-1.34-3-3-3S9 3.34 9 5v6c0 1.66 1.34 3 3 3zm-1-9c0-.55.45-1 1-1s1 .45 1 1v6c0 .55-.45 1-1 1s-1-.45-1-1V5z" />
                <path d="M17 11c0 2.76-2.24 5-5 5s-5-2.24-5-5H5c0 3.53 2.61 6.43 6 6.92V21h2v-3.08c3.39-.49 6-3.39 6-6.92h-2z" />
              </svg>
              <span style={{ color: 'rgba(255,255,255,0.55)', fontSize: '0.76rem', lineHeight: 1.3 }}>
                Mensaje de audio
              </span>
            </div>
          </div>

          <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="rgba(255,255,255,0.3)" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" style={{ flexShrink: 0 }}>
            <polyline points="9 18 15 12 9 6" />
          </svg>
        </div>
      </motion.div>

      {/* ── MÉTODO MAGNÉTICO — bottom center ── */}
      <div
        style={{
          position: 'absolute',
          bottom: 'clamp(1rem, 3vw, 1.5rem)',
          left: 0,
          right: 0,
          textAlign: 'center',
          zIndex: 10,
        }}
      >
        <span
          style={{
            fontFamily: "'Cinzel', serif",
            fontSize: 'clamp(0.55rem, 1.5vw, 0.65rem)',
            fontWeight: 500,
            color: 'rgba(255,255,255,0.4)',
            letterSpacing: '0.2em',
            textTransform: 'uppercase',
          }}
        >
          MÉTODO MAGNÉTICO
        </span>
      </div>

      {/* ── CSS animations ── */}
      <style>{`
        @keyframes notifPulse {
          0%, 100% { opacity: 0.3; transform: scale(1); }
          50% { opacity: 0.8; transform: scale(1.005); }
        }
        @keyframes notifBounce {
          0%, 100% { transform: translateY(0); }
          50% { transform: translateY(-5px); }
        }
      `}</style>
    </motion.div>
  )
}
