'use client'

import { useEffect, useState } from 'react'
import { motion } from 'framer-motion'

interface LockScreenNotificationProps {
  onOpen: () => void
}

export default function LockScreenNotification({ onOpen }: LockScreenNotificationProps) {
  const [currentTime, setCurrentTime] = useState(new Date())

  // Real-time clock update every second
  useEffect(() => {
    const interval = setInterval(() => {
      setCurrentTime(new Date())
    }, 1000)
    return () => clearInterval(interval)
  }, [])

  // Vibration and sound IMMEDIATELY on mount
  useEffect(() => {
    // Vibrate pattern — WhatsApp style
    try {
      if (navigator.vibrate) {
        navigator.vibrate([100, 50, 100])
      }
    } catch {
      // Vibration not supported
    }

    // Play WhatsApp notification sound
    const audio = new Audio('/audio/whatsapp-notification.aac')
    audio.volume = 1.0
    audio.play().catch(() => {
      // Autoplay blocked — ignore
    })
  }, [])

  // Format clock as HH:MM
  const clockStr = `${currentTime.getHours().toString().padStart(2, '0')}:${currentTime.getMinutes().toString().padStart(2, '0')}`

  // Format date in Spanish
  const spanishDays = ['domingo', 'lunes', 'martes', 'miércoles', 'jueves', 'viernes', 'sábado']
  const spanishMonths = ['enero', 'febrero', 'marzo', 'abril', 'mayo', 'junio', 'julio', 'agosto', 'septiembre', 'octubre', 'noviembre', 'diciembre']
  const dateStr = `${spanishDays[currentTime.getDay()]} ${currentTime.getDate()} de ${spanishMonths[currentTime.getMonth()]}`

  return (
    <div
      className="fixed inset-0 z-50 flex flex-col items-center select-none overflow-hidden"
      style={{ fontFamily: "'Cinzel', serif" }}
    >
      {/* Full-screen wallpaper background with dark overlay */}
      <div className="absolute inset-0">
        <img
          src="/images/wallpaper-lock.jpg"
          alt=""
          style={{
            width: '100%',
            height: '100%',
            objectFit: 'cover',
          }}
        />
        {/* Dark overlay for readability */}
        <div
          className="absolute inset-0"
          style={{ background: 'rgba(0, 0, 0, 0.5)' }}
        />
      </div>

      {/* Content layer */}
      <div className="relative z-10 flex flex-col items-center w-full h-full">
        {/* Clock */}
        <motion.div
          className="mt-[15vh] flex flex-col items-center"
          initial={{ opacity: 0, y: -10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.1, duration: 0.4 }}
        >
          <span
            style={{
              fontFamily: "'Cinzel', serif",
              fontSize: 'clamp(3rem, 12vw, 5rem)',
              fontWeight: 300,
              color: '#FFFFFF',
              lineHeight: 1,
              fontVariantNumeric: 'tabular-nums',
              letterSpacing: '0.02em',
            }}
          >
            {clockStr}
          </span>

          {/* Date */}
          <span
            style={{
              fontFamily: "'Cinzel', serif",
              fontSize: 'clamp(0.75rem, 2.5vw, 0.95rem)',
              fontWeight: 400,
              color: 'rgba(255, 255, 255, 0.7)',
              marginTop: 8,
              letterSpacing: '0.03em',
              textTransform: 'capitalize',
            }}
          >
            {dateStr}
          </span>
        </motion.div>

        {/* WhatsApp Notification card — ENTRA DE UNA */}
        <motion.div
          className="mt-8 w-[90%] max-w-sm"
          initial={{ opacity: 0, y: -30, scale: 0.95 }}
          animate={{ opacity: 1, y: 0, scale: 1 }}
          transition={{
            delay: 0.3,
            duration: 0.4,
            type: 'spring',
            stiffness: 250,
            damping: 22,
          }}
          whileTap={{ scale: 0.97 }}
        >
          <div
            onClick={onOpen}
            onTouchEnd={(e) => { e.preventDefault(); onOpen() }}
            className="cursor-pointer relative overflow-hidden"
            style={{
              background: 'rgba(30, 30, 30, 0.85)',
              backdropFilter: 'blur(20px)',
              WebkitBackdropFilter: 'blur(20px)',
              borderRadius: 16,
              padding: '12px 14px',
              border: '1px solid rgba(255, 255, 255, 0.08)',
            }}
          >
            {/* Shimmer effect */}
            <div
              style={{
                position: 'absolute',
                top: 0,
                left: 0,
                width: '50%',
                height: '100%',
                background: 'linear-gradient(90deg, transparent, rgba(255,255,255,0.04), rgba(255,255,255,0.08), rgba(255,255,255,0.04), transparent)',
                animation: 'lockShimmer 4s ease-in-out infinite',
                pointerEvents: 'none',
              }}
            />

            <div className="flex items-start gap-3" style={{ position: 'relative', zIndex: 1 }}>
              {/* WhatsApp icon — green circle with phone */}
              <div
                style={{
                  width: 36,
                  height: 36,
                  borderRadius: 8,
                  background: '#25D366',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  flexShrink: 0,
                }}
              >
                <svg width="18" height="18" viewBox="0 0 24 24" fill="white">
                  <path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347m-5.421 7.403h-.004a9.87 9.87 0 01-5.031-1.378l-.361-.214-3.741.982.998-3.648-.235-.374a9.86 9.86 0 01-1.51-5.26c.001-5.45 4.436-9.884 9.888-9.884 2.64 0 5.122 1.03 6.988 2.898a9.825 9.825 0 012.893 6.994c-.003 5.45-4.437 9.884-9.885 9.884m8.413-18.297A11.815 11.815 0 0012.05 0C5.495 0 .16 5.335.157 11.892c0 2.096.547 4.142 1.588 5.945L.057 24l6.305-1.654a11.882 11.882 0 005.683 1.448h.005c6.554 0 11.89-5.335 11.893-11.893a11.821 11.821 0 00-3.48-8.413z" />
                </svg>
              </div>

              {/* Notification content */}
              <div className="flex-1 min-w-0">
                <div className="flex items-center justify-between">
                  <span
                    style={{
                      fontFamily: "'Cinzel', serif",
                      fontSize: '13px',
                      fontWeight: 700,
                      color: '#FFFFFF',
                      letterSpacing: '0.02em',
                    }}
                  >
                    WhatsApp
                  </span>
                  <span
                    style={{
                      fontFamily: "'Cinzel', serif",
                      fontSize: '10px',
                      color: 'rgba(255, 255, 255, 0.4)',
                      letterSpacing: '0.02em',
                    }}
                  >
                    ahora
                  </span>
                </div>
                <div className="flex items-center gap-2 mt-1">
                  {/* ZYRA profile pic — SIN filtro grayscale */}
                  <div
                    style={{
                      width: 22,
                      height: 22,
                      borderRadius: '50%',
                      overflow: 'hidden',
                      flexShrink: 0,
                    }}
                  >
                    <img
                      src="/images/zyra-profile.jpg"
                      alt="Zyra"
                      style={{
                        width: '100%',
                        height: '100%',
                        objectFit: 'cover',
                      }}
                    />
                  </div>
                  <span
                    style={{
                      fontFamily: "'Cinzel', serif",
                      fontSize: '12px',
                      fontWeight: 600,
                      color: '#FFFFFF',
                      letterSpacing: '0.02em',
                    }}
                  >
                    ZYRA
                  </span>
                  <span
                    style={{
                      fontFamily: "'Cinzel', serif",
                      fontSize: '12px',
                      fontWeight: 400,
                      color: 'rgba(255, 255, 255, 0.5)',
                      letterSpacing: '0.02em',
                    }}
                  >
                    Tengo algo para ti...
                  </span>
                </div>
              </div>
            </div>
          </div>
        </motion.div>
      </div>

      {/* Keyframe animations */}
      <style>{`
        @keyframes lockShimmer {
          0% { transform: translateX(-100%) skewX(-20deg); }
          100% { transform: translateX(300%) skewX(-20deg); }
        }
      `}</style>
    </div>
  )
}
