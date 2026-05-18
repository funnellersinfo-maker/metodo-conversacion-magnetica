'use client'

import { useEffect, useRef, useState } from 'react'
import { motion, AnimatePresence } from 'framer-motion'

interface AudioCallScreenProps {
  onComplete: () => void
}

const CAPTIONS: { start: number; end: number; text: string }[] = [
  { start: 0, end: 1.5, text: 'Conectando...' },
  { start: 1.5, end: 4, text: 'Hey, no cuelgues.' },
  { start: 4, end: 7, text: 'Tienes suerte de haber atendido.' },
  { start: 7, end: 10.5, text: 'La mayoría de los hombres están ahí fuera gritando por atención...' },
  { start: 10.5, end: 14, text: 'Y tú... tú acabas de entrar en la frecuencia correcta.' },
  { start: 14, end: 17.5, text: 'Hace años la atracción era una especie de alquimia.' },
  { start: 17.5, end: 21.5, text: 'Había misterio, había silencios que decían más que mil palabras.' },
  { start: 21.5, end: 24.5, text: 'Pero algo se rompió.' },
  { start: 24.5, end: 29, text: 'El mundo se llenó de plantillas baratas y frases de copia y pega...' },
  { start: 29, end: 33, text: 'Que ella ya detecta en menos de siete segundos.' },
  { start: 33, end: 36, text: 'Te has vuelto predecible.' },
  { start: 36, end: 39.5, text: 'Y en la biología del deseo... lo predecible es invisible.' },
  { start: 39.5, end: 43, text: 'Ella no te ignora porque no le gustes.' },
  { start: 43, end: 47, text: 'Te ignora porque ya sabe exactamente qué vas a decir después.' },
  { start: 47, end: 50, text: 'Eres un eco más en su bandeja de entrada.' },
  { start: 50, end: 54, text: 'Pero escucha bien... porque lo que estoy a punto de revelarte es el cortocircuito.' },
  { start: 54, end: 58, text: 'Un sistema que ella no puede ignorar porque le habla directamente a su instinto.' },
  { start: 58, end: 68, text: 'No cuelgues... el primer capítulo está por desbloquearse.' },
]

