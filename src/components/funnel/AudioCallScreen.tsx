'use client'

import { useEffect, useRef, useState } from 'react'
import { motion, AnimatePresence } from 'framer-motion'

interface AudioCallScreenProps {
  onComplete: () => void
}

const CAPTIONS: { start: number; end: number; text: string }[] = [
  { start: 0, end: 1.8, text: 'Conectando...' },
  { start: 1.8, end: 4.5, text: 'Hey, no cuelgues.' },
  { start: 4.5, end: 7.5, text: 'Tienes suerte de haber atendido.' },
  { start: 7.5, end: 9.5, text: 'La mayoría de los hombres' },
  { start: 9.5, end: 11.5, text: 'gritando por atención...' },
  { start: 11.5, end: 13.5, text: 'Y tú... tú acabas de entrar' },
  { start: 13.5, end: 15.5, text: 'en la frecuencia correcta.' },
  { start: 15.5, end: 19, text: 'La atracción era una alquimia.' },
  { start: 19, end: 21.5, text: 'Había misterio, silencios' },
  { start: 21.5, end: 24, text: 'que decían más que mil palabras.' },
  { start: 24, end: 27, text: 'Pero algo se rompió.' },
  { start: 27, end: 29.5, text: 'El mundo se llenó de plantillas' },
  { start: 29.5, end: 32, text: 'y frases de copia y pega...' },
  { start: 32, end: 35.5, text: 'Que detecta en menos de 7 segundos.' },
  { start: 35.5, end: 39, text: 'Te has vuelto predecible.' },
  { start: 39, end: 42.5, text: 'Lo predecible es invisible.' },
  { start: 42.5, end: 46, text: 'No te ignora porque no le gustes.' },
  { start: 46, end: 48.5, text: 'Te ignora porque ya sabe' },
  { start: 48.5, end: 51, text: 'qué vas a decir después.' },
  { start: 51, end: 54, text: 'Eres un eco en su bandeja.' },
  { start: 54, end: 56.5, text: 'Pero escucha bien...' },
  { start: 56.5, end: 59, text: 'lo que viene es el cortocircuito.' },
  { start: 59, end: 62, text: 'Un sistema que no puede ignorar' },
  { start: 62, end: 65, text: 'porque habla a su instinto.' },
  { start: 65, end: 68.28, text: 'No cuelgues... el primer capítulo.' },
]

