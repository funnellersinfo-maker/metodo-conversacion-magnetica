'use client'

import { useEffect, useRef, useState, useCallback } from 'react'
import { motion } from 'framer-motion'

interface DantePodcastProps {
  onComplete: () => void
}

export default function DantePodcast({ onComplete }: DantePodcastProps) {
  const audioRef = useRef<HTMLAudioElement>(null)
  const audioContextRef = useRef<AudioContext | null>(null)
  const analyserRef = useRef<AnalyserNode | null>(null)
  const sourceRef = useRef<MediaElementAudioSourceNode | null>(null)
  const animFrameRef = useRef<number>(0)
  const completedRef = useRef(false)

  const [isPlaying, setIsPlaying] = useState(false)
  const [hasPlayedOnce, setHasPlayedOnce] = useState(false)
  const [currentTime, setCurrentTime] = useState(0)
  const [duration, setDuration] = useState(0)
  const [liked, setLiked] = useState(false)
  const [heartScale, setHeartScale] = useState(1)
  const [glowIntensity, setGlowIntensity] = useState(0.15)
  const [waveformData, setWaveformData] = useState<number[]>(Array(40).fill(0.2))

  const handleComplete = useCallback(() => {
    if (completedRef.current) return
    completedRef.current = true
    setTimeout(() => {
      onComplete()
    }, 1500)
  }, [onComplete])

  // Setup Web Audio API for audio-reactive glow
  const setupAudioContext = useCallback(() => {
    const audio = audioRef.current
    if (!audio || audioContextRef.current) return

    try {
      const ctx = new AudioContext()
      const analyser = ctx.createAnalyser()
      analyser.fftSize = 128
      analyser.smoothingTimeConstant = 0.8

      const source = ctx.createMediaElementSource(audio)
      source.connect(analyser)
      analyser.connect(ctx.destination)

      audioContextRef.current = ctx
      analyserRef.current = analyser
      sourceRef.current = source
    } catch {
      // AudioContext not available
    }
  }, [])

  // Animate glow + waveform from audio data
  useEffect(() => {
    if (!isPlaying) return

    const animate = () => {
      const analyser = analyserRef.current
      if (analyser) {
        const dataArray = new Uint8Array(analyser.frequencyBinCount)
        analyser.getByteFrequencyData(dataArray)

        // Calculate average intensity for glow (bass-heavy weighting)
        let sum = 0
        const binCount = dataArray.length
        for (let i = 0; i < binCount; i++) {
          const weight = 1 - (i / binCount) * 0.5 // bass gets more weight
          sum += dataArray[i] * weight
        }
        const avg = sum / binCount / 255
        setGlowIntensity(0.15 + avg * 0.85) // range 0.15 to 1.0

        // Generate waveform data for visualization
        const wave = Array.from(dataArray.slice(0, 40), v => Math.max(0.08, v / 255))
        setWaveformData(wave)
      }

      animFrameRef.current = requestAnimationFrame(animate)
    }

    animFrameRef.current = requestAnimationFrame(animate)

    return () => {
      if (animFrameRef.current) {
        cancelAnimationFrame(animFrameRef.current)
      }
    }
  }, [isPlaying])

  useEffect(() => {
    const audio = audioRef.current
    if (!audio) return

    const playAudio = async () => {
      try {
        setupAudioContext()
        if (audioContextRef.current?.state === 'suspended') {
          await audioContextRef.current.resume()
        }
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
      setGlowIntensity(0.15)
      setWaveformData(Array(40).fill(0.2))
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
      setGlowIntensity(0.15)
      setWaveformData(Array(40).fill(0.2))
    }
    const handlePlay = () => {
      setIsPlaying(true)
      setHasPlayedOnce(true)
      setupAudioContext()
      if (audioContextRef.current?.state === 'suspended') {
        audioContextRef.current.resume()
      }
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
      if (animFrameRef.current) cancelAnimationFrame(animFrameRef.current)
      if (audioContextRef.current) {
        audioContextRef.current.close().catch(() => {})
      }
    }
  }, [handleComplete, setupAudioContext])

  const togglePlayPause = () => {
    const audio = audioRef.current
    if (!audio) return
    if (isPlaying) {
      audio.pause()
      setGlowIntensity(0.15)
      setWaveformData(Array(40).fill(0.2))
    } else {
      setupAudioContext()
      if (audioContextRef.current?.state === 'suspended') {
        audioContextRef.current.resume()
      }
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
      className="fixed inset-0 z-50 flex flex-col items-center justify-center select-none overflow-hidden"
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
            'repeating-linear-gradient(0deg, transparent, transparent 2px, rgba(0,0,0,0.03) 2px, rgba(0,0,0,0.03) 4px)',
          opacity: 0.5,
          zIndex: 1,
        }}
      />

      {/* AUDIO — podcast file */}
      <audio ref={audioRef} src="/audio/podcast.aac" preload="auto" crossOrigin="anonymous" />

      {/* Main content */}
      <motion.div
        className="relative z-10 w-full max-w-sm mx-auto px-6 flex flex-col items-center"
        initial={{ opacity: 0, y: 30 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.2, duration: 0.7, ease: [0.22, 1, 0.36, 1] }}
      >
        {/* MÉTODO MAGNÉTICO PRESENTA */}
        <motion.p
          className="text-center mb-4"
          style={{
            fontFamily: "'Cinzel', serif",
            fontSize: 'clamp(0.6rem, 2vw, 0.72rem)',
            fontWeight: 500,
            color: 'rgba(255, 255, 255, 0.3)',
            letterSpacing: '0.2em',
            textTransform: 'uppercase',
          }}
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.4, duration: 0.5 }}
        >
          MÉTODO MAGNÉTICO PRESENTA
        </motion.p>

        {/* PODCAST COVER with BIG RED GLOW that moves with audio */}
        <motion.div
          className="relative mb-6"
          initial={{ opacity: 0, scale: 0.85 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ delay: 0.5, duration: 0.6, type: 'spring', stiffness: 120 }}
        >
          {/* RED GLOW — audio-reactive, big, dramatic */}
          <div
            className="absolute inset-0 pointer-events-none"
            style={{
              background: `radial-gradient(ellipse 70% 70% at 50% 50%, rgba(211, 47, 47, ${0.25 * glowIntensity}) 0%, rgba(183, 28, 28, ${0.15 * glowIntensity}) 30%, rgba(211, 47, 47, ${0.08 * glowIntensity}) 50%, transparent 70%)`,
              transform: `scale(${1.3 + glowIntensity * 0.4})`,
              filter: `blur(${20 + glowIntensity * 15}px)`,
              transition: 'transform 0.1s ease-out, filter 0.1s ease-out, background 0.1s ease-out',
              zIndex: 0,
            }}
          />

          {/* Secondary pulsing ring */}
          <div
            className="absolute inset-0 pointer-events-none"
            style={{
              background: `radial-gradient(circle at 50% 50%, rgba(239, 83, 80, ${0.12 * glowIntensity}) 0%, transparent 60%)`,
              transform: `scale(${1.5 + glowIntensity * 0.6})`,
              filter: `blur(${30 + glowIntensity * 20}px)`,
              transition: 'transform 0.15s ease-out, filter 0.15s ease-out, background 0.15s ease-out',
              zIndex: 0,
            }}
          />

          {/* Cover image */}
          <div
            className="relative overflow-hidden rounded-xl"
            style={{
              width: 'clamp(220px, 65vw, 280px)',
              height: 'clamp(220px, 65vw, 280px)',
              boxShadow: `0 8px 40px rgba(0,0,0,0.6), 0 0 ${30 + glowIntensity * 40}px rgba(211, 47, 47, ${0.2 + glowIntensity * 0.3})`,
              transition: 'box-shadow 0.1s ease-out',
              zIndex: 1,
            }}
          >
            <img
              src="/images/podcast-cover.png"
              alt="Método Magnético — Podcast Cover"
              className="w-full h-full object-cover"
            />

            {/* Dark gradient overlay at bottom of cover for text readability */}
            <div className="absolute inset-0" style={{
              background: 'linear-gradient(180deg, transparent 30%, rgba(0,0,0,0.65) 100%)',
            }} />

            {/* ACCESO RESTRINGIDO stamp */}
            <div
              className="absolute top-3 right-3"
              style={{
                fontFamily: "'Cinzel', serif",
                fontSize: 'clamp(0.5rem, 1.5vw, 0.6rem)',
                fontWeight: 700,
                color: '#EF5350',
                letterSpacing: '0.12em',
                textTransform: 'uppercase',
                border: '1.5px solid #EF5350',
                padding: '2px 6px',
                borderRadius: 2,
                transform: 'rotate(3deg)',
                opacity: 0.8,
              }}
            >
              ACCESO RESTRINGIDO
            </div>

            {/* Title overlay on cover */}
            <div className="absolute bottom-0 left-0 right-0 p-4">
              <p
                style={{
                  fontFamily: "'Cinzel', serif",
                  fontSize: 'clamp(0.95rem, 3.5vw, 1.25rem)',
                  fontWeight: 700,
                  color: '#FFFFFF',
                  letterSpacing: '0.06em',
                  lineHeight: 1.25,
                  textShadow: '0 2px 15px rgba(0,0,0,0.8)',
                }}
              >
                LA AUDITORÍA QUE NUNCA QUISISTE ESCUCHAR
              </p>
            </div>
          </div>
        </motion.div>

        {/* LA AUDITORÍA — title below cover */}
        <motion.h1
          className="text-center"
          style={{
            fontFamily: "'Cinzel', serif",
            fontSize: 'clamp(1.6rem, 7vw, 2.2rem)',
            fontWeight: 700,
            color: '#FFFFFF',
            letterSpacing: '0.1em',
            lineHeight: 1.1,
            textShadow: '0 2px 15px rgba(0,0,0,0.6)',
          }}
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.7, duration: 0.5 }}
        >
          LA AUDITORÍA
        </motion.h1>

        {/* QUE NUNCA QUISISTE ESCUCHAR — subtitle */}
        <motion.p
          className="text-center mb-6"
          style={{
            fontFamily: "'Cinzel', serif",
            fontSize: 'clamp(0.7rem, 2.5vw, 0.85rem)',
            fontWeight: 400,
            color: 'rgba(255, 255, 255, 0.4)',
            letterSpacing: '0.08em',
          }}
          initial={{ opacity: 0, y: 8 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.85, duration: 0.5 }}
        >
          QUE NUNCA QUISISTE ESCUCHAR
        </motion.p>

        {/* Progress bar — RED */}
        <motion.div
          className="w-full mb-2"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 1.0, duration: 0.4 }}
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
            <div
              style={{
                height: '100%',
                background: 'linear-gradient(90deg, #B71C1C, #EF5350)',
                borderRadius: '2px',
                width: `${progressPercent}%`,
                boxShadow: '0 0 8px rgba(211, 47, 47, 0.4)',
                transition: 'width 0.3s ease',
              }}
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

        {/* Waveform visualization — RED bars that react to audio */}
        <motion.div
          className="w-full flex items-end justify-center gap-[2px] mb-4"
          style={{ height: 28 }}
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 1.1, duration: 0.4 }}
        >
          {waveformData.map((val, i) => (
            <div
              key={i}
              style={{
                width: 3,
                height: `${Math.max(8, val * 100)}%`,
                minHeight: 3,
                borderRadius: 1.5,
                background: isPlaying
                  ? `rgba(239, 83, 80, ${0.4 + val * 0.6})`
                  : 'rgba(255, 255, 255, 0.1)',
                transition: 'height 0.08s ease-out, background 0.08s ease-out',
                boxShadow: isPlaying && val > 0.5 ? `0 0 4px rgba(211, 47, 47, ${val * 0.3})` : 'none',
              }}
            />
          ))}
        </motion.div>

        {/* Controls row: play + heart */}
        <motion.div
          className="flex items-center justify-center gap-8"
          initial={{ opacity: 0, scale: 0.5 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ delay: 1.2, duration: 0.5, type: 'spring', stiffness: 150 }}
        >
          {/* Play/Pause button */}
          <button
            onClick={togglePlayPause}
            className="relative cursor-pointer border-none bg-transparent p-0 flex items-center justify-center"
            aria-label={isPlaying ? 'Pausar' : 'Reproducir'}
          >
            {/* Glow ring — RED, audio-reactive */}
            <div
              className="absolute rounded-full"
              style={{
                width: '72px',
                height: '72px',
                background: `radial-gradient(circle, rgba(211, 47, 47, ${0.15 + glowIntensity * 0.2}) 0%, transparent 70%)`,
                transition: 'background 0.1s ease-out',
              }}
            />

            {/* Main button circle */}
            <div
              className="relative rounded-full flex items-center justify-center"
              style={{
                width: '60px',
                height: '60px',
                background: 'linear-gradient(135deg, #B71C1C, #D32F2F)',
                boxShadow: `0 0 ${15 + glowIntensity * 20}px rgba(211, 47, 47, ${0.3 + glowIntensity * 0.2}), 0 4px 16px rgba(0,0,0,0.4), inset 0 1px 0 rgba(255,255,255,0.1)`,
                transition: 'box-shadow 0.1s ease-out',
              }}
            >
              {isPlaying ? (
                <svg width="22" height="22" viewBox="0 0 24 24" fill="white" stroke="none">
                  <rect x="6" y="4" width="4" height="16" rx="1" />
                  <rect x="14" y="4" width="4" height="16" rx="1" />
                </svg>
              ) : (
                <svg width="22" height="22" viewBox="0 0 24 24" fill="white" stroke="none" style={{ marginLeft: '3px' }}>
                  <path d="M8 5v14l11-7z" />
                </svg>
              )}
            </div>
          </button>

          {/* Heart / Like button */}
          <button
            onClick={handleLike}
            className="cursor-pointer border-none bg-transparent p-2 flex items-center justify-center"
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
                <svg
                  width="28"
                  height="28"
                  viewBox="0 0 24 24"
                  fill="none"
                  stroke="rgba(255,255,255,0.35)"
                  strokeWidth="1.5"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                >
                  <path d="M12 21.35l-1.45-1.32C5.4 15.36 2 12.28 2 8.5 2 5.42 4.42 3 7.5 3c1.74 0 3.41.81 4.5 2.09C13.09 3.81 14.76 3 16.5 3 19.58 3 22 5.42 22 8.5c0 3.78-3.4 6.86-8.55 11.54L12 21.35z" />
                </svg>
              )}
            </motion.div>
          </button>
        </motion.div>

        {/* DANTE — MÉTODO MAGNÉTICO */}
        <motion.p
          className="text-center mt-6"
          style={{
            fontFamily: "'Cinzel', serif",
            fontSize: 'clamp(0.6rem, 2vw, 0.72rem)',
            fontWeight: 600,
            color: '#EF5350',
            letterSpacing: '0.12em',
            textShadow: '0 0 10px rgba(211, 47, 47, 0.3)',
          }}
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 1.4, duration: 0.5 }}
        >
          DANTE — MÉTODO MAGNÉTICO
        </motion.p>
      </motion.div>
    </motion.div>
  )
}
