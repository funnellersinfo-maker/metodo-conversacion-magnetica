'use client'

import { useEffect, useRef, useState, useCallback } from 'react'
import { motion } from 'framer-motion'

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
  needsUserPlay: boolean
}

export default function WhatsAppChatScreen({ onComplete }: WhatsAppChatScreenProps) {
  const [messages, setMessages] = useState<VoiceMessage[]>([
    { id: 1, src: '/audio/wha-voices/voice1.wav', duration: 0, arrived: false, playing: false, progress: 0, played: false, needsUserPlay: true },
    { id: 2, src: '/audio/wha-voices/voice2.wav', duration: 0, arrived: false, playing: false, progress: 0, played: false, needsUserPlay: false },
    { id: 3, src: '/audio/wha-voices/voice3.wav', duration: 0, arrived: false, playing: false, progress: 0, played: false, needsUserPlay: false },
    { id: 4, src: '/audio/wha-voices/voice4.wav', duration: 0, arrived: false, playing: false, progress: 0, played: false, needsUserPlay: false },
    { id: 5, src: '/audio/wha-voices/voice5.wav', duration: 0, arrived: false, playing: false, progress: 0, played: false, needsUserPlay: false },
  ])
  const [credentialStep, setCredentialStep] = useState(0)

  const audioRef = useRef<HTMLAudioElement | null>(null)
  const completedRef = useRef(false)
  const onCompleteRef = useRef(onComplete)
  const chatContainerRef = useRef<HTMLDivElement>(null)
  const incomingSoundRef = useRef<HTMLAudioElement | null>(null)
  const durationsLoadedRef = useRef(false)

  // Refs for functions to break circular dependencies
  const playVoiceRef = useRef<(index: number) => void>(() => {})
  const arriveAndPlayRef = useRef<(index: number) => void>(() => {})

  useEffect(() => {
    onCompleteRef.current = onComplete
  }, [onComplete])

  // Preload incoming message sound
  useEffect(() => {
    incomingSoundRef.current = new Audio('/audio/wha-incoming.mp3')
    incomingSoundRef.current.volume = 0.7
    incomingSoundRef.current.preload = 'auto'
  }, [])

  const playIncomingSound = useCallback(() => {
    if (incomingSoundRef.current) {
      const sound = incomingSoundRef.current.cloneNode() as HTMLAudioElement
      sound.volume = 0.7
      sound.play().catch(() => {})
    }
  }, [])

  const scrollToBottom = useCallback(() => {
    if (chatContainerRef.current) {
      chatContainerRef.current.scrollTop = chatContainerRef.current.scrollHeight
    }
  }, [])

  // ── Load audio durations — uses FUNCTIONAL state update to NOT overwrite arrived status ──
  useEffect(() => {
    const loadDurations = async () => {
      for (let i = 0; i < 5; i++) {
        const src = [
          '/audio/wha-voices/voice1.wav',
          '/audio/wha-voices/voice2.wav',
          '/audio/wha-voices/voice3.wav',
          '/audio/wha-voices/voice4.wav',
          '/audio/wha-voices/voice5.wav',
        ][i]

        const audio = new Audio(src)
        audio.preload = 'metadata'
        const dur = await new Promise<number>((resolve) => {
          audio.addEventListener('loadedmetadata', () => resolve(audio.duration || 0))
          audio.addEventListener('error', () => resolve(0))
          setTimeout(() => resolve(0), 3000)
        })

        // Use FUNCTIONAL update — only update duration, preserve all other state (arrived, playing, etc.)
        setMessages(prev => {
          const next = [...prev]
          next[i] = { ...next[i], duration: dur }
          return next
        })
      }
      durationsLoadedRef.current = true
    }
    loadDurations()
  }, [])

  // ── playVoice — assigned to ref to avoid circular deps ──
  playVoiceRef.current = (index: number) => {
    if (index >= 5) return

    // Stop any currently playing audio
    if (audioRef.current) {
      audioRef.current.pause()
      audioRef.current.src = ''
      audioRef.current = null
    }

    // Get current message source
    setMessages(prev => {
      const msg = prev[index]
      if (!msg) return prev

      const audio = new Audio(msg.src)
      audioRef.current = audio

      // Mark as playing
      const next = [...prev]
      next[index] = { ...next[index], playing: true }
      return next
    })

    // Small delay to ensure audio element is created after state update
    setTimeout(() => {
      if (!audioRef.current) return
      const audio = audioRef.current
      const currentIndex = index

      audio.addEventListener('timeupdate', () => {
        if (audio.duration > 0) {
          const prog = (audio.currentTime / audio.duration) * 100
          setMessages(prev => {
            const next = [...prev]
            if (next[currentIndex]) {
              next[currentIndex] = { ...next[currentIndex], progress: prog }
            }
            return next
          })

          if (prog >= 99) {
            // Mark as played — use functional update to check current state
            setMessages(prev => {
              const next = [...prev]
              if (next[currentIndex] && !next[currentIndex].played) {
                next[currentIndex] = { ...next[currentIndex], played: true, playing: false, progress: 100 }

                // Trigger next message or credentials
                if (currentIndex < 4) {
                  setTimeout(() => arriveAndPlayRef.current(currentIndex + 1), 500)
                } else {
                  // Last voice done → send credentials → TikTok
                  setTimeout(() => {
                    playIncomingSound()
                    setCredentialStep(1)
                    setTimeout(scrollToBottom, 200)
                    setTimeout(() => {
                      playIncomingSound()
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
              return next
            })
          }
        }
      })

      audio.addEventListener('ended', () => {
        setMessages(prev => {
          const next = [...prev]
          if (next[currentIndex]) {
            next[currentIndex] = { ...next[currentIndex], playing: false, progress: 100, played: true }
          }
          return next
        })

        // Only trigger next if not already handled by timeupdate
        setMessages(prev => {
          if (currentIndex < 4 && prev[currentIndex]?.played) {
            setTimeout(() => arriveAndPlayRef.current(currentIndex + 1), 500)
          } else if (currentIndex === 4 && prev[currentIndex]?.played && !completedRef.current) {
            setTimeout(() => {
              playIncomingSound()
              setCredentialStep(1)
              setTimeout(scrollToBottom, 200)
              setTimeout(() => {
                playIncomingSound()
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
          return prev
        })
      })

      audio.play().catch(() => {})
    }, 50)
  }

  // ── arriveAndPlay — assigned to ref to avoid circular deps ──
  arriveAndPlayRef.current = (index: number) => {
    if (index >= 5) return

    // Play incoming sound EXACTLY as message appears
    playIncomingSound()

    // Set message as arrived — it will now render and stay
    setMessages(prev => {
      const next = [...prev]
      next[index] = { ...next[index], arrived: true }
      return next
    })

    // Scroll to show the new message
    setTimeout(scrollToBottom, 150)
    setTimeout(scrollToBottom, 400)

    // Auto-play after short delay
    setTimeout(() => {
      playVoiceRef.current(index)
    }, 600)
  }

  // ── First message arrives after entering chat ──
  useEffect(() => {
    const timer = setTimeout(() => {
      // Play incoming sound EXACTLY as message appears
      playIncomingSound()

      setMessages(prev => {
        const next = [...prev]
        next[0] = { ...next[0], arrived: true }
        return next
      })

      setTimeout(scrollToBottom, 150)
      setTimeout(scrollToBottom, 400)
    }, 600)
    return () => clearTimeout(timer)
  }, [scrollToBottom, playIncomingSound])

  // ── Scroll on credential changes ──
  useEffect(() => {
    if (credentialStep > 0) {
      setTimeout(scrollToBottom, 150)
      setTimeout(scrollToBottom, 400)
    }
  }, [credentialStep, scrollToBottom])

  const handleUserPlay = useCallback(() => {
    playVoiceRef.current(0)
  }, [])

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

  const getWaveformBars = (msgIndex: number) => {
    const bars: number[] = []
    for (let j = 0; j < 35; j++) {
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

        {/* Chat header row — non-interactive */}
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

        {messages.map((msg, i) => {
          // If not arrived, render nothing for this slot
          if (!msg.arrived) return null

          return (
            <motion.div
              key={`voice-${msg.id}`}
              initial={{ opacity: 0, y: 12, scale: 0.96 }}
              animate={{ opacity: 1, y: 0, scale: 1 }}
              transition={{ duration: 0.35, ease: 'easeOut' }}
              style={{
                display: 'flex',
                justifyContent: 'flex-start',
                marginBottom: 5,
              }}
            >
              <div style={{
                background: '#1f2c34',
                borderRadius: '8px 0 8px 8px',
                padding: '8px 10px 6px',
                maxWidth: '88%',
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
                <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                  {/* Play/Pause button */}
                  {msg.needsUserPlay && !msg.playing && !msg.played ? (
                    /* CLICKABLE play button for first message with shimmer */
                    <button
                      onClick={handleUserPlay}
                      style={{
                        width: 36,
                        height: 36,
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
                    /* Normal play/pause indicator */
                    <div style={{
                      width: 32,
                      height: 32,
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

                  {/* Waveform — wider with more bars */}
                  <div style={{
                    flex: 1,
                    minWidth: 0,
                    height: 28,
                    display: 'flex',
                    alignItems: 'center',
                    gap: 1.5,
                    padding: '0 2px',
                  }}>
                    {getWaveformBars(i).map((barHeight, j) => {
                      const filled = (j / 35) * 100 <= msg.progress
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
          )
        })}

        {/* Credentials */}
        {credentialStep >= 1 && (
          <motion.div
            key="cred-user"
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

        {credentialStep >= 2 && (
          <motion.div
            key="cred-pass"
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

      {/* ── Shimmer keyframes ── */}
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