export default function AudioCallScreen({ onComplete }: AudioCallScreenProps) {
  const audioRef = useRef<HTMLAudioElement>(null)
  const bgAudioRef = useRef<HTMLAudioElement | null>(null)
  const analyserRef = useRef<AnalyserNode | null>(null)
  const animFrameRef = useRef<number | null>(null)
  const completedRef = useRef(false)
  const bgStartedRef = useRef(false)
  const captionIndexRef = useRef(0)
  const onCompleteRef = useRef(onComplete)
  const timersRef = useRef<ReturnType<typeof setTimeout>[]>([])

  const [currentTime, setCurrentTime] = useState(0)
  const [isPlaying, setIsPlaying] = useState(false)
  const [frequencyData, setFrequencyData] = useState<number[]>(Array(24).fill(0))
  const [activeCaptionIndex, setActiveCaptionIndex] = useState(0)
  const [visibleWords, setVisibleWords] = useState(0)
  const [callEnded, setCallEnded] = useState(false)
  const [fadeToBlack, setFadeToBlack] = useState(false)

  const words = CAPTIONS[activeCaptionIndex]?.text.split(' ') || []

  // Keep onComplete ref updated (never causes re-renders)
  useEffect(() => {
    onCompleteRef.current = onComplete
  }, [onComplete])

  // ============ COMPLETE HANDLER — called ONCE when audio ends ============
  const triggerComplete = () => {
    if (completedRef.current) return
    completedRef.current = true

    // Stop background audio
    if (bgAudioRef.current) {
      bgAudioRef.current.pause()
    }

    // Show "Llamada finalizada" overlay
    setCallEnded(true)

    // After 2.5s, fade to black
    const t1 = setTimeout(() => {
      setFadeToBlack(true)
    }, 2500)
    timersRef.current.push(t1)

    // After 4s total, advance to next step (Quiz)
    const t2 = setTimeout(() => {
      onCompleteRef.current()
    }, 4000)
    timersRef.current.push(t2)
  }

  // ============ MAIN AUDIO SETUP — runs ONLY ONCE ============
  useEffect(() => {
    const audio = audioRef.current
    if (!audio) return

    // Background music (starts at second 40)
    const bgAudio = new Audio('/audio/fondo-llamada.aac')
    bgAudio.loop = true
    bgAudio.volume = 0.18
    bgAudioRef.current = bgAudio

    // Web Audio API for frequency bars
    try {
      const audioCtx = new (window.AudioContext || (window as unknown as { webkitAudioContext: typeof AudioContext }).webkitAudioContext)()
      const source = audioCtx.createMediaElementSource(audio)
      const analyser = audioCtx.createAnalyser()
      analyser.fftSize = 64
      source.connect(analyser)
      analyser.connect(audioCtx.destination)
      analyserRef.current = analyser

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
      // Web Audio API not available
    }

    // Play the call audio
    const playAudio = async () => {
      try {
        audio.volume = 1.0
        await audio.play()
        setIsPlaying(true)
      } catch {
        // Browser may block autoplay
      }
    }
    playAudio()

    // === EVENT: Audio ended → trigger complete ===
    const handleEnded = () => {
      triggerComplete()
    }

    // === EVENT: Time update → track time + captions + bg music ===
    const handleTimeUpdate = () => {
      const t = audio.currentTime
      setCurrentTime(t)

      // Find active caption (using ref to avoid re-running this effect)
      const idx = CAPTIONS.findIndex(c => t >= c.start && t < c.end)
      if (idx !== -1 && idx !== captionIndexRef.current) {
        captionIndexRef.current = idx
        setActiveCaptionIndex(idx)
      }

      // Start background music at second 40
      if (!bgStartedRef.current && t >= 40) {
        bgStartedRef.current = true
        bgAudio.play().catch(() => {})
      }
    }

    audio.addEventListener('ended', handleEnded)
    audio.addEventListener('timeupdate', handleTimeUpdate)

    // Keep-alive: resume if paused unexpectedly
    const keepAlive = setInterval(() => {
      if (audio.paused && !audio.ended && !completedRef.current) {
        audio.play().catch(() => {})
      }
    }, 1000)

    // Auto-resume on pause
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
      bgAudio.pause()
      bgAudioRef.current = null
      if (animFrameRef.current) cancelAnimationFrame(animFrameRef.current)
      // Clear all pending timers
      timersRef.current.forEach(t => clearTimeout(t))
      timersRef.current = []
    }
  }, []) // EMPTY: runs once, no re-runs

  // ============ WORD-BY-WORD TELEPROMPTER — slow reveal ============
  useEffect(() => {
    const caption = CAPTIONS[activeCaptionIndex]
    if (!caption) return

    setVisibleWords(0)

    const totalWords = caption.text.split(' ').length
    const durationMs = (caption.end - caption.start) * 1000

    // Balanced pace: 400ms before first word, then natural timing per word
    // Minimum 280ms per word — follows audio rhythm
    const initialDelay = 400
    const wordDelay = Math.max(280, (durationMs - initialDelay) / totalWords)

    let count = 0
    const timer = setInterval(() => {
      count++
      if (count <= totalWords) {
        setVisibleWords(count)
      } else {
        clearInterval(timer)
      }
    }, wordDelay)

    return () => clearInterval(timer)
  }, [activeCaptionIndex])

  const formatTime = (seconds: number) => {
    const mins = Math.floor(seconds / 60)
    const secs = Math.floor(seconds % 60)
    return `${mins}:${secs.toString().padStart(2, '0')}`
  }

  const audioDuration = 68.28
  const progressPercent = Math.min((currentTime / audioDuration) * 100, 100)

  const RING_RADIUS = 52
  const RING_CIRCUMFERENCE = 2 * Math.PI * RING_RADIUS
  const ringDashOffset = RING_CIRCUMFERENCE - (progressPercent / 100) * RING_CIRCUMFERENCE

  return (
    <motion.div
      className="fixed inset-0 z-50 flex flex-col items-center select-none overflow-hidden"
      style={{ background: '#0a0a0a' }}
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      transition={{ duration: 0.5 }}
    >
      {/* Fade to black overlay */}
      <AnimatePresence>
        {fadeToBlack && (
          <motion.div
            className="absolute inset-0 z-[100]"
            style={{ background: '#000000' }}
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ duration: 1.5 }}
          />
        )}
      </AnimatePresence>

      {/* Call ended overlay */}
      <AnimatePresence>
        {callEnded && !fadeToBlack && (
          <motion.div
            className="absolute inset-0 z-[90] flex flex-col items-center justify-center"
            style={{ background: 'rgba(10,10,10,0.9)' }}
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ duration: 0.8 }}
          >
            <div style={{
              width: '56px', height: '56px', borderRadius: '50%',
              background: 'rgba(255,255,255,0.05)',
              display: 'flex', alignItems: 'center', justifyContent: 'center',
              marginBottom: 16,
            }}>
              <svg width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="rgba(255,255,255,0.4)" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
                <path d="M15.05 5A5 5 0 0 1 19 8.95M15.05 1A9 9 0 0 1 23 8.94m-1 7.98v3a2 2 0 0 1-2.18 2 19.79 19.79 0 0 1-8.63-3.07 19.5 19.5 0 0 1-6-6 19.79 19.79 0 0 1-3.07-8.67A2 2 0 0 1 4.11 2h3a2 2 0 0 1 2 1.72c.127.96.361 1.903.7 2.81a2 2 0 0 1-.45 2.11L8.09 9.91a16 16 0 0 0 6 6l1.27-1.27a2 2 0 0 1 2.11-.45c.907.339 1.85.573 2.81.7A2 2 0 0 1 22 16.92z" />
              </svg>
            </div>
            <span style={{
              fontFamily: "'Cinzel', serif",
              fontSize: 'clamp(0.9rem, 3vw, 1.1rem)',
              fontWeight: 500,
              color: 'rgba(255,255,255,0.5)',
              letterSpacing: '0.15em',
              textTransform: 'uppercase',
            }}>
              Llamada finalizada
            </span>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Subtle bg glow */}
      <div className="absolute inset-0" style={{
        background: 'radial-gradient(ellipse 60% 40% at 50% 30%, rgba(76, 175, 80, 0.04) 0%, transparent 70%), #0a0a0a',
      }} />

      {/* Scan lines overlay */}
      <div className="absolute inset-0 pointer-events-none" style={{
        backgroundImage: 'repeating-linear-gradient(0deg, transparent, transparent 2px, rgba(0,0,0,0.03) 2px, rgba(0,0,0,0.03) 4px)',
        opacity: 0.5,
      }} />

      {/* Audio element */}
      <audio ref={audioRef} src="/audio/call-audio.mp3" preload="auto" crossOrigin="anonymous" />

      {/* === TOP: Profile with circular progress ring === */}
      <div className="relative z-10 mt-14 flex flex-col items-center">
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

        <motion.div
          className="mt-5 relative flex items-center justify-center"
          initial={{ scale: 0.6, opacity: 0 }}
          animate={{ scale: 1, opacity: 1 }}
          transition={{ delay: 0.4, duration: 0.6, type: 'spring' }}
        >
          <svg width="124" height="124" viewBox="0 0 124 124" style={{ position: 'absolute', transform: 'rotate(-90deg)' }}>
            <circle cx="62" cy="62" r={RING_RADIUS} fill="none" stroke="rgba(76, 175, 80, 0.1)" strokeWidth="3" strokeLinecap="round" />
            <circle cx="62" cy="62" r={RING_RADIUS} fill="none" stroke="#4CAF50" strokeWidth="3" strokeLinecap="round" strokeDasharray={RING_CIRCUMFERENCE} strokeDashoffset={ringDashOffset} style={{ transition: 'stroke-dashoffset 0.3s ease', filter: 'drop-shadow(0 0 6px rgba(76, 175, 80, 0.5))' }} />
            <circle cx="62" cy="62" r={RING_RADIUS} fill="none" stroke="rgba(76, 175, 80, 0.15)" strokeWidth="8" strokeLinecap="round" strokeDasharray={RING_CIRCUMFERENCE} strokeDashoffset={ringDashOffset} style={{ transition: 'stroke-dashoffset 0.3s ease' }} />
          </svg>

          <div style={{
            width: '88px', height: '88px', borderRadius: '50%', overflow: 'hidden',
            boxShadow: '0 0 25px rgba(76, 175, 80, 0.2), 0 0 50px rgba(76, 175, 80, 0.1)',
          }}>
            <img src="/images/dante-profile.jpg" alt="Dante" style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
          </div>
        </motion.div>

        <motion.div initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.7, duration: 0.5 }}>
          <h1 style={{
            fontFamily: "'Cinzel', serif", fontSize: 'clamp(1.2rem, 4.5vw, 1.5rem)',
            fontWeight: 700, color: '#FFFFFF', letterSpacing: '0.18em', marginTop: '0.75rem',
            textShadow: '0 2px 15px rgba(0,0,0,0.8)',
          }}>
            DANTE
          </h1>
        </motion.div>
      </div>

      {/* === TELEPROMPTER — word by word slow reveal === */}
      <motion.div
        className="relative z-10 mt-4 w-full px-4 flex-1 flex items-center justify-center"
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ delay: 0.8, duration: 0.4 }}
        style={{ minHeight: 0 }}
      >
        <div style={{ width: '100%', textAlign: 'center', position: 'relative', overflow: 'hidden', padding: '8px 4px', transform: 'translateZ(0)', wordBreak: 'break-word' }}>
          <div style={{ position: 'absolute', top: 0, left: 0, right: 0, height: '30%', background: 'linear-gradient(to bottom, #0a0a0a, transparent)', pointerEvents: 'none', zIndex: 2 }} />
          <div style={{ position: 'absolute', bottom: 0, left: 0, right: 0, height: '30%', background: 'linear-gradient(to top, #0a0a0a, transparent)', pointerEvents: 'none', zIndex: 2 }} />
          
          <AnimatePresence mode="wait">
            <motion.p
              key={activeCaptionIndex}
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              transition={{ duration: 0.4 }}
              style={{
                fontFamily: "'Cinzel', serif",
                fontSize: 'clamp(0.72rem, 2.2vw, 0.9rem)',
                fontWeight: 500,
                color: 'rgba(76, 175, 80, 0.9)',
                lineHeight: 1.8,
                letterSpacing: '0.01em',
                textShadow: '0 0 14px rgba(76, 175, 80, 0.3), 0 0 28px rgba(76, 175, 80, 0.1)',
                willChange: 'opacity',
                transform: 'translateZ(0)',
                WebkitBackfaceVisibility: 'hidden',
                minHeight: '2.8em',
              }}
            >
              {words.map((word, i) => (
                <span
                  key={i}
                  style={{
                    opacity: i < visibleWords ? 1 : 0,
                    transition: 'opacity 0.5s ease',
                    marginRight: '0.3em',
                    display: 'inline',
                  }}
                >
                  {word}
                </span>
              ))}
            </motion.p>
          </AnimatePresence>
        </div>
      </motion.div>

      {/* === BOTTOM: Sound bar + time — NO HANG UP BUTTON === */}
      <div className="relative z-10 mt-auto w-full px-5 pb-10">
        <div className="flex items-end justify-center gap-[2px]" style={{ height: '32px', marginBottom: '10px' }}>
          {frequencyData.slice(0, 24).map((val, i) => {
            const height = isPlaying ? Math.max(4, (val / 100) * 28) : 4
            return (
              <motion.div
                key={i}
                style={{
                  width: '3px', borderRadius: '2px',
                  backgroundColor: isPlaying ? `rgba(76, 175, 80, ${0.4 + (val / 100) * 0.6})` : 'rgba(76, 175, 80, 0.15)',
                  height,
                  boxShadow: val > 50 ? `0 0 4px rgba(76, 175, 80, 0.3)` : 'none',
                }}
                animate={{ height }}
                transition={{ duration: 0.08 }}
              />
            )
          })}
        </div>

        <div className="w-full">
          <div className="flex justify-start mb-2">
            <span style={{
              fontFamily: "'Cinzel', serif", fontSize: 'clamp(0.65rem, 2vw, 0.78rem)',
              fontWeight: 600, color: '#4CAF50', letterSpacing: '0.05em',
              fontVariantNumeric: 'tabular-nums', textShadow: '0 0 8px rgba(76, 175, 80, 0.2)',
            }}>
              {formatTime(currentTime)}
            </span>
          </div>

          <div style={{ width: '100%', height: '3px', backgroundColor: 'rgba(255, 255, 255, 0.08)', borderRadius: '2px', overflow: 'hidden' }}>
            <motion.div
              style={{
                height: '100%', background: 'linear-gradient(90deg, #1B5E20, #4CAF50)',
                borderRadius: '2px', width: `${progressPercent}%`,
                boxShadow: '0 0 6px rgba(76, 175, 80, 0.3)',
              }}
              animate={{ width: `${progressPercent}%` }}
              transition={{ duration: 0.3 }}
            />
          </div>
        </div>
      </div>
    </motion.div>
  )
}
