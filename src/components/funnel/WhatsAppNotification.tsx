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
  const vibrationRef = useRef<ReturnType<typeof setTimeout> | null>(null)
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

      const days = ['domingo', 'lunes', 'martes', 'miércoles', 'jueves', 'viernes', 'sábado']
      const months = ['enero', 'febrero', 'marzo', 'abril', 'mayo', 'junio', 'julio', 'agosto', 'septiembre', 'octubre', 'noviembre', 'diciembre']
      setCurrentDate(`${days[now.getDay()]}, ${now.getDate()} de ${months[now.getMonth()]}`)
    }

    updateTime()
    const interval = setInterval(updateTime, 1000)
    return () => clearInterval(interval)
  }, [])

  // Play notification sound + vibrate on mount
  useEffect(() => {
    if (notificationPlayedRef.current) return
    notificationPlayedRef.current = true

    // Sound
    const audio = new Audio('/audio/notificacion.aac')
    audio.volume = 1.0
    audio.play().catch(() => {})
    audioRef.current = audio

    // Vibration — same pattern as call
    if (navigator.vibrate) {
      const pattern = [400, 200, 600, 300, 400, 200, 600, 300]
      navigator.vibrate(pattern)

      // One burst only (not looping like the call)
    }

    // Auto-advance after 5 seconds
    const timer = setTimeout(() => {
      if (!completedRef.current) {
        completedRef.current = true
        if (navigator.vibrate) navigator.vibrate(0)
        onCompleteRef.current()
      }
    }, 5000)

    return () => {
      clearTimeout(timer)
      if (navigator.vibrate) navigator.vibrate(0)
      if (vibrationRef.current) clearTimeout(vibrationRef.current)
      if (audioRef.current) {
        audioRef.current.pause()
        audioRef.current.src = ''
      }
    }
  }, [])

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
      {/* ── Wallpaper background ── */}
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
          background: 'rgba(0,0,0,0.35)',
        }}
      />

      {/* ── Status bar (time, battery, signal) ── */}
      <div
        style={{
          position: 'absolute',
          top: 0,
          left: 0,
          right: 0,
          padding: '12px 20px 8px',
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center',
          color: '#fff',
          fontSize: '0.75rem',
          fontWeight: 600,
          zIndex: 10,
        }}
      >
        <span>{currentTime}</span>
        <div style={{ display: 'flex', gap: 4, alignItems: 'center' }}>
          {/* Signal bars */}
          <svg width="16" height="12" viewBox="0 0 16 12" fill="white">
            <rect x="0" y="8" width="3" height="4" rx="0.5" />
            <rect x="4" y="5" width="3" height="7" rx="0.5" />
            <rect x="8" y="2" width="3" height="10" rx="0.5" />
            <rect x="12" y="0" width="3" height="12" rx="0.5" />
          </svg>
          {/* Battery */}
          <svg width="22" height="12" viewBox="0 0 22 12" fill="none">
            <rect x="0.5" y="0.5" width="18" height="11" rx="2" stroke="white" strokeWidth="1" />
            <rect x="2" y="2" width="14" height="8" rx="1" fill="white" />
            <rect x="19" y="3" width="2" height="6" rx="0.5" fill="white" />
          </svg>
        </div>
      </div>

      {/* ── Lock icon + date ── */}
      <div
        style={{
          position: 'absolute',
          top: '12%',
          left: 0,
          right: 0,
          textAlign: 'center',
          zIndex: 10,
        }}
      >
        {/* Lock icon */}
        <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" style={{ margin: '0 auto 8px', display: 'block', opacity: 0.8 }}>
          <rect x="3" y="11" width="18" height="11" rx="2" ry="2" />
          <path d="M7 11V7a5 5 0 0 1 10 0v4" />
        </svg>
        <div style={{ color: '#fff', fontSize: 'clamp(2.5rem, 10vw, 3.5rem)', fontWeight: 200, lineHeight: 1, letterSpacing: '-0.02em' }}>
          {currentTime}
        </div>
        <div style={{ color: 'rgba(255,255,255,0.8)', fontSize: 'clamp(0.7rem, 2.2vw, 0.85rem)', fontWeight: 400, marginTop: 6, textTransform: 'capitalize' }}>
          {currentDate}
        </div>
      </div>

      {/* ── WhatsApp Notification Card ── */}
      <motion.div
        initial={{ y: -30, opacity: 0 }}
        animate={{ y: 0, opacity: 1 }}
        transition={{ delay: 0.3, duration: 0.4, ease: 'easeOut' }}
        style={{
          position: 'absolute',
          top: '30%',
          left: '5%',
          right: '5%',
          background: 'rgba(30, 30, 30, 0.95)',
          borderRadius: '16px',
          padding: '14px 16px',
          zIndex: 20,
          backdropFilter: 'blur(20px)',
          WebkitBackdropFilter: 'blur(20px)',
          boxShadow: '0 4px 30px rgba(0,0,0,0.4)',
        }}
      >
        {/* Notification header */}
        <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 10 }}>
          {/* WhatsApp icon */}
          <div style={{
            width: 22,
            height: 22,
            borderRadius: 5,
            background: '#25D366',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            flexShrink: 0,
          }}>
            <svg width="13" height="13" viewBox="0 0 24 24" fill="white">
              <path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347m-5.421 7.403h-.004a9.87 9.87 0 01-5.031-1.378l-.361-.214-3.741.982.998-3.648-.235-.374a9.86 9.86 0 01-1.51-5.26c.001-5.45 4.436-9.884 9.888-9.884 2.64 0 5.122 1.03 6.988 2.898a9.825 9.825 0 012.893 6.994c-.003 5.45-4.437 9.884-9.885 9.884m8.413-18.297A11.815 11.815 0 0012.05 0C5.495 0 .16 5.335.157 11.892c0 2.096.547 4.142 1.588 5.945L.057 24l6.305-1.654a11.882 11.882 0 005.683 1.448h.005c6.554 0 11.89-5.335 11.893-11.893a11.821 11.821 0 00-3.48-8.413z" />
            </svg>
          </div>
          <span style={{ color: 'rgba(255,255,255,0.7)', fontSize: '0.72rem', fontWeight: 600, textTransform: 'uppercase', letterSpacing: '0.05em' }}>
            WhatsApp
          </span>
          <span style={{ color: 'rgba(255,255,255,0.4)', fontSize: '0.65rem', marginLeft: 'auto' }}>
            ahora
          </span>
        </div>

        {/* Message content */}
        <div style={{ display: 'flex', gap: 10, alignItems: 'flex-start' }}>
          {/* Profile photo */}
          <div style={{
            width: 42,
            height: 42,
            borderRadius: '50%',
            overflow: 'hidden',
            flexShrink: 0,
            border: '1px solid rgba(255,255,255,0.1)',
          }}>
            <img
              src="/images/notification/zyra-profile.jpg"
              alt="Zyra"
              style={{
                width: '100%',
                height: '100%',
                objectFit: 'cover',
                filter: 'grayscale(100%)',
              }}
            />
          </div>

          {/* Text */}
          <div style={{ flex: 1, minWidth: 0 }}>
            <div style={{ color: '#fff', fontSize: '0.85rem', fontWeight: 600, marginBottom: 3 }}>
              Zyra
            </div>
            <div style={{ color: 'rgba(255,255,255,0.7)', fontSize: '0.78rem', lineHeight: 1.4 }}>
              Necesito verte. No debería escribirte esto pero... no puedo esperar más. 🖤
            </div>
          </div>
        </div>
      </motion.div>
    </motion.div>
  )
}
