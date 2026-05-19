'use client'

import { useRef, useEffect, useState, useCallback } from 'react'
import { motion, AnimatePresence } from 'framer-motion'

interface ClownVideoScreenProps {
  onComplete: () => void
}

export default function ClownVideoScreen({ onComplete }: ClownVideoScreenProps) {
  const videoRef = useRef<HTMLVideoElement>(null)
  const soundActivatedRef = useRef(false)
  const completedRef = useRef(false)
  const onCompleteRef = useRef(onComplete)
  const [showButton, setShowButton] = useState(true)
  const [buttonFading, setButtonFading] = useState(false)

  useEffect(() => {
    onCompleteRef.current = onComplete
  }, [onComplete])

  const handleVideoEnded = useCallback(() => {
    if (!soundActivatedRef.current || completedRef.current) return
    completedRef.current = true
    setTimeout(() => {
      onCompleteRef.current()
    }, 800)
  }, [])

  const activateSound = useCallback(() => {
    if (!soundActivatedRef.current) {
      soundActivatedRef.current = true
    }

    setButtonFading(true)

    const video = videoRef.current
    if (!video) return

    // Turn off loop — now it plays once with sound
    video.loop = false
    video.muted = false
    video.volume = 1.0
    video.currentTime = 0

    const playPromise = video.play()
    if (playPromise !== undefined) {
      playPromise.catch(() => {
        video.muted = true
        video.play().catch(() => {})
        // Try to unmute
        const tryUnmute = () => {
          video.muted = false
          video.volume = 1.0
          video.play().catch(() => {})
        }
        tryUnmute()
      })
    }

    setTimeout(() => {
      setShowButton(false)
    }, 300)
  }, [])

  useEffect(() => {
    const video = videoRef.current
    if (!video) return

    // Start muted + looping so there's always visual content while user decides
    video.muted = true
    video.volume = 0
    video.loop = true

    const startMutedPlayback = async () => {
      try {
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

    startMutedPlayback()

    video.addEventListener('ended', handleVideoEnded)

    return () => {
      video.removeEventListener('ended', handleVideoEnded)
      video.pause()
    }
  }, [handleVideoEnded])

  return (
    <div
      style={{
        position: 'fixed',
        inset: 0,
        backgroundColor: '#000',
        overflow: 'hidden',
      }}
    >
      <video
        ref={videoRef}
        src="/videos/payaso-vol1.mp4"
        style={{
          position: 'absolute',
          top: 0,
          left: 0,
          width: '100%',
          height: '100%',
          objectFit: 'cover',
        }}
        playsInline
        preload="auto"
      />

      <AnimatePresence>
        {showButton && (
          <motion.button
            onClick={activateSound}
            initial={{ opacity: 1 }}
            animate={
              buttonFading
                ? { opacity: 0 }
                : {
                    opacity: [1, 0.7, 1],
                    scale: [1, 1.04, 1],
                    boxShadow: [
                      '0 0 30px rgba(204,0,0,0.5)',
                      '0 0 50px rgba(204,0,0,0.8)',
                      '0 0 30px rgba(204,0,0,0.5)',
                    ],
                  }
            }
            transition={
              buttonFading
                ? { duration: 0.3, ease: 'easeOut' }
                : {
                    duration: 2,
                    repeat: Infinity,
                    ease: 'easeInOut',
                  }
            }
            exit={{ opacity: 0 }}
            style={{
              position: 'absolute',
              top: '50%',
              left: '50%',
              transform: 'translate(-50%, -50%)',
              zIndex: 10,
              background: 'rgba(0,0,0,0.75)',
              border: '3px solid #CC0000',
              borderRadius: '16px',
              padding: '28px 48px',
              color: 'white',
              fontFamily: "'Cinzel', serif",
              fontSize: 'clamp(1rem, 4vw, 1.25rem)',
              fontWeight: 700,
              letterSpacing: '0.14em',
              boxShadow: '0 0 40px rgba(204,0,0,0.6)',
              cursor: 'pointer',
              minWidth: '44px',
              minHeight: '44px',
              touchAction: 'manipulation',
              WebkitTapHighlightColor: 'transparent',
              userSelect: 'none',
              textAlign: 'center',
            }}
          >
            🔊 TOCA PARA ACTIVAR SONIDO
          </motion.button>
        )}
      </AnimatePresence>
    </div>
  )
}
