'use client'

import { useState, useCallback, useRef, useEffect } from 'react'
import { motion, AnimatePresence } from 'framer-motion'

interface FakeQuizProps {
  onComplete: () => void
}

// 3 preguntas ULTRA FOMO para nicho seducción
const QUESTIONS = [
  {
    question: '¿Cuánto tiempo llevas usando los mismos mensajes que ella ya detecta?',
    options: [
      { letter: 'A', text: 'Semanas — sé que ya no funcionan' },
      { letter: 'B', text: 'Meses — pero no sé qué más hacer' },
      { letter: 'C', text: 'Apenas empecé, pero siento que se enfriaron' },
    ],
  },
  {
    question: '¿Qué pasa cuando ella lee tu mensaje y no responde?',
    options: [
      { letter: 'A', text: 'Te quedas esperando sin saber qué hacer' },
      { letter: 'B', text: 'Le escribes de nuevo pensando que no vio' },
      { letter: 'C', text: 'Borraste y volviste a escribir algo peor' },
    ],
  },
  {
    question: '¿Estás listo para ver el sistema que ella no puede ignorar?',
    options: [
      { letter: 'A', text: 'Sí, quiero dejar de ser invisible' },
      { letter: 'B', text: 'No estoy seguro, pero ya no tengo otra opción' },
      { letter: 'C', text: 'Dime qué tengo que hacer' },
    ],
  },
]

