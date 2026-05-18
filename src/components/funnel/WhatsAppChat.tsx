'use client'

import { useEffect, useState, useCallback, useRef } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { useSubtleAudio } from '@/hooks/useSubtleAudio'

interface WhatsAppChatProps {
  onComplete: () => void
}

type AudioState = 'recording' | 'ready' | 'playing' | 'played'

interface AudioMessage {
  id: number
  state: AudioState
  progress: number
  src: string
}

// Audio file paths and known durations (seconds)
const AUDIO_CONFIG = [
  { src: '/audio/voice-1.mp3', duration: 27.48 },
  { src: '/audio/voice-2.mp3', duration: 22.80 },
  { src: '/audio/voice-3.mp3', duration: 25.39 },
  { src: '/audio/voice-4.mp3', duration: 20.30 },
  { src: '/audio/voice-5.mp3', duration: 54.60 },
]

export default function WhatsAppChat({ onComplete }: WhatsAppChatProps) {
  const [messages, setMessages] = useState<AudioMessage[]>([])
  const [showCredentials, setShowCredentials] = useState(false)
  const [phase, setPhase] = useState<'chat' | 'tiktok'>('chat')
  const [showPassword, setShowPassword] = useState(false)

  const audioEngine = useSubtleAudio()
  const animFrameRef = useRef<number | null>(null)
  const currentPlayingRef = useRef<number>(0)
  const chatEndRef = useRef<HTMLDivElement | null>(null)
  const credentialsTimerRef = useRef<NodeJS.Timeout | null>(null)
  const playStartTimeRef = useRef<number>(0)
  const isPlayingRef = useRef<boolean>(false)

  // Auto-scroll to bottom when new messages appear
  const scrollToBottom = useCallback(() => {
    setTimeout(() => {
      chatEndRef.current?.scrollIntoView({ behavior: 'smooth', block: 'end' })
    }, 150)
    setTimeout(() => {
      chatEndRef.current?.scrollIntoView({ behavior: 'smooth', block: 'end' })
    }, 400)
  }, [])

  // Start ambient on mount
  useEffect(() => {
    audioEngine.startAmbient()
    return () => {
      audioEngine.cleanupAll()
    }
  }, [audioEngine])

  // Initialize first audio message after a short delay
  useEffect(() => {
    const timer = setTimeout(() => {
      setMessages([{
        id: 0,
        state: 'recording',
        progress: 0,
        src: AUDIO_CONFIG[0].src,
      }])
      scrollToBottom()
    }, 800)
    return () => clearTimeout(timer)
  }, [scrollToBottom])

  // Auto-transition: recording → ready after 1.8s
  useEffect(() => {
    const recordingMsg = messages.find(m => m.state === 'recording')
    if (!recordingMsg) return

    const timer = setTimeout(() => {
      setMessages(prev => prev.map(m =>
        m.id === recordingMsg.id ? { ...m, state: 'ready' as AudioState } : m
      ))
      scrollToBottom()
    }, 1800)
    return () => clearTimeout(timer)
  }, [messages, scrollToBottom])

  // Handle play click for a specific audio
  const handlePlayAudio = useCallback((msgId: number) => {
    const msg = messages.find(m => m.id === msgId)
    if (!msg || msg.state !== 'ready') return

    // Stop any currently playing audio
    audioEngine.stopPlayback()
    if (animFrameRef.current) {
      cancelAnimationFrame(animFrameRef.current)
      animFrameRef.current = null
    }

    currentPlayingRef.current = msgId
    isPlayingRef.current = true

    // Set to playing
    setMessages(prev => prev.map(m =>
      m.id === msgId ? { ...m, state: 'playing' as AudioState, progress: 0 } : m
    ))

    playStartTimeRef.current = Date.now()
    const duration = AUDIO_CONFIG[msgId].duration * 1000

    // Play with subtle reverb (15% wet — barely perceptible warmth)
    audioEngine.play(msg.src, 0.15, () => {
      // Audio ended naturally
      isPlayingRef.current = false

      setMessages(prev => prev.map(m =>
        m.id === msgId ? { ...m, state: 'played' as AudioState, progress: 1 } : m
      ))

      // Check if this was the last audio
      if (msgId === AUDIO_CONFIG.length - 1) {
        credentialsTimerRef.current = setTimeout(() => {
          setShowCredentials(true)
          scrollToBottom()
          setTimeout(() => {
            setPhase('tiktok')
          }, 3000)
        }, 1500)
      } else {
        // Show next audio after a brief natural pause
        setTimeout(() => {
          const nextId = msgId + 1
          setMessages(prev => [...prev, {
            id: nextId,
            state: 'recording' as AudioState,
            progress: 0,
            src: AUDIO_CONFIG[nextId].src,
          }])
          scrollToBottom()
        }, 1200)
      }
    }).catch(() => {
      isPlayingRef.current = false
    })

    // Progress animation
    const updateProgress = () => {
      const elapsed = Date.now() - playStartTimeRef.current
      const progress = Math.min(elapsed / duration, 1)
      setMessages(prev => prev.map(m =>
        m.id === msgId ? { ...m, progress } : m
      ))

      if (progress < 0.99 && isPlayingRef.current) {
        animFrameRef.current = requestAnimationFrame(updateProgress)
      }
    }
    animFrameRef.current = requestAnimationFrame(updateProgress)
  }, [messages, scrollToBottom, audioEngine])

  // Cleanup
  useEffect(() => {
    return () => {
      audioEngine.stopPlayback()
      if (animFrameRef.current) {
        cancelAnimationFrame(animFrameRef.current)
      }
      if (credentialsTimerRef.current) {
        clearTimeout(credentialsTimerRef.current)
      }
    }
  }, [audioEngine])

  // Format current time
  const now = new Date()
  const msgTime = `${now.getHours().toString().padStart(2, '0')}:${now.getMinutes().toString().padStart(2, '0')}`

  // Generate waveform bars for each message (deterministic)
  const getWaveformBars = (id: number) => {
    const seed = id * 7 + 13
    return Array.from({ length: 38 }, (_, i) => {
      const val = Math.abs(Math.sin(seed + i * 0.7)) * 0.6 + 0.15
      return val
    })
  }

  // Format duration for display
  const formatDuration = (seconds: number) => {
    const m = Math.floor(seconds / 60)
    const s = Math.floor(seconds % 60)
    return `${m}:${s.toString().padStart(2, '0')}`
  }

  return (
    <div
      className="fixed inset-0 z-50 flex flex-col select-none overflow-hidden"
      style={{ background: '#0b141a', fontFamily: "'Cinzel', serif" }}
    >
      <style>{`
        @keyframes audioShimmer {
          0% { transform: translateX(-100%) skewX(-20deg); }
          100% { transform: translateX(300%) skewX(-20deg); }
        }
        @keyframes audioGlow {
          0%, 100% { box-shadow: 0 0 8px rgba(37, 211, 102, 0.15); }
          50% { box-shadow: 0 0 18px rgba(37, 211, 102, 0.3), 0 0 30px rgba(37, 211, 102, 0.1); }
        }
        @keyframes recPulse {
          0%, 100% { opacity: 1; }
          50% { opacity: 0.3; }
        }
        @keyframes tiktokShimmer {
          0% { transform: translateX(-100%) skewX(-20deg); }
          100% { transform: translateX(300%) skewX(-20deg); }
        }
        @keyframes loginGlow {
          0%, 100% { box-shadow: 0 4px 20px rgba(254, 44, 85, 0.3); }
          50% { box-shadow: 0 4px 35px rgba(254, 44, 85, 0.5), 0 0 50px rgba(254, 44, 85, 0.15); }
        }
        .wa-chat-scroll::-webkit-scrollbar { width: 3px; }
        .wa-chat-scroll::-webkit-scrollbar-track { background: transparent; }
        .wa-chat-scroll::-webkit-scrollbar-thumb { background: rgba(255,255,255,0.1); border-radius: 3px; }
      `}</style>

      {/* ==================== CHAT PHASE ==================== */}
      <AnimatePresence>
        {phase === 'chat' && (
          <motion.div
            className="absolute inset-0 flex flex-col"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0, scale: 1.1 }}
            transition={{ duration: 0.2 }}
          >
            {/* === HEADER === */}
            <div style={{
              background: '#1f2c34',
              padding: '0 12px',
              height: 56,
              display: 'flex',
              alignItems: 'center',
              gap: 10,
              borderBottom: '1px solid rgba(255,255,255,0.04)',
              flexShrink: 0,
            }}>
              {/* Back arrow */}
              <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="rgba(255,255,255,0.7)" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <polyline points="15 18 9 12 15 6" />
              </svg>

              {/* Profile pic — B&W */}
              <div style={{
                width: 36, height: 36, borderRadius: '50%',
                overflow: 'hidden', flexShrink: 0,
              }}>
                <img
                  src="/images/zyra-profile.webp"
                  alt="Zyra"
                  style={{
                    width: '100%', height: '100%', objectFit: 'cover',
                    filter: 'grayscale(100%)',
                  }}
                />
              </div>

              {/* Name + status */}
              <div className="flex flex-col flex-1 min-w-0">
                <span style={{
                  fontFamily: "'Cinzel', serif",
                  fontSize: '14px', fontWeight: 600, color: '#FFFFFF',
                  lineHeight: 1.2, letterSpacing: '0.03em',
                }}>
                  Zyra
                </span>
                <span style={{
                  fontFamily: "'Cinzel', serif",
                  fontSize: '10px', fontWeight: 400,
                  color: messages.some(m => m.state === 'recording') ? 'rgba(255,255,255,0.5)' : '#25D366',
                  lineHeight: 1.2, letterSpacing: '0.04em',
                }}>
                  {messages.some(m => m.state === 'recording') ? 'grabando audio...' : 'en línea'}
                </span>
              </div>

              {/* Call icons */}
              <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="rgba(255,255,255,0.6)" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <path d="M22 16.92v3a2 2 0 0 1-2.18 2 19.79 19.79 0 0 1-8.63-3.07 19.5 19.5 0 0 1-6-6 19.79 19.79 0 0 1-3.07-8.67A2 2 0 0 1 4.11 2h3a2 2 0 0 1 2 1.72c.127.96.361 1.903.7 2.81a2 2 0 0 1-.45 2.11L8.09 9.91a16 16 0 0 0 6 6l1.27-1.27a2 2 0 0 1 2.11-.45c.907.339 1.85.573 2.81.7A2 2 0 0 1 22 16.92z" />
              </svg>
              <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="rgba(255,255,255,0.6)" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <polygon points="23 7 16 12 23 17 23 7" />
                <rect x="1" y="5" width="15" height="14" rx="2" ry="2" />
              </svg>
            </div>

            {/* === CHAT BODY with wallpaper background === */}
            <div className="flex-1 relative overflow-hidden">
              {/* Fixed blurred wallpaper background layer */}
              <div className="absolute inset-0" style={{ overflow: 'hidden' }}>
                <img
                  src="/images/wallpaper-whatsapp.jpeg"
                  alt=""
                  style={{
                    width: '100%',
                    height: '100%',
                    objectFit: 'cover',
                    filter: 'blur(8px)',
                    transform: 'scale(1.1)',
                  }}
                />
                {/* Dark overlay for readability */}
                <div className="absolute inset-0" style={{
                  background: 'rgba(11, 20, 26, 0.6)',
                }} />
              </div>

              {/* Scrollable chat content */}
              <div className="relative z-10 overflow-y-auto h-full px-3 py-4 wa-chat-scroll">
                {/* Encryption message */}
                <motion.div
                  className="flex justify-center mb-4"
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: 0.3, duration: 0.4 }}
                >
                  <div style={{
                    background: 'rgba(34, 47, 39, 0.65)',
                    borderRadius: 6,
                    padding: '5px 10px',
                    maxWidth: '85%',
                  }}>
                    <div className="flex items-center gap-1.5">
                      <svg width="10" height="10" viewBox="0 0 24 24" fill="none" stroke="rgba(255,255,255,0.4)" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                        <rect x="3" y="11" width="18" height="11" rx="2" ry="2" />
                        <path d="M7 11V7a5 5 0 0 1 10 0v4" />
                      </svg>
                      <span style={{
                        fontFamily: "'Cinzel', serif",
                        fontSize: '9.5px',
                        color: 'rgba(255,255,255,0.45)',
                        lineHeight: 1.4,
                        letterSpacing: '0.01em',
                      }}>
                        Los mensajes y las llamadas están cifrados de extremo a extremo.
                      </span>
                    </div>
                  </div>
                </motion.div>

                {/* === AUDIO MESSAGES === */}
                {messages.map((msg) => {
                  const waveformBars = getWaveformBars(msg.id)
                  const duration = AUDIO_CONFIG[msg.id].duration
                  const isPlaying = msg.state === 'playing'
                  const isReady = msg.state === 'ready'
                  const isPlayed = msg.state === 'played'

                  return (
                    <div key={msg.id}>
                      {/* Recording indicator */}
                      <AnimatePresence>
                        {msg.state === 'recording' && (
                          <motion.div
                            className="flex justify-start mb-2"
                            initial={{ opacity: 0, y: 10 }}
                            animate={{ opacity: 1, y: 0 }}
                            exit={{ opacity: 0, scale: 0.95 }}
                            transition={{ duration: 0.3 }}
                          >
                            <div style={{
                              background: 'rgba(31, 44, 52, 0.9)',
                              borderRadius: '8px 8px 8px 0',
                              padding: '8px 12px',
                              maxWidth: '75%',
                            }}>
                              <div className="flex items-center gap-2">
                                <div style={{
                                  width: 8, height: 8, borderRadius: '50%',
                                  background: '#EF5350',
                                  animation: 'recPulse 1s ease-in-out infinite',
                                }} />
                                <span style={{
                                  fontFamily: "'Cinzel', serif",
                                  fontSize: '12px',
                                  color: 'rgba(255,255,255,0.5)',
                                  fontStyle: 'italic',
                                  letterSpacing: '0.03em',
                                }}>
                                  grabando audio...
                                </span>
                              </div>
                            </div>
                          </motion.div>
                        )}
                      </AnimatePresence>

                      {/* Audio bubble */}
                      <AnimatePresence>
                        {(isReady || isPlaying || isPlayed) && (
                          <motion.div
                            className="flex justify-start mb-2"
                            initial={{ opacity: 0, y: 15, scale: 0.9 }}
                            animate={{ opacity: 1, y: 0, scale: 1 }}
                            transition={{ duration: 0.35, type: 'spring' }}
                          >
                            <div
                              onClick={isReady ? () => handlePlayAudio(msg.id) : undefined}
                              onTouchEnd={isReady ? (e) => { e.preventDefault(); handlePlayAudio(msg.id) } : undefined}
                              style={{
                                background: isReady ? 'rgba(26, 58, 42, 0.9)' : 'rgba(31, 44, 52, 0.9)',
                                borderRadius: '8px 8px 8px 0',
                                padding: '8px 10px',
                                maxWidth: '80%',
                                position: 'relative',
                                overflow: 'hidden',
                                cursor: isReady ? 'pointer' : 'default',
                                animation: isReady ? 'audioGlow 2.5s ease-in-out infinite' : 'none',
                              }}
                            >
                              {/* Shimmer on ready state — subtle */}
                              {isReady && (
                                <div
                                  style={{
                                    position: 'absolute', top: 0, left: 0, width: '40%', height: '100%',
                                    background: 'linear-gradient(90deg, transparent, rgba(37,211,102,0.06), rgba(37,211,102,0.14), rgba(37,211,102,0.06), transparent)',
                                    animation: 'audioShimmer 3s ease-in-out infinite',
                                    pointerEvents: 'none',
                                  }}
                                />
                              )}

                              <div className="flex items-center gap-2.5" style={{ position: 'relative', zIndex: 1 }}>
                                {/* Play/Pause button */}
                                <div style={{
                                  width: 30, height: 30, borderRadius: '50%',
                                  background: isPlayed ? 'rgba(255,255,255,0.1)' : '#25D366',
                                  display: 'flex', alignItems: 'center', justifyContent: 'center',
                                  flexShrink: 0,
                                  boxShadow: isReady ? '0 0 10px rgba(37,211,102,0.3)' : 'none',
                                }}>
                                  {isPlaying ? (
                                    <svg width="11" height="11" viewBox="0 0 24 24" fill="white" stroke="none">
                                      <rect x="6" y="4" width="4" height="16" rx="1" />
                                      <rect x="14" y="4" width="4" height="16" rx="1" />
                                    </svg>
                                  ) : (
                                    <svg width="11" height="11" viewBox="0 0 24 24" fill="white" stroke="none">
                                      <polygon points="6 3 20 12 6 21 6 3" />
                                    </svg>
                                  )}
                                </div>

                                {/* Waveform */}
                                <div className="flex items-center gap-[1.5px] flex-1" style={{ height: 22 }}>
                                  {waveformBars.map((h, i) => {
                                    const playedUpTo = Math.floor(msg.progress * waveformBars.length)
                                    const isPlayedBar = i < playedUpTo
                                    return (
                                      <div
                                        key={i}
                                        style={{
                                          width: 2.5,
                                          height: `${h * 100}%`,
                                          minHeight: 3,
                                          borderRadius: 1.5,
                                          background: isPlayedBar
                                            ? '#25D366'
                                            : isReady
                                              ? 'rgba(37, 211, 102, 0.5)'
                                              : 'rgba(255,255,255,0.2)',
                                          transition: 'background 0.15s ease',
                                        }}
                                      />
                                    )
                                  })}
                                </div>

                                {/* Duration */}
                                <span style={{
                                  fontFamily: "'Cinzel', serif",
                                  fontSize: '9px',
                                  color: 'rgba(255,255,255,0.4)',
                                  fontVariantNumeric: 'tabular-nums',
                                  flexShrink: 0,
                                  letterSpacing: '0.02em',
                                }}>
                                  {isPlaying
                                    ? formatDuration(duration * (1 - msg.progress))
                                    : formatDuration(duration)
                                  }
                                </span>
                              </div>

                              {/* Timestamp + read receipts */}
                              <div className="flex items-center justify-end gap-1 mt-0.5" style={{ position: 'relative', zIndex: 1 }}>
                                <span style={{
                                  fontFamily: "'Cinzel', serif",
                                  fontSize: '9px',
                                  color: 'rgba(255,255,255,0.3)',
                                  fontVariantNumeric: 'tabular-nums',
                                  letterSpacing: '0.02em',
                                }}>
                                  {msgTime}
                                </span>
                                <svg width="14" height="10" viewBox="0 0 20 12" fill="none" stroke={isPlayed ? '#53bdeb' : 'rgba(255,255,255,0.3)'} strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
                                  <polyline points="1 7 4 10 10 3" />
                                  <polyline points="7 7 10 10 16 3" />
                                </svg>
                              </div>
                            </div>
                          </motion.div>
                        )}
                      </AnimatePresence>
                    </div>
                  )
                })}

                {/* === TIKTOK CREDENTIALS MESSAGE === */}
                <AnimatePresence>
                  {showCredentials && (
                    <motion.div
                      className="flex justify-start mb-2"
                      initial={{ opacity: 0, y: 15, scale: 0.9 }}
                      animate={{ opacity: 1, y: 0, scale: 1 }}
                      transition={{ duration: 0.4, type: 'spring' }}
                    >
                      <div style={{
                        background: 'rgba(31, 44, 52, 0.9)',
                        borderRadius: '8px 8px 8px 0',
                        padding: '10px 14px',
                        maxWidth: '80%',
                      }}>
                        <div className="flex flex-col gap-1.5">
                          <span style={{
                            fontFamily: "'Cinzel', serif",
                            fontSize: '12px',
                            fontWeight: 600,
                            color: '#FFFFFF',
                            letterSpacing: '0.02em',
                            lineHeight: 1.4,
                          }}>
                            Acceso exclusivo 🔓
                          </span>
                          <div style={{
                            background: 'rgba(0,0,0,0.3)',
                            borderRadius: 6,
                            padding: '8px 10px',
                          }}>
                            <span style={{
                              fontFamily: "'Cinzel', serif",
                              fontSize: '11px',
                              color: 'rgba(255,255,255,0.7)',
                              letterSpacing: '0.02em',
                              lineHeight: 1.6,
                              display: 'block',
                            }}>
                              Usuario: <span style={{ color: '#25D366', fontWeight: 600 }}>@ELCODIGODETEXTO</span>
                            </span>
                            <span style={{
                              fontFamily: "'Cinzel', serif",
                              fontSize: '11px',
                              color: 'rgba(255,255,255,0.7)',
                              letterSpacing: '0.02em',
                              lineHeight: 1.6,
                              display: 'block',
                            }}>
                              Clave: <span style={{ color: '#25D366', fontWeight: 600 }}>DANTE01*</span>
                            </span>
                          </div>
                          <span style={{
                            fontFamily: "'Cinzel', serif",
                            fontSize: '10px',
                            color: 'rgba(255,255,255,0.35)',
                            letterSpacing: '0.03em',
                            fontStyle: 'italic',
                          }}>
                            Iniciando sesión...
                          </span>
                        </div>
                        {/* Timestamp */}
                        <div className="flex items-center justify-end gap-1 mt-1">
                          <span style={{
                            fontFamily: "'Cinzel', serif",
                            fontSize: '9px',
                            color: 'rgba(255,255,255,0.3)',
                            fontVariantNumeric: 'tabular-nums',
                          }}>
                            {msgTime}
                          </span>
                          <svg width="14" height="10" viewBox="0 0 20 12" fill="none" stroke="rgba(255,255,255,0.3)" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
                            <polyline points="1 7 4 10 10 3" />
                            <polyline points="7 7 10 10 16 3" />
                          </svg>
                        </div>
                      </div>
                    </motion.div>
                  )}
                </AnimatePresence>

                <div ref={chatEndRef} />
              </div>
            </div>

            {/* === INPUT BAR === */}
            <div style={{
              background: '#1f2c34',
              padding: '6px 10px',
              display: 'flex',
              alignItems: 'center',
              gap: 8,
              borderTop: '1px solid rgba(255,255,255,0.04)',
              flexShrink: 0,
            }}>
              <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="rgba(255,255,255,0.4)" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
                <circle cx="12" cy="12" r="10" />
                <path d="M8 14s1.5 2 4 2 4-2 4-2" />
                <line x1="9" y1="9" x2="9.01" y2="9" />
                <line x1="15" y1="9" x2="15.01" y2="9" />
              </svg>
              <div style={{
                flex: 1,
                background: 'rgba(255,255,255,0.05)',
                borderRadius: 20,
                padding: '8px 14px',
                fontSize: '13px',
                color: 'rgba(255,255,255,0.3)',
                fontFamily: "'Cinzel', serif",
                letterSpacing: '0.02em',
              }}>
                Escribe un mensaje
              </div>
              <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="rgba(255,255,255,0.4)" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
                <path d="M21.44 11.05l-9.19 9.19a6 6 0 0 1-8.49-8.49l9.19-9.19a4 4 0 0 1 5.66 5.66l-9.2 9.19a2 2 0 0 1-2.83-2.83l8.49-8.48" />
              </svg>
              <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="rgba(255,255,255,0.4)" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
                <path d="M12 1a3 3 0 0 0-3 3v8a3 3 0 0 0 6 0V4a3 3 0 0 0-3-3z" />
                <path d="M19 10v2a7 7 0 0 1-14 0v-2" />
                <line x1="12" y1="19" x2="12" y2="23" />
                <line x1="8" y1="23" x2="16" y2="23" />
              </svg>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* ==================== TIKTOK LOGIN PHASE ==================== */}
      <AnimatePresence>
        {phase === 'tiktok' && (
          <motion.div
            className="absolute inset-0 flex flex-col items-center justify-center"
            style={{ background: '#000000' }}
            initial={{ opacity: 0, scale: 0.92 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ duration: 0.4, ease: [0.16, 1, 0.3, 1] }}
          >
            {/* Stop ambient when transitioning to TikTok */}
            {/* TikTok background gradient */}
            <div className="absolute inset-0" style={{
              background: 'radial-gradient(ellipse 80% 60% at 50% 40%, rgba(30,30,35,1) 0%, rgba(10,10,12,1) 60%, #000 100%)',
            }} />

            {/* Content */}
            <div className="relative z-10 w-full max-w-sm px-8 flex flex-col items-center">
              {/* TikTok Logo */}
              <motion.div
                className="mb-8"
                initial={{ opacity: 0, y: -20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.2, duration: 0.5 }}
              >
                <svg width="48" height="48" viewBox="0 0 48 48" fill="none">
                  <path d="M34.1 10.2A9.7 9.7 0 0128 4h-6.4v26.5a5.7 5.7 0 01-5.7 5.3 5.7 5.7 0 01-5.7-5.7 5.7 5.7 0 015.7-5.7c.6 0 1.2.1 1.7.3V18a12.1 12.1 0 00-1.7-.1A12 12 0 004 29.8 12 12 0 0029.6 30V16.8a16 16 0 009.3 3V13.4a9.7 9.7 0 01-4.8-3.2z" fill="white"/>
                  <path d="M34.1 10.2A9.7 9.7 0 0128 4h-6.4v26.5a5.7 5.7 0 01-5.7 5.3 5.7 5.7 0 01-3-0.8A5.7 5.7 0 0021.6 30V13.4h6.4a9.7 9.7 0 006.1 3.2V16.8a16 16 0 01-6.1-1.6V30a12 12 0 01-12 12 12 12 0 01-6-1.6A12 12 0 0028 30V4a9.7 9.7 0 006.1 6.2z" fill="#25F4EE"/>
                  <path d="M34.1 10.2A9.7 9.7 0 0128 4h-6.4v26.5a5.7 5.7 0 01-5.7 5.3 5.7 5.7 0 01-3-0.8 5.7 5.7 0 003.3-5V13.4h6.4a9.7 9.7 0 006.1 3.2V16.8a16 16 0 01-6.1-1.6V30a12 12 0 01-12 12 12 12 0 01-6-1.6A12 12 0 0028 30V4a9.7 9.7 0 006.1 6.2z" fill="#FE2C55"/>
                </svg>
              </motion.div>

              {/* Title */}
              <motion.h1
                style={{
                  fontFamily: "'Cinzel', serif",
                  fontSize: 'clamp(1.2rem, 5vw, 1.5rem)',
                  fontWeight: 700,
                  color: '#FFFFFF',
                  letterSpacing: '0.04em',
                  marginBottom: 28,
                }}
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                transition={{ delay: 0.3, duration: 0.5 }}
              >
                Iniciar sesión en TikTok
              </motion.h1>

              {/* Username field — pre-filled */}
              <motion.div
                className="w-full mb-3"
                initial={{ opacity: 0, x: -20 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ delay: 0.5, duration: 0.4 }}
              >
                <label style={{
                  fontFamily: "'Cinzel', serif",
                  fontSize: '10px',
                  color: 'rgba(255,255,255,0.5)',
                  letterSpacing: '0.06em',
                  textTransform: 'uppercase',
                  marginBottom: 6,
                  display: 'block',
                }}>
                  Usuario
                </label>
                <div style={{
                  background: 'rgba(255,255,255,0.08)',
                  border: '1px solid rgba(255,255,255,0.12)',
                  borderRadius: 8,
                  padding: '12px 14px',
                  fontFamily: "'Cinzel', serif",
                  fontSize: '14px',
                  color: '#FFFFFF',
                  letterSpacing: '0.02em',
                }}>
                  @ELCODIGODETEXTO
                </div>
              </motion.div>

              {/* Password field — with eye toggle */}
              <motion.div
                className="w-full mb-6"
                initial={{ opacity: 0, x: -20 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ delay: 0.65, duration: 0.4 }}
              >
                <label style={{
                  fontFamily: "'Cinzel', serif",
                  fontSize: '10px',
                  color: 'rgba(255,255,255,0.5)',
                  letterSpacing: '0.06em',
                  textTransform: 'uppercase',
                  marginBottom: 6,
                  display: 'block',
                }}>
                  Contraseña
                </label>
                <div style={{
                  background: 'rgba(255,255,255,0.08)',
                  border: '1px solid rgba(255,255,255,0.12)',
                  borderRadius: 8,
                  padding: '12px 14px',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'space-between',
                }}>
                  <span style={{
                    fontFamily: "'Cinzel', serif",
                    fontSize: '14px',
                    color: '#FFFFFF',
                    letterSpacing: '0.08em',
                  }}>
                    {showPassword ? 'DANTE01*' : '•••••••'}
                  </span>
                  {/* Eye icon — clickable */}
                  <button
                    type="button"
                    onClick={() => setShowPassword(!showPassword)}
                    onTouchEnd={(e) => { e.preventDefault(); setShowPassword(!showPassword) }}
                    style={{
                      background: 'none',
                      border: 'none',
                      cursor: 'pointer',
                      padding: 4,
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                    }}
                  >
                    {showPassword ? (
                      <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="rgba(255,255,255,0.5)" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
                        <path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z" />
                        <circle cx="12" cy="12" r="3" />
                      </svg>
                    ) : (
                      <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="rgba(255,255,255,0.5)" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
                        <path d="M17.94 17.94A10.07 10.07 0 0112 20c-7 0-11-8-11-8a18.45 18.45 0 015.06-5.94M9.9 4.24A9.12 9.12 0 0112 4c7 0 11 8 11 8a18.5 18.5 0 01-2.16 3.19m-6.72-1.07a3 3 0 11-4.24-4.24" />
                        <line x1="1" y1="1" x2="23" y2="23" />
                      </svg>
                    )}
                  </button>
                </div>
              </motion.div>

              {/* Iniciar sesión button */}
              <motion.button
                type="button"
                className="w-full relative overflow-hidden"
                style={{
                  background: '#FE2C55',
                  border: 'none',
                  borderRadius: 8,
                  padding: '14px 0',
                  fontFamily: "'Cinzel', serif",
                  fontSize: 'clamp(0.85rem, 3.5vw, 1rem)',
                  fontWeight: 700,
                  color: '#FFFFFF',
                  letterSpacing: '0.12em',
                  textTransform: 'uppercase',
                  cursor: 'pointer',
                  animation: 'loginGlow 2.5s ease-in-out infinite',
                }}
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.8, duration: 0.5 }}
                whileTap={{ scale: 0.97 }}
              >
                {/* Shimmer on button */}
                <div
                  style={{
                    position: 'absolute', top: 0, left: 0, width: '40%', height: '100%',
                    background: 'linear-gradient(90deg, transparent, rgba(255,255,255,0.1), rgba(255,255,255,0.2), rgba(255,255,255,0.1), transparent)',
                    animation: 'tiktokShimmer 3s ease-in-out infinite',
                    pointerEvents: 'none',
                  }}
                />
                <span style={{ position: 'relative', zIndex: 1 }}>Iniciar sesión</span>
              </motion.button>

              {/* Social login options */}
              <motion.div
                className="w-full mt-6 mb-4"
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                transition={{ delay: 0.9, duration: 0.5 }}
              >
                {/* Divider */}
                <div className="flex items-center gap-3 mb-5">
                  <div className="flex-1" style={{ height: 1, background: 'rgba(255,255,255,0.08)' }} />
                  <span style={{
                    fontFamily: "'Cinzel', serif",
                    fontSize: '9px',
                    color: 'rgba(255,255,255,0.3)',
                    letterSpacing: '0.08em',
                    textTransform: 'uppercase',
                  }}>
                    o continuar con
                  </span>
                  <div className="flex-1" style={{ height: 1, background: 'rgba(255,255,255,0.08)' }} />
                </div>

                {/* Social buttons */}
                <div className="flex items-center justify-center gap-5">
                  {/* Google */}
                  <div style={{
                    width: 44, height: 44, borderRadius: '50%',
                    border: '1px solid rgba(255,255,255,0.1)',
                    display: 'flex', alignItems: 'center', justifyContent: 'center',
                    cursor: 'pointer',
                  }}>
                    <svg width="18" height="18" viewBox="0 0 24 24">
                      <path d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92a5.06 5.06 0 01-2.2 3.32v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.1z" fill="#4285F4"/>
                      <path d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" fill="#34A853"/>
                      <path d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z" fill="#FBBC05"/>
                      <path d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z" fill="#EA4335"/>
                    </svg>
                  </div>
                  {/* Apple */}
                  <div style={{
                    width: 44, height: 44, borderRadius: '50%',
                    border: '1px solid rgba(255,255,255,0.1)',
                    display: 'flex', alignItems: 'center', justifyContent: 'center',
                    cursor: 'pointer',
                  }}>
                    <svg width="18" height="18" viewBox="0 0 24 24" fill="white">
                      <path d="M17.05 20.28c-.98.95-2.05.88-3.08.4-1.09-.5-2.08-.48-3.24 0-1.44.62-2.2.44-3.06-.4C2.79 15.25 3.51 7.59 9.05 7.31c1.35.07 2.29.74 3.08.8 1.18-.24 2.31-.93 3.57-.84 1.51.12 2.65.72 3.4 1.8-3.12 1.87-2.38 5.98.48 7.13-.57 1.5-1.31 2.99-2.54 4.09zM12.03 7.25c-.15-2.23 1.66-4.07 3.74-4.25.29 2.58-2.34 4.5-3.74 4.25z"/>
                    </svg>
                  </div>
                  {/* Facebook */}
                  <div style={{
                    width: 44, height: 44, borderRadius: '50%',
                    border: '1px solid rgba(255,255,255,0.1)',
                    display: 'flex', alignItems: 'center', justifyContent: 'center',
                    cursor: 'pointer',
                  }}>
                    <svg width="18" height="18" viewBox="0 0 24 24" fill="#1877F2">
                      <path d="M24 12.073c0-6.627-5.373-12-12-12s-12 5.373-12 12c0 5.99 4.388 10.954 10.125 11.854v-8.385H7.078v-3.47h3.047V9.43c0-3.007 1.792-4.669 4.533-4.669 1.312 0 2.686.235 2.686.235v2.953H15.83c-1.491 0-1.956.925-1.956 1.874v2.25h3.328l-.532 3.47h-2.796v8.385C19.612 23.027 24 18.062 24 12.073z"/>
                    </svg>
                  </div>
                </div>
              </motion.div>

              {/* Footer links */}
              <motion.div
                className="flex items-center gap-4 mt-3"
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                transition={{ delay: 1, duration: 0.5 }}
              >
                <span style={{
                  fontFamily: "'Cinzel', serif",
                  fontSize: '10px',
                  color: 'rgba(255,255,255,0.35)',
                  letterSpacing: '0.02em',
                }}>
                  ¿Olvidaste la contraseña?
                </span>
                <span style={{
                  fontFamily: "'Cinzel', serif",
                  fontSize: '10px',
                  color: 'rgba(255,255,255,0.35)',
                  letterSpacing: '0.02em',
                }}>
                  Registrarse
                </span>
              </motion.div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  )
}
