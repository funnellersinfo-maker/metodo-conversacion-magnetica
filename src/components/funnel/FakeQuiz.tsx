'use client'

import { useEffect, useRef, useState, useCallback } from 'react'
import { motion, AnimatePresence } from 'framer-motion'

interface FakeQuizProps {
  onComplete: () => void
}

// ============ PREGUNTA ESTRATÉGICA FOMO ============
const QUIZ = {
  question: 'Sé honesto... ¿En cuál de estos tres cementerios digitales está muriendo tu chat en este momento?',
  options: [
    {
      label: 'A',
      text: 'El chat iba increíble, pero de la nada se enfrió, me dejó en visto y ahora no sé qué escribir sin parecer desesperado.',
    },
    {
      label: 'B',
      text: 'Me responde, pero solo por cortesía. Si yo no invento un tema o hago una pregunta, el chat se muere ahí mismo.',
    },
    {
      label: 'C',
      text: 'Ni siquiera abre mi mensaje. Sé que mi notificación lleva días sepultada abajo de otros 50 tipos que le escriben lo mismo.',
    },
  ],
}

export default function FakeQuiz({ onComplete }: FakeQuizProps) {
  const [answered, setAnswered] = useState(false)
  const [selectedIdx, setSelectedIdx] = useState(-1)
  const [showVideo, setShowVideo] = useState(false)
  const [videoEnded, setVideoEnded] = useState(false)
  const videoRef = useRef<HTMLVideoElement>(null)
  const completedRef = useRef(false)
  const onCompleteRef = useRef(onComplete)

  useEffect(() => {
    onCompleteRef.current = onComplete
  }, [onComplete])

  const handleAnswer = useCallback((idx: number) => {
    if (answered) return
    setAnswered(true)
    setSelectedIdx(idx)

    // Instant → show video behind translucent quiz
    setTimeout(() => {
      setShowVideo(true)
    }, 300)
  }, [answered])

  // Play video when showVideo becomes true
  useEffect(() => {
    if (!showVideo) return
    const video = videoRef.current
    if (!video) return

    video.load()

    const tryPlay = async () => {
      try {
        video.muted = false
        video.volume = 1.0
        await video.play()
      } catch {
        try {
          video.muted = true
          await video.play()
        } catch {
          // Will try on interaction
        }
      }
    }
    tryPlay()

    const handleEnded = () => {
      setVideoEnded(true)
    }

    const handlePause = () => {
      if (!video.ended) {
        setTimeout(() => {
          if (!video.ended) video.play().catch(() => {})
        }, 100)
      }
    }

    const keepAlive = setInterval(() => {
      if (video.paused && !video.ended) {
        video.play().catch(() => {})
      }
    }, 500)

    video.addEventListener('ended', handleEnded)
    video.addEventListener('pause', handlePause)

    return () => {
      video.removeEventListener('ended', handleEnded)
      video.removeEventListener('pause', handlePause)
      clearInterval(keepAlive)
      video.pause()
    }
  }, [showVideo])

  const handleContinue = useCallback(() => {
    if (completedRef.current) return
    completedRef.current = true
    onCompleteRef.current()
  }, [])

  return (
    <motion.div
      className="fixed inset-0 z-50 flex flex-col items-center select-none overflow-hidden"
      style={{ background: '#000000' }}
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      transition={{ duration: 0.3 }}
    >
      {/* ============ VIDEO LAYER (bottom) — plays behind translucent quiz ============ */}
      <AnimatePresence>
        {showVideo && (
          <motion.div
            className="absolute inset-0 z-0"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ duration: 0.4 }}
          >
            <video
              ref={videoRef}
              src="/videos/vidrio-roto.mp4"
              playsInline
              preload="auto"
              className="w-full h-full object-cover"
            />
          </motion.div>
        )}
      </AnimatePresence>

      {/* ============ QUIZ CONTENT (top layer — becomes TRANSLUCENT 50%) ============ */}
      {/* When answered, the whole quiz fades to 50% opacity — video shows through */}
      <motion.div
        className="absolute inset-0 z-20 flex flex-col items-center justify-center px-5"
        style={{ background: showVideo ? 'transparent' : '#000000' }}
        animate={{ opacity: answered ? 0.5 : 1 }}
        transition={{ duration: 0.5 }}
      >
        {/* ── Shield Icon ── */}
        <motion.div
          initial={{ scale: 0.8, opacity: 0 }}
          animate={{ scale: 1, opacity: 1 }}
          transition={{ delay: 0.15, duration: 0.4 }}
          style={{
            width: 52,
            height: 52,
            borderRadius: 10,
            border: '2px solid #CC0000',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            marginBottom: 16,
          }}
        >
          <svg width="26" height="26" viewBox="0 0 24 24" fill="none" stroke="#CC0000" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
            <path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z" />
            <path d="M9 12l2 2 4-4" strokeWidth="2" />
          </svg>
        </motion.div>

        {/* ── "1/5 PREGUNTAS" counter — engaña al ojo ── */}
        <motion.div
          initial={{ opacity: 0, y: 8 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.25, duration: 0.35 }}
          style={{
            display: 'flex',
            alignItems: 'center',
            gap: 10,
            marginBottom: 20,
          }}
        >
          <div style={{ height: 1, width: 28, backgroundColor: '#333' }} />
          <span style={{
            fontFamily: "'Cinzel', serif",
            fontSize: 'clamp(0.5rem, 1.6vw, 0.65rem)',
            fontWeight: 500,
            color: '#CC0000',
            letterSpacing: '0.22em',
            textTransform: 'uppercase',
          }}>
            1 / 5 PREGUNTAS
          </span>
          <div style={{ height: 1, width: 28, backgroundColor: '#333' }} />
        </motion.div>

        {/* ── Question — 2 lines on mobile ── */}
        <motion.h2
          initial={{ opacity: 0, y: 12 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.4, duration: 0.45 }}
          style={{
            fontFamily: "'Cinzel', serif",
            fontSize: 'clamp(0.82rem, 3.4vw, 1.05rem)',
            fontWeight: 700,
            color: '#FFFFFF',
            textAlign: 'center',
            lineHeight: 1.6,
            maxWidth: '340px',
            marginBottom: 24,
            textShadow: '0 2px 18px rgba(0,0,0,0.7)',
          }}
        >
          {QUIZ.question}
        </motion.h2>

        {/* ── Options ── */}
        <div className="w-full max-w-sm flex flex-col gap-2.5">
          {QUIZ.options.map((opt, i) => {
            const isSelected = selectedIdx === i

            return (
              <motion.button
                key={i}
                onClick={() => handleAnswer(i)}
                disabled={answered}
                className="w-full cursor-pointer text-left relative overflow-hidden"
                style={{
                  fontFamily: "'Cinzel', serif",
                  fontSize: 'clamp(0.65rem, 2.2vw, 0.76rem)',
                  fontWeight: isSelected ? 600 : 400,
                  color: isSelected ? '#FFFFFF' : '#CCCCCC',
                  background: isSelected
                    ? 'rgba(204, 0, 0, 0.15)'
                    : '#1A1A1A',
                  borderRadius: 5,
                  padding: '13px 15px 13px 38px',
                  border: isSelected
                    ? '1px solid #CC0000'
                    : '1px solid #2A2A2A',
                  transition: 'all 0.25s ease',
                  pointerEvents: answered ? 'none' : 'auto',
                  lineHeight: 1.5,
                }}
                whileTap={!answered ? { scale: 0.98 } : {}}
                whileHover={!answered ? { borderColor: '#CC0000' } : {}}
              >
                {/* Red letter label — absolute left */}
                <span style={{
                  position: 'absolute',
                  left: 14,
                  top: 13,
                  color: '#CC0000',
                  fontWeight: 700,
                  fontSize: 'clamp(0.65rem, 2.2vw, 0.76rem)',
                }}>
                  {opt.label}.
                </span>
                {opt.text}

                {/* Selected red bar */}
                {isSelected && (
                  <motion.div
                    layoutId="selected-bar"
                    style={{
                      position: 'absolute',
                      top: 0,
                      left: 0,
                      width: 3,
                      height: '100%',
                      backgroundColor: '#CC0000',
                      borderRadius: '0 2px 2px 0',
                    }}
                    initial={{ scaleY: 0 }}
                    animate={{ scaleY: 1 }}
                    transition={{ duration: 0.2 }}
                  />
                )}
              </motion.button>
            )
          })}
        </div>

        {/* ── Brand watermark ── */}
        <motion.span
          initial={{ opacity: 0 }}
          animate={{ opacity: 0.3 }}
          transition={{ delay: 0.7, duration: 0.4 }}
          style={{
            fontFamily: "'Cinzel', serif",
            fontSize: 'clamp(0.45rem, 1.2vw, 0.55rem)',
            fontWeight: 500,
            color: '#555555',
            letterSpacing: '0.2em',
            textTransform: 'uppercase',
            marginTop: 28,
          }}
        >
          MÉTODO MAGNÉTICO
        </motion.span>
      </motion.div>

      {/* ============ CONTINUE BUTTON (after video ends) ============ */}
      <AnimatePresence>
        {videoEnded && (
          <motion.div
            className="absolute bottom-14 left-0 right-0 flex justify-center z-40"
            initial={{ opacity: 0, y: 22 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.4, ease: 'easeOut' }}
          >
            <button
              onClick={handleContinue}
              className="cursor-pointer border-none"
              style={{
                fontFamily: "'Cinzel', serif",
                fontSize: 'clamp(0.78rem, 2.8vw, 0.92rem)',
                fontWeight: 700,
                color: '#FFFFFF',
                letterSpacing: '0.14em',
                textTransform: 'uppercase',
                background: '#CC0000',
                borderRadius: 4,
                padding: '14px 48px',
                boxShadow: '0 0 35px rgba(204, 0, 0, 0.6), 0 4px 20px rgba(0,0,0,0.5)',
                animation: 'quizPulse 2s ease-in-out infinite',
              }}
            >
              CONTINUAR
            </button>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Pulse animation */}
      <style>{`
        @keyframes quizPulse {
          0%, 100% { box-shadow: 0 0 35px rgba(204, 0, 0, 0.6), 0 4px 20px rgba(0,0,0,0.5); }
          50% { box-shadow: 0 0 55px rgba(204, 0, 0, 0.85), 0 4px 30px rgba(0,0,0,0.6); }
        }
      `}</style>
    </motion.div>
  )
}
