'use client'

import { useEffect, useState, useMemo, useCallback } from 'react'
import { motion, AnimatePresence } from 'framer-motion'

interface CinematicLandingProps {
  onComplete: () => void
}

export default function CinematicLanding({ onComplete }: CinematicLandingProps) {
  const [showContent, setShowContent] = useState(false)
  const [isExiting, setIsExiting] = useState(false)
  const [viewHeight, setViewHeight] = useState(1200)

  useEffect(() => {
    setViewHeight(window.innerHeight)
    const timer = setTimeout(() => setShowContent(true), 400)
    return () => clearTimeout(timer)
  }, [])

  const handleStart = useCallback(() => {
    if (isExiting) return
    setIsExiting(true)
    setTimeout(() => onComplete(), 800)
  }, [isExiting, onComplete])

  const flames = useMemo(() =>
    Array.from({ length: 28 }, (_, i) => {
      const colorSet = [
        '#FF6D00', '#FF3D00', '#DD2C00', '#FFAB00',
        '#FF9100', '#BF360C', '#FFD600', '#E65100',
      ]
      return {
        id: i,
        left: Math.random() * 100,
        delay: Math.random() * 8,
        duration: 4 + Math.random() * 7,
        width: 6 + Math.random() * 18,
        height: 16 + Math.random() * 40,
        color: colorSet[Math.floor(Math.random() * colorSet.length)],
        opacity: 0.15 + Math.random() * 0.35,
        drift: (Math.random() - 0.5) * 60,
        wobbleFreq: 1 + Math.random() * 2,
        scale: 0.5 + Math.random() * 0.8,
        blur: Math.random() > 0.6 ? 1 + Math.random() * 2 : 0,
      }
    }),
    []
  )

  return (
    <AnimatePresence>
      {!isExiting ? (
        <motion.div
          className="fixed inset-0 z-50 flex flex-col overflow-hidden select-none"
          style={{ background: '#0a0a0a', fontFamily: "'Cinzel', serif" }}
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          transition={{ duration: 0.8 }}
        >
          {/* BACKGROUND */}
          <div
            className="absolute inset-0"
            style={{
              background: `
                radial-gradient(ellipse 90% 50% at 50% 100%, rgba(180, 40, 0, 0.12) 0%, rgba(120, 10, 10, 0.06) 40%, transparent 70%),
                radial-gradient(ellipse 70% 40% at 30% 80%, rgba(255, 100, 0, 0.04) 0%, transparent 60%),
                radial-gradient(ellipse 70% 40% at 70% 80%, rgba(255, 60, 0, 0.04) 0%, transparent 60%),
                radial-gradient(ellipse 80% 60% at 50% 50%, rgba(120, 10, 10, 0.05) 0%, transparent 60%),
                #0a0a0a
              `,
            }}
          />

          {/* Film grain */}
          <div
            className="absolute inset-0 pointer-events-none"
            style={{
              opacity: 0.03,
              backgroundImage: `url("data:image/svg+xml,%3Csvg viewBox='0 0 256 256' xmlns='http://www.w3.org/2000/svg'%3E%3Cfilter id='noise'%3E%3CfeTurbulence type='fractalNoise' baseFrequency='0.85' numOctaves='4' stitchTiles='stitch'/%3E%3C/filter%3E%3Crect width='100%25' height='100%25' filter='url(%23noise)' opacity='1'/%3E%3C/svg%3E")`,
              backgroundSize: '128px 128px',
            }}
          />

          {/* FLOATING FLAMES */}
          {flames.map((flame) => (
            <motion.div
              key={flame.id}
              className="absolute pointer-events-none"
              style={{
                left: `${flame.left}%`,
                bottom: '-5%',
                width: `${flame.width}px`,
                height: `${flame.height}px`,
                filter: flame.blur > 0 ? `blur(${flame.blur}px)` : 'none',
              }}
              animate={{
                y: [0, -viewHeight * 1.3],
                x: [0, flame.drift],
                opacity: [0, flame.opacity, flame.opacity * 0.7, flame.opacity * 0.3, 0],
                scale: [0.3, flame.scale, flame.scale * 0.8, flame.scale * 0.4],
              }}
              transition={{
                duration: flame.duration,
                delay: flame.delay,
                repeat: Infinity,
                ease: 'easeOut',
              }}
            >
              <div
                style={{
                  width: '100%',
                  height: '100%',
                  background: `linear-gradient(to top, ${flame.color}, ${flame.color}88, transparent)`,
                  borderRadius: '50% 50% 50% 50% / 60% 60% 40% 40%',
                  boxShadow: `0 0 ${flame.width * 0.8}px ${flame.width * 0.3}px ${flame.color}44`,
                  animation: `flameWobble ${1 / flame.wobbleFreq * 2}s ease-in-out infinite alternate`,
                }}
              />
            </motion.div>
          ))}

          <style>{`
            @keyframes flameWobble {
              0% { transform: scaleX(1) rotate(-3deg); }
              100% { transform: scaleX(0.85) rotate(3deg); }
            }
            @keyframes shimmerSweep {
              0% { transform: translateX(-100%) skewX(-20deg); }
              100% { transform: translateX(300%) skewX(-20deg); }
            }
            @keyframes buttonGlow {
              0%, 100% {
                box-shadow:
                  0 4px 25px rgba(183, 28, 28, 0.5),
                  0 0 40px rgba(255, 60, 0, 0.15),
                  0 8px 60px rgba(183, 28, 28, 0.2);
              }
              50% {
                box-shadow:
                  0 4px 30px rgba(183, 28, 28, 0.7),
                  0 0 60px rgba(255, 60, 0, 0.25),
                  0 8px 80px rgba(183, 28, 28, 0.3);
              }
            }
          `}</style>

          {/* Vignette */}
          <div
            className="pointer-events-none absolute inset-0"
            style={{
              background: 'radial-gradient(ellipse 65% 55% at 50% 50%, transparent 20%, rgba(0, 0, 0, 0.7) 100%)',
            }}
          />

          {/* CONTENT AREA — flex-1 bounded, no overlap with button */}
          <div className="relative z-10 flex-1 flex flex-col items-center justify-center px-6 text-center max-w-lg mx-auto overflow-y-auto">

            {/* HOOK TITLE */}
            <motion.div
              initial={{ opacity: 0, y: 25 }}
              animate={showContent ? { opacity: 1, y: 0 } : {}}
              transition={{ duration: 1.2, delay: 0.5, ease: 'easeOut' }}
            >
              <p
                style={{
                  fontFamily: "'Cinzel', serif",
                  fontSize: 'clamp(1.4rem, 5.5vw, 2.2rem)',
                  fontWeight: 700,
                  color: '#FFFFFF',
                  lineHeight: 1.35,
                  letterSpacing: '0.02em',
                  textShadow: '0 2px 20px rgba(0,0,0,0.5), 0 0 40px rgba(180, 40, 40, 0.15)',
                }}
              >
                ELLA YA DECIDIÓ SI ERES{' '}
                <span style={{ color: '#D32F2F' }}>EL PREMIO</span>{' '}
                O SI ERES{' '}
                <span style={{ color: '#D32F2F' }}>OLVIDABLE</span>...
              </p>
            </motion.div>

            {/* Subtitle */}
            <motion.div
              initial={{ opacity: 0, y: 15 }}
              animate={showContent ? { opacity: 1, y: 0 } : {}}
              transition={{ duration: 1.2, delay: 1.0, ease: 'easeOut' }}
            >
              <p
                style={{
                  fontFamily: "'Cinzel', serif",
                  fontSize: 'clamp(0.95rem, 3.5vw, 1.25rem)',
                  fontWeight: 400,
                  color: '#AAAAAA',
                  lineHeight: 1.5,
                  marginTop: '0.75rem',
                  letterSpacing: '0.04em',
                }}
              >
                Y SOLO LE TOMÓ <strong style={{ color: '#FFFFFF', fontWeight: 700 }}>7 SEGUNDOS.</strong>
              </p>
            </motion.div>

            {/* SUBTEXTO DE INMERSIÓN */}
            <motion.div
              initial={{ opacity: 0, y: 10 }}
              animate={showContent ? { opacity: 1, y: 0 } : {}}
              transition={{ duration: 1.2, delay: 1.3, ease: 'easeOut' }}
              className="mt-5 max-w-md"
            >
              <p
                style={{
                  fontFamily: "'Cinzel', serif",
                  fontSize: 'clamp(0.65rem, 1.8vw, 0.78rem)',
                  fontWeight: 400,
                  color: 'rgba(255, 255, 255, 0.45)',
                  lineHeight: 1.6,
                  letterSpacing: '0.03em',
                }}
              >
                El 99% de los hombres están usando el mismo formato aburrido de chat y están siendo archivados en silencio. Lo que estás a punto de experimentar es el cortocircuito biológico para hackear su atención de inmediato.
              </p>
            </motion.div>

            {/* SUBE EL VOLUMEN — CopyFilms style */}
            <motion.div
              className="mt-5"
              initial={{ opacity: 0 }}
              animate={showContent ? { opacity: 1 } : {}}
              transition={{ duration: 1, delay: 1.7 }}
            >
              <div className="flex items-center justify-center gap-2">
                {/* Red speaker icon */}
                <svg
                  width="18" height="18" viewBox="0 0 24 24"
                  fill="none" stroke="#D32F2F" strokeWidth="2"
                  strokeLinecap="round" strokeLinejoin="round"
                  style={{ flexShrink: 0 }}
                >
                  <polygon points="11 5 6 9 2 9 2 15 6 15 11 19 11 5" />
                  <path d="M15.54 8.46a5 5 0 0 1 0 7.07" />
                  <path d="M19.07 4.93a10 10 0 0 1 0 14.14" />
                </svg>
                {/* Text */}
                <span
                  style={{
                    fontFamily: "'Cinzel', serif",
                    fontSize: 'clamp(0.7rem, 2vw, 0.85rem)',
                    fontWeight: 600,
                    color: '#FFFFFF',
                    letterSpacing: '0.1em',
                    textTransform: 'uppercase',
                    whiteSpace: 'nowrap',
                    lineHeight: 1,
                  }}
                >
                  SUBE EL VOLUMEN
                </span>
              </div>
            </motion.div>
          </div>

          {/* CTA BUTTON — in document flow, no overlap possible */}
          <div className="relative z-10 px-6 pb-8 pt-4">
            <motion.button
              onClick={handleStart}
              className="relative w-full cursor-pointer border-none flex items-center justify-center gap-3 overflow-hidden"
              style={{
                fontFamily: "'Cinzel', serif",
                fontSize: 'clamp(0.8rem, 2.5vw, 0.95rem)',
                fontWeight: 600,
                color: '#FFFFFF',
                letterSpacing: '0.06em',
                textTransform: 'uppercase',
                background: 'linear-gradient(135deg, #B71C1C 0%, #D32F2F 40%, #C62828 60%, #8B0000 100%)',
                borderRadius: '6px',
                padding: '16px 24px',
                animation: 'buttonGlow 2.5s ease-in-out infinite',
              }}
              initial={{ opacity: 0, y: 20 }}
              animate={showContent ? { opacity: 1, y: 0 } : {}}
              transition={{ duration: 0.8, delay: 2.0, ease: 'easeOut' }}
              whileTap={{ scale: 0.97 }}
            >
              <div
                style={{
                  position: 'absolute', top: 0, left: 0, width: '40%', height: '100%',
                  background: 'linear-gradient(90deg, transparent, rgba(255,255,255,0.2), rgba(255,255,255,0.35), rgba(255,255,255,0.2), transparent)',
                  animation: 'shimmerSweep 3s ease-in-out infinite 2.5s',
                  pointerEvents: 'none',
                }}
              />
              <div
                style={{
                  position: 'absolute', top: '1px', left: '10%', right: '10%', height: '1px',
                  background: 'linear-gradient(90deg, transparent, rgba(255,255,255,0.4), transparent)',
                  pointerEvents: 'none', borderRadius: '1px',
                }}
              />
              <div
                style={{
                  position: 'absolute', bottom: '-8px', left: '15%', right: '15%', height: '8px',
                  background: 'linear-gradient(to bottom, rgba(183, 28, 28, 0.3), transparent)',
                  filter: 'blur(4px)', pointerEvents: 'none', borderRadius: '0 0 50% 50%',
                }}
              />
              <span style={{ position: 'relative', zIndex: 1 }}>
                ENTRAR EN LA EXPERIENCIA
              </span>
              <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" style={{ position: 'relative', zIndex: 1 }}>
                <line x1="5" y1="12" x2="19" y2="12" />
                <polyline points="12 5 19 12 12 19" />
              </svg>
            </motion.button>
          </div>
        </motion.div>
      ) : (
        <motion.div
          className="fixed inset-0 z-50"
          style={{ background: '#0a0a0a' }}
          initial={{ opacity: 1 }}
          animate={{ opacity: 0 }}
          transition={{ duration: 0.8, ease: 'easeInOut' }}
        />
      )}
    </AnimatePresence>
  )
}
