'use client'

import { useEffect, useRef, useCallback, useState } from 'react'
import { motion, AnimatePresence } from 'framer-motion'

interface CallHookProps {
  onAnswer: () => void
}

export default function CallHook({ onAnswer }: CallHookProps) {
  const vibrationRef = useRef<number | null>(null)
  const audioRef = useRef<HTMLAudioElement | null>(null)
  const answeredRef = useRef(false)
  const [dragY, setDragY] = useState(0)
  const [isAnswered, setIsAnswered] = useState(false)
  const trackRef = useRef<HTMLDivElement>(null)

  // Start real phone vibration + vibration sound loop immediately
  useEffect(() => {
    const startVibration = () => {
      if (!navigator.vibrate) return
      const pattern = [400, 200, 600, 300, 400, 200, 600, 300]
      const vibrateLoop = () => {
        if (answeredRef.current) return
        navigator.vibrate(pattern)
        vibrationRef.current = window.setTimeout(vibrateLoop, 2800)
      }
      vibrateLoop()
    }
    startVibration()

    const audio = new Audio('/audio/vibracion-celular.aac')
    audio.loop = true
    audio.volume = 1.0
    audioRef.current = audio

    audio.play().catch(() => {
      const resumeOnInteraction = () => {
        if (!answeredRef.current) audio.play().catch(() => {})
        document.removeEventListener('touchstart', resumeOnInteraction)
        document.removeEventListener('click', resumeOnInteraction)
      }
      document.addEventListener('touchstart', resumeOnInteraction, { once: true })
      document.addEventListener('click', resumeOnInteraction, { once: true })
    })

    return () => {
      if (navigator.vibrate) navigator.vibrate(0)
      if (vibrationRef.current) clearTimeout(vibrationRef.current)
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
    setIsAnswered(true)
    if (navigator.vibrate) navigator.vibrate(0)
    if (vibrationRef.current) clearTimeout(vibrationRef.current)
    if (audioRef.current) {
      audioRef.current.pause()
      audioRef.current.currentTime = 0
    }
    setTimeout(() => onAnswer(), 400)
  }, [onAnswer])

  // Swipe-up distance threshold to trigger answer
  const SWIPE_THRESHOLD = -120

  const handleDragEnd = () => {
    if (dragY <= SWIPE_THRESHOLD) {
      handleAnswer()
    } else {
      setDragY(0) // snap back
    }
  }

  const handleTouchMove = (e: React.TouchEvent) => {
    if (answeredRef.current) return
    const touch = e.touches[0]
    const track = trackRef.current
    if (!track) return
    const rect = track.getBoundingClientRect()
    const startY = rect.bottom - 32 // button starts at bottom
    const diff = touch.clientY - startY
    // Only allow upward movement, clamp
    const clamped = Math.max(-200, Math.min(0, diff))
    setDragY(clamped)
  }

  const handleTouchEnd = () => {
    handleDragEnd()
  }

  // Progress % for visual feedback (0 = bottom, 1 = answered)
  const swipeProgress = Math.min(Math.abs(dragY) / Math.abs(SWIPE_THRESHOLD), 1)

  return (
    <motion.div
      className="fixed inset-0 z-50 flex flex-col items-center select-none overflow-hidden"
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      transition={{ duration: 0.5 }}
    >
      {/* Background image */}
      <div
        className="absolute inset-0"
        style={{
          backgroundImage: 'url(/images/call-bg.png)',
          backgroundSize: 'cover',
          backgroundPosition: 'center top',
          filter: 'brightness(0.35) saturate(0.6)',
        }}
      />

      {/* Dark overlay */}
      <div className="absolute inset-0 bg-black/40" />

      {/* Top gradient */}
      <div
        className="absolute top-0 left-0 right-0 h-32"
        style={{ background: 'linear-gradient(to bottom, rgba(0,0,0,0.6), transparent)' }}
      />

      {/* === HEADER === */}
      <div className="relative z-10 mt-20 flex flex-col items-center">
        <motion.div
          initial={{ opacity: 0, y: -10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.3, duration: 0.6 }}
        >
          <span style={{
            fontFamily: "'Cinzel', serif",
            fontSize: 'clamp(0.7rem, 2.2vw, 0.85rem)',
            fontWeight: 500,
            color: '#4CAF50',
            letterSpacing: '0.2em',
            textTransform: 'uppercase',
            textShadow: '0 0 20px rgba(76, 175, 80, 0.4)',
          }}>
            LLAMADA ENTRANTE
          </span>
        </motion.div>

        {/* Profile photo */}
        <motion.div
          className="mt-6"
          initial={{ scale: 0.5, opacity: 0 }}
          animate={{ scale: 1, opacity: 1 }}
          transition={{ delay: 0.5, duration: 0.6, type: 'spring' }}
        >
          <div style={{
            width: '100px', height: '100px', borderRadius: '50%',
            border: '3px solid #4CAF50', overflow: 'hidden',
            boxShadow: '0 0 30px rgba(76, 175, 80, 0.3), 0 0 60px rgba(76, 175, 80, 0.15)',
          }}>
            <img src="/images/dante-profile.jpg" alt="Dante" loading="eager" fetchPriority="high" decoding="async"
              style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
          </div>
        </motion.div>

        {/* Name */}
        <motion.div
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.8, duration: 0.6 }}
        >
          <h1 style={{
            fontFamily: "'Cinzel', serif",
            fontSize: 'clamp(1.6rem, 6vw, 2.2rem)',
            fontWeight: 700, color: '#FFFFFF',
            letterSpacing: '0.15em',
            textShadow: '0 2px 20px rgba(0,0,0,0.8)',
            marginTop: '1rem',
          }}>
            DANTE
          </h1>
        </motion.div>

        {/* Ringing dots */}
        <motion.div className="flex gap-1.5 mt-3"
          initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: 1 }}>
          {[0, 1, 2].map((i) => (
            <motion.div key={i}
              style={{ width: 6, height: 6, borderRadius: '50%', backgroundColor: '#4CAF50' }}
              animate={{ opacity: [0.3, 1, 0.3] }}
              transition={{ duration: 1.5, repeat: Infinity, delay: i * 0.3 }}
            />
          ))}
        </motion.div>
      </div>

      {/* === SWIPE-UP ANSWER === */}
      <div className="relative z-10 mt-auto mb-10 flex flex-col items-center w-full px-8">
        <AnimatePresence>
          {!isAnswered && (
            <motion.div
              className="flex flex-col items-center w-full"
              initial={{ opacity: 1 }}
              exit={{ opacity: 0, scale: 1.2 }}
              transition={{ duration: 0.3 }}
            >
              {/* DESLIZA hint */}
              <motion.div
                animate={{ y: [0, -6, 0], opacity: [0.5, 1, 0.5] }}
                transition={{ duration: 2, repeat: Infinity }}
                className="flex flex-col items-center mb-4"
              >
                <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="#4CAF50" strokeWidth="2" strokeLinecap="round">
                  <polyline points="18 15 12 9 6 15" />
                </svg>
                <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="rgba(76,175,80,0.5)" strokeWidth="2" strokeLinecap="round" style={{ marginTop: '-2px' }}>
                  <polyline points="18 15 12 9 6 15" />
                </svg>
                <span style={{
                  fontFamily: "'Cinzel', serif",
                  fontSize: 'clamp(0.55rem, 1.6vw, 0.68rem)',
                  fontWeight: 400, color: '#4CAF50',
                  letterSpacing: '0.18em', textTransform: 'uppercase',
                  marginTop: '4px',
                }}>
                  DESLIZA PARA CONTESTAR
                </span>
              </motion.div>

              {/* Swipe track */}
              <div
                ref={trackRef}
                className="relative w-20 flex flex-col items-center"
                style={{
                  height: '180px',
                  borderRadius: '40px',
                  background: `linear-gradient(to top, rgba(76, 175, 80, ${0.08 + swipeProgress * 0.15}), rgba(76, 175, 80, ${0.02 + swipeProgress * 0.05}))`,
                  border: `1.5px solid rgba(76, 175, 80, ${0.15 + swipeProgress * 0.3})`,
                  boxShadow: swipeProgress > 0.5
                    ? `0 0 ${20 + swipeProgress * 30}px rgba(76, 175, 80, ${swipeProgress * 0.3})`
                    : 'none',
                  touchAction: 'none',
                }}
              >
                {/* Track guide lines */}
                <div className="absolute left-1/2 top-4 bottom-4 -translate-x-1/2" style={{
                  width: '1px',
                  background: `linear-gradient(to top, rgba(76, 175, 80, 0.3), rgba(76, 175, 80, 0.05))`,
                }} />

                {/* Draggable button */}
                <motion.div
                  className="absolute left-1/2 -translate-x-1/2 cursor-grab active:cursor-grabbing"
                  style={{
                    bottom: `${8 - dragY}px`,
                    transition: dragY === 0 ? 'bottom 0.3s cubic-bezier(0.34, 1.56, 0.64, 1)' : 'none',
                    touchAction: 'none',
                  }}
                  onTouchMove={handleTouchMove}
                  onTouchEnd={handleTouchEnd}
                  onMouseUp={handleTouchEnd}
                >
                  {/* Pulse rings */}
                  <motion.div
                    style={{
                      position: 'absolute', width: '64px', height: '64px',
                      borderRadius: '50%', border: '2px solid rgba(76, 175, 80, 0.3)',
                      top: '50%', left: '50%', transform: 'translate(-50%, -50%)',
                    }}
                    animate={{ scale: [1, 1.5, 1], opacity: [0.5, 0, 0.5] }}
                    transition={{ duration: 2, repeat: Infinity }}
                  />

                  {/* Green circle with phone — click fallback for desktop */}
                  <div onClick={handleAnswer}
                    style={{
                    width: '56px', height: '56px', borderRadius: '50%',
                    background: `linear-gradient(135deg, ${swipeProgress > 0.8 ? '#1B5E20' : '#2E7D32'}, ${swipeProgress > 0.8 ? '#2E7D32' : '#4CAF50'})`,
                    display: 'flex', alignItems: 'center', justifyContent: 'center',
                    boxShadow: `0 0 ${20 + swipeProgress * 20}px rgba(76, 175, 80, ${0.4 + swipeProgress * 0.4}), 0 4px 15px rgba(0,0,0,0.3)`,
                    transform: `scale(${1 + swipeProgress * 0.1})`,
                    transition: 'transform 0.1s, box-shadow 0.1s',
                    cursor: 'pointer',
                  }}>
                    <svg width="26" height="26" viewBox="0 0 24 24" fill="white" stroke="none">
                      <path d="M20.01 15.38c-1.23 0-2.42-.2-3.53-.56a.977.977 0 0 0-1.01.24l-1.57 1.97c-2.83-1.35-5.48-3.9-6.89-6.83l1.95-1.66c.27-.28.35-.67.24-1.02-.37-1.11-.56-2.3-.56-3.53 0-.54-.45-.99-.99-.99H4.19C3.65 3 3 3.24 3 3.99 3 13.28 10.73 21 20.01 21c.71 0 .99-.63.99-1.18v-3.45c0-.54-.45-.99-.99-.99z"/>
                    </svg>
                  </div>
                </motion.div>
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </div>
    </motion.div>
  )
}
