'use client'

import { useEffect, useRef, useState, useCallback } from 'react'
import { motion, AnimatePresence } from 'framer-motion'

interface WhatsAppChatScreenProps {
  onComplete: () => void
}

interface VoiceMessage {
  id: number
  src: string
  duration: number
  arrived: boolean
  playing: boolean
  progress: number
  played: boolean
  needsUserPlay: boolean // only true for first message
}

export default function WhatsAppChatScreen({ onComplete }: WhatsAppChatScreenProps) {
  const [messages, setMessages] = useState<VoiceMessage[]>([
    { id: 1, src: '/audio/wha-voices/voice1.wav', duration: 0, arrived: false, playing: false, progress: 0, played: false, needsUserPlay: true },
    { id: 2, src: '/audio/wha-voices/voice2.wav', duration: 0, arrived: false, playing: false, progress: 0, played: false, needsUserPlay: false },
    { id: 3, src: '/audio/wha-voices/voice3.wav', duration: 0, arrived: false, playing: false, progress: 0, played: false, needsUserPlay: false },
    { id: 4, src: '/audio/wha-voices/voice4.wav', duration: 0, arrived: false, playing: false, progress: 0, played: false, needsUserPlay: false },
    { id: 5, src: '/audio/wha-voices/voice5.wav', duration: 0, arrived: false, playing: false, progress: 0, played: false, needsUserPlay: false },
  ])
  const [credentialStep, setCredentialStep] = useState(0) // 0=none, 1=username, 2=password

  const audioRef = useRef<HTMLAudioElement | null>(null)
  const currentPlayingRef = useRef<number>(0)
  const completedRef = useRef(false)
  const onCompleteRef = useRef(onComplete)
  const messagesRef = useRef(messages)
  const chatContainerRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    onCompleteRef.current = onComplete
  }, [onComplete])

  useEffect(() => {
    messagesRef.current = messages
  }, [messages])

  // Auto-scroll to bottom
  const scrollToBottom = useCallback(() => {
    if (chatContainerRef.current) {
      chatContainerRef.current.scrollTop = chatContainerRef.current.scrollHeight
    }
  }, [])

  useEffect(() => {
    setTimeout(scrollToBottom, 150)
  }, [messages, credentialStep, scrollToBottom])

  // Load audio durations
  useEffect(() => {
    const loadDurations = async () => {
      const updated = [...messages]
      for (let i = 0; i < updated.length; i++) {
        const audio = new Audio(updated[i].src)
        audio.preload = 'metadata'
        await new Promise<void>((resolve) => {
          audio.addEventListener('loadedmetadata', () => {
            updated[i] = { ...updated[i], duration: audio.duration }
            resolve()
          })
          audio.addEventListener('error', () => resolve())
          setTimeout(() => resolve(), 3000)
        })
      }
      setMessages(updated)
    }
    loadDurations()
  }, [])

  // First message arrives on mount — user must click play
  useEffect(() => {
    const timer = setTimeout(() => {
      setMessages(prev => {
        const next = [...prev]
        next[0] = { ...next[0], arrived: true }
        return next
      })
      setTimeout(scrollToBottom, 200)
    }, 800)
    return () => clearTimeout(timer)
  }, [scrollToBottom])

  // User clicks play on first message
  const handleUserPlay = useCallback(() => {
    playVoice(0)
  }, [])

  // Arrive and auto-play a message (for messages 2-5)
  const arriveAndPlay = useCallback((index: number) => {
    if (index >= 5) return

    setMessages(prev => {
      const next = [...prev]
      next[index] = { ...next[index], arrived: true }
      return next
    })

    setTimeout(scrollToBottom, 200)

    // Auto-play after a small delay
    setTimeout(() => {
      playVoice(index)
    }, 600)
  }, [scrollToBottom])

  const playVoice = useCallback((index: number) => {
    // Stop any current audio
    if (audioRef.current) {
      audioRef.current.pause()
      audioRef.current.src = ''
    }

    const msg = messagesRef.current[index]
    const audio = new Audio(msg.src)
    audioRef.current = audio

    setMessages(prev => {
      const next = [...prev]
      next[index] = { ...next[index], playing: true }
      return next
    })

    currentPlayingRef.current = index

    audio.addEventListener('timeupdate', () => {
      if (audio.duration > 0) {
        const prog = (audio.currentTime / audio.duration) * 100
        setMessages(prev => {
          const next = [...prev]
          next[index] = { ...next[index], progress: prog }
          return next
        })

        // When 99% reached, trigger next
        if (prog >= 99 && !messagesRef.current[index].played) {
          setMessages(prev => {
            const next = [...prev]
            next[index] = { ...next[index], played: true, playing: false, progress: 100 }
            return next
          })

          if (index < 4) {
            setTimeout(() => arriveAndPlay(index + 1), 500)
          } else {
            // Last voice — send credentials
            setTimeout(() => {
              setCredentialStep(1)
              setTimeout(scrollToBottom, 200)
              setTimeout(() => {
                setCredentialStep(2)
                setTimeout(scrollToBottom, 200)
                // After 4 seconds, go to TikTok login
                setTimeout(() => {
                  if (!completedRef.current) {
                    completedRef.current = true
                    onCompleteRef.current()
                  }
                }, 4000)
              }, 800)
            }, 1000)
          }
        }
      }
    })

    audio.addEventListener('ended', () => {
      setMessages(prev => {
        const next = [...prev]
        next[index] = { ...next[index], playing: false, progress: 100, played: true }
        return next
      })

      if (!messagesRef.current[index].played) {
        if (index < 4) {
          setTimeout(() => arriveAndPlay(index + 1), 500)
        } else {
          setTimeout(() => {
            setCredentialStep(1)
            setTimeout(scrollToBottom, 200)
            setTimeout(() => {
              setCredentialStep(2)
              setTimeout(scrollToBottom, 200)
              setTimeout(() => {
                if (!completedRef.current) {
                  completedRef.current = true
                  onCompleteRef.current()
                }
              }, 4000)
            }, 800)
          }, 1000)
        }
      }
    })

    audio.play().catch(() => {})
  }, [arriveAndPlay, scrollToBottom])

  const formatDuration = (sec: number) => {
    if (!sec || !isFinite(sec)) return '0:00'
    const m = Math.floor(sec / 60)
    const s = Math.floor(sec % 60)
    return `${m}:${s.toString().padStart(2, '0')}`
  }

  const getNowTime = () => {
    const now = new Date()
    return `${now.getHours().toString().padStart(2, '0')}:${now.getMinutes().toString().padStart(2, '0')}`
  }

  // Deterministic waveform bars
  const getWaveformBars = (msgIndex: number) => {
    const bars: number[] = []
    for (let j = 0; j < 30; j++) {
      const seed = Math.sin(msgIndex * 127.1 + j * 311.7) * 43758.5453
      const normalized = seed - Math.floor(seed)
      bars.push(4 + normalized * 14)
    }
    return bars
  }

  return (
    <div
      style={{
        position: 'fixed',
        inset: 0,
        backgroundColor: '#0b141a',
        display: 'flex',
        flexDirection: 'column',
        fontFamily: '-apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, Helvetica, Arial, sans-serif',
        overflow: 'hidden',
        userSelect: 'none',
      }}
    >
      {/* ── Chat wallpaper ── */}
      <div
        style={{
          position: 'absolute',
          inset: 0,
          backgroundImage: 'url(/images/chat/wallpaper.jpg)',
          backgroundSize: 'cover',
          backgroundPosition: 'center',
          opacity: 0.3,
        }}
      />

      {/* ══════════════════════════════════════
          HEADER BAR
          ══════════════════════════════════════ */}
      <div
        style={{
          position: 'relative',
          zIndex: 20,
          background: '#1f2c34',
          padding: '0 8px',
          flexShrink: 0,
        }}
      >
        {/* Android status bar mock */}
        <div style={{
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center',
          padding: '6px 10px 2px',
          color: 'rgba(255,255,255,0.6)',
          fontSize: '0.68rem',
          fontWeight: 600,
        }}>
          <span>{getNowTime()}</span>
          <div style={{ display: 'flex', gap: 4, alignItems: 'center' }}>
            <svg width="12" height="10" viewBox="0 0 16 12" fill="currentColor" opacity="0.6">
              <rect x="0" y="8" width="3" height="4" rx="0.5" />
              <rect x="4" y="5" width="3" height="7" rx="0.5" />
              <rect x="8" y="2" width="3" height="10" rx="0.5" />
              <rect x="12" y="0" width="3" height="12" rx="0.5" />
            </svg>
            <svg width="12" height="10" viewBox="0 0 24 24" fill="currentColor" opacity="0.6">
              <path d="M1 9l2 2c4.97-4.97 13.03-4.97 18 0l2-2C16.93 2.93 7.08 2.93 1 9zm8 8l3 3 3-3c-1.65-1.66-4.34-1.66-6 0zm-4-4l2 2c2.76-2.76 7.24-2.76 10 0l2-2C15.14 9.14 8.87 9.14 5 13z" />
            </svg>
            <svg width="18" height="10" viewBox="0 0 22 12" fill="none">
              <rect x="0.5" y="0.5" width="16" height="11" rx="2" stroke="rgba(255,255,255,0.4)" strokeWidth="1" />
              <rect x="2" y="2" width="11" height="8" rx="1" fill="rgba(255,255,255,0.6)" />
              <rect x="17" y="3" width="2" height="6" rx="0.5" fill="rgba(255,255,255,0.4)" />
            </svg>
          </div>
        </div>

        {/* Chat header row — all non-interactive */}
        <div style={{
          display: 'flex',
          alignItems: 'center',
          padding: '4px 4px 8px',
          gap: 6,
          pointerEvents: 'none',
        }}>
          <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="rgba(255,255,255,0.7)" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" style={{ flexShrink: 0 }}>
            <polyline points="15 18 9 12 15 6" />
          </svg>

          <div style={{
            width: 38,
            height: 38,
            borderRadius: '50%',
            overflow: 'hidden',
            flexShrink: 0,
          }}>
            <img
              src="/images/notification/zyra-profile.png"
              alt="Zyra"
              style={{ width: '100%', height: '100%', objectFit: 'cover' }}
            />
          </div>

          {/* Name + status with MÉTODO MAGNÉTICO */}
          <div style={{ flex: 1, minWidth: 0 }}>
            <div style={{ color: '#e9edef', fontSize: '0.92rem', fontWeight: 500, lineHeight: 1.2 }}>Zyra</div>
            <div style={{ color: '#8696a0', fontSize: '0.68rem', lineHeight: 1.3, display: 'flex', alignItems: 'center', gap: 4 }}>
              <span>en línea</span>
              <span style={{ color: 'rgba(255,255,255,0.25)', fontSize: '0.5rem' }}>•</span>
              <span style={{ fontFamily: "'Cinzel', serif", fontSize: '0.52rem', color: 'rgba(255,255,255,0.3)', letterSpacing: '0.12em' }}>MÉTODO MAGNÉTICO</span>
            </div>
          </div>

          <svg width="21" height="21" viewBox="0 0 24 24" fill="none" stroke="rgba(255,255,255,0.55)" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" style={{ flexShrink: 0 }}>
            <polygon points="23 7 16 12 23 17 23 7" />
            <rect x="1" y="5" width="15" height="14" rx="2" ry="2" />
          </svg>
          <svg width="21" height="21" viewBox="0 0 24 24" fill="none" stroke="rgba(255,255,255,0.55)" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" style={{ flexShrink: 0 }}>
            <path d="M22 16.92v3a2 2 0 0 1-2.18 2 19.79 19.79 0 0 1-8.63-3.07 19.5 19.5 0 0 1-6-6 19.79 19.79 0 0 1-3.07-8.67A2 2 0 0 1 4.11 2h3a2 2 0 0 1 2 1.72c.127.96.361 1.903.7 2.81a2 2 0 0 1-.45 2.11L8.09 9.91a16 16 0 0 0 6 6l1.27-1.27a2 2 0 0 1 2.11-.45c.907.339 1.85.573 2.81.7A2 2 0 0 1 22 16.92z" />
          </svg>
          <svg width="21" height="21" viewBox="0 0 24 24" fill="none" stroke="rgba(255,255,255,0.55)" strokeWidth="2" strokeLinecap="round" style={{ flexShrink: 0 }}>
            <circle cx="12" cy="5" r="1" />
            <circle cx="12" cy="12" r="1" />
            <circle cx="12" cy="19" r="1" />
          </svg>
        </div>
      </div>

      {/* ══════════════════════════════════════
          CHAT MESSAGES AREA
          ══════════════════════════════════════ */}
      <div
        ref={chatContainerRef}
        style={{
          flex: 1,
          overflowY: 'auto',
          padding: '6px 10px 10px',
          position: 'relative',
          zIndex: 5,
          WebkitOverflowScrolling: 'touch',
        }}
      >
        {/* Today chip */}
        <div style={{ textAlign: 'center', margin: '6px 0 12px' }}>
          <span style={{
            background: 'rgba(30,42,50,0.88)',
            color: 'rgba(255,255,255,0.55)',
            fontSize: '0.62rem',
            padding: '3px 10px',
            borderRadius: 6,
            letterSpacing: '0.02em',
            fontWeight: 500,
          }}>
            HOY
          </span>
        </div>

        {messages.map((msg, i) => (
          <AnimatePresence key={msg.id}>
            {msg.arrived && (
              <motion.div
                initial={{ opacity: 0, y: 12, scale: 0.96 }}
                animate={{ opacity: 1, y: 0, scale: 1 }}
                transition={{ duration: 0.35, ease: 'easeOut' }}
                style={{
                  display: 'flex',
                  justifyContent: 'flex-start',
                  marginBottom: 4,
                }}
              >
                <div style={{
                  background: '#1f2c34',
                  borderRadius: '8px 0 8px 8px',
                  padding: '7px 8px 5px',
                  maxWidth: '80%',
                  position: 'relative',
                  boxShadow: '0 1px 1px rgba(0,0,0,0.15)',
                }}>
                  {/* Tail triangle */}
                  <div style={{
                    position: 'absolute',
                    top: 0,
                    left: -6,
                    width: 0,
                    height: 0,
                    borderTop: '8px solid #1f2c34',
                    borderLeft: '6px solid transparent',
                  }} />

                  {/* Voice content */}
                  <div style={{ display: 'flex', alignItems: 'center', gap: 7 }}>
                    {/* Play/Pause button */}
                    {msg.needsUserPlay && !msg.playing && !msg.played ? (
                      /* CLICKABLE play button for first message with shimmer effect */
                      <button
                        onClick={handleUserPlay}
                        style={{
                          width: 34,
                          height: 34,
                          borderRadius: '50%',
                          background: '#25D366',
                          display: 'flex',
                          alignItems: 'center',
                          justifyContent: 'center',
                          flexShrink: 0,
                          border: 'none',
                          cursor: 'pointer',
                          padding: 0,
                          position: 'relative',
                          overflow: 'hidden',
                          boxShadow: '0 0 12px rgba(37,211,102,0.5), 0 0 24px rgba(37,211,102,0.25)',
                          outline: 'none',
                          WebkitTapHighlightColor: 'transparent',
                        }}
                      >
                        {/* Shimmer sweep effect */}
                        <div style={{
                          position: 'absolute',
                          inset: 0,
                          background: 'linear-gradient(105deg, transparent 30%, rgba(255,255,255,0.4) 50%, transparent 70%)',
                          animation: 'shimmerSweep 2s ease-in-out infinite',
                        }} />
                        <svg width="14" height="14" viewBox="0 0 24 24" fill="white" style={{ position: 'relative', zIndex: 1 }}>
                          <path d="M8 5v14l11-7z" />
                        </svg>
                      </button>
                    ) : (
                      /* Normal (non-interactive) play/pause indicator */
                      <div style={{
                        width: 30,
                        height: 30,
                        borderRadius: '50%',
                        background: '#25D366',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        flexShrink: 0,
                        boxShadow: msg.playing ? '0 1px 3px rgba(37,211,102,0.3)' : 'none',
                      }}>
                        {msg.playing ? (
                          <svg width="12" height="12" viewBox="0 0 24 24" fill="white">
                            <rect x="6" y="4" width="4" height="16" rx="1" />
                            <rect x="14" y="4" width="4" height="16" rx="1" />
                          </svg>
                        ) : (
                          <svg width="12" height="12" viewBox="0 0 24 24" fill="white">
                            <path d="M8 5v14l11-7z" />
                          </svg>
                        )}
                      </div>
                    )}

                    {/* Waveform */}
                    <div style={{
                      flex: 1,
                      minWidth: 0,
                      height: 26,
                      display: 'flex',
                      alignItems: 'center',
                      gap: 1.5,
                      padding: '0 2px',
                    }}>
                      {getWaveformBars(i).map((barHeight, j) => {
                        const filled = (j / 30) * 100 <= msg.progress
                        return (
                          <div
                            key={j}
                            style={{
                              width: 2.5,
                              height: barHeight,
                              borderRadius: 1.5,
                              background: filled ? '#25D366' : 'rgba(255,255,255,0.18)',
                              flexShrink: 0,
                              transition: 'background 0.15s',
                            }}
                          />
                        )
                      })}
                    </div>
                  </div>

                  {/* Timestamp */}
                  <div style={{
                    display: 'flex',
                    justifyContent: 'flex-end',
                    alignItems: 'center',
                    gap: 4,
                    marginTop: 2,
                    paddingRight: 2,
                  }}>
                    <span style={{ fontSize: '0.58rem', color: 'rgba(255,255,255,0.38)' }}>
                      {formatDuration(msg.duration)}
                    </span>
                    <span style={{ fontSize: '0.58rem', color: 'rgba(255,255,255,0.38)' }}>
                      {getNowTime()}
                    </span>
                  </div>
                </div>
              </motion.div>
            )}
          </AnimatePresence>
        ))}

        {/* Credentials */}
        <AnimatePresence>
          {credentialStep >= 1 && (
            <motion.div
              initial={{ opacity: 0, y: 12, scale: 0.96 }}
              animate={{ opacity: 1, y: 0, scale: 1 }}
              transition={{ duration: 0.35 }}
              style={{ display: 'flex', justifyContent: 'flex-start', marginTop: 4 }}
            >
              <div style={{
                background: '#1f2c34',
                borderRadius: '8px 0 8px 8px',
                padding: '6px 10px 4px',
                maxWidth: '80%',
                position: 'relative',
                boxShadow: '0 1px 1px rgba(0,0,0,0.15)',
              }}>
                <div style={{ position: 'absolute', top: 0, left: -6, width: 0, height: 0, borderTop: '8px solid #1f2c34', borderLeft: '6px solid transparent' }} />
                <div style={{ color: '#e9edef', fontSize: '0.88rem', lineHeight: 1.45, wordBreak: 'break-word' }}>
                  @ELCODIGODETEXTO
                </div>
                <div style={{ display: 'flex', justifyContent: 'flex-end', alignItems: 'center', gap: 4, marginTop: 1 }}>
                  <span style={{ fontSize: '0.58rem', color: 'rgba(255,255,255,0.38)' }}>{getNowTime()}</span>
                  <svg width="14" height="8" viewBox="0 0 16 9" fill="none" style={{ flexShrink: 0 }}>
                    <path d="M0 4.5L2.5 7L8 1.5" stroke="rgba(37,211,102,0.7)" strokeWidth="1.3" strokeLinecap="round" strokeLinejoin="round" />
                    <path d="M5 4.5L7.5 7L13 1.5" stroke="rgba(37,211,102,0.7)" strokeWidth="1.3" strokeLinecap="round" strokeLinejoin="round" />
                  </svg>
                </div>
              </div>
            </motion.div>
          )}
        </AnimatePresence>

        <AnimatePresence>
          {credentialStep >= 2 && (
            <motion.div
              initial={{ opacity: 0, y: 12, scale: 0.96 }}
              animate={{ opacity: 1, y: 0, scale: 1 }}
              transition={{ duration: 0.35 }}
              style={{ display: 'flex', justifyContent: 'flex-start', marginTop: 4 }}
            >
              <div style={{
                background: '#1f2c34',
                borderRadius: '8px 0 8px 8px',
                padding: '6px 10px 4px',
                maxWidth: '80%',
                position: 'relative',
                boxShadow: '0 1px 1px rgba(0,0,0,0.15)',
              }}>
                <div style={{ position: 'absolute', top: 0, left: -6, width: 0, height: 0, borderTop: '8px solid #1f2c34', borderLeft: '6px solid transparent' }} />
                <div style={{ color: '#e9edef', fontSize: '0.88rem', lineHeight: 1.45, wordBreak: 'break-word' }}>
                  DANTE000
                </div>
                <div style={{ display: 'flex', justifyContent: 'flex-end', alignItems: 'center', gap: 4, marginTop: 1 }}>
                  <span style={{ fontSize: '0.58rem', color: 'rgba(255,255,255,0.38)' }}>{getNowTime()}</span>
                  <svg width="14" height="8" viewBox="0 0 16 9" fill="none" style={{ flexShrink: 0 }}>
                    <path d="M0 4.5L2.5 7L8 1.5" stroke="rgba(37,211,102,0.7)" strokeWidth="1.3" strokeLinecap="round" strokeLinejoin="round" />
                    <path d="M5 4.5L7.5 7L13 1.5" stroke="rgba(37,211,102,0.7)" strokeWidth="1.3" strokeLinecap="round" strokeLinejoin="round" />
                  </svg>
                </div>
              </div>
            </motion.div>
          )}
        </AnimatePresence>

        <div style={{ height: 1 }} />
      </div>

      {/* ══════════════════════════════════════
          BOTTOM INPUT BAR (decorative, non-interactive)
          ══════════════════════════════════════ */}
      <div
        style={{
          position: 'relative',
          zIndex: 20,
          background: '#1f2c34',
          padding: '6px 8px',
          display: 'flex',
          alignItems: 'center',
          gap: 8,
          flexShrink: 0,
          pointerEvents: 'none',
        }}
      >
        <svg width="23" height="23" viewBox="0 0 24 24" fill="none" stroke="rgba(255,255,255,0.45)" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" style={{ flexShrink: 0 }}>
          <circle cx="12" cy="12" r="10" />
          <path d="M8 14s1.5 2 4 2 4-2 4-2" />
          <line x1="9" y1="9" x2="9.01" y2="9" />
          <line x1="15" y1="9" x2="15.01" y2="9" />
        </svg>
        <div style={{
          flex: 1,
          background: '#2a3942',
          borderRadius: 22,
          padding: '9px 14px',
          color: 'rgba(255,255,255,0.3)',
          fontSize: '0.82rem',
          fontWeight: 400,
        }}>
          Mensaje
        </div>
        <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="rgba(255,255,255,0.45)" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" style={{ flexShrink: 0, transform: 'rotate(45deg)' }}>
          <path d="M21.44 11.05l-9.19 9.19a6 6 0 0 1-8.49-8.49l9.19-9.19a4 4 0 0 1 5.66 5.66l-9.2 9.19a2 2 0 0 1-2.83-2.83l8.49-8.48" />
        </svg>
        <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="rgba(255,255,255,0.45)" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" style={{ flexShrink: 0 }}>
          <path d="M23 19a2 2 0 0 1-2 2H3a2 2 0 0 1-2-2V8a2 2 0 0 1 2-2h4l2-3h6l2 3h4a2 2 0 0 1 2 2z" />
          <circle cx="12" cy="13" r="4" />
        </svg>
        <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="rgba(255,255,255,0.45)" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" style={{ flexShrink: 0 }}>
          <path d="M12 1a3 3 0 0 0-3 3v8a3 3 0 0 0 6 0V4a3 3 0 0 0-3-3z" />
          <path d="M19 10v2a7 7 0 0 1-14 0v-2" />
          <line x1="12" y1="19" x2="12" y2="23" />
          <line x1="8" y1="23" x2="16" y2="23" />
        </svg>
      </div>

      {/* ── Shimmer keyframes (injected once) ── */}
      <style>{`
        @keyframes shimmerSweep {
          0% { transform: translateX(-150%); }
          50% { transform: translateX(150%); }
          100% { transform: translateX(-150%); }
        }
      `}</style>
    </div>
  )
}