export default function AudioCallScreen({ onComplete }: AudioCallScreenProps) {
  const audioRef = useRef<HTMLAudioElement>(null)
  const bgAudioRef = useRef<HTMLAudioElement | null>(null)
  const analyserRef = useRef<AnalyserNode | null>(null)
  const animFrameRef = useRef<number | null>(null)
  const completedRef = useRef(false)
  const bgStartedRef = useRef(false)
  const onCompleteRef = useRef(onComplete)
  const timersRef = useRef<ReturnType<typeof setTimeout>[]>([])

  const [currentTime, setCurrentTime] = useState(0)
  const [isPlaying, setIsPlaying] = useState(false)
  const [frequencyData, setFrequencyData] = useState<number[]>(Array(24).fill(0))
  const [activeCaptionIndex, setActiveCaptionIndex] = useState(-1)
  const [callEnded, setCallEnded] = useState(false)

  // ============ PURE TIME-BASED WORD REVEAL ============
  // Instead of setInterval, compute visible words directly from currentTime
  // This guarantees perfect sync with audio — no cutting off, no drift

  const activeCaption = activeCaptionIndex >= 0 ? CAPTIONS[activeCaptionIndex] : null
  const words = activeCaption?.text.split(' ') || []

  // Compute how many words should be visible based on current time
  let visibleWords = 0
  if (activeCaption) {
    const totalWords = words.length
    const captionDuration = activeCaption.end - activeCaption.start
    const elapsed = currentTime - activeCaption.start

    if (elapsed >= 0) {
      // Words finish revealing at 80% of caption duration, rest is reading time
      const revealPortion = 0.80
      const revealTime = captionDuration * revealPortion

      if (elapsed >= revealTime) {
        visibleWords = totalWords
      } else {
        // Distribute words evenly across the reveal portion
        const progress = elapsed / revealTime
        visibleWords = Math.min(totalWords, Math.ceil(progress * totalWords))
      }
    }
  }

  // Keep onComplete ref updated
  useEffect(() => {
    onCompleteRef.current = onComplete
  }, [onComplete])

  // ============ COMPLETE HANDLER — RED screen + fast transition to quiz ============
  const triggerComplete = () => {
    if (completedRef.current) return
    completedRef.current = true

    // Stop background audio
    if (bgAudioRef.current) {
      bgAudioRef.current.pause()
    }

    // Show RED "Llamada finalizada" overlay
    setCallEnded(true)

    // After 1.5s, advance directly to quiz (no fade to black)
    const t1 = setTimeout(() => {
      onCompleteRef.current()
    }, 1500)
    timersRef.current.push(t1)
  }

  // ============ MAIN AUDIO SETUP ============
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

    const handleEnded = () => triggerComplete()

    const handleTimeUpdate = () => {
      const t = audio.currentTime
      setCurrentTime(t)

      // Find active caption with buffer — look ahead 0.3s so captions appear slightly early
      // and look behind 0.5s so captions stay visible a bit longer
      const idx = CAPTIONS.findIndex(c => t >= (c.start - 0.15) && t < c.end + 0.5)
      if (idx !== -1 && idx !== activeCaptionIndex) {
        setActiveCaptionIndex(idx)
      }
      // If we're past the end of current caption but before next one, keep showing current
      // (already handled by the +0.5 buffer above)

      // Start background music at second 40
      if (!bgStartedRef.current && t >= 40) {
        bgStartedRef.current = true
        bgAudio.play().catch(() => {})
      }
    }

    audio.addEventListener('ended', handleEnded)
    audio.addEventListener('timeupdate', handleTimeUpdate)

    // Keep-alive
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
      bgAudio.pause()
      bgAudioRef.current = null
      if (animFrameRef.current) cancelAnimationFrame(animFrameRef.current)
      timersRef.current.forEach(t => clearTimeout(t))
      timersRef.current = []
    }
  }, [])

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
      {/* === RED "Llamada finalizada" overlay === */}
      <AnimatePresence>
        {callEnded && (
          <motion.div
            className="absolute inset-0 z-[100] flex flex-col items-center justify-center"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ duration: 0.5 }}
          >
            {/* Red background */}
            <div className="absolute inset-0" style={{ background: 'linear-gradient(135deg, #B71C1C, #D32F2F, #C62828)' }} />
            
            {/* Phone icon */}
            <motion.div
              style={{
                width: '64px', height: '64px', borderRadius: '50%',
                background: 'rgba(255,255,255,0.15)',
                display: 'flex', alignItems: 'center', justifyContent: 'center',
                marginBottom: 20,
              }}
              initial={{ scale: 0.5, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              transition={{ delay: 0.2, duration: 0.4, type: 'spring' }}
            >
              <svg width="28" height="28" viewBox="0 0 24 24" fill="white" stroke="none" style={{ transform: 'rotate(135deg)' }}>
                <path d="M20.01 15.38c-1.23 0-2.42-.2-3.53-.56a.977.977 0 0 0-1.01.24l-1.57 1.97c-2.83-1.35-5.48-3.9-6.89-6.83l1.95-1.66c.27-.28.35-.67.24-1.02-.37-1.11-.56-2.3-.56-3.53 0-.54-.45-.99-.99-.99H4.19C3.65 3 3 3.24 3 3.99 3 13.28 10.73 21 20.01 21c.71 0 .99-.63.99-1.18v-3.45c0-.54-.45-.99-.99-.99z"/>
              </svg>
            </motion.div>

            <motion.span
              style={{
                fontFamily: "'Cinzel', serif",
                fontSize: 'clamp(1rem, 3.5vw, 1.3rem)',
                fontWeight: 700,
                color: '#FFFFFF',
                letterSpacing: '0.2em',
                textTransform: 'uppercase',
                textShadow: '0 2px 20px rgba(0,0,0,0.4)',
              }}
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.3, duration: 0.4 }}
            >
              Llamada finalizada
            </motion.span>

            <motion.span
              style={{
                fontFamily: "'Cinzel', serif",
                fontSize: 'clamp(0.7rem, 2vw, 0.85rem)',
                fontWeight: 400,
                color: 'rgba(255,255,255,0.7)',
                letterSpacing: '0.1em',
                marginTop: 8,
              }}
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ delay: 0.5, duration: 0.4 }}
            >
              {formatTime(currentTime)}
            </motion.span>
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

      {/* === TELEPROMPTER — pure time-based, no setInterval === */}
      <motion.div
        className="relative z-10 mt-3 w-full px-3 flex-1 flex items-center justify-center"
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ delay: 0.8, duration: 0.4 }}
        style={{ minHeight: 0 }}
      >
        <div style={{ width: '100%', textAlign: 'center', position: 'relative', overflow: 'hidden', padding: '4px 0', transform: 'translateZ(0)', whiteSpace: 'nowrap' }}>
          <div style={{ position: 'absolute', top: 0, left: 0, right: 0, height: '30%', background: 'linear-gradient(to bottom, #0a0a0a, transparent)', pointerEvents: 'none', zIndex: 2 }} />
          <div style={{ position: 'absolute', bottom: 0, left: 0, right: 0, height: '30%', background: 'linear-gradient(to top, #0a0a0a, transparent)', pointerEvents: 'none', zIndex: 2 }} />
          
          {activeCaption && (
            <p
              key={activeCaptionIndex}
              style={{
                fontFamily: "'Cinzel', serif",
                // Font size increased ~2% from original: was clamp(0.62rem, 2.4vw, 0.82rem)
                fontSize: 'clamp(0.632rem, 2.45vw, 0.836rem)',
                fontWeight: 500,
                color: 'rgba(76, 175, 80, 0.9)',
                lineHeight: 1.5,
                letterSpacing: '0.01em',
                textShadow: '0 0 14px rgba(76, 175, 80, 0.3), 0 0 28px rgba(76, 175, 80, 0.1)',
                willChange: 'opacity',
                transform: 'translateZ(0)',
                WebkitBackfaceVisibility: 'hidden',
                minHeight: '2em',
                transition: 'opacity 0.3s ease',
                opacity: 1,
              }}
            >
              {words.map((word, i) => (
                <span
                  key={i}
                  style={{
                    opacity: i < visibleWords ? 1 : 0,
                    transition: 'opacity 0.25s ease',
                    marginRight: '0.22em',
                    display: 'inline',
                  }}
                >
                  {word}
                </span>
              ))}
            </p>
          )}
        </div>
      </motion.div>

      {/* === BOTTOM: Sound bar + time === */}
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
