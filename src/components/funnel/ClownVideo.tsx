'use client'

import { useEffect, useRef, useCallback, useState } from 'react'
import { motion, AnimatePresence } from 'framer-motion'

interface ClownVideoProps {
  videoSrc: string
  onComplete: () => void
  showSoundPrompt?: boolean
}

export default function ClownVideo({ videoSrc, onComplete, showSoundPrompt = false }: ClownVideoProps) {
  const videoRef = useRef<HTMLVideoElement>(null)
  const completedRef = useRef(false)
  const [showPrompt, setShowPrompt] = useState(showSoundPrompt)

  const handleComplete = useCallback(() => {
    if (completedRef.current) return
    completedRef.current = true
    onComplete()
  }, [onComplete])

  useEffect(() => {
    const video = videoRef.current
    if (!video) return

    // Start muted if sound prompt is expected, otherwise play muted anyway
    video.muted = true

    const playVideo = async () => {
      try {
        await video.play()
      } catch {
        // Autoplay blocked — will need user interaction
        if (showSoundPrompt) {
          setShowPrompt(true)
        }
      }
    }

    playVideo()

    const handleEnded = () => handleComplete()

    // Stall / pause recovery
    const handleStalled = () => {
      if (!video.paused && !completedRef.current) {
        video.play().catch(() => {})
      }
    }

    const handlePause = () => {
      if (!completedRef.current) {
        setTimeout(() => {
          if (!video.ended && !completedRef.current) {
            video.play().catch(() => {})
          }
        }, 100)
      }
    }

    const handleError = () => {
      if (!completedRef.current && video.error) {
        const currentTime = video.currentTime
        video.load()
        video.currentTime = currentTime
        video.play().catch(() => {})
      }
    }

    const keepAlive = setInterval(() => {
      if (video.paused && !video.ended && !completedRef.current) {
        video.play().catch(() => {})
      }
    }, 1000)

    video.addEventListener('ended', handleEnded)
    video.addEventListener('stalled', handleStalled)
    video.addEventListener('pause', handlePause)
    video.addEventListener('error', handleError)
    video.addEventListener('waiting', handleStalled)

    return () => {
      video.removeEventListener('ended', handleEnded)
      video.removeEventListener('stalled', handleStalled)
      video.removeEventListener('pause', handlePause)
      video.removeEventListener('error', handleError)
      video.removeEventListener('waiting', handleStalled)
      clearInterval(keepAlive)
      video.pause()
    }
  }, [handleComplete, showSoundPrompt])

  const handleActivateSound = () => {
    const video = videoRef.current
    if (!video) return

    // Restart from second 0 with sound
    video.muted = false
    video.currentTime = 0
    video.play().catch(() => {})
    setShowPrompt(false)
  }

  return (
    <motion.div
      className="fixed inset-0 z-50 bg-black select-none"
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      transition={{ duration: 0.4 }}
    >
      <video
        ref={videoRef}
        src={videoSrc}
        playsInline
        preload="auto"
        className="w-full h-full object-cover"
      />

      {/* Sound Prompt Overlay */}
      <AnimatePresence>
        {showPrompt && (
          <motion.div
            className="absolute inset-0 z-20 flex flex-col items-center justify-center"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.3 }}
          >
            {/* Pulsing glow backdrop */}
            <motion.button
              onClick={handleActivateSound}
              className="relative cursor-pointer border-none bg-transparent flex flex-col items-center gap-4 group"
              whileTap={{ scale: 0.95 }}
              aria-label="Activar sonido"
            >
              {/* Speaker icon with green pulsing glow */}
              <motion.div
                className="relative flex items-center justify-center"
                animate={{
                  boxShadow: [
                    '0 0 20px rgba(76, 175, 80, 0.4)',
                    '0 0 40px rgba(76, 175, 80, 0.7)',
                    '0 0 60px rgba(76, 175, 80, 0.4)',
                    '0 0 20px rgba(76, 175, 80, 0.4)',
                  ],
                }}
                transition={{
                  duration: 2,
                  repeat: Infinity,
                  ease: 'easeInOut',
                }}
                style={{
                  width: '72px',
                  height: '72px',
                  borderRadius: '50%',
                  background: 'linear-gradient(145deg, #2E7D32, #4CAF50)',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                }}
              >
                {/* Shimmer overlay on icon */}
                <div
                  className="absolute inset-0 rounded-full overflow-hidden"
                  style={{ pointerEvents: 'none' }}
                >
                  <div
                    style={{
                      position: 'absolute',
                      top: 0,
                      left: '-100%',
                      width: '50%',
                      height: '100%',
                      background:
                        'linear-gradient(90deg, transparent, rgba(255,255,255,0.35), transparent)',
                      animation: 'shimmer-slide 2s ease-in-out infinite',
                    }}
                  />
                </div>

                <svg
                  width="30"
                  height="30"
                  viewBox="0 0 24 24"
                  fill="none"
                  stroke="white"
                  strokeWidth="2"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  style={{ position: 'relative', zIndex: 1 }}
                >
                  <polygon points="11 5 6 9 2 9 2 15 6 15 11 19 11 5" />
                  <path d="M15.54 8.46a5 5 0 0 1 0 7.07" />
                  <path d="M19.07 4.93a10 10 0 0 1 0 14.14" />
                </svg>
              </motion.div>

              {/* "ACTIVAR SONIDO" button with shimmer */}
              <motion.div
                className="relative overflow-hidden rounded-full px-6 py-3 sm:px-8 sm:py-4"
                style={{
                  background: 'linear-gradient(145deg, rgba(76,175,80,0.25), rgba(46,125,50,0.4))',
                  border: '1px solid rgba(76,175,80,0.5)',
                  backdropFilter: 'blur(8px)',
                }}
                animate={{
                  boxShadow: [
                    '0 0 15px rgba(76, 175, 80, 0.2)',
                    '0 0 30px rgba(76, 175, 80, 0.5)',
                    '0 0 15px rgba(76, 175, 80, 0.2)',
                  ],
                }}
                transition={{
                  duration: 2,
                  repeat: Infinity,
                  ease: 'easeInOut',
                }}
              >
                {/* Shimmer / Destello sweep */}
                <div
                  style={{
                    position: 'absolute',
                    top: 0,
                    left: '-100%',
                    width: '60%',
                    height: '100%',
                    background:
                      'linear-gradient(90deg, transparent, rgba(255,255,255,0.4), transparent)',
                    animation: 'shimmer-slide 2.5s ease-in-out infinite',
                    pointerEvents: 'none',
                  }}
                />

                <span
                  className="relative z-10"
                  style={{
                    fontFamily: "'Cinzel', serif",
                    fontSize: 'clamp(0.75rem, 2.5vw, 1rem)',
                    fontWeight: 700,
                    color: '#E8F5E9',
                    letterSpacing: '0.18em',
                    textTransform: 'uppercase',
                    textShadow: '0 1px 10px rgba(0,0,0,0.8)',
                    whiteSpace: 'nowrap',
                  }}
                >
                  ACTIVAR SONIDO
                </span>
              </motion.div>
            </motion.button>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Shimmer keyframes */}
      <style>{`
        @keyframes shimmer-slide {
          0% { left: -100%; }
          50% { left: 100%; }
          100% { left: 100%; }
        }
      `}</style>
    </motion.div>
  )
}
