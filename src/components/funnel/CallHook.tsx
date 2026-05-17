'use client'

import { useEffect, useRef, useCallback } from 'react'
import { motion } from 'framer-motion'

interface CallHookProps {
  onAnswer: () => void
}

export default function CallHook({ onAnswer }: CallHookProps) {
  const vibrationRef = useRef<number | null>(null)
  const audioRef = useRef<HTMLAudioElement | null>(null)
  const answeredRef = useRef(false)

  // Start real phone vibration + vibration sound loop immediately
  useEffect(() => {
    // === HAPTIC VIBRATION ===
    const startVibration = () => {
      if (!navigator.vibrate) return

      // Vibrate pattern: 400ms vibrate, 200ms pause, 600ms vibrate, 300ms pause (repeating)
      const pattern = [400, 200, 600, 300, 400, 200, 600, 300]

      // Keep vibrating in a loop
      const vibrateLoop = () => {
        if (answeredRef.current) return
        navigator.vibrate(pattern)
        vibrationRef.current = window.setTimeout(vibrateLoop, 2800)
      }

      vibrateLoop()
    }

    startVibration()

    // === VIBRATION SOUND LOOP ===
    const audio = new Audio('/audio/vibracion-celular.aac')
    audio.loop = true
    audio.volume = 1.0
    audioRef.current = audio

    audio.play().catch(() => {
      // If autoplay blocked, try on first user interaction
      const resumeOnInteraction = () => {
        if (!answeredRef.current) {
          audio.play().catch(() => {})
        }
        document.removeEventListener('touchstart', resumeOnInteraction)
        document.removeEventListener('click', resumeOnInteraction)
      }
      document.addEventListener('touchstart', resumeOnInteraction, { once: true })
      document.addEventListener('click', resumeOnInteraction, { once: true })
    })

    return () => {
      // Stop vibration on unmount
      if (navigator.vibrate) navigator.vibrate(0)
      if (vibrationRef.current) clearTimeout(vibrationRef.current)
      // Stop vibration sound
      if (audioRef.current) {
        audioRef.current.pause()
        audioRef.current.currentTime = 0
        audioRef.current = null
      }
    }
  }, [])

  const handleAnswer = useCallback(() => {
    if (answeredRef.current) return
    answeredRef.current = true
    // Stop vibration immediately
    if (navigator.vibrate) navigator.vibrate(0)
    if (vibrationRef.current) clearTimeout(vibrationRef.current)
    // Stop vibration sound
    if (audioRef.current) {
      audioRef.current.pause()
      audioRef.current.currentTime = 0
    }
    onAnswer()
  }, [onAnswer])

  return (
    <motion.div
      className="fixed inset-0 z-50 flex flex-col items-center select-none overflow-hidden"
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      transition={{ duration: 0.5 }}
    >
      {/* Background image — girl looking at city */}
      <div
        className="absolute inset-0"
        style={{
          backgroundImage: 'url(/images/call-bg.png)',
          backgroundSize: 'cover',
          backgroundPosition: 'center top',
          filter: 'brightness(0.35) saturate(0.6)',
        }}
      />

      {/* Dark overlay for readability */}
      <div className="absolute inset-0 bg-black/40" />

      {/* Top gradient */}
      <div
        className="absolute top-0 left-0 right-0 h-32"
        style={{
          background: 'linear-gradient(to bottom, rgba(0,0,0,0.6), transparent)',
        }}
      />

      {/* === HEADER: LLAMADA ENTRANTE === */}
      <div className="relative z-10 mt-20 flex flex-col items-center">
        {/* LLAMADA ENTRANTE label */}
        <motion.div
          initial={{ opacity: 0, y: -10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.3, duration: 0.6 }}
        >
          <span
            style={{
              fontFamily: "'Cinzel', serif",
              fontSize: 'clamp(0.7rem, 2.2vw, 0.85rem)',
              fontWeight: 500,
              color: '#4CAF50',
              letterSpacing: '0.2em',
              textTransform: 'uppercase',
              textShadow: '0 0 20px rgba(76, 175, 80, 0.4)',
            }}
          >
            LLAMADA ENTRANTE
          </span>
        </motion.div>

        {/* Profile photo — mask man */}
        <motion.div
          className="mt-6"
          initial={{ scale: 0.5, opacity: 0 }}
          animate={{ scale: 1, opacity: 1 }}
          transition={{ delay: 0.5, duration: 0.6, type: 'spring' }}
        >
          <div
            style={{
              width: '100px',
              height: '100px',
              borderRadius: '50%',
              border: '3px solid #4CAF50',
              overflow: 'hidden',
              boxShadow: '0 0 30px rgba(76, 175, 80, 0.3), 0 0 60px rgba(76, 175, 80, 0.15)',
            }}
          >
            <img
              src="/images/dante-profile.jpg"
              alt="Dante"
              style={{
                width: '100%',
                height: '100%',
                objectFit: 'cover',
              }}
            />
          </div>
        </motion.div>

        {/* Name DANTE */}
        <motion.div
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.8, duration: 0.6 }}
        >
          <h1
            style={{
              fontFamily: "'Cinzel', serif",
              fontSize: 'clamp(1.6rem, 6vw, 2.2rem)',
              fontWeight: 700,
              color: '#FFFFFF',
              letterSpacing: '0.15em',
              textShadow: '0 2px 20px rgba(0,0,0,0.8)',
              marginTop: '1rem',
            }}
          >
            DANTE
          </h1>
        </motion.div>

        {/* Ringing animation dots */}
        <motion.div
          className="flex gap-1.5 mt-3"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 1 }}
        >
          {[0, 1, 2].map((i) => (
            <motion.div
              key={i}
              style={{
                width: 6,
                height: 6,
                borderRadius: '50%',
                backgroundColor: '#4CAF50',
              }}
              animate={{ opacity: [0.3, 1, 0.3] }}
              transition={{
                duration: 1.5,
                repeat: Infinity,
                delay: i * 0.3,
              }}
            />
          ))}
        </motion.div>
      </div>

      {/* Bottom section — answer button + decline */}
      <div className="relative z-10 mt-auto mb-16 flex flex-col items-center gap-6 w-full px-8">

        {/* DESLIZA HACIA ARRIBA hint */}
        <motion.span
          initial={{ opacity: 0 }}
          animate={{ opacity: [0.4, 0.8, 0.4] }}
          transition={{ duration: 2, repeat: Infinity }}
          style={{
            fontFamily: "'Cinzel', serif",
            fontSize: 'clamp(0.6rem, 1.8vw, 0.72rem)',
            fontWeight: 400,
            color: '#4CAF50',
            letterSpacing: '0.15em',
            textTransform: 'uppercase',
          }}
        >
          DESLIZA HACIA ARRIBA
        </motion.span>

        {/* Answer button — green circle */}
        <motion.button
          onClick={handleAnswer}
          className="cursor-pointer border-none bg-transparent flex items-center justify-center"
          initial={{ scale: 0.8, opacity: 0 }}
          animate={{ scale: 1, opacity: 1 }}
          transition={{ delay: 0.6, duration: 0.4 }}
          whileTap={{ scale: 0.92 }}
        >
          <div className="relative flex items-center justify-center">
            {/* Pulse ring around answer button */}
            <motion.div
              style={{
                position: 'absolute',
                width: '80px',
                height: '80px',
                borderRadius: '50%',
                border: '2px solid rgba(76, 175, 80, 0.4)',
              }}
              animate={{ scale: [1, 1.5, 1], opacity: [0.6, 0, 0.6] }}
              transition={{ duration: 1.8, repeat: Infinity }}
            />
            <motion.div
              style={{
                position: 'absolute',
                width: '80px',
                height: '80px',
                borderRadius: '50%',
                border: '1.5px solid rgba(76, 175, 80, 0.25)',
              }}
              animate={{ scale: [1, 1.8, 1], opacity: [0.4, 0, 0.4] }}
              transition={{ duration: 1.8, repeat: Infinity, delay: 0.5 }}
            />

            {/* Green circle button */}
            <div
              style={{
                width: '64px',
                height: '64px',
                borderRadius: '50%',
                background: 'linear-gradient(135deg, #2E7D32, #4CAF50)',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                boxShadow: '0 0 30px rgba(76, 175, 80, 0.5), 0 4px 20px rgba(0,0,0,0.3)',
                position: 'relative',
                zIndex: 1,
              }}
            >
              {/* Phone icon */}
              <svg width="28" height="28" viewBox="0 0 24 24" fill="white" stroke="none">
                <path d="M20.01 15.38c-1.23 0-2.42-.2-3.53-.56a.977.977 0 0 0-1.01.24l-1.57 1.97c-2.83-1.35-5.48-3.9-6.89-6.83l1.95-1.66c.27-.28.35-.67.24-1.02-.37-1.11-.56-2.3-.56-3.53 0-.54-.45-.99-.99-.99H4.19C3.65 3 3 3.24 3 3.99 3 13.28 10.73 21 20.01 21c.71 0 .99-.63.99-1.18v-3.45c0-.54-.45-.99-.99-.99z"/>
              </svg>
            </div>
          </div>
        </motion.button>
      </div>
    </motion.div>
  )
}
