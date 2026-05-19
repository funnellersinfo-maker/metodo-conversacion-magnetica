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
  sparkle: boolean
  playing: boolean
  progress: number
  played: boolean
}

export default function WhatsAppChatScreen({ onComplete }: WhatsAppChatScreenProps) {
  const [messages, setMessages] = useState<VoiceMessage[]>([
    { id: 1, src: '/audio/wha-voices/voice1.wav', duration: 0, arrived: false, sparkle: false, playing: false, progress: 0, played: false },
    { id: 2, src: '/audio/wha-voices/voice2.wav', duration: 0, arrived: false, sparkle: false, playing: false, progress: 0, played: false },
    { id: 3, src: '/audio/wha-voices/voice3.wav', duration: 0, arrived: false, sparkle: false, playing: false, progress: 0, played: false },
    { id: 4, src: '/audio/wha-voices/voice4.wav', duration: 0, arrived: false, sparkle: false, playing: false, progress: 0, played: false },
    { id: 5, src: '/audio/wha-voices/voice5.wav', duration: 0, arrived: false, sparkle: false, playing: false, progress: 0, played: false },
  ])
  const [credentialsSent, setCredentialsSent] = useState(false)
  const [currentTime, setCurrentTime] = useState('')

  const audioRef = useRef<HTMLAudioElement | null>(null)
  const currentPlayingRef = useRef<number>(0)
  const completedRef = useRef(false)
  const onCompleteRef = useRef(onComplete)
  const messagesRef = useRef(messages)
  const chatEndRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    onCompleteRef.current = onComplete
  }, [onComplete])

  useEffect(() => {
    messagesRef.current = messages
  }, [messages])

  // Update time
  useEffect(() => {
    const update = () => {
      const now = new Date()
      setCurrentTime(`${now.getHours().toString().padStart(2, '0')}:${now.getMinutes().toString().padStart(2, '0')}`)
    }
    update()
    const iv = setInterval(update, 1000)
    return () => clearInterval(iv)
  }, [])

  // Auto-scroll to bottom
  useEffect(() => {
    setTimeout(() => {
      chatEndRef.current?.scrollIntoView({ behavior: 'smooth' })
    }, 100)
  }, [messages, credentialsSent])

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
  }, []) // eslint-disable-line react-hooks/exhaustive-deps

  // Start the sequence — first message arrives after 1.5s
  useEffect(() => {
    const timer = setTimeout(() => {
      arriveMessage(0)
    }, 1500)
    return () => clearTimeout(timer)
  }, []) // eslint-disable-line react-hooks/exhaustive-deps

  const arriveMessage = useCallback((index: number) => {
    if (index >= 5) return

    // Show sparkle first
    setMessages(prev => {
      const next = [...prev]
      next[index] = { ...next[index], sparkle: true }
      return next
    })

    // After sparkle, show message as arrived
    setTimeout(() => {
      setMessages(prev => {
        const next = [...prev]
        next[index] = { ...next[index], arrived: true, sparkle: false }
        return next
      })

      // Auto-play the voice
      setTimeout(() => {
        playVoice(index)
      }, 600)
    }, 1200)
  }, []) // eslint-disable-line react-hooks/exhaustive-deps

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

        // When 99% reached, trigger next message
        if (prog >= 99 && !messagesRef.current[index].played) {
          setMessages(prev => {
            const next = [...prev]
            next[index] = { ...next[index], played: true, playing: false, progress: 100 }
            return next
          })

          // Next message or credentials
          if (index < 4) {
            setTimeout(() => arriveMessage(index + 1), 500)
          } else {
            // Last voice done — send credentials after short delay
            setTimeout(() => {
              setCredentialsSent(true)
              // After 4 seconds, go to TikTok login
              setTimeout(() => {
                if (!completedRef.current) {
                  completedRef.current = true
                  onCompleteRef.current()
                }
              }, 4000)
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
        // Mark as played and proceed
        if (index < 4) {
          setTimeout(() => arriveMessage(index + 1), 500)
        } else {
          setTimeout(() => {
            setCredentialsSent(true)
            setTimeout(() => {
              if (!completedRef.current) {
                completedRef.current = true
                onCompleteRef.current()
              }
            }, 4000)
          }, 1000)
        }
      }
    })

    audio.play().catch(() => {})
  }, [arriveMessage])

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

  return (
    <div
      style={{
        position: 'fixed',
        inset: 0,
        backgroundColor: '#0b141a',
        display: 'flex',
        flexDirection: 'column',
        fontFamily: '-apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif',
        overflow: 'hidden',
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
          opacity: 0.25,
        }}
      />

      {/* ── Header bar ── */}
      <div
        style={{
          position: 'relative',
          zIndex: 10,
          background: '#1f2c34',
          padding: '10px 12px',
          display: 'flex',
          alignItems: 'center',
          gap: 10,
          borderBottom: '1px solid rgba(255,255,255,0.05)',
        }}
      >
        {/* Back arrow */}
        <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="rgba(255,255,255,0.7)" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
          <polyline points="15 18 9 12 15 6" />
        </svg>
        {/* Profile pic */}
        <div style={{
          width: 36,
          height: 36,
          borderRadius: '50%',
          overflow: 'hidden',
          flexShrink: 0,
          border: '1px solid rgba(255,255,255,0.1)',
        }}>
          <img
            src="/images/notification/zyra-profile.jpg"
            alt="Zyra"
            style={{ width: '100%', height: '100%', objectFit: 'cover', filter: 'grayscale(100%) contrast(1.1)' }}
          />
        </div>
        <div style={{ flex: 1 }}>
          <div style={{ color: '#e9edef', fontSize: '0.9rem', fontWeight: 600 }}>Zyra</div>
          <div style={{ color: '#8696a0', fontSize: '0.7rem' }}>en línea</div>
        </div>
        {/* Phone + video icons */}
        <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="rgba(255,255,255,0.5)" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
          <path d="M22 16.92v3a2 2 0 0 1-2.18 2 19.79 19.79 0 0 1-8.63-3.07 19.5 19.5 0 0 1-6-6 19.79 19.79 0 0 1-3.07-8.67A2 2 0 0 1 4.11 2h3a2 2 0 0 1 2 1.72 12.84 12.84 0 0 0 .7 2.81 2 2 0 0 1-.45 2.11L8.09 9.91a16 16 0 0 0 6 6l1.27-1.27a2 2 0 0 1 2.11-.45 12.84 12.84 0 0 0 2.81.7A2 2 0 0 1 22 16.92z" />
        </svg>
      </div>

      {/* ── Chat messages area ── */}
      <div
        style={{
          flex: 1,
          overflowY: 'auto',
          padding: '8px 10px',
          position: 'relative',
          zIndex: 5,
        }}
      >
        {/* Today date chip */}
        <div style={{ textAlign: 'center', margin: '8px 0 16px' }}>
          <span style={{
            background: 'rgba(30,42,50,0.85)',
            color: 'rgba(255,255,255,0.6)',
            fontSize: '0.65rem',
            padding: '3px 10px',
            borderRadius: 6,
            letterSpacing: '0.02em',
          }}>
            HOY
          </span>
        </div>

        {messages.map((msg, i) => (
          <div key={msg.id}>
            {/* Sparkle effect before message arrives */}
            <AnimatePresence>
              {msg.sparkle && (
                <motion.div
                  initial={{ opacity: 0, scale: 0.5 }}
                  animate={{ opacity: 1, scale: 1 }}
                  exit={{ opacity: 0 }}
                  transition={{ duration: 0.4 }}
                  style={{
                    display: 'flex',
                    justifyContent: 'flex-start',
                    marginBottom: 4,
                    padding: '0 52px',
                  }}
                >
                  <div style={{
                    background: 'rgba(30,42,50,0.9)',
                    borderRadius: 10,
                    padding: '10px 14px',
                    display: 'flex',
                    alignItems: 'center',
                    gap: 6,
                  }}>
                    {/* Sparkle animation */}
                    <motion.div
                      animate={{
                        scale: [1, 1.4, 1],
                        opacity: [0.5, 1, 0.5],
                        rotate: [0, 180, 360],
                      }}
                      transition={{ duration: 1, repeat: Infinity, ease: 'easeInOut' }}
                      style={{ fontSize: '1rem' }}
                    >
                      ✨
                    </motion.div>
                    <span style={{ color: 'rgba(255,255,255,0.5)', fontSize: '0.7rem' }}>
                      Zyra está escribiendo...
                    </span>
                  </div>
                </motion.div>
              )}
            </AnimatePresence>

            {/* Voice message bubble */}
            <AnimatePresence>
              {msg.arrived && (
                <motion.div
                  initial={{ opacity: 0, y: 10, scale: 0.95 }}
                  animate={{ opacity: 1, y: 0, scale: 1 }}
                  transition={{ duration: 0.3 }}
                  style={{
                    display: 'flex',
                    justifyContent: 'flex-start',
                    marginBottom: 6,
                  }}
                >
                  <div style={{
                    background: '#1f2c34',
                    borderRadius: '10px 10px 10px 2px',
                    padding: '8px 10px',
                    maxWidth: '75%',
                    position: 'relative',
                  }}>
                    {/* Voice message content */}
                    <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                      {/* Play button */}
                      <div style={{
                        width: 32,
                        height: 32,
                        borderRadius: '50%',
                        background: '#25D366',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        flexShrink: 0,
                      }}>
                        {msg.playing ? (
                          <svg width="14" height="14" viewBox="0 0 24 24" fill="white">
                            <rect x="6" y="4" width="4" height="16" />
                            <rect x="14" y="4" width="4" height="16" />
                          </svg>
                        ) : (
                          <svg width="14" height="14" viewBox="0 0 24 24" fill="white">
                            <path d="M8 5v14l11-7z" />
                          </svg>
                        )}
                      </div>

                      {/* Waveform / progress bar */}
                      <div style={{ flex: 1, minWidth: 0 }}>
                        {/* Simple progress bar representing voice waveform */}
                        <div style={{
                          height: 22,
                          display: 'flex',
                          alignItems: 'center',
                          gap: 1.5,
                        }}>
                          {Array.from({ length: 28 }).map((_, j) => {
                            const barHeight = 4 + Math.sin(j * 0.5 + i) * 8 + Math.random() * 6
                            const filled = (j / 28) * 100 <= msg.progress
                            return (
                              <div
                                key={j}
                                style={{
                                  width: 2.5,
                                  height: barHeight,
                                  borderRadius: 1,
                                  background: filled ? '#25D366' : 'rgba(255,255,255,0.2)',
                                  flexShrink: 0,
                                }}
                              />
                            )
                          })}
                        </div>
                      </div>
                    </div>

                    {/* Time */}
                    <div style={{
                      textAlign: 'right',
                      marginTop: 2,
                      fontSize: '0.6rem',
                      color: 'rgba(255,255,255,0.4)',
                    }}>
                      {formatDuration(msg.duration)} {getNowTime()}
                    </div>
                  </div>
                </motion.div>
              )}
            </AnimatePresence>
          </div>
        ))}

        {/* Credentials messages */}
        <AnimatePresence>
          {credentialsSent && (
            <>
              {/* Username */}
              <motion.div
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.3 }}
                style={{
                  display: 'flex',
                  justifyContent: 'flex-start',
                  marginBottom: 6,
                }}
              >
                <div style={{
                  background: '#1f2c34',
                  borderRadius: '10px 10px 10px 2px',
                  padding: '8px 12px',
                  maxWidth: '75%',
                }}>
                  <div style={{ color: '#e9edef', fontSize: '0.85rem', lineHeight: 1.4 }}>
                    @ELCODIGODETEXTO
                  </div>
                  <div style={{
                    textAlign: 'right',
                    marginTop: 2,
                    fontSize: '0.6rem',
                    color: 'rgba(255,255,255,0.4)',
                  }}>
                    {getNowTime()}
                  </div>
                </div>
              </motion.div>

              {/* Password */}
              <motion.div
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.3, delay: 0.5 }}
                style={{
                  display: 'flex',
                  justifyContent: 'flex-start',
                  marginBottom: 6,
                }}
              >
                <div style={{
                  background: '#1f2c34',
                  borderRadius: '10px 10px 10px 2px',
                  padding: '8px 12px',
                  maxWidth: '75%',
                }}>
                  <div style={{ color: '#e9edef', fontSize: '0.85rem', lineHeight: 1.4 }}>
                    DANTE000
                  </div>
                  <div style={{
                    textAlign: 'right',
                    marginTop: 2,
                    fontSize: '0.6rem',
                    color: 'rgba(255,255,255,0.4)',
                  }}>
                    {getNowTime()}
                  </div>
                </div>
              </motion.div>
            </>
          )}
        </AnimatePresence>

        <div ref={chatEndRef} />
      </div>

      {/* ── Bottom input bar (decorative) ── */}
      <div
        style={{
          position: 'relative',
          zIndex: 10,
          background: '#1f2c34',
          padding: '8px 10px',
          display: 'flex',
          alignItems: 'center',
          gap: 8,
          borderTop: '1px solid rgba(255,255,255,0.05)',
        }}
      >
        <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="rgba(255,255,255,0.4)" strokeWidth="2">
          <circle cx="12" cy="12" r="10" />
          <line x1="12" y1="8" x2="12" y2="16" />
          <line x1="8" y1="12" x2="16" y2="12" />
        </svg>
        <div style={{
          flex: 1,
          background: '#2a3942',
          borderRadius: 20,
          padding: '8px 14px',
          color: 'rgba(255,255,255,0.3)',
          fontSize: '0.8rem',
        }}>
          Mensaje
        </div>
        <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="rgba(255,255,255,0.4)" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
          <path d="M12 1a3 3 0 0 0-3 3v8a3 3 0 0 0 6 0V4a3 3 0 0 0-3-3z" />
          <path d="M19 10v2a7 7 0 0 1-14 0v-2" />
          <line x1="12" y1="19" x2="12" y2="23" />
        </svg>
      </div>
    </div>
  )
}
