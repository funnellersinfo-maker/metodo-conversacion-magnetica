'use client'

import { useState, useRef, useCallback, useEffect } from 'react'
import { motion, AnimatePresence } from 'framer-motion'

interface FakeQuizProps {
  onComplete: () => void
}

const QUESTION = {
  question: 'Sé honesto... ¿En cuál de estos tres cementerios digitales está muriendo tu chat en este momento?',
  options: [
    { letter: 'A', text: '"El chat iba increíble, pero de la nada se enfrió, me dejó en visto y ahora no sé qué escribir sin parecer desesperado."' },
    { letter: 'B', text: '"Me responde, pero solo por cortesía. Si yo no invento un tema o hago una pregunta, el chat se muere ahí mismo."' },
    { letter: 'C', text: '"Ni siquiera abre mi mensaje. Sé que mi notificación lleva días sepultada abajo de otros 50 tipos que le escriben lo mismo."' },
  ],
}

export default function FakeQuiz({ onComplete }: FakeQuizProps) {
  const [showContent, setShowContent] = useState(false)
  const [answered, setAnswered] = useState(false)
  const [videoEnded, setVideoEnded] = useState(false)

  const videoRef = useRef<HTMLVideoElement>(null)
  const answeredRef = useRef(false)
  const completedRef = useRef(false)
  const onCompleteRef = useRef(onComplete)
  const videoReadyRef = useRef(false)

  useEffect(() => {
    onCompleteRef.current = onComplete
  }, [onComplete])

  useEffect(() => {
    const timer = setTimeout(() => setShowContent(true), 300)
    return () => clearTimeout(timer)
  }, [])

  // ============ PRE-LOAD VIDEO — ensure it's ready to play instantly ============
  useEffect(() => {
    const video = videoRef.current
    if (!video) return

    // Explicitly load the video
    video.load()

    const onCanPlay = () => {
      videoReadyRef.current = true
    }

    const onEnded = () => {
      setVideoEnded(true)
    }

    video.addEventListener('canplay', onCanPlay)
    video.addEventListener('canplaythrough', onCanPlay)
    video.addEventListener('ended', onEnded)

    // Keep-alive: if video was supposed to play but paused, restart it
    const keepAlive = setInterval(() => {
      if (video.paused && !video.ended && answeredRef.current && !completedRef.current) {
        video.play().catch(() => {
          // Try muted if unmuted fails
          video.muted = true
          video.play().catch(() => {})
        })
      }
    }, 500)

    return () => {
      video.removeEventListener('canplay', onCanPlay)
      video.removeEventListener('canplaythrough', onCanPlay)
      video.removeEventListener('ended', onEnded)
      clearInterval(keepAlive)
    }
  }, [])

  // ============ HANDLE ANSWER — INSTANT on click ============
  const handleAnswer = useCallback(() => {
    if (answeredRef.current) return
    answeredRef.current = true
    setAnswered(true)

    // Play video INMEDIATAMENTE — el usuario ya interactuó, el navegador permite audio
    const video = videoRef.current
    if (!video) return

    // Strategy: try unmuted first, fall back to muted
    const tryPlay = () => {
      video.muted = false
      video.currentTime = 0
      const playPromise = video.play()
      
      if (playPromise !== undefined) {
        playPromise.catch(() => {
          // Unmuted failed — try muted (mobile autoplay policy)
          video.muted = true
          video.play().catch(() => {})
        })
      }
    }

    // If video is ready, play immediately
    if (video.readyState >= 3) {
      tryPlay()
    } else {
      // Wait for video to be ready, then play
      const onReady = () => {
        tryPlay()
        video.removeEventListener('canplay', onReady)
        video.removeEventListener('canplaythrough', onReady)
      }
      video.addEventListener('canplay', onReady)
      video.addEventListener('canplaythrough', onReady)
      // Also try immediately in case it works
      tryPlay()
    }
  }, [])

  const handleContinue = useCallback(() => {
    if (completedRef.current) return
    completedRef.current = true
    onCompleteRef.current()
  }, [])

  return (
    <motion.div
      className="fixed inset-0 z-50 flex flex-col items-center select-none"
      style={{ background: '#000000', fontFamily: "'Cinzel', serif" }}
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      transition={{ duration: 0.5 }}
    >
      {/* === VIDEO LAYER — siempre visible y cargado, tapado por overlay negro === */}
      <div className="absolute inset-0 z-0">
        <video
          ref={videoRef}
          src="/videos/payaso-vidrio.mp4"
          playsInline
          preload="auto"
          className="w-full h-full object-cover"
        />
      </div>

      {/* === OVERLAY NEGRO que tapa el video antes de responder === */}
      {/* Al responder: se desvanece revelando el video + quiz al 50% */}
      <div
        className="absolute inset-0 z-10"
        style={{
          background: '#000000',
          opacity: answered ? 0 : 1,
          transition: 'opacity 0.6s ease',
          pointerEvents: 'none',
        }}
      />

      {/* === 50% TRANSLUCENT OVERLAY after answer (oscurece un poco el video) === */}
      <div
        className="absolute inset-0 z-10"
        style={{
          background: 'rgba(0, 0, 0, 0.5)',
          opacity: answered ? 1 : 0,
          transition: 'opacity 0.6s ease',
          pointerEvents: 'none',
        }}
      />

      {/* === QUIZ CONTENT — fades to 50% opacity on answer === */}
      <div
        className="relative z-20 flex-1 flex flex-col items-center justify-center px-5 w-full max-w-lg mx-auto"
        style={{
          opacity: answered ? 0.5 : 1,
          transition: 'opacity 0.6s ease',
        }}
      >
        {/* Shield icon */}
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

        {/* VERIFICACIÓN DE ACCESO */}
        <motion.div
          className="flex items-center gap-3 mb-2"
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

        {/* 1/5 PREGUNTAS */}
        <motion.div
          initial={{ opacity: 0 }}
          animate={showContent ? { opacity: 1 } : {}}
          transition={{ duration: 0.6, delay: 0.5 }}
          className="mb-6"
        >
          <span style={{
            fontFamily: "'Cinzel', serif",
            fontSize: 'clamp(0.55rem, 1.6vw, 0.65rem)',
            fontWeight: 500,
            color: 'rgba(255, 255, 255, 0.35)',
            letterSpacing: '0.15em',
            textTransform: 'uppercase',
          }}>
            1/5 PREGUNTAS
          </span>
        </motion.div>

        {/* Question */}
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
          {QUESTION.question}
        </motion.h1>

        {/* Answer buttons — SIEMPRE clickeables, incluso después de minutos */}
        <div className="flex flex-col gap-3 w-full max-w-sm">
          {QUESTION.options.map((option, index) => (
            <motion.button
              key={option.letter}
              onClick={handleAnswer}
              className="relative cursor-pointer overflow-hidden w-full text-left"
              style={{
                background: 'rgba(34, 34, 34, 0.95)',
                border: '1px solid rgba(255, 255, 255, 0.1)',
                borderRadius: 6,
                padding: '14px 16px',
                display: 'flex',
                alignItems: 'center',
                gap: 12,
                // Siempre clickeable — nunca se desactiva
                pointerEvents: 'auto',
              }}
              initial={{ opacity: 0, x: -30 }}
              animate={showContent ? { opacity: 1, x: 0 } : {}}
              transition={{ duration: 0.5, delay: 0.9 + index * 0.15 }}
              whileTap={{ scale: 0.97, borderColor: 'rgba(211, 47, 47, 0.5)' }}
            >
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
      </div>

      {/* === Continuar — después de que el video termine === */}
      <AnimatePresence>
        {videoEnded && (
          <motion.div
            className="absolute inset-0 z-30 flex flex-col items-center justify-center"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ duration: 0.6, ease: 'easeOut' }}
          >
            <div className="absolute inset-0" style={{ background: 'rgba(0, 0, 0, 0.7)' }} />
            <motion.button
              onClick={handleContinue}
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
                pointerEvents: 'auto',
              }}
              initial={{ scale: 0.8, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              transition={{ delay: 0.3, duration: 0.6, type: 'spring' }}
              whileTap={{ scale: 0.95 }}
            >
              Continuar
            </motion.button>
          </motion.div>
        )}
      </AnimatePresence>
    </motion.div>
  )
}
