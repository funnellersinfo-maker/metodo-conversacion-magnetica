'use client'

import { useState, useRef, useCallback, useEffect } from 'react'
import { motion, AnimatePresence } from 'framer-motion'

interface FakeQuizProps {
  onComplete: () => void
}

// Pregunta ULTRA FOMO para nicho seducción (solo se muestra 1, las demás son señuelo)
const QUESTION = {
  question: '¿Cuánto tiempo llevas usando los mismos mensajes que ella ya detecta?',
  options: [
    { letter: 'A', text: 'Semanas — sé que ya no funcionan' },
    { letter: 'B', text: 'Meses — pero no sé qué más hacer' },
    { letter: 'C', text: 'Apenas empecé, pero siento que se enfriaron' },
  ],
}

export default function FakeQuiz({ onComplete }: FakeQuizProps) {
  const [showContent, setShowContent] = useState(false)
  const [answered, setAnswered] = useState(false)
  const [videoEnded, setVideoEnded] = useState(false)

  const videoRef = useRef<HTMLVideoElement>(null)

  // ============ REFS: Immune to stale closures ============
  // Todos los estados críticos viven en refs — los botones funcionan
  // aunque pasen minutos sin interacción
  const answeredRef = useRef(false)
  const completedRef = useRef(false)
  const onCompleteRef = useRef(onComplete)

  useEffect(() => {
    onCompleteRef.current = onComplete
  }, [onComplete])

  // Entry animation
  useEffect(() => {
    const timer = setTimeout(() => setShowContent(true), 300)
    return () => clearTimeout(timer)
  }, [])

  // ============ HANDLE ANSWER — Parallel actions on click ============
  // En el microsegundo del clic ejecuta EN PARALELO:
  // A) Quiz → opacity 0.5 + pointer-events none
  // B) Video payaso → .play() con audio propio
  const handleAnswer = useCallback(() => {
    if (answeredRef.current) return
    answeredRef.current = true

    // A) Transición inmediata del quiz a 50% opacidad
    setAnswered(true)

    // B) Disparar video de fondo INMEDIATAMENTE
    const video = videoRef.current
    if (video) {
      // Ya hubo interacción real del usuario → el navegador permite audio
      video.muted = false
      video.play().catch(() => {
        // Fallback remoto: si falla unmuted, intentar muted
        video.muted = true
        video.play().catch(() => {})
      })
    }
  }, [])

  // ============ HANDLE CONTINUE ============
  const handleContinue = useCallback(() => {
    if (completedRef.current) return
    completedRef.current = true
    onCompleteRef.current()
  }, [])

  // ============ VIDEO: ended event → mostrar "Continuar" ============
  useEffect(() => {
    const video = videoRef.current
    if (!video) return

    const onEnded = () => {
      setVideoEnded(true)
    }

    video.addEventListener('ended', onEnded)

    // Keep-alive: si el navegador pausa el video, reanudar
    const keepAlive = setInterval(() => {
      if (video.paused && !video.ended && answeredRef.current) {
        video.play().catch(() => {})
      }
    }, 1000)

    return () => {
      video.removeEventListener('ended', onEnded)
      clearInterval(keepAlive)
    }
  }, [])

  return (
    <motion.div
      className="fixed inset-0 z-50 flex flex-col items-center select-none"
      style={{ background: '#000000', fontFamily: "'Cinzel', serif" }}
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      transition={{ duration: 0.5 }}
    >
      {/* === VIDEO LAYER — payaso rompiendo pantalla === */}
      {/* Siempre en DOM (preload), se hace visible al responder */}
      <div
        className="absolute inset-0 z-0"
        style={{
          opacity: answered ? 1 : 0,
          transition: 'opacity 0.5s ease',
        }}
      >
        <video
          ref={videoRef}
          src="/videos/payaso-vidrio.mp4"
          playsInline
          webkit-playsinline="true"
          preload="auto"
          className="w-full h-full object-cover"
        />
      </div>

      {/* === 50% TRANSLUCENT OVERLAY after answer === */}
      <div
        className="absolute inset-0 z-10"
        style={{
          background: 'rgba(0, 0, 0, 0.5)',
          opacity: answered ? 1 : 0,
          transition: 'opacity 0.5s ease',
        }}
      />

      {/* === QUIZ CONTENT — opacity 0.5 + pointer-events none after answer === */}
      <div
        className="relative z-20 flex-1 flex flex-col items-center justify-center px-5 w-full max-w-lg mx-auto"
        style={{
          opacity: answered ? 0.5 : 1,
          pointerEvents: answered ? 'none' : 'auto',
          transition: 'opacity 0.5s ease',
        }}
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

        {/* "VERIFICACIÓN DE ACCESO" */}
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

        {/* "1/5 PREGUNTAS" — engaña al ojo */}
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

        {/* Answer buttons — SIEMPRE interactivos */}
        <div className="flex flex-col gap-3 w-full max-w-sm">
          {QUESTION.options.map((option, index) => (
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
      </div>

      {/* === "Continuar" BUTTON — solo después de que el video termine === */}
      <AnimatePresence>
        {videoEnded && (
          <motion.div
            className="absolute inset-0 z-30 flex flex-col items-center justify-center"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ duration: 0.6, ease: 'easeOut' }}
          >
            {/* Semi-black translucent overlay */}
            <div className="absolute inset-0" style={{ background: 'rgba(0, 0, 0, 0.7)' }} />

            {/* Botón Continuar — fade in dopamínico */}
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
