'use client'

import { useEffect, useRef, useCallback, useState } from 'react'
import { motion } from 'framer-motion'

interface AudioCallScreenProps {
  onComplete: () => void
}

export default function AudioCallScreen({ onComplete }: AudioCallScreenProps) {
  const audioRef = useRef<HTMLAudioElement>(null)
  const bgAudioRef = useRef<HTMLAudioElement | null>(null)
  const completedRef = useRef(false)
  const bgStartedRef = useRef(false)
  const [currentTime, setCurrentTime] = useState(0)
  const [isPlaying, setIsPlaying] = useState(false)

  const handleComplete = useCallback(() => {
    if (completedRef.current) return
    completedRef.current = true
    // Stop background music
    if (bgAudioRef.current) {
      bgAudioRef.current.pause()
      bgAudioRef.current.currentTime = 0
    }
    onComplete()
  }, [onComplete])

  useEffect(() => {
    const audio = audioRef.current
    if (!audio) return

    // === Background music — starts at second 40, low volume ===
    const bgAudio = new Audio('/audio/fondo-llamada.aac')
    bgAudio.loop = true
    bgAudio.volume = 0.18 // Low volume so it doesn't overpower the voice
    bgAudioRef.current = bgAudio

    const playAudio = async () => {
      try {
        audio.volume = 1.0
        await audio.play()
        setIsPlaying(true)
      } catch {
        // Browser may block — will need user interaction
      }
    }

    playAudio()

    const handleEnded = () => handleComplete()
    const handleTimeUpdate = () => {
      setCurrentTime(audio.currentTime)

      // Start background music at second 40
      if (!bgStartedRef.current && audio.currentTime >= 40) {
        bgStartedRef.current = true
        bgAudio.play().catch(() => {})
      }
    }

    audio.addEventListener('ended', handleEnded)
    audio.addEventListener('timeupdate', handleTimeUpdate)

    // Keep alive — prevent browser from pausing
    const keepAlive = setInterval(() => {
      if (audio.paused && !audio.ended && !completedRef.current) {
        audio.play().catch(() => {})
      }
    }, 1000)

    const handlePause = () => {
      if (!completedRef.current) {
        setTimeout(() => {
          if (!audio.ended && !completedRef.current) {
            audio.play().catch(() => {})
          }
        }, 100)
      }
    }

    audio.addEventListener('pause', handlePause)

    return () => {
      audio.removeEventListener('ended', handleEnded)
      audio.removeEventListener('timeupdate', handleTimeUpdate)
      audio.removeEventListener('pause', handlePause)
      clearInterval(keepAlive)
      audio.pause()
      // Stop background music
      bgAudio.pause()
      bgAudio.currentTime = 0
      bgAudioRef.current = null
    }
  }, [handleComplete])

  // Format time as M:SS
  const formatTime = (seconds: number) => {
    const mins = Math.floor(seconds / 60)
    const secs = Math.floor(seconds % 60)
    return `${mins}:${secs.toString().padStart(2, '0')}`
  }

  // Calculate progress percentage
  const audioDuration = 68.28 // from ffprobe
  const progressPercent = Math.min((currentTime / audioDuration) * 100, 100)

  return (
    <motion.div
      className="fixed inset-0 z-50 flex flex-col items-center select-none overflow-hidden"
      style={{ background: '#0a0a0a' }}
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      transition={{ duration: 0.5 }}
    >
      {/* Subtle background glow */}
      <div
        className="absolute inset-0"
        style={{
          background: 'radial-gradient(ellipse 60% 40% at 50% 30%, rgba(76, 175, 80, 0.04) 0%, transparent 70%), #0a0a0a',
        }}
      />

      {/* Audio element */}
      <audio ref={audioRef} src="/audio/call-audio.mp3" preload="auto" />

      {/* === HEADER: In call === */}
      <div className="relative z-10 mt-16 flex flex-col items-center">
        {/* EN LLAMADA label */}
        <span
          style={{
            fontFamily: "'Cinzel', serif",
            fontSize: 'clamp(0.6rem, 1.8vw, 0.72rem)',
            fontWeight: 500,
            color: '#4CAF50',
            letterSpacing: '0.2em',
            textTransform: 'uppercase',
          }}
        >
          EN LLAMADA
        </span>

        {/* Profile photo */}
        <div className="mt-5">
          <div
            style={{
              width: '80px',
              height: '80px',
              borderRadius: '50%',
              border: '2px solid #4CAF50',
              overflow: 'hidden',
              boxShadow: '0 0 20px rgba(76, 175, 80, 0.2)',
            }}
          >
            <img
              src="/images/dante-profile.jpg"
              alt="Dante"
              style={{
                width: '100%',
                height: '100%',
                objectFit: 'cover',
              }}
            />
          </div>
        </div>

        {/* Name */}
        <h1
          style={{
            fontFamily: "'Cinzel', serif",
            fontSize: 'clamp(1.2rem, 4.5vw, 1.6rem)',
            fontWeight: 700,
            color: '#FFFFFF',
            letterSpacing: '0.15em',
            marginTop: '0.75rem',
          }}
        >
          DANTE
        </h1>

        {/* Sound wave visualization */}
        <div className="flex items-center gap-1 mt-4" style={{ height: '24px' }}>
          {Array.from({ length: 7 }, (_, i) => (
            <motion.div
              key={i}
              style={{
                width: '3px',
                borderRadius: '2px',
                backgroundColor: isPlaying ? '#4CAF50' : 'rgba(76, 175, 80, 0.3)',
              }}
              animate={
                isPlaying
                  ? { height: [6, 20, 8, 16, 6], opacity: [0.6, 1, 0.7, 1, 0.6] }
                  : { height: [6], opacity: [0.3] }
              }
              transition={{
                duration: 1 + i * 0.15,
                repeat: Infinity,
                ease: 'easeInOut',
              }}
            />
          ))}
        </div>
      </div>

      {/* === BOTTOM: Audio progress bar === */}
      <div className="relative z-10 mt-auto w-full px-6 pb-12">
        {/* Progress bar */}
        <div className="w-full">
          {/* Current time only — no total duration shown */}
          <div className="flex justify-start mb-2">
            <span
              style={{
                fontFamily: "'Cinzel', serif",
                fontSize: 'clamp(0.65rem, 2vw, 0.8rem)',
                fontWeight: 600,
                color: '#4CAF50',
                letterSpacing: '0.05em',
                fontVariantNumeric: 'tabular-nums',
              }}
            >
              {formatTime(currentTime)}
            </span>
          </div>

          {/* Progress track */}
          <div
            style={{
              width: '100%',
              height: '4px',
              backgroundColor: 'rgba(255, 255, 255, 0.1)',
              borderRadius: '2px',
              overflow: 'hidden',
            }}
          >
            <motion.div
              style={{
                height: '100%',
                background: 'linear-gradient(90deg, #2E7D32, #4CAF50)',
                borderRadius: '2px',
                width: `${progressPercent}%`,
                boxShadow: '0 0 8px rgba(76, 175, 80, 0.4)',
              }}
              initial={{ width: 0 }}
              animate={{ width: `${progressPercent}%` }}
              transition={{ duration: 0.3 }}
            />
          </div>
        </div>

        {/* End call button */}
        <div className="flex justify-center mt-6">
          <button
            onClick={handleComplete}
            className="cursor-pointer border-none bg-transparent flex items-center justify-center"
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
                boxShadow: '0 0 20px rgba(211, 47, 47, 0.4), 0 4px 16px rgba(0,0,0,0.3)',
                transform: 'rotate(135deg)',
              }}
            >
              <svg width="24" height="24" viewBox="0 0 24 24" fill="white" stroke="none">
                <path d="M20.01 15.38c-1.23 0-2.42-.2-3.53-.56a.977.977 0 0 0-1.01.24l-1.57 1.97c-2.83-1.35-5.48-3.9-6.89-6.83l1.95-1.66c.27-.28.35-.67.24-1.02-.37-1.11-.56-2.3-.56-3.53 0-.54-.45-.99-.99-.99H4.19C3.65 3 3 3.24 3 3.99 3 13.28 10.73 21 20.01 21c.71 0 .99-.63.99-1.18v-3.45c0-.54-.45-.99-.99-.99z"/>
              </svg>
            </div>
          </button>
        </div>
      </div>
    </motion.div>
  )
}
