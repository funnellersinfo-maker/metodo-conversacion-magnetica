'use client'

import { useEffect, useRef, useCallback, useState } from 'react'
import { motion, AnimatePresence } from 'framer-motion'

interface AudioCallScreenProps {
  onComplete: () => void
}

// Teleprompter captions — REAL transcript, ~35% faster than audio for teleprompter feel
// Timing multiplied by ~0.65 so text appears ahead of voice
const CAPTIONS: { start: number; end: number; text: string }[] = [
  { start: 0, end: 1, text: 'Conectando...' },
  { start: 1, end: 2.6, text: 'Hey, no cuelgues.' },
  { start: 2.6, end: 4.5, text: 'Tienes suerte de haber atendido.' },
  { start: 4.5, end: 6.8, text: 'La mayoría de los hombres están ahí fuera gritando por atención...' },
  { start: 6.8, end: 9.1, text: 'Y tú... tú acabas de entrar en la frecuencia correcta.' },
  { start: 9.1, end: 11.4, text: 'Hace años la atracción era una especie de alquimia.' },
  { start: 11.4, end: 14, text: 'Había misterio, había silencios que decían más que mil palabras.' },
  { start: 14, end: 15.9, text: 'Pero algo se rompió.' },
  { start: 15.9, end: 18.8, text: 'El mundo se llenó de plantillas baratas y frases de copia y pega...' },
  { start: 18.8, end: 21.4, text: 'Que ella ya detecta en menos de siete segundos.' },
  { start: 21.4, end: 23.4, text: 'Te has vuelto predecible.' },
  { start: 23.4, end: 25.7, text: 'Y en la biología del deseo... lo predecible es invisible.' },
  { start: 25.7, end: 27.9, text: 'Ella no te ignora porque no le gustes.' },
  { start: 27.9, end: 30.5, text: 'Te ignora porque ya sabe exactamente qué vas a decir después.' },
  { start: 30.5, end: 32.5, text: 'Eres un eco más en su bandeja de entrada.' },
  { start: 32.5, end: 35.1, text: 'Pero escucha bien... porque lo que estoy a punto de revelarte es el cortocircuito.' },
  { start: 35.1, end: 37.7, text: 'Un sistema que ella no puede ignorar porque le habla directamente a su instinto.' },
  { start: 37.7, end: 44.4, text: 'No cuelgues... el primer capítulo está por desbloquearse.' },
]

