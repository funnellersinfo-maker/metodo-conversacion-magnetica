'use client'

import { useEffect, useRef, useState, useCallback } from 'react'
import { motion, AnimatePresence } from 'framer-motion'

interface FakeQuizProps {
  onComplete: () => void
}

// ============ PREGUNTA ESTRATÉGICA FOMO ============
// Una sola pregunta que genera urgencia, escasez y competencia
const QUIZ = {
  question: '¿Cuántos hombres están viendo esto mismo ahora... y están a punto de adelantarse?',
  options: [
    { label: 'A', text: 'Nadie más tiene acceso' },
    { label: 'B', text: 'Quizás algunos cientos' },
    { label: 'C', text: 'Miles en este momento' },
    { label: 'D', text: 'Prefiero no saberlo' },
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

    // After brief moment, show video behind
    setTimeout(() => {
      setShowVideo(true)
    }, 400)
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
      {/* ============ VIDEO LAYER (bottom) ============ */}
      <AnimatePresence>
        {showVideo && (
          <motion.div
            className="absolute inset-0 z-0"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ duration: 0.6 }}
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

      {/* ============ WHITE WASH OVERLAY (middle) — ACLARA 50% ============ */}
      {/* This is the key: instead of opacity:0.5 on the quiz (which makes it DISAPPEAR),
          we overlay a white layer at 50% opacity, creating a lightened/frosted effect
          while the video plays behind it */}
      <AnimatePresence>
        {showVideo && (
          <motion.div
            className="absolute inset-0 z-10"
            style={{ backgroundColor: 'rgba(255, 255, 255, 0.50)' }}
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ duration: 0.5 }}
          />
        )}
      </AnimatePresence>

      {/* ============ QUIZ CONTENT (top layer) ============ */}
      <motion.div
        className="absolute inset-0 z-20 flex flex-col items-center justify-center px-6"
        animate={answered ? { opacity: 0.35 } : { opacity: 1 }}
        transition={{ duration: 0.5 }}
      >
        {/* ── Shield Icon ── */}
        <motion.div
          initial={{ scale: 0.8, opacity: 0 }}
          animate={{ scale: 1, opacity: 1 }}
          transition={{ delay: 0.2, duration: 0.4 }}
          style={{
            width: 56,
            height: 56,
            borderRadius: 12,
            border: '2px solid #CC0000',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            marginBottom: 20,
          }}
        >
          {/* Shield SVG */}
          <svg width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="#CC0000" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
            <path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z" />
            <path d="M9 12l2 2 4-4" strokeWidth="2" />
          </svg>
        </motion.div>

        {/* ── "VERIFICACIÓN DE ACCESO" with horizontal lines ── */}
        <motion.div
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.35, duration: 0.4 }}
          style={{
            display: 'flex',
            alignItems: 'center',
            gap: 12,
            marginBottom: 28,
            width: '100%',
            maxWidth: 340,
          }}
        >
          <div style={{ flex: 1, height: 1, backgroundColor: '#333333' }} />
          <span style={{
            fontFamily: "'Inter', 'Helvetica Neue', Arial, sans-serif",
            fontSize: 'clamp(0.55rem, 1.8vw, 0.7rem)',
            fontWeight: 600,
            color: '#CC0000',
            letterSpacing: '0.22em',
            textTransform: 'uppercase',
            whiteSpace: 'nowrap',
          }}>
            VERIFICACIÓN DE ACCESO
          </span>
          <div style={{ flex: 1, height: 1, backgroundColor: '#333333' }} />
        </motion.div>

        {/* ── Question ── */}
        <motion.h2
          initial={{ opacity: 0, y: 15 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.5, duration: 0.5 }}
          style={{
            fontFamily: "'Inter', 'Helvetica Neue', Arial, sans-serif",
            fontSize: 'clamp(1rem, 4.2vw, 1.25rem)',
            fontWeight: 700,
            color: '#FFFFFF',
            textAlign: 'center',
            lineHeight: 1.55,
            maxWidth: '360px',
            marginBottom: 32,
            textShadow: '0 2px 20px rgba(0,0,0,0.6)',
          }}
        >
          {QUIZ.question}
        </motion.h2>

        {/* ── Options ── */}
        <div className="w-full max-w-sm flex flex-col gap-3">
          {QUIZ.options.map((opt, i) => {
            const isSelected = selectedIdx === i

            return (
              <motion.button
                key={i}
                onClick={() => handleAnswer(i)}
                disabled={answered}
                className="w-full cursor-pointer text-left relative overflow-hidden"
                style={{
                  fontFamily: "'Inter', 'Helvetica Neue', Arial, sans-serif",
                  fontSize: 'clamp(0.78rem, 2.8vw, 0.88rem)',
                  fontWeight: isSelected ? 600 : 400,
                  color: isSelected ? '#FFFFFF' : '#CCCCCC',
                  background: isSelected
                    ? 'rgba(204, 0, 0, 0.18)'
                    : '#1A1A1A',
                  borderRadius: 6,
                  padding: '15px 18px',
                  border: isSelected
                    ? '1px solid #CC0000'
                    : '1px solid #333333',
                  transition: 'all 0.25s ease',
                  pointerEvents: answered ? 'none' : 'auto',
                }}
                whileTap={!answered ? { scale: 0.98 } : {}}
                whileHover={!answered ? { borderColor: '#CC0000' } : {}}
              >
                {/* Red letter label */}
                <span style={{
                  color: '#CC0000',
                  fontWeight: 700,
                  marginRight: 12,
                  fontSize: 'clamp(0.75rem, 2.5vw, 0.85rem)',
                }}>
                  {opt.label}.
                </span>
                {opt.text}

                {/* Selected indicator */}
                {isSelected && (
                  <motion.div
                    layoutId="selected-indicator"
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
          animate={{ opacity: 0.35 }}
          transition={{ delay: 0.8, duration: 0.5 }}
          style={{
            fontFamily: "'Inter', 'Helvetica Neue', Arial, sans-serif",
            fontSize: 'clamp(0.5rem, 1.4vw, 0.6rem)',
            fontWeight: 500,
            color: '#666666',
            letterSpacing: '0.2em',
            textTransform: 'uppercase',
            marginTop: 32,
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
            initial={{ opacity: 0, y: 25 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5, ease: 'easeOut' }}
          >
            <button
              onClick={handleContinue}
              className="cursor-pointer border-none"
              style={{
                fontFamily: "'Inter', 'Helvetica Neue', Arial, sans-serif",
                fontSize: 'clamp(0.8rem, 3vw, 0.95rem)',
                fontWeight: 700,
                color: '#FFFFFF',
                letterSpacing: '0.14em',
                textTransform: 'uppercase',
                background: '#CC0000',
                borderRadius: 4,
                padding: '15px 52px',
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
