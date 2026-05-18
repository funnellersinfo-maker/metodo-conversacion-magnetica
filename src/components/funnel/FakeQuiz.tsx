'use client'

import { useEffect, useRef, useState, useCallback } from 'react'
import { motion, AnimatePresence } from 'framer-motion'

interface FakeQuizProps {
  onComplete: () => void
}

const QUESTIONS = [
  {
    question: '¿Cuánto tiempo le toma a una mujer decidir si eres atractivo o no?',
    options: ['30 segundos', '7 segundos', '3 minutos', '1 minuto'],
    correct: 1,
  },
  {
    question: '¿Qué detecta ella más rápido: un mensaje original o un "copia y pega"?',
    options: ['El original', 'El copia y pega', 'Ninguno', 'Los detecta igual'],
    correct: 1,
  },
  {
    question: 'En la biología del deseo, ¿lo predecible es...?',
    options: ['Atractivo', 'Seguro', 'Invisible', 'Aburrido'],
    correct: 2,
  },
]

export default function FakeQuiz({ onComplete }: FakeQuizProps) {
  const [currentQ, setCurrentQ] = useState(0)
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

    // After brief feedback, fade to video
    setTimeout(() => {
      setShowVideo(true)
    }, 600)
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

  const q = QUESTIONS[currentQ]

  return (
    <motion.div
      className="fixed inset-0 z-50 flex flex-col items-center select-none overflow-hidden"
      style={{ background: '#0a0a0a' }}
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      transition={{ duration: 0.3 }}
    >
      {/* Quiz content — fades to 50% when answered */}
      <motion.div
        className="absolute inset-0 flex flex-col items-center justify-center px-6"
        animate={{ opacity: answered ? 0.5 : 1 }}
        transition={{ duration: 0.4 }}
      >
        {/* Question number */}
        <span style={{
          fontFamily: "'Cinzel', serif",
          fontSize: 'clamp(0.6rem, 1.6vw, 0.72rem)',
          fontWeight: 500,
          color: '#D32F2F',
          letterSpacing: '0.25em',
          textTransform: 'uppercase',
          marginBottom: '1.5rem',
        }}>
          PREGUNTA {currentQ + 1} DE {QUESTIONS.length}
        </span>

        {/* Question text */}
        <h2 style={{
          fontFamily: "'Cinzel', serif",
          fontSize: 'clamp(1rem, 4vw, 1.3rem)',
          fontWeight: 700,
          color: '#FFFFFF',
          textAlign: 'center',
          lineHeight: 1.5,
          maxWidth: '360px',
          marginBottom: '2rem',
          textShadow: '0 2px 15px rgba(0,0,0,0.8)',
        }}>
          {q.question}
        </h2>

        {/* Options */}
        <div className="w-full max-w-sm flex flex-col gap-3">
          {q.options.map((opt, i) => {
            const isSelected = selectedIdx === i
            const isCorrect = i === q.correct
            const showResult = answered && isSelected

            return (
              <motion.button
                key={i}
                onClick={() => handleAnswer(i)}
                disabled={answered}
                className="w-full cursor-pointer border-none text-left"
                style={{
                  fontFamily: "'Cinzel', serif",
                  fontSize: 'clamp(0.75rem, 2.5vw, 0.9rem)',
                  fontWeight: 500,
                  color: showResult ? (isCorrect ? '#66FF66' : '#FF5252') : '#FFFFFF',
                  background: showResult
                    ? (isCorrect ? 'rgba(76, 175, 80, 0.15)' : 'rgba(211, 47, 47, 0.15)')
                    : 'rgba(255, 255, 255, 0.06)',
                  borderRadius: '8px',
                  padding: '14px 18px',
                  border: showResult
                    ? (isCorrect ? '1px solid rgba(76, 175, 80, 0.4)' : '1px solid rgba(211, 47, 47, 0.4)')
                    : '1px solid rgba(255, 255, 255, 0.1)',
                  transition: 'all 0.3s ease',
                  pointerEvents: answered ? 'none' : 'auto',
                }}
                whileTap={!answered ? { scale: 0.97 } : {}}
                whileHover={!answered ? { borderColor: 'rgba(211, 47, 47, 0.4)' } : {}}
              >
                <span style={{ color: 'rgba(255,255,255,0.3)', marginRight: '10px' }}>
                  {String.fromCharCode(65 + i)}.
                </span>
                {opt}
              </motion.button>
            )
          })}
        </div>
      </motion.div>

      {/* VIDEO OVERLAY — appears after answer, covers everything */}
      <AnimatePresence>
        {showVideo && (
          <motion.div
            className="absolute inset-0 z-20 bg-black"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ duration: 0.5 }}
          >
            <video
              ref={videoRef}
              src="/videos/vidrio-roto.mp4"
              playsInline
              preload="auto"
              className="w-full h-full object-cover"
            />

            {/* Continue button — only after video ends */}
            <AnimatePresence>
              {videoEnded && (
                <motion.div
                  className="absolute bottom-16 left-0 right-0 flex justify-center z-30"
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ duration: 0.4 }}
                >
                  <button
                    onClick={handleContinue}
                    className="cursor-pointer border-none"
                    style={{
                      fontFamily: "'Cinzel', serif",
                      fontSize: 'clamp(0.85rem, 3vw, 1rem)',
                      fontWeight: 700,
                      color: '#FFFFFF',
                      letterSpacing: '0.12em',
                      textTransform: 'uppercase',
                      background: 'linear-gradient(135deg, #B71C1C, #D32F2F)',
                      borderRadius: '6px',
                      padding: '16px 48px',
                      boxShadow: '0 0 30px rgba(211, 47, 47, 0.5), 0 4px 20px rgba(0,0,0,0.4)',
                      animation: 'pulse 2s ease-in-out infinite',
                    }}
                  >
                    CONTINUAR
                  </button>
                </motion.div>
              )}
            </AnimatePresence>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Pulse animation */}
      <style>{`
        @keyframes pulse {
          0%, 100% { box-shadow: 0 0 30px rgba(211, 47, 47, 0.5), 0 4px 20px rgba(0,0,0,0.4); }
          50% { box-shadow: 0 0 50px rgba(211, 47, 47, 0.7), 0 4px 30px rgba(0,0,0,0.5); }
        }
      `}</style>
    </motion.div>
  )
}