export default function AudioCallScreen({ onComplete }: AudioCallScreenProps) {
  const audioRef = useRef<HTMLAudioElement>(null)
  const bgAudioRef = useRef<HTMLAudioElement | null>(null)
  const analyserRef = useRef<AnalyserNode | null>(null)
  const animFrameRef = useRef<number | null>(null)
  const completedRef = useRef(false)
  const bgStartedRef = useRef(false)
  const [currentTime, setCurrentTime] = useState(0)
  const [isPlaying, setIsPlaying] = useState(false)
  const [frequencyData, setFrequencyData] = useState<number[]>(Array(24).fill(0))
  const [activeCaption, setActiveCaption] = useState('Conectando...')

  const handleComplete = useCallback(() => {
    if (completedRef.current) return
    completedRef.current = true
    if (bgAudioRef.current) {
      bgAudioRef.current.pause()
      bgAudioRef.current.currentTime = 0
    }
    onComplete()
  }, [onComplete])

  useEffect(() => {
    const audio = audioRef.current
    if (!audio) return

    // === Background music at second 40 ===
    const bgAudio = new Audio('/audio/fondo-llamada.aac')
    bgAudio.loop = true
    bgAudio.volume = 0.18
    bgAudioRef.current = bgAudio

    // === Web Audio API for frequency analysis ===
    try {
      const audioCtx = new (window.AudioContext || (window as unknown as { webkitAudioContext: typeof AudioContext }).webkitAudioContext)()
      const source = audioCtx.createMediaElementSource(audio)
      const analyser = audioCtx.createAnalyser()
      analyser.fftSize = 64
      source.connect(analyser)
      analyser.connect(audioCtx.destination)
      analyserRef.current = analyser

      // Animation loop for frequency data
      const updateFrequency = () => {
        if (analyserRef.current && !completedRef.current) {
          const data = new Uint8Array(analyserRef.current.frequencyBinCount)
          analyserRef.current.getByteFrequencyData(data)
          const normalized = Array.from(data).map(v => Math.round((v / 255) * 100))
          setFrequencyData(normalized)
        }
        animFrameRef.current = requestAnimationFrame(updateFrequency)
      }
      updateFrequency()
    } catch {
      // Web Audio API not available — frequency bars will use fallback animation
    }

    const playAudio = async () => {
      try {
        audio.volume = 1.0
        await audio.play()
        setIsPlaying(true)
      } catch {
        // Browser may block
      }
    }

    playAudio()

    const handleEnded = () => handleComplete()
    const handleTimeUpdate = () => {
      setCurrentTime(audio.currentTime)

      // Update caption
      const caption = CAPTIONS.find(c => audio.currentTime >= c.start && audio.currentTime < c.end)
      if (caption) setActiveCaption(caption.text)

      // Start background music at second 40
      if (!bgStartedRef.current && audio.currentTime >= 40) {
        bgStartedRef.current = true
        bgAudio.play().catch(() => {})
      }
    }

    audio.addEventListener('ended', handleEnded)
    audio.addEventListener('timeupdate', handleTimeUpdate)

    const keepAlive = setInterval(() => {
      if (audio.paused && !audio.ended && !completedRef.current) {
        audio.play().catch(() => {})
      }
    }, 1000)

    const handlePause = () => {
      if (!completedRef.current) {
        setTimeout(() => {
          if (!audio.ended && !completedRef.current) audio.play().catch(() => {})
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
      bgAudio.pause()
      bgAudio.currentTime = 0
      bgAudioRef.current = null
      if (animFrameRef.current) cancelAnimationFrame(animFrameRef.current)
    }
  }, [handleComplete])

  const formatTime = (seconds: number) => {
    const mins = Math.floor(seconds / 60)
    const secs = Math.floor(seconds % 60)
    return `${mins}:${secs.toString().padStart(2, '0')}`
  }

  const audioDuration = 68.28
  const progressPercent = Math.min((currentTime / audioDuration) * 100, 100)

  // SVG circular progress — circumference calculation
  const RING_RADIUS = 52
  const RING_CIRCUMFERENCE = 2 * Math.PI * RING_RADIUS
  const ringProgress = (progressPercent / 100) * RING_CIRCUMFERENCE
  const ringDashOffset = RING_CIRCUMFERENCE - ringProgress

  return (
    <motion.div
      className="fixed inset-0 z-50 flex flex-col items-center select-none overflow-hidden"
      style={{ background: '#0a0a0a' }}
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      transition={{ duration: 0.5 }}
    >
      {/* Subtle bg glow */}
      <div className="absolute inset-0" style={{
        background: 'radial-gradient(ellipse 60% 40% at 50% 30%, rgba(76, 175, 80, 0.04) 0%, transparent 70%), #0a0a0a',
      }} />

      {/* Scan lines overlay for sci-fi feel */}
      <div className="absolute inset-0 pointer-events-none" style={{
        backgroundImage: 'repeating-linear-gradient(0deg, transparent, transparent 2px, rgba(0,0,0,0.03) 2px, rgba(0,0,0,0.03) 4px)',
        opacity: 0.5,
      }} />

      {/* Audio element */}
      <audio ref={audioRef} src="/audio/call-audio.mp3" preload="auto" crossOrigin="anonymous" />

      {/* === TOP: Profile with circular progress ring === */}
      <div className="relative z-10 mt-14 flex flex-col items-center">
        {/* EN LLAMADA */}
        <motion.div
          initial={{ opacity: 0, y: -10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.3, duration: 0.5 }}
        >
          <span style={{
            fontFamily: "'Cinzel', serif",
            fontSize: 'clamp(0.6rem, 1.8vw, 0.72rem)',
            fontWeight: 500, color: '#4CAF50',
            letterSpacing: '0.25em', textTransform: 'uppercase',
            textShadow: '0 0 12px rgba(76, 175, 80, 0.3)',
          }}>
            EN LLAMADA
          </span>
        </motion.div>

        {/* Profile photo with SVG circular progress */}
        <motion.div
          className="mt-5 relative flex items-center justify-center"
          initial={{ scale: 0.6, opacity: 0 }}
          animate={{ scale: 1, opacity: 1 }}
          transition={{ delay: 0.4, duration: 0.6, type: 'spring' }}
        >
          {/* SVG ring — rotates -90deg so progress starts from top */}
          <svg
            width="124" height="124" viewBox="0 0 124 124"
            style={{ position: 'absolute', transform: 'rotate(-90deg)' }}
          >
            {/* Background ring */}
            <circle
              cx="62" cy="62" r={RING_RADIUS}
              fill="none" stroke="rgba(76, 175, 80, 0.1)"
              strokeWidth="3" strokeLinecap="round"
            />
            {/* Progress ring */}
            <circle
              cx="62" cy="62" r={RING_RADIUS}
              fill="none" stroke="#4CAF50"
              strokeWidth="3" strokeLinecap="round"
              strokeDasharray={RING_CIRCUMFERENCE}
              strokeDashoffset={ringDashOffset}
              style={{
                transition: 'stroke-dashoffset 0.3s ease',
                filter: 'drop-shadow(0 0 6px rgba(76, 175, 80, 0.5))',
              }}
            />
            {/* Glow ring */}
            <circle
              cx="62" cy="62" r={RING_RADIUS}
              fill="none" stroke="rgba(76, 175, 80, 0.15)"
              strokeWidth="8" strokeLinecap="round"
              strokeDasharray={RING_CIRCUMFERENCE}
              strokeDashoffset={ringDashOffset}
              style={{ transition: 'stroke-dashoffset 0.3s ease' }}
            />
          </svg>

          {/* Profile photo */}
          <div style={{
            width: '88px', height: '88px', borderRadius: '50%',
            overflow: 'hidden',
            boxShadow: '0 0 25px rgba(76, 175, 80, 0.2), 0 0 50px rgba(76, 175, 80, 0.1)',
          }}>
            <img src="/images/dante-profile.jpg" alt="Dante"
              style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
          </div>
        </motion.div>

        {/* Name */}
        <motion.div
          initial={{ opacity: 0, y: 8 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.7, duration: 0.5 }}
        >
          <h1 style={{
            fontFamily: "'Cinzel', serif",
            fontSize: 'clamp(1.2rem, 4.5vw, 1.5rem)',
            fontWeight: 700, color: '#FFFFFF',
            letterSpacing: '0.18em', marginTop: '0.75rem',
            textShadow: '0 2px 15px rgba(0,0,0,0.8)',
          }}>
            DANTE
          </h1>
        </motion.div>
      </div>

      {/* === TELEPROMPTER — Centered, tubular/reel effect, real transcript === */}
      <motion.div
        className="relative z-10 mt-4 w-full px-6 flex-1 flex items-center justify-center"
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ delay: 0.8, duration: 0.4 }}
        style={{ minHeight: 0 }}
      >
        <div style={{ width: '100%', textAlign: 'center', position: 'relative', overflow: 'hidden', padding: '12px 0', transform: 'translateZ(0)' }}>
          {/* Subtle top/bottom fade for reel/tubular feel */}
          <div style={{
            position: 'absolute', top: 0, left: 0, right: 0, height: '30%',
            background: 'linear-gradient(to bottom, #0a0a0a, transparent)',
            pointerEvents: 'none', zIndex: 2,
          }} />
          <div style={{
            position: 'absolute', bottom: 0, left: 0, right: 0, height: '30%',
            background: 'linear-gradient(to top, #0a0a0a, transparent)',
            pointerEvents: 'none', zIndex: 2,
          }} />
          <AnimatePresence mode="wait">
            <motion.p
              key={activeCaption}
              initial={{ opacity: 0, y: 8, filter: 'blur(4px)' }}
              animate={{ opacity: 1, y: 0, filter: 'blur(0px)' }}
              exit={{ opacity: 0, y: -8, filter: 'blur(4px)' }}
              transition={{ duration: 0.1, ease: 'easeOut' }}
              style={{
                fontFamily: "'Cinzel', serif",
                fontSize: 'clamp(0.82rem, 2.8vw, 0.95rem)',
                fontWeight: 500,
                color: 'rgba(76, 175, 80, 0.9)',
                lineHeight: 1.6,
                letterSpacing: '0.03em',
                textShadow: '0 0 14px rgba(76, 175, 80, 0.3), 0 0 28px rgba(76, 175, 80, 0.1)',
                willChange: 'transform, opacity, filter',
                transform: 'translateZ(0)',
                WebkitBackfaceVisibility: 'hidden',
              }}
            >
              {activeCaption}
            </motion.p>
          </AnimatePresence>
        </div>
      </motion.div>

      {/* === BOTTOM: Sound bar + time + end call === */}
      <div className="relative z-10 mt-auto w-full px-5 pb-10">
        {/* Sound bar — reactive frequency visualization */}
        <div className="flex items-end justify-center gap-[2px]" style={{ height: '32px', marginBottom: '10px' }}>
          {frequencyData.slice(0, 24).map((val, i) => {
            const height = isPlaying ? Math.max(4, (val / 100) * 28) : 4
            return (
              <motion.div
                key={i}
                style={{
                  width: '3px',
                  borderRadius: '2px',
                  backgroundColor: isPlaying
                    ? `rgba(76, 175, 80, ${0.4 + (val / 100) * 0.6})`
                    : 'rgba(76, 175, 80, 0.15)',
                  height,
                  boxShadow: val > 50 ? `0 0 4px rgba(76, 175, 80, 0.3)` : 'none',
                }}
                animate={{ height }}
                transition={{ duration: 0.08 }}
              />
            )
          })}
        </div>

        {/* Elapsed time + progress track */}
        <div className="w-full">
          <div className="flex justify-start mb-2">
            <span style={{
              fontFamily: "'Cinzel', serif",
              fontSize: 'clamp(0.65rem, 2vw, 0.78rem)',
              fontWeight: 600, color: '#4CAF50',
              letterSpacing: '0.05em',
              fontVariantNumeric: 'tabular-nums',
              textShadow: '0 0 8px rgba(76, 175, 80, 0.2)',
            }}>
              {formatTime(currentTime)}
            </span>
          </div>

          {/* Progress track */}
          <div style={{
            width: '100%', height: '3px',
            backgroundColor: 'rgba(255, 255, 255, 0.08)',
            borderRadius: '2px', overflow: 'hidden',
          }}>
            <motion.div
              style={{
                height: '100%',
                background: 'linear-gradient(90deg, #1B5E20, #4CAF50)',
                borderRadius: '2px',
                width: `${progressPercent}%`,
                boxShadow: '0 0 6px rgba(76, 175, 80, 0.3)',
              }}
              animate={{ width: `${progressPercent}%` }}
              transition={{ duration: 0.3 }}
            />
          </div>
        </div>

        {/* End call button */}
        <div className="flex justify-center mt-5">
          <button onClick={handleComplete}
            className="cursor-pointer border-none bg-transparent flex items-center justify-center">
            <div style={{
              width: '52px', height: '52px', borderRadius: '50%',
              background: 'linear-gradient(135deg, #B71C1C, #D32F2F)',
              display: 'flex', alignItems: 'center', justifyContent: 'center',
              boxShadow: '0 0 20px rgba(211, 47, 47, 0.35), 0 4px 14px rgba(0,0,0,0.3)',
              transform: 'rotate(135deg)',
            }}>
              <svg width="22" height="22" viewBox="0 0 24 24" fill="white" stroke="none">
                <path d="M20.01 15.38c-1.23 0-2.42-.2-3.53-.56a.977.977 0 0 0-1.01.24l-1.57 1.97c-2.83-1.35-5.48-3.9-6.89-6.83l1.95-1.66c.27-.28.35-.67.24-1.02-.37-1.11-.56-2.3-.56-3.53 0-.54-.45-.99-.99-.99H4.19C3.65 3 3 3.24 3 3.99 3 13.28 10.73 21 20.01 21c.71 0 .99-.63.99-1.18v-3.45c0-.54-.45-.99-.99-.99z"/>
              </svg>
            </div>
          </button>
        </div>
      </div>
    </motion.div>
  )
}