export default function FakeQuiz({ onComplete }: FakeQuizProps) {
  const [showContent, setShowContent] = useState(false)
  const [answered, setAnswered] = useState(false)
  const [showVideo, setShowVideo] = useState(false)
  const [videoEnded, setVideoEnded] = useState(false)
  const videoRef = useRef<HTMLVideoElement>(null)
  const completedRef = useRef(false)

  useEffect(() => {
    const timer = setTimeout(() => setShowContent(true), 400)
    return () => clearTimeout(timer)
  }, [])

  const handleAnswer = useCallback(() => {
    if (answered) return
    setAnswered(true)
    // After brief delay, show video behind translucent overlay
    setTimeout(() => {
      setShowVideo(true)
    }, 300)
  }, [answered])

  const handleVideoEnded = useCallback(() => {
    setVideoEnded(true)
  }, [])

  const handleContinue = useCallback(() => {
    if (completedRef.current) return
    completedRef.current = true
    onComplete()
  }, [onComplete])

  // Auto-play video when shown
  useEffect(() => {
    if (!showVideo) return
    const video = videoRef.current
    if (!video) return

    video.muted = false
    const playVideo = async () => {
      try {
        await video.play()
      } catch {
        video.muted = true
        await video.play().catch(() => {})
      }
    }
    playVideo()

    const handleEnded = () => handleVideoEnded()
    video.addEventListener('ended', handleEnded)

    const keepAlive = setInterval(() => {
      if (video.paused && !video.ended) {
        video.play().catch(() => {})
      }
    }, 1000)

    return () => {
      video.removeEventListener('ended', handleEnded)
      clearInterval(keepAlive)
      video.pause()
    }
  }, [showVideo, handleVideoEnded])

  return (
    <motion.div
      className="fixed inset-0 z-50 flex flex-col items-center select-none overflow-hidden"
      style={{ background: '#000000', fontFamily: "'Cinzel', serif" }}
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      transition={{ duration: 0.5 }}
    >
      {/* === VIDEO LAYER (behind quiz) === */}
      <AnimatePresence>
        {showVideo && (
          <motion.div
            className="absolute inset-0 z-0"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ duration: 0.5 }}
          >
            <video
              ref={videoRef}
              src="/videos/payaso-vidrio.mp4"
              playsInline
              preload="auto"
              className="w-full h-full object-cover"
            />
          </motion.div>
        )}
      </AnimatePresence>

      {/* === 50% TRANSLUCENT OVERLAY after answer === */}
      <AnimatePresence>
        {showVideo && (
          <motion.div
            className="absolute inset-0 z-10"
            style={{ background: 'rgba(0, 0, 0, 0.5)' }}
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ duration: 0.5 }}
          />
        )}
      </AnimatePresence>

      {/* === QUIZ CONTENT === */}
      <AnimatePresence>
        {!videoEnded && (
          <motion.div
            className="relative z-20 flex-1 flex flex-col items-center justify-center px-5 w-full max-w-lg mx-auto"
            initial={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.5 }}
          >
            {/* Shield icon — CopyFilms style */}
            <motion.div
              initial={{ opacity: 0, scale: 0.8 }}
              animate={showContent ? { opacity: 1, scale: 1 } : {}}
              transition={{ duration: 0.6, delay: 0.2 }}
              className="mb-4"
            >
              <div style={{
                width: '52px', height: '52px',
                background: 'linear-gradient(135deg, #B71C1C, #D32F2F)',
                borderRadius: 10,
                display: 'flex', alignItems: 'center', justifyContent: 'center',
                boxShadow: '0 0 20px rgba(211, 47, 47, 0.4)',
              }}>
                <svg width="26" height="26" viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                  <path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z" />
                  <polyline points="9 12 11 14 15 10" />
                </svg>
              </div>
            </motion.div>

            {/* "VERIFICACIÓN DE ACCESO" — CopyFilms style with red lines */}
            <motion.div
              className="flex items-center gap-3 mb-6"
              initial={{ opacity: 0 }}
              animate={showContent ? { opacity: 1 } : {}}
              transition={{ duration: 0.6, delay: 0.4 }}
            >
              <div style={{ width: 30, height: 1, background: 'linear-gradient(90deg, transparent, #D32F2F)' }} />
              <span style={{
                fontFamily: "'Cinzel', serif",
                fontSize: 'clamp(0.6rem, 2vw, 0.75rem)',
                fontWeight: 600,
                color: '#D32F2F',
                letterSpacing: '0.2em',
                textTransform: 'uppercase',
              }}>
                VERIFICACIÓN DE ACCESO
              </span>
              <div style={{ width: 30, height: 1, background: 'linear-gradient(90deg, #D32F2F, transparent)' }} />
            </motion.div>

            {/* Question — large white bold */}
            <motion.h1
              initial={{ opacity: 0, y: 20 }}
              animate={showContent ? { opacity: 1, y: 0 } : {}}
              transition={{ duration: 0.8, delay: 0.6, ease: 'easeOut' }}
              className="text-center mb-8 px-2"
              style={{
                fontSize: 'clamp(1.1rem, 4.5vw, 1.5rem)',
                fontWeight: 700,
                color: '#FFFFFF',
                lineHeight: 1.4,
                letterSpacing: '0.01em',
                textShadow: '0 2px 20px rgba(0,0,0,0.6)',
              }}
            >
              {QUESTIONS[0].question}
            </motion.h1>

            {/* Answer buttons — CopyFilms style: dark bg, red letter square */}
            <div className="flex flex-col gap-3 w-full max-w-sm">
              {QUESTIONS[0].options.map((option, index) => (
                <motion.button
                  key={option.letter}
                  onClick={handleAnswer}
                  onTouchEnd={(e) => { e.preventDefault(); handleAnswer() }}
                  className="relative cursor-pointer overflow-hidden w-full text-left"
                  style={{
                    background: 'rgba(34, 34, 34, 0.95)',
                    border: '1px solid rgba(255, 255, 255, 0.1)',
                    borderRadius: 6,
                    padding: '14px 16px',
                    display: 'flex',
                    alignItems: 'center',
                    gap: 12,
                  }}
                  initial={{ opacity: 0, x: -30 }}
                  animate={showContent ? { opacity: 1, x: 0 } : {}}
                  transition={{ duration: 0.5, delay: 0.9 + index * 0.15 }}
                  whileTap={{ scale: 0.97, borderColor: 'rgba(211, 47, 47, 0.5)' }}
                >
                  {/* Red letter square */}
                  <div style={{
                    width: 30, height: 30,
                    background: 'linear-gradient(135deg, #B71C1C, #D32F2F)',
                    borderRadius: 4,
                    display: 'flex', alignItems: 'center', justifyContent: 'center',
                    flexShrink: 0,
                    fontWeight: 700,
                    fontSize: '0.8rem',
                    color: '#FFFFFF',
                    letterSpacing: '0.05em',
                  }}>
                    {option.letter}
                  </div>

                  {/* Option text */}
                  <span style={{
                    fontFamily: "'Cinzel', serif",
                    fontSize: 'clamp(0.75rem, 2.5vw, 0.88rem)',
                    fontWeight: 400,
                    color: '#FFFFFF',
                    letterSpacing: '0.02em',
                    lineHeight: 1.3,
                  }}>
                    {option.text}
                  </span>
                </motion.button>
              ))}
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* === CONTINUAR BUTTON after video ends === */}
      <AnimatePresence>
        {videoEnded && (
          <motion.div
            className="absolute inset-0 z-30 flex flex-col items-center justify-center"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ duration: 0.5 }}
          >
            {/* Semi-black translucent background */}
            <div className="absolute inset-0" style={{ background: 'rgba(0, 0, 0, 0.7)' }} />

            {/* CONTINUAR button */}
            <motion.button
              onClick={handleContinue}
              onTouchEnd={(e) => { e.preventDefault(); handleContinue() }}
              className="relative z-10 cursor-pointer border-none overflow-hidden"
              style={{
                background: 'linear-gradient(135deg, #B71C1C, #D32F2F)',
                borderRadius: 8,
                padding: '18px 48px',
                fontFamily: "'Cinzel', serif",
                fontSize: 'clamp(0.9rem, 3vw, 1.1rem)',
                fontWeight: 700,
                color: '#FFFFFF',
                letterSpacing: '0.18em',
                textTransform: 'uppercase',
                boxShadow: '0 0 30px rgba(211, 47, 47, 0.5), 0 0 60px rgba(211, 47, 47, 0.2)',
              }}
              initial={{ scale: 0.8, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              transition={{ delay: 0.3, duration: 0.5, type: 'spring' }}
              whileTap={{ scale: 0.95 }}
            >
              <span style={{ position: 'relative', zIndex: 1 }}>CONTINUAR</span>
            </motion.button>
          </motion.div>
        )}
      </AnimatePresence>
    </motion.div>
  )
}
