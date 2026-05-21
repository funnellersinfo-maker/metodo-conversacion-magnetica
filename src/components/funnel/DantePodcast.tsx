'use client'

import { useEffect, useRef, useState, useCallback } from 'react'
import { motion } from 'framer-motion'

interface DantePodcastProps {
  onComplete: () => void
}

export default function DantePodcast({ onComplete }: DantePodcastProps) {
  const audioRef = useRef<HTMLAudioElement>(null)
  const completedRef = useRef(false)
  const [isPlaying, setIsPlaying] = useState(false)
  const [hasPlayedOnce, setHasPlayedOnce] = useState(false)
  const [currentTime, setCurrentTime] = useState(0)
  const [duration, setDuration] = useState(0)
  const [liked, setLiked] = useState(false)
  const [heartScale, setHeartScale] = useState(1)
  const [shimmerKey, setShimmerKey] = useState(0)

  const handleComplete = useCallback(() => {
    if (completedRef.current) return
    completedRef.current = true
    setTimeout(() => {
      onComplete()
    }, 1500)
  }, [onComplete])

  useEffect(() => {
    const audio = audioRef.current
    if (!audio) return

    const playAudio = async () => {
      try {
        audio.volume = 1.0
        await audio.play()
        setIsPlaying(true)
        setHasPlayedOnce(true)
      } catch {
        // Browser may block autoplay
      }
    }

    playAudio()

    const handleEnded = () => {
      setIsPlaying(false)
      handleComplete()
    }

    const handleTimeUpdate = () => {
      setCurrentTime(audio.currentTime)
    }

    const handleLoadedMetadata = () => {
      setDuration(audio.duration)
    }

    const handlePause = () => {
      setIsPlaying(false)
    }

    const handlePlay = () => {
      setIsPlaying(true)
      setHasPlayedOnce(true)
    }

    audio.addEventListener('ended', handleEnded)
    audio.addEventListener('timeupdate', handleTimeUpdate)
    audio.addEventListener('loadedmetadata', handleLoadedMetadata)
    audio.addEventListener('pause', handlePause)
    audio.addEventListener('play', handlePlay)

    return () => {
      audio.removeEventListener('ended', handleEnded)
      audio.removeEventListener('timeupdate', handleTimeUpdate)
      audio.removeEventListener('loadedmetadata', handleLoadedMetadata)
      audio.removeEventListener('pause', handlePause)
      audio.removeEventListener('play', handlePlay)
      audio.pause()
    }
  }, [handleComplete])

  // Shimmer animation loop for play button
  useEffect(() => {
    if (hasPlayedOnce) return
    const interval = setInterval(() => {
      setShimmerKey(k => k + 1)
    }, 2000)
    return () => clearInterval(interval)
  }, [hasPlayedOnce])

  const togglePlayPause = () => {
    const audio = audioRef.current
    if (!audio) return
    if (isPlaying) {
      audio.pause()
    } else {
      audio.play().catch(() => {})
    }
  }

  const handleLike = () => {
    if (liked) return
    setLiked(true)
    setHeartScale(1.35)
    setTimeout(() => setHeartScale(1), 300)
  }

  const formatTime = (seconds: number) => {
    if (!isFinite(seconds) || isNaN(seconds)) return '0:00'
    const mins = Math.floor(seconds / 60)
    const secs = Math.floor(seconds % 60)
    return `${mins}:${secs.toString().padStart(2, '0')}`
  }

  const progressPercent = duration > 0 ? Math.min((currentTime / duration) * 100, 100) : 0

  return (
    <motion.div
      className="fixed inset-0 z-50 flex items-center justify-center select-none overflow-hidden"
      style={{ background: '#0a0a0a' }}
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      transition={{ duration: 0.6 }}
    >
      {/* Scan lines overlay */}
      <div
        className="absolute inset-0 pointer-events-none"
        style={{
          backgroundImage:
            'repeating-linear-gradient(0deg, transparent, transparent 2px, rgba(0,0,0,0.04) 2px, rgba(0,0,0,0.04) 4px)',
          opacity: 0.5,
          zIndex: 1,
        }}
      />

      {/* Subtle radial glow — RED for podcast */}
      <div
        className="absolute inset-0 pointer-events-none"
        style={{
          background:
            'radial-gradient(ellipse 50% 50% at 50% 40%, rgba(211, 47, 47, 0.06) 0%, transparent 70%)',
          zIndex: 1,
        }}
      />

      {/* PODCAST AUDIO — archivo de podcast, NO call-audio */}
      <audio ref={audioRef} src="/audio/podcast.aac" preload="auto" />

      {/* Main player card — RED shadow theme */}
      <motion.div
        className="relative z-10 w-full max-w-sm mx-4 flex flex-col items-center rounded-2xl p-6 sm:p-8"
        style={{
          background: 'rgba(18, 18, 18, 0.85)',
          backdropFilter: 'blur(20px)',
          border: '1px solid rgba(211, 47, 47, 0.15)',
          boxShadow:
            '0 0 40px rgba(211, 47, 47, 0.08), 0 0 80px rgba(211, 47, 47, 0.04), inset 0 1px 0 rgba(255,255,255,0.03)',
        }}
        initial={{ opacity: 0, y: 40 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.2, duration: 0.7, ease: [0.22, 1, 0.36, 1] }}
      >
        {/* Border glow pulse — RED */}
        <motion.div
          className="absolute inset-0 rounded-2xl pointer-events-none"
          style={{
            border: '1px solid rgba(211, 47, 47, 0.1)',
          }}
          animate={{
            boxShadow: [
              '0 0 15px rgba(211, 47, 47, 0.04), inset 0 0 15px rgba(211, 47, 47, 0.01)',
              '0 0 25px rgba(211, 47, 47, 0.1), inset 0 0 25px rgba(211, 47, 47, 0.02)',
              '0 0 15px rgba(211, 47, 47, 0.04), inset 0 0 15px rgba(211, 47, 47, 0.01)',
            ],
          }}
          transition={{ duration: 4, repeat: Infinity, ease: 'easeInOut' }}
        />

        {/* PODCAST COVER — portada dedicada del podcast */}
        <motion.div
          className="w-48 h-48 sm:w-56 sm:h-56 rounded-xl overflow-hidden mb-6 relative"
          style={{
            boxShadow:
              '0 8px 32px rgba(0,0,0,0.5), 0 0 30px rgba(211, 47, 47, 0.15)',
          }}
          initial={{ opacity: 0, scale: 0.85 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ delay: 0.4, duration: 0.6, type: 'spring', stiffness: 120 }}
        >
          <img
            src="/images/podcast-cover.png"
            alt="Método Magnético — Podcast Cover"
            className="w-full h-full object-cover"
          />
          {/* Red shadow overlay on cover */}
          <div className="absolute inset-0" style={{
            background: 'linear-gradient(180deg, transparent 40%, rgba(211, 47, 47, 0.12) 100%)',
          }} />
        </motion.div>

        {/* Title */}
        <motion.h1
          className="text-center mb-1"
          style={{
            fontFamily: "'Cinzel', serif",
            fontSize: 'clamp(1.3rem, 5vw, 1.7rem)',
            fontWeight: 700,
            color: '#FFFFFF',
            letterSpacing: '0.14em',
            lineHeight: 1.2,
            textShadow: '0 2px 12px rgba(0,0,0,0.6)',
          }}
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.6, duration: 0.5 }}
        >
          MÉTODO MAGNÉTICO
        </motion.h1>

        {/* Subtitle — RED accent */}
        <motion.p
          className="text-center mb-8"
          style={{
            fontFamily: "'Cinzel', serif",
            fontSize: 'clamp(0.75rem, 2.5vw, 0.9rem)',
            fontWeight: 500,
            color: '#EF5350',
            letterSpacing: '0.08em',
            textShadow: '0 0 10px rgba(211, 47, 47, 0.3)',
          }}
          initial={{ opacity: 0, y: 8 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.75, duration: 0.5 }}
        >
          Capítulo 1 — El Cortocircuito
        </motion.p>

        {/* Progress bar — RED */}
        <motion.div
          className="w-full mb-3"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.9, duration: 0.4 }}
        >
          <div
            className="w-full relative"
            style={{
              height: '3px',
              backgroundColor: 'rgba(255, 255, 255, 0.08)',
              borderRadius: '2px',
              overflow: 'hidden',
            }}
          >
            <motion.div
              style={{
                height: '100%',
                background: 'linear-gradient(90deg, #B71C1C, #EF5350)',
                borderRadius: '2px',
                width: `${progressPercent}%`,
                boxShadow: '0 0 8px rgba(211, 47, 47, 0.4)',
              }}
              animate={{ width: `${progressPercent}%` }}
              transition={{ duration: 0.3 }}
            />
          </div>

          {/* Time display */}
          <div
            className="flex justify-between mt-2"
            style={{
              fontFamily: "'Cinzel', serif",
              fontSize: 'clamp(0.6rem, 1.8vw, 0.72rem)',
              fontWeight: 600,
              color: 'rgba(255, 255, 255, 0.35)',
              letterSpacing: '0.04em',
              fontVariantNumeric: 'tabular-nums',
            }}
          >
            <span>{formatTime(currentTime)}</span>
            <span>{formatTime(duration)}</span>
          </div>
        </motion.div>

        {/* Play/Pause button — RED theme */}
        <motion.div
          className="flex items-center justify-center my-4"
          initial={{ opacity: 0, scale: 0.5 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ delay: 1.0, duration: 0.5, type: 'spring', stiffness: 150 }}
        >
          <button
            onClick={togglePlayPause}
            className="relative cursor-pointer border-none bg-transparent p-0 flex items-center justify-center"
            aria-label={isPlaying ? 'Pausar' : 'Reproducir'}
          >
            {/* Glow ring behind button — RED */}
            <motion.div
              className="absolute rounded-full"
              style={{
                width: '76px',
                height: '76px',
                background: 'radial-gradient(circle, rgba(211, 47, 47, 0.15) 0%, transparent 70%)',
              }}
              animate={{
                scale: isPlaying ? [1, 1.15, 1] : 1,
                opacity: isPlaying ? [0.6, 1, 0.6] : 0.5,
              }}
              transition={{
                duration: 2,
                repeat: Infinity,
                ease: 'easeInOut',
              }}
            />

            {/* Magic shimmer — only before first play */}
            {!hasPlayedOnce && (
              <motion.div
                key={shimmerKey}
                className="absolute rounded-full"
                style={{
                  width: '64px',
                  height: '64px',
                  background:
                    'conic-gradient(from 0deg, transparent 0%, rgba(211, 47, 47, 0.2) 25%, transparent 50%)',
                }}
                initial={{ rotate: 0, opacity: 0.8 }}
                animate={{ rotate: 360, opacity: 0 }}
                transition={{ duration: 2, ease: 'easeInOut' }}
              />
            )}

            {/* Main button circle — RED gradient */}
            <motion.div
              className="relative rounded-full flex items-center justify-center"
              style={{
                width: '64px',
                height: '64px',
                background: 'linear-gradient(135deg, #B71C1C, #D32F2F)',
                boxShadow:
                  '0 0 20px rgba(211, 47, 47, 0.3), 0 4px 16px rgba(0,0,0,0.4), inset 0 1px 0 rgba(255,255,255,0.1)',
              }}
              whileHover={{
                boxShadow:
                  '0 0 30px rgba(211, 47, 47, 0.45), 0 4px 16px rgba(0,0,0,0.4), inset 0 1px 0 rgba(255,255,255,0.1)',
              }}
              whileTap={{ scale: 0.93 }}
            >
              {isPlaying ? (
                <svg width="24" height="24" viewBox="0 0 24 24" fill="white" stroke="none">
                  <rect x="6" y="4" width="4" height="16" rx="1" />
                  <rect x="14" y="4" width="4" height="16" rx="1" />
                </svg>
              ) : (
                <svg width="24" height="24" viewBox="0 0 24 24" fill="white" stroke="none" style={{ marginLeft: '3px' }}>
                  <path d="M8 5v14l11-7z" />
                </svg>
              )}
            </motion.div>
          </button>
        </motion.div>

        {/* Heart / Like button */}
        <motion.div
          className="mt-2 flex items-center justify-center"
          initial={{ opacity: 0, y: 8 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 1.2, duration: 0.5 }}
        >
          <button
            onClick={handleLike}
            className="cursor-pointer border-none bg-transparent p-3 flex items-center justify-center"
            aria-label="Me gusta"
          >
            <motion.div
              animate={{ scale: heartScale }}
              transition={{ type: 'spring', stiffness: 400, damping: 10 }}
            >
              {liked ? (
                <svg
                  width="28"
                  height="28"
                  viewBox="0 0 24 24"
                  fill="#EF5350"
                  stroke="none"
                  style={{
                    filter: 'drop-shadow(0 0 8px rgba(239, 83, 80, 0.5))',
                  }}
                >
                  <path d="M12 21.35l-1.45-1.32C5.4 15.36 2 12.28 2 8.5 2 5.42 4.42 3 7.5 3c1.74 0 3.41.81 4.5 2.09C13.09 3.81 14.76 3 16.5 3 19.58 3 22 5.42 22 8.5c0 3.78-3.4 6.86-8.55 11.54L12 21.35z" />
                </svg>
              ) : (
                <div className="relative">
                  <motion.svg
                    width="28"
                    height="28"
                    viewBox="0 0 24 24"
                    fill="none"
                    stroke="rgba(255,255,255,0.35)"
                    strokeWidth="1.5"
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    animate={{
                      stroke: [
                        'rgba(255,255,255,0.25)',
                        'rgba(255,255,255,0.5)',
                        'rgba(255,255,255,0.25)',
                      ],
                    }}
                    transition={{ duration: 2.5, repeat: Infinity, ease: 'easeInOut' }}
                  >
                    <path d="M12 21.35l-1.45-1.32C5.4 15.36 2 12.28 2 8.5 2 5.42 4.42 3 7.5 3c1.74 0 3.41.81 4.5 2.09C13.09 3.81 14.76 3 16.5 3 19.58 3 22 5.42 22 8.5c0 3.78-3.4 6.86-8.55 11.54L12 21.35z" />
                  </motion.svg>
                  <motion.div
                    className="absolute inset-0 rounded-full pointer-events-none"
                    style={{
                      background:
                        'radial-gradient(circle at 50% 50%, rgba(239, 83, 80, 0.08) 0%, transparent 70%)',
                    }}
                    animate={{
                      opacity: [0.3, 0.7, 0.3],
                      scale: [0.9, 1.1, 0.9],
                    }}
                    transition={{ duration: 3, repeat: Infinity, ease: 'easeInOut' }}
                  />
                </div>
              )}
            </motion.div>

            {liked && (
              <motion.span
                className="ml-2"
                style={{
                  fontFamily: "'Cinzel', serif",
                  fontSize: '0.7rem',
                  fontWeight: 600,
                  color: '#EF5350',
                  letterSpacing: '0.06em',
                  textShadow: '0 0 8px rgba(239, 83, 80, 0.3)',
                }}
                initial={{ opacity: 0, x: -5 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ duration: 0.4 }}
              >
                TE GUSTA
              </motion.span>
            )}
          </button>
        </motion.div>
      </motion.div>
    </motion.div>
  )
}
