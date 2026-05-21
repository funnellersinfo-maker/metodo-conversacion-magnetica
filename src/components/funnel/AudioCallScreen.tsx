'use client'

import { useEffect, useRef, useState } from 'react'
import { motion, AnimatePresence } from 'framer-motion'

interface AudioCallScreenProps {
  onComplete: () => void
}

// ============ COPIE EXACTO DE LA LLAMADA — Sincronización Calibrada a 68.28s ============
// Timestamps convertidos de timecode 24fps a segundos
// Los huecos entre bloques son INTENCIONALES — coinciden con respiraciones/suspiros del actor
// NO agregar buffers artificiales — estos tiempos son quirúrgicos
const CAPTIONS: { start: number; end: number; text: string }[] = [
  { start: 0.83, end: 2.63, text: 'Hey... no cuelgues.' },                        // 00:00:20 → 00:02:15
  { start: 3.21, end: 5.42, text: 'Tienes suerte de haber atendido.' },            // 00:03:05 → 00:05:10
  { start: 5.83, end: 9.63, text: 'La mayoría de los hombres están ahí fuera, gritando por atención,' }, // 00:05:20 → 00:09:15
  { start: 9.92, end: 13.50, text: 'y tú... tú acabas de entrar en la frecuencia correcta.' }, // 00:09:22 → 00:13:12
  { start: 14.08, end: 17.42, text: 'Hace años, la atracción era una especie de alquimia.' }, // 00:14:02 → 00:17:10
  { start: 17.75, end: 22.50, text: 'Había misterio, había silencios que decían más que mil palabras.' }, // 00:17:18 → 00:22:12
  { start: 22.83, end: 24.50, text: 'Pero algo se rompió.' },                      // 00:22:20 → 00:24:12
  { start: 24.83, end: 29.42, text: 'El mundo se llenó de plantillas baratas y frases de "copia y pega"' }, // 00:24:20 → 00:29:10
  { start: 29.75, end: 32.63, text: 'que ella ya detecta en menos de 7 segundos.' }, // 00:29:18 → 00:32:15
  { start: 33.08, end: 39.42, text: 'Te has vuelto predecible, y en la biología del deseo, lo predecible es invisible.' }, // 00:33:02 → 00:39:10
  { start: 39.83, end: 41.92, text: 'Ella no te ignora porque no le gustes;' },   // 00:39:20 → 00:41:22
  { start: 42.21, end: 46.08, text: 'te ignora porque ya sabe exactamente qué vas a decir después.' }, // 00:42:05 → 00:46:02
  { start: 46.50, end: 49.21, text: 'Eres un eco más en su bandeja de entrada.' }, // 00:46:12 → 00:49:05
  { start: 49.63, end: 55.42, text: 'Pero escucha bien... porque lo que estoy a punto de revelarte es el cortocircuito.' }, // 00:49:15 → 00:55:10
  { start: 55.83, end: 61.75, text: 'Un sistema que ella no puede ignorar porque le habla directamente a su instinto, no a su lógica.' }, // 00:55:20 → 01:01:18
  { start: 62.42, end: 64.08, text: 'No cuelgues.' },                              // 01:02:10 → 01:04:02
  { start: 64.50, end: 68.28, text: 'El primer capítulo está por desbloquearse.' }, // 01:04:12 → 01:08:07
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
  // Las palabras van apareciendo dentro de cada frase, la frase se wrappea natural
  const activeCaption = activeCaptionIndex >= 0 ? CAPTIONS[activeCaptionIndex] : null
  const words = activeCaption?.text.split(' ') || []

  let visibleWords = 0
  if (activeCaption) {
    const totalWords = words.length
    const captionDuration = activeCaption.end - activeCaption.start
    const elapsed = currentTime - activeCaption.start

    if (elapsed >= 0) {
      const revealPortion = 0.75
      const revealTime = captionDuration * revealPortion

      if (elapsed >= revealTime) {
        visibleWords = totalWords
      } else {
        const progress = elapsed / revealTime
        visibleWords = Math.min(totalWords, Math.ceil(progress * totalWords))
      }
    }
  }

  // Keep onComplete ref updated
  useEffect(() => {
    onCompleteRef.current = onComplete
  }, [onComplete])

  // ============ COMPLETE HANDLER — RED screen + transition ============
  const triggerComplete = () => {
    if (completedRef.current) return
    completedRef.current = true

    if (bgAudioRef.current) {
      bgAudioRef.current.pause()
    }

    setCallEnded(true)

    const t1 = setTimeout(() => {
      onCompleteRef.current()
    }, 1500)
    timersRef.current.push(t1)
  }

  // ============ MAIN AUDIO SETUP ============
  useEffect(() => {
    const audio = audioRef.current
    if (!audio) return

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

      // Find active caption — NO artificial buffers
      // The gaps between captions are INTENTIONAL (breathing/sighs in the audio)
      const idx = CAPTIONS.findIndex(c => t >= c.start && t < c.end)
      if (idx !== -1 && idx !== activeCaptionIndex) {
        setActiveCaptionIndex(idx)
      }
      // If we're between captions (in a breathing gap), keep showing the last one
      // until the next one starts — this is already handled because we only
      // change activeCaptionIndex when we find a matching caption

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
            <div className="absolute inset-0" style={{ background: 'linear-gradient(135deg, #B71C1C, #D32F2F, #C62828)' }} />
            
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
            <img src="/images/dante-profile.jpg" alt="Dante" loading="eager" fetchPriority="high" decoding="async" style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
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

      {/* === TELEPROMPTER — SOLUCIÓN DEFINITIVA v2 === */}
      {/*
        DIAGNÓSTICO FINAL: El texto se sale porque NINGÚN contenedor le está limitando
        el ancho de verdad. La solución: position:absolute + left:0 + right:0 + padding
        crea un contenedor que es EXACTAMENTE el ancho de la pantalla menos el padding.
        El texto se renderiza como string plano (.join) para que el navegador haga wrap.
      */}
      <div style={{
        position: 'absolute',
        top: '30%',
        left: 0,
        right: 0,
        boxSizing: 'border-box',
        padding: '0 4vw',
        zIndex: 10,
        pointerEvents: 'none',
      }}>
        <div style={{
          maxWidth: '420px',
          margin: '0 auto',
          boxSizing: 'border-box',
        }}>
          {activeCaption && visibleWords > 0 && (
            <p style={{
              fontFamily: "'Cinzel', serif",
              fontSize: 'clamp(0.78rem, 3.2vw, 1.05rem)',
              fontWeight: 500,
              lineHeight: 1.7,
              letterSpacing: '0.02em',
              margin: 0,
              padding: 0,
              textAlign: 'center',
              boxSizing: 'border-box',
              display: 'block',
              width: '100%',
              // WRAPPING: estas 3 propiedades juntas garantizan wrap
              whiteSpace: 'pre-wrap',
              overflowWrap: 'anywhere',
              wordBreak: 'break-word',
            }}>
              {/* Texto como UN SOLO STRING — el navegador ve espacios reales */}
              {visibleWords > 1 && (
                <span style={{
                  color: 'rgba(76, 175, 80, 0.9)',
                  textShadow: '0 0 10px rgba(76, 175, 80, 0.3), 0 0 20px rgba(76, 175, 80, 0.1)',
                }}>
                  {words.slice(0, visibleWords - 1).join(' ')}{' '}
                </span>
              )}
              <span style={{
                color: '#66FF66',
                textShadow: '0 0 8px rgba(102, 255, 102, 0.7), 0 0 20px rgba(76, 175, 80, 0.4)',
                transition: 'color 0.3s ease, text-shadow 0.3s ease',
              }}>
                {words[visibleWords - 1]}
              </span>
            </p>
          )}
        </div>
      </div>

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
