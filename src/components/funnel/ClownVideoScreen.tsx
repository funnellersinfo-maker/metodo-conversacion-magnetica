'use client'

import { useRef, useEffect, useState, useCallback } from 'react'

interface ClownVideoScreenProps {
  onComplete: () => void
}

export default function ClownVideoScreen({ onComplete }: ClownVideoScreenProps) {
  const videoRef = useRef<HTMLVideoElement>(null)
  const soundActivatedRef = useRef(false)
  const completedRef = useRef(false)
  const onCompleteRef = useRef(onComplete)
  const [showButton, setShowButton] = useState(true)

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

    setShowButton(false)

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
        display: 'grid',
        placeItems: 'center',
      }}
    >
      {/* Video — absolutely positioned, doesn't participate in grid */}
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

      {/* Button — grid-centered, NO transform, NO absolute positioning */}
      {showButton && (
        <button
          onClick={activateSound}
          className="sound-activate-btn"
          style={{
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
            touchAction: 'manipulation',
            WebkitTapHighlightColor: 'transparent',
            userSelect: 'none',
            textAlign: 'center',
            position: 'relative',
          }}
        >
          🔊 TOCA PARA ACTIVAR SONIDO
        </button>
      )}

      {/* CSS keyframes — pulse opacity + box-shadow only, NEVER transform */}
      <style>{`
        .sound-activate-btn {
          animation: soundBtnPulse 2s ease-in-out infinite;
        }
        @keyframes soundBtnPulse {
          0%, 100% {
            opacity: 1;
            box-shadow: 0 0 30px rgba(204,0,0,0.5);
          }
          50% {
            opacity: 0.85;
            box-shadow: 0 0 55px rgba(204,0,0,0.85);
          }
        }
      `}</style>
    </div>
  )
}
