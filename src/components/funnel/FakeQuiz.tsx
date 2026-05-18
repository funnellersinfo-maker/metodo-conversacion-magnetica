'use client'

import { useState, useCallback } from 'react'
import { motion, AnimatePresence } from 'framer-motion'

interface FakeQuizProps {
  onComplete: () => void
}

const ANSWERS = [
  'Sí, estoy listo',
  'No estoy seguro',
  'Tal vez',
]

export default function FakeQuiz({ onComplete }: FakeQuizProps) {
  const [isExiting, setIsExiting] = useState(false)
  const [showContent, setShowContent] = useState(false)

  // We use a flag to prevent double-clicks
  const handleAnswer = useCallback(() => {
    if (isExiting) return
    setIsExiting(true)
    setTimeout(() => onComplete(), 500)
  }, [isExiting, onComplete])

  return (
    <AnimatePresence>
      {!isExiting ? (
        <motion.div
          className="fixed inset-0 z-50 flex flex-col items-center select-none overflow-hidden"
          style={{
            background: '#0a0a0a',
            fontFamily: "'Cinzel', serif",
          }}
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0.5 }}
          transition={{ duration: 0.5, ease: 'easeInOut' }}
          onAnimationComplete={() => {
            if (!showContent) setShowContent(true)
          }}
        >
          {/* Scan lines overlay */}
          <div
            className="pointer-events-none absolute inset-0 z-20"
            style={{
              backgroundImage:
                'repeating-linear-gradient(0deg, transparent, transparent 2px, rgba(0,0,0,0.08) 2px, rgba(0,0,0,0.08) 4px)',
              opacity: 0.6,
            }}
          />

          {/* Vignette */}
          <div
            className="pointer-events-none absolute inset-0 z-10"
            style={{
              background:
                'radial-gradient(ellipse 65% 55% at 50% 50%, transparent 20%, rgba(0,0,0,0.7) 100%)',
            }}
          />

          {/* Subtle green ambient glow */}
          <div
            className="pointer-events-none absolute inset-0"
            style={{
              background:
                'radial-gradient(ellipse 60% 40% at 50% 45%, rgba(76,175,80,0.04) 0%, transparent 70%)',
            }}
          />

          {/* Film grain */}
          <div
            className="pointer-events-none absolute inset-0"
            style={{
              opacity: 0.03,
              backgroundImage: `url("data:image/svg+xml,%3Csvg viewBox='0 0 256 256' xmlns='http://www.w3.org/2000/svg'%3E%3Cfilter id='noise'%3E%3CfeTurbulence type='fractalNoise' baseFrequency='0.85' numOctaves='4' stitchTiles='stitch'/%3E%3C/filter%3E%3Crect width='100%25' height='100%25' filter='url(%23noise)' opacity='1'/%3E%3C/svg%3E")`,
              backgroundSize: '128px 128px',
            }}
          />

          {/* KEYFRAMES */}
          <style>{`
            @keyframes shimmerSweep {
              0% { transform: translateX(-150%) skewX(-20deg); }
              100% { transform: translateX(350%) skewX(-20deg); }
            }
            @keyframes greenGlow {
              0%, 100% {
                box-shadow:
                  0 0 15px rgba(76,175,80,0.2),
                  0 0 30px rgba(76,175,80,0.08),
                  inset 0 0 12px rgba(76,175,80,0.05);
              }
              50% {
                box-shadow:
                  0 0 25px rgba(76,175,80,0.35),
                  0 0 50px rgba(76,175,80,0.12),
                  inset 0 0 18px rgba(76,175,80,0.08);
              }
            }
            @keyframes counterGlow {
              0%, 100% { text-shadow: 0 0 12px rgba(76,175,80,0.5), 0 0 25px rgba(76,175,80,0.2); }
              50% { text-shadow: 0 0 20px rgba(76,175,80,0.7), 0 0 40px rgba(76,175,80,0.3); }
            }
          `}</style>

          {/* === CONTENT === */}
          <div className="relative z-30 flex-1 flex flex-col items-center justify-center px-6 text-center max-w-lg mx-auto w-full">
            {/* Question counter */}
            <motion.div
              initial={{ opacity: 0, y: -20 }}
              animate={showContent ? { opacity: 1, y: 0 } : {}}
              transition={{ duration: 0.8, delay: 0.2, ease: 'easeOut' }}
            >
              <span
                style={{
                  fontFamily: "'Cinzel', serif",
                  fontSize: 'clamp(0.7rem, 2.2vw, 0.9rem)',
                  fontWeight: 600,
                  color: '#4CAF50',
                  letterSpacing: '0.25em',
                  textTransform: 'uppercase',
                  animation: 'counterGlow 3s ease-in-out infinite',
                }}
              >
                1/5 PREGUNTAS
              </span>
            </motion.div>

            {/* Decorative line */}
            <motion.div
              initial={{ scaleX: 0, opacity: 0 }}
              animate={showContent ? { scaleX: 1, opacity: 1 } : {}}
              transition={{ duration: 0.8, delay: 0.5, ease: 'easeOut' }}
              className="my-5"
              style={{
                width: '60px',
                height: '1px',
                background: 'linear-gradient(90deg, transparent, #4CAF50, transparent)',
                boxShadow: '0 0 8px rgba(76,175,80,0.4)',
              }}
            />

            {/* Dramatic question */}
            <motion.div
              initial={{ opacity: 0, y: 30, scale: 0.95 }}
              animate={showContent ? { opacity: 1, y: 0, scale: 1 } : {}}
              transition={{ duration: 1.2, delay: 0.7, ease: [0.25, 0.46, 0.45, 0.94] }}
            >
              <h1
                style={{
                  fontFamily: "'Cinzel', serif",
                  fontSize: 'clamp(1.3rem, 5vw, 2rem)',
                  fontWeight: 700,
                  color: '#FFFFFF',
                  lineHeight: 1.4,
                  letterSpacing: '0.02em',
                  textShadow:
                    '0 2px 20px rgba(0,0,0,0.6), 0 0 40px rgba(76,175,80,0.08)',
                }}
              >
                ¿Estás listo para descubrir la verdad sobre la{' '}
                <span style={{ color: '#4CAF50', textShadow: '0 0 15px rgba(76,175,80,0.4)' }}>
                  atracción
                </span>
                ?
              </h1>
            </motion.div>

            {/* Answer buttons */}
            <div className="mt-10 flex flex-col gap-4 w-full max-w-sm">
              {ANSWERS.map((answer, index) => (
                <motion.button
                  key={answer}
                  onClick={handleAnswer}
                  className="relative cursor-pointer overflow-hidden"
                  style={{
                    fontFamily: "'Cinzel', serif",
                    fontSize: 'clamp(0.8rem, 2.5vw, 0.95rem)',
                    fontWeight: 500,
                    color: '#FFFFFF',
                    letterSpacing: '0.06em',
                    background:
                      'linear-gradient(135deg, rgba(76,175,80,0.08) 0%, rgba(20,20,20,0.95) 40%, rgba(15,15,15,0.98) 100%)',
                    border: '1px solid rgba(76,175,80,0.3)',
                    borderRadius: '6px',
                    padding: '15px 24px',
                    animation: 'greenGlow 3s ease-in-out infinite',
                    animationDelay: `${index * 0.5}s`,
                    textAlign: 'center',
                  }}
                  initial={{ opacity: 0, x: -40 }}
                  animate={showContent ? { opacity: 1, x: 0 } : {}}
                  transition={{
                    duration: 0.7,
                    delay: 1.2 + index * 0.2,
                    ease: [0.25, 0.46, 0.45, 0.94],
                  }}
                  whileHover={{
                    borderColor: 'rgba(76,175,80,0.6)',
                    backgroundColor: 'rgba(76,175,80,0.12)',
                  }}
                  whileTap={{ scale: 0.97 }}
                >
                  {/* Shimmer / destello effect */}
                  <div
                    style={{
                      position: 'absolute',
                      top: 0,
                      left: 0,
                      width: '50%',
                      height: '100%',
                      background:
                        'linear-gradient(90deg, transparent, rgba(255,255,255,0.06), rgba(255,255,255,0.15), rgba(255,255,255,0.06), transparent)',
                      animation: `shimmerSweep 3.5s ease-in-out infinite`,
                      animationDelay: `${1.5 + index * 0.4}s`,
                      pointerEvents: 'none',
                    }}
                  />

                  {/* Top highlight line */}
                  <div
                    style={{
                      position: 'absolute',
                      top: '1px',
                      left: '15%',
                      right: '15%',
                      height: '1px',
                      background:
                        'linear-gradient(90deg, transparent, rgba(76,175,80,0.3), transparent)',
                      pointerEvents: 'none',
                      borderRadius: '1px',
                    }}
                  />

                  {/* Button text */}
                  <span style={{ position: 'relative', zIndex: 1 }}>
                    {answer}
                  </span>
                </motion.button>
              ))}
            </div>
          </div>

          {/* Bottom subtle hint */}
          <motion.div
            className="relative z-30 pb-6"
            initial={{ opacity: 0 }}
            animate={showContent ? { opacity: 0.4 } : {}}
            transition={{ duration: 1, delay: 2.2 }}
          >
            <span
              style={{
                fontFamily: "'Cinzel', serif",
                fontSize: 'clamp(0.55rem, 1.5vw, 0.65rem)',
                fontWeight: 400,
                color: 'rgba(255,255,255,0.5)',
                letterSpacing: '0.1em',
                textTransform: 'uppercase',
              }}
            >
              Todas las respuestas llevan al mismo destino
            </span>
          </motion.div>
        </motion.div>
      ) : (
        <motion.div
          className="fixed inset-0 z-50"
          style={{ background: '#0a0a0a' }}
          initial={{ opacity: 0.5 }}
          animate={{ opacity: 0 }}
          transition={{ duration: 0.5, ease: 'easeInOut' }}
        />
      )}
    </AnimatePresence>
  )
}
