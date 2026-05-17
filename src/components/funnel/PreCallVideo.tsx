'use client'

import { useEffect, useRef, useCallback, useState } from 'react'
import { motion } from 'framer-motion'

interface PreCallVideoProps {
  onComplete: () => void
}

export default function PreCallVideo({ onComplete }: PreCallVideoProps) {
  const videoRef = useRef<HTMLVideoElement>(null)
  const completedRef = useRef(false)
  const [showUnmute, setShowUnmute] = useState(false)

  const handleComplete = useCallback(() => {
    if (completedRef.current) return
    completedRef.current = true
    onComplete()
  }, [onComplete])

  useEffect(() => {
    const video = videoRef.current
    if (!video) return

    // Video is preloaded via <link rel="preload"> in layout — should play instantly
    const playVideo = async () => {
      try {
        video.muted = false
        video.volume = 1.0
        await video.play()
      } catch {
        // Browser blocked autoplay with sound — try muted
        try {
          video.muted = true
          await video.play()
          setShowUnmute(true)
        } catch {
          // Even muted blocked — show tap to play
          setShowUnmute(true)
        }
      }
    }

    playVideo()

    const handleEnded = () => handleComplete()

    video.addEventListener('ended', handleEnded)

    return () => {
      video.removeEventListener('ended', handleEnded)
      video.pause()
    }
  }, [handleComplete])

  const handleUnmute = () => {
    const video = videoRef.current
    if (video) {
      video.muted = false
      video.volume = 1.0
      setShowUnmute(false)
    }
  }

  return (
    <motion.div
      className="fixed inset-0 z-50 bg-black select-none"
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      transition={{ duration: 0.3 }}
    >
      <video
        ref={videoRef}
        src="/videos/pre-llamada.mp4"
        playsInline
        preload="auto"
        className="w-full h-full object-cover"
      />

      {/* Unmute button — only if browser blocked audio */}
      {showUnmute && (
        <button
          onClick={handleUnmute}
          className="absolute bottom-24 left-1/2 -translate-x-1/2 z-20 flex flex-col items-center gap-2 cursor-pointer bg-transparent border-none"
        >
          <div
            style={{
              width: '56px',
              height: '56px',
              borderRadius: '50%',
              background: 'linear-gradient(135deg, #B71C1C, #D32F2F)',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              boxShadow: '0 0 30px rgba(211, 47, 47, 0.6), 0 0 60px rgba(255, 60, 0, 0.2)',
            }}
          >
            <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <polygon points="11 5 6 9 2 9 2 15 6 15 11 19 11 5" />
              <path d="M15.54 8.46a5 5 0 0 1 0 7.07" />
              <path d="M19.07 4.93a10 10 0 0 1 0 14.14" />
            </svg>
          </div>
          <span
            style={{
              fontFamily: "'Cinzel', serif",
              fontSize: '0.7rem',
              fontWeight: 600,
              color: '#FF8A50',
              letterSpacing: '0.12em',
              textTransform: 'uppercase',
              textShadow: '0 1px 8px rgba(0,0,0,0.8)',
            }}
          >
            TOCA PARA ACTIVAR AUDIO
          </span>
        </button>
      )}
    </motion.div>
  )
}
