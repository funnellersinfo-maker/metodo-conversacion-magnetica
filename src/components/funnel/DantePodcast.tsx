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
  const [currentTime, setCurrentTime] = useState(0)
  const [duration, setDuration] = useState(0)
  const [liked, setLiked] = useState(false)
  const [heartScale, setHeartScale] = useState(1)
  const [glowIntensity, setGlowIntensity] = useState(0.12)
  const [waveformData, setWaveformData] = useState<number[]>(Array(32).fill(0.15))

  const handleComplete = useCallback(() => {
    if (completedRef.current) return
    completedRef.current = true
    setTimeout(() => { onComplete() }, 1500)
  }, [onComplete])

  // Setup Web Audio API
  const setupAudioContext = useCallback(() => {
    const audio = audioRef.current
    if (!audio || audioContextRef.current) return
    try {
      const ctx = new AudioContext()
      const analyser = ctx.createAnalyser()
      analyser.fftSize = 128
      analyser.smoothingTimeConstant = 0.82
      const source = ctx.createMediaElementSource(audio)
      source.connect(analyser)
      analyser.connect(ctx.destination)
      audioContextRef.current = ctx
      analyserRef.current = analyser
      sourceRef.current = source
    } catch { /* AudioContext not available */ }
  }, [])

  // Animate glow + waveform from audio
  useEffect(() => {
    if (!isPlaying) return
    const animate = () => {
      const analyser = analyserRef.current
      if (analyser) {
        const data = new Uint8Array(analyser.frequencyBinCount)
        analyser.getByteFrequencyData(data)
        let sum = 0
        for (let i = 0; i < data.length; i++) {
          sum += data[i] * (1 - (i / data.length) * 0.5)
        }
        setGlowIntensity(0.12 + (sum / data.length / 255) * 0.88)
        setWaveformData(Array.from(data.slice(0, 32), v => Math.max(0.06, v / 255)))
      }
      animFrameRef.current = requestAnimationFrame(animate)
    }
    animFrameRef.current = requestAnimationFrame(animate)
    return () => { if (animFrameRef.current) cancelAnimationFrame(animFrameRef.current) }
  }, [isPlaying])

  // Audio setup & events
  useEffect(() => {
    const audio = audioRef.current
    if (!audio) return

    const playAudio = async () => {
      try {
        setupAudioContext()
        if (audioContextRef.current?.state === 'suspended') await audioContextRef.current.resume()
        audio.volume = 1.0
        await audio.play()
        setIsPlaying(true)
      } catch { /* autoplay blocked */ }
    }
    playAudio()

    const onEnded = () => { setIsPlaying(false); setGlowIntensity(0.12); setWaveformData(Array(32).fill(0.15)); handleComplete() }
    const onTimeUpdate = () => setCurrentTime(audio.currentTime)
    const onLoadedMetadata = () => setDuration(audio.duration)
    const onPause = () => { setIsPlaying(false); setGlowIntensity(0.12); setWaveformData(Array(32).fill(0.15)) }
    const onPlay = () => { setIsPlaying(true); setupAudioContext(); if (audioContextRef.current?.state === 'suspended') audioContextRef.current.resume() }

    audio.addEventListener('ended', onEnded)
    audio.addEventListener('timeupdate', onTimeUpdate)
    audio.addEventListener('loadedmetadata', onLoadedMetadata)
    audio.addEventListener('pause', onPause)
    audio.addEventListener('play', onPlay)

    return () => {
      audio.removeEventListener('ended', onEnded)
      audio.removeEventListener('timeupdate', onTimeUpdate)
      audio.removeEventListener('loadedmetadata', onLoadedMetadata)
      audio.removeEventListener('pause', onPause)
      audio.removeEventListener('play', onPlay)
      audio.pause()
      if (animFrameRef.current) cancelAnimationFrame(animFrameRef.current)
      if (audioContextRef.current) audioContextRef.current.close().catch(() => {})
    }
  }, [handleComplete, setupAudioContext])

  const togglePlayPause = () => {
    const audio = audioRef.current
    if (!audio) return
    if (isPlaying) {
      audio.pause()
    } else {
      setupAudioContext()
      if (audioContextRef.current?.state === 'suspended') audioContextRef.current.resume()
      audio.play().catch(() => {})
    }
  }

  const handleLike = () => {
    if (liked) return
    setLiked(true)
    setHeartScale(1.4)
    setTimeout(() => setHeartScale(1), 300)
  }

  const formatTime = (s: number) => {
    if (!isFinite(s) || isNaN(s)) return '0:00'
    return `${Math.floor(s / 60)}:${Math.floor(s % 60).toString().padStart(2, '0')}`
  }

  const progress = duration > 0 ? Math.min((currentTime / duration) * 100, 100) : 0

  return (
    <motion.div
      className="fixed inset-0 z-50 flex flex-col select-none overflow-hidden"
      style={{ background: '#121212' }}
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      transition={{ duration: 0.5 }}
    >
      {/* ===== TOP BAR — Spotify style ===== */}
      <div
        className="flex items-center justify-between px-4 py-3 flex-shrink-0"
        style={{ background: 'rgba(18,18,18,0.95)' }}
      >
        {/* Close X */}
        <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="rgba(255,255,255,0.7)" strokeWidth="2" strokeLinecap="round">
          <line x1="18" y1="6" x2="6" y2="18" /><line x1="6" y1="6" x2="18" y2="18" />
        </svg>

        {/* Title */}
        <div className="flex flex-col items-center">
          <span style={{ fontFamily: "'Cinzel', serif", fontSize: 11, fontWeight: 600, color: 'rgba(255,255,255,0.5)', letterSpacing: '0.08em' }}>
            MÉTODO MAGNÉTICO
          </span>
          <span style={{ fontFamily: "'Cinzel', serif", fontSize: 9, color: 'rgba(255,255,255,0.3)', letterSpacing: '0.06em' }}>
            PODCAST
          </span>
        </div>

        {/* 3-dot menu */}
        <svg width="20" height="20" viewBox="0 0 24 24" fill="rgba(255,255,255,0.5)">
          <circle cx="12" cy="5" r="2" /><circle cx="12" cy="12" r="2" /><circle cx="12" cy="19" r="2" />
        </svg>
      </div>

      {/* ===== MAIN CONTENT ===== */}
      <div className="flex-1 flex flex-col items-center justify-center px-6 overflow-y-auto">

        {/* PODCAST COVER with RED GLOW */}
        <motion.div
          className="relative mb-6"
          initial={{ opacity: 0, scale: 0.88 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ delay: 0.2, duration: 0.7, type: 'spring', stiffness: 110 }}
        >
          {/* Audio-reactive RED GLOW — big, dramatic */}
          <div
            className="absolute pointer-events-none"
            style={{
              inset: '-30%',
              background: `radial-gradient(ellipse 60% 55% at 50% 50%, rgba(211,47,47,${0.3 * glowIntensity}) 0%, rgba(183,28,28,${0.18 * glowIntensity}) 35%, rgba(211,47,47,${0.06 * glowIntensity}) 55%, transparent 75%)`,
              filter: `blur(${25 + glowIntensity * 20}px)`,
              transition: 'background 0.12s ease-out, filter 0.12s ease-out',
            }}
          />
          {/* Secondary glow ring */}
          <div
            className="absolute pointer-events-none"
            style={{
              inset: '-45%',
              background: `radial-gradient(circle at 50% 50%, rgba(239,83,80,${0.1 * glowIntensity}) 0%, transparent 55%)`,
              filter: `blur(${35 + glowIntensity * 25}px)`,
              transition: 'background 0.15s ease-out, filter 0.15s ease-out',
            }}
          />

          {/* Cover image */}
          <div
            className="relative overflow-hidden rounded-lg"
            style={{
              width: 'clamp(240px, 70vw, 300px)',
              height: 'clamp(240px, 70vw, 300px)',
              boxShadow: `0 10px 50px rgba(0,0,0,0.7), 0 0 ${35 + glowIntensity * 50}px rgba(211,47,47,${0.2 + glowIntensity * 0.35})`,
              transition: 'box-shadow 0.12s ease-out',
            }}
          >
            <img src="/images/podcast-cover.png" alt="Podcast Cover" className="w-full h-full object-cover" />
            {/* Gradient overlay */}
            <div className="absolute inset-0" style={{ background: 'linear-gradient(180deg, transparent 35%, rgba(0,0,0,0.6) 100%)' }} />
            {/* ACCESO RESTRINGIDO stamp */}
            <div className="absolute top-3 right-3" style={{
              fontFamily: "'Cinzel', serif", fontSize: 'clamp(0.45rem, 1.3vw, 0.55rem)', fontWeight: 700,
              color: '#EF5350', letterSpacing: '0.1em', textTransform: 'uppercase',
              border: '1.5px solid rgba(239,83,80,0.7)', padding: '2px 6px', borderRadius: 2,
              transform: 'rotate(2deg)', opacity: 0.85,
            }}>
              ACCESO RESTRINGIDO
            </div>
            {/* Title on cover */}
            <div className="absolute bottom-0 left-0 right-0 p-4">
              <p style={{
                fontFamily: "'Cinzel', serif", fontSize: 'clamp(0.85rem, 3.2vw, 1.1rem)', fontWeight: 700,
                color: '#FFFFFF', letterSpacing: '0.05em', lineHeight: 1.2,
                textShadow: '0 2px 12px rgba(0,0,0,0.8)',
              }}>
                LA AUDITORÍA QUE NUNCA QUISISTE ESCUCHAR
              </p>
            </div>
          </div>
        </motion.div>

        {/* MÉTODO MAGNÉTICO PRESENTA */}
        <motion.p
          className="text-center mb-1"
          style={{ fontFamily: "'Cinzel', serif", fontSize: 'clamp(0.55rem, 1.8vw, 0.65rem)', fontWeight: 500, color: 'rgba(255,255,255,0.25)', letterSpacing: '0.2em', textTransform: 'uppercase' }}
          initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: 0.4, duration: 0.5 }}
        >
          MÉTODO MAGNÉTICO PRESENTA
        </motion.p>

        {/* Title */}
        <motion.h1
          className="text-center"
          style={{ fontFamily: "'Cinzel', serif", fontSize: 'clamp(1.4rem, 6vw, 1.9rem)', fontWeight: 700, color: '#FFFFFF', letterSpacing: '0.08em', lineHeight: 1.15 }}
          initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.5, duration: 0.5 }}
        >
          LA AUDITORÍA
        </motion.h1>
        <motion.p
          className="text-center"
          style={{ fontFamily: "'Cinzel', serif", fontSize: 'clamp(0.65rem, 2.2vw, 0.8rem)', fontWeight: 400, color: 'rgba(255,255,255,0.4)', letterSpacing: '0.06em' }}
          initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: 0.6, duration: 0.5 }}
        >
          QUE NUNCA QUISISTE ESCUCHAR
        </motion.p>
        <motion.p
          className="text-center mb-5"
          style={{ fontFamily: "'Cinzel', serif", fontSize: 'clamp(0.55rem, 1.8vw, 0.68rem)', fontWeight: 600, color: '#EF5350', letterSpacing: '0.1em', textShadow: '0 0 10px rgba(211,47,47,0.3)' }}
          initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: 0.7, duration: 0.5 }}
        >
          DANTE — MÉTODO MAGNÉTICO
        </motion.p>

        {/* ===== WAVEFORM — audio-reactive ===== */}
        <motion.div
          className="w-full flex items-end justify-center gap-[1.5px] mb-3"
          style={{ height: 24 }}
          initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: 0.8, duration: 0.4 }}
        >
          {waveformData.map((val, i) => (
            <div key={i} style={{
              width: 3, height: `${Math.max(6, val * 100)}%`, minHeight: 2, borderRadius: 1.5,
              background: isPlaying ? `rgba(239,83,80,${0.35 + val * 0.65})` : 'rgba(255,255,255,0.08)',
              transition: 'height 0.1s ease-out, background 0.1s ease-out',
              boxShadow: isPlaying && val > 0.6 ? `0 0 5px rgba(211,47,47,${val * 0.25})` : 'none',
            }} />
          ))}
        </motion.div>

        {/* ===== PROGRESS BAR — Spotify style ===== */}
        <motion.div className="w-full mb-1" initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: 0.9, duration: 0.4 }}>
          {/* Scrub bar */}
          <div className="w-full relative" style={{ height: 4, backgroundColor: 'rgba(255,255,255,0.1)', borderRadius: 2, overflow: 'hidden' }}>
            <div style={{
              height: '100%', width: `${progress}%`, borderRadius: 2,
              background: isPlaying ? '#EF5350' : 'rgba(255,255,255,0.3)',
              boxShadow: isPlaying ? '0 0 6px rgba(211,47,47,0.4)' : 'none',
              transition: 'width 0.3s linear, background 0.2s',
            }} />
          </div>
          {/* Time */}
          <div className="flex justify-between mt-1.5" style={{ fontFamily: "'Cinzel', serif", fontSize: 'clamp(0.55rem, 1.6vw, 0.65rem)', fontWeight: 500, color: 'rgba(255,255,255,0.35)', fontVariantNumeric: 'tabular-nums' }}>
            <span>{formatTime(currentTime)}</span>
            <span>{formatTime(duration)}</span>
          </div>
        </motion.div>

        {/* ===== CONTROL BUTTONS — Spotify style ===== */}
        <motion.div
          className="w-full flex items-center justify-between px-2 mt-2"
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 1.0, duration: 0.5 }}
        >
          {/* Shuffle — decorative */}
          <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="rgba(255,255,255,0.25)" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
            <polyline points="16 3 21 3 21 8" /><line x1="4" y1="20" x2="21" y2="3" /><polyline points="21 16 21 21 16 21" /><line x1="15" y1="15" x2="21" y2="21" /><line x1="4" y1="4" x2="9" y2="9" />
          </svg>

          {/* Previous — decorative */}
          <svg width="24" height="24" viewBox="0 0 24 24" fill="rgba(255,255,255,0.5)">
            <path d="M6 6h2v12H6zm3.5 6l8.5 6V6z" />
          </svg>

          {/* PLAY / PAUSE — the main functional button */}
          <button
            onClick={togglePlayPause}
            className="cursor-pointer border-none bg-transparent p-0 flex items-center justify-center"
            aria-label={isPlaying ? 'Pausar' : 'Reproducir'}
          >
            <div
              className="rounded-full flex items-center justify-center"
              style={{
                width: 56, height: 56,
                background: '#FFFFFF',
                boxShadow: `0 0 ${12 + glowIntensity * 18}px rgba(211,47,47,${0.2 + glowIntensity * 0.2}), 0 4px 12px rgba(0,0,0,0.3)`,
                transition: 'box-shadow 0.12s ease-out, transform 0.15s',
                transform: isPlaying ? 'scale(1)' : 'scale(0.95)',
              }}
            >
              {isPlaying ? (
                <svg width="22" height="22" viewBox="0 0 24 24" fill="#121212" stroke="none">
                  <rect x="6" y="4" width="4" height="16" rx="1" />
                  <rect x="14" y="4" width="4" height="16" rx="1" />
                </svg>
              ) : (
                <svg width="22" height="22" viewBox="0 0 24 24" fill="#121212" stroke="none" style={{ marginLeft: 2 }}>
                  <path d="M8 5v14l11-7z" />
                </svg>
              )}
            </div>
          </button>

          {/* Next — decorative */}
          <svg width="24" height="24" viewBox="0 0 24 24" fill="rgba(255,255,255,0.5)">
            <path d="M6 18l8.5-6L6 6v12zM16 6v12h2V6h-2z" />
          </svg>

          {/* Repeat — decorative */}
          <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="rgba(255,255,255,0.25)" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
            <polyline points="17 1 21 5 17 9" /><path d="M3 11V9a4 4 0 0 1 4-4h14" /><polyline points="7 23 3 19 7 15" /><path d="M21 13v2a4 4 0 0 1-4 4H3" />
          </svg>
        </motion.div>

        {/* ===== BOTTOM ACTIONS ROW — Spotify style ===== */}
        <motion.div
          className="w-full flex items-center justify-between px-1 mt-5 mb-4"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 1.2, duration: 0.5 }}
        >
          {/* Heart — THE ONLY TAPPABLE ACTION */}
          <button
            onClick={handleLike}
            className="cursor-pointer border-none bg-transparent p-0 flex items-center justify-center"
            aria-label="Me gusta"
          >
            <motion.div animate={{ scale: heartScale }} transition={{ type: 'spring', stiffness: 400, damping: 10 }}>
              {liked ? (
                <svg width="24" height="24" viewBox="0 0 24 24" fill="#EF5350" stroke="none" style={{ filter: 'drop-shadow(0 0 8px rgba(239,83,80,0.5))' }}>
                  <path d="M12 21.35l-1.45-1.32C5.4 15.36 2 12.28 2 8.5 2 5.42 4.42 3 7.5 3c1.74 0 3.41.81 4.5 2.09C13.09 3.81 14.76 3 16.5 3 19.58 3 22 5.42 22 8.5c0 3.78-3.4 6.86-8.55 11.54L12 21.35z" />
                </svg>
              ) : (
                <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="rgba(255,255,255,0.4)" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
                  <path d="M12 21.35l-1.45-1.32C5.4 15.36 2 12.28 2 8.5 2 5.42 4.42 3 7.5 3c1.74 0 3.41.81 4.5 2.09C13.09 3.81 14.76 3 16.5 3 19.58 3 22 5.42 22 8.5c0 3.78-3.4 6.86-8.55 11.54L12 21.35z" />
                </svg>
              )}
            </motion.div>
          </button>

          {/* Bullets / chapters list — decorative */}
          <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="rgba(255,255,255,0.3)" strokeWidth="1.5" strokeLinecap="round">
            <line x1="8" y1="6" x2="21" y2="6" /><line x1="8" y1="12" x2="21" y2="12" /><line x1="8" y1="18" x2="21" y2="18" /><line x1="3" y1="6" x2="3.01" y2="6" /><line x1="3" y1="12" x2="3.01" y2="12" /><line x1="3" y1="18" x2="3.01" y2="18" />
          </svg>

          {/* Share — decorative */}
          <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="rgba(255,255,255,0.3)" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
            <circle cx="18" cy="5" r="3" /><circle cx="6" cy="12" r="3" /><circle cx="18" cy="19" r="3" /><line x1="8.59" y1="13.51" x2="15.42" y2="17.49" /><line x1="15.41" y1="6.51" x2="8.59" y2="10.49" />
          </svg>

          {/* Queue / playlist — decorative */}
          <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="rgba(255,255,255,0.3)" strokeWidth="1.5" strokeLinecap="round">
            <line x1="8" y1="6" x2="21" y2="6" /><line x1="8" y1="12" x2="21" y2="12" /><line x1="8" y1="18" x2="21" y2="18" /><line x1="3" y1="6" x2="3.01" y2="6" /><line x1="3" y1="12" x2="3.01" y2="12" /><line x1="3" y1="18" x2="3.01" y2="18" />
          </svg>

          {/* Volume / speaker — decorative */}
          <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="rgba(255,255,255,0.3)" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
            <polygon points="11 5 6 9 2 9 2 15 6 15 11 19 11 5" /><path d="M19.07 4.93a10 10 0 0 1 0 14.14M15.54 8.46a5 5 0 0 1 0 7.07" />
          </svg>
        </motion.div>
      </div>
    </motion.div>
  )
}
