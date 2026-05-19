'use client'

import { useState, useRef, useEffect, useCallback } from 'react'
import { motion } from 'framer-motion'

interface PodcastScreenProps {
  onComplete: () => void
}

/* ───────── SVG Icons (inline, no external libs) ───────── */

function ShuffleIcon() {
  return (
    <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <polyline points="16 3 21 3 21 8" />
      <line x1="4" y1="20" x2="21" y2="3" />
      <polyline points="21 16 21 21 16 21" />
      <line x1="15" y1="15" x2="21" y2="21" />
      <line x1="4" y1="4" x2="9" y2="9" />
    </svg>
  )
}

function PreviousIcon() {
  return (
    <svg width="22" height="22" viewBox="0 0 24 24" fill="currentColor">
      <path d="M6 6h2v12H6zm3.5 6 8.5 6V6z" />
    </svg>
  )
}

function NextIcon() {
  return (
    <svg width="22" height="22" viewBox="0 0 24 24" fill="currentColor">
      <path d="M16 6h2v12h-2zm-2 6L5.5 18V6z" />
    </svg>
  )
}

function RepeatIcon() {
  return (
    <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <polyline points="17 1 21 5 17 9" />
      <path d="M3 11V9a4 4 0 0 1 4-4h14" />
      <polyline points="7 23 3 19 7 15" />
      <path d="M21 13v2a4 4 0 0 1-4 4H3" />
    </svg>
  )
}

function PlayIcon() {
  return (
    <svg width="28" height="28" viewBox="0 0 24 24" fill="currentColor">
      <path d="M8 5v14l11-7z" />
    </svg>
  )
}

function PauseIcon() {
  return (
    <svg width="28" height="28" viewBox="0 0 24 24" fill="currentColor">
      <rect x="6" y="4" width="4" height="16" />
      <rect x="14" y="4" width="4" height="16" />
    </svg>
  )
}

function HeartIcon({ filled }: { filled: boolean }) {
  return filled ? (
    <svg width="24" height="24" viewBox="0 0 24 24" fill="#CC0000" stroke="#CC0000" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <path d="M20.84 4.61a5.5 5.5 0 0 0-7.78 0L12 5.67l-1.06-1.06a5.5 5.5 0 0 0-7.78 7.78l1.06 1.06L12 21.23l7.78-7.78 1.06-1.06a5.5 5.5 0 0 0 0-7.78z" />
    </svg>
  ) : (
    <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="#666" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <path d="M20.84 4.61a5.5 5.5 0 0 0-7.78 0L12 5.67l-1.06-1.06a5.5 5.5 0 0 0-7.78 7.78l1.06 1.06L12 21.23l7.78-7.78 1.06-1.06a5.5 5.5 0 0 0 0-7.78z" />
    </svg>
  )
}

/* ───────── Helpers ───────── */

function formatTime(seconds: number): string {
  if (!isFinite(seconds) || seconds < 0) return '0:00'
  const m = Math.floor(seconds / 60)
  const s = Math.floor(seconds % 60)
  return `${m}:${s.toString().padStart(2, '0')}`
}

/* ───────── Component ───────── */

export default function PodcastScreen({ onComplete }: PodcastScreenProps) {
  const audioRef = useRef<HTMLAudioElement | null>(null)
  const [isPlaying, setIsPlaying] = useState(false)
  const [isLiked, setIsLiked] = useState(false)
  const [currentTime, setCurrentTime] = useState(0)
  const [duration, setDuration] = useState(0)
  const [heartAnimating, setHeartAnimating] = useState(false)
  const hasCompletedRef = useRef(false)

  /* ---- Audio element ---- */
  useEffect(() => {
    const audio = new Audio('/audio/podcast.aac')
    audio.preload = 'auto'
    audioRef.current = audio

    const onLoadedMetadata = () => {
      setDuration(audio.duration)
    }

    const onTimeUpdate = () => {
      setCurrentTime(audio.currentTime)
    }

    const onEnded = () => {
      setIsPlaying(false)
      if (!hasCompletedRef.current) {
        hasCompletedRef.current = true
        setTimeout(() => {
          onComplete()
        }, 800)
      }
    }

    const onPlay = () => setIsPlaying(true)
    const onPause = () => setIsPlaying(false)

    audio.addEventListener('loadedmetadata', onLoadedMetadata)
    audio.addEventListener('timeupdate', onTimeUpdate)
    audio.addEventListener('ended', onEnded)
    audio.addEventListener('play', onPlay)
    audio.addEventListener('pause', onPause)

    // Autoplay — try normal first, fallback to muted then unmute
    const attemptAutoplay = async () => {
      try {
        await audio.play()
      } catch {
        try {
          audio.muted = true
          await audio.play()
          // Unmute shortly after
          setTimeout(() => {
            audio.muted = false
          }, 100)
        } catch {
          // Autoplay completely blocked — user must tap play
        }
      }
    }

    attemptAutoplay()

    return () => {
      audio.removeEventListener('loadedmetadata', onLoadedMetadata)
      audio.removeEventListener('timeupdate', onTimeUpdate)
      audio.removeEventListener('ended', onEnded)
      audio.removeEventListener('play', onPlay)
      audio.removeEventListener('pause', onPause)
      audio.pause()
      audio.src = ''
    }
  }, [onComplete])

  /* ---- Toggle play/pause ---- */
  const togglePlay = useCallback(() => {
    const audio = audioRef.current
    if (!audio) return
    if (isPlaying) {
      audio.pause()
    } else {
      audio.play().catch(() => {})
    }
  }, [isPlaying])

  /* ---- Toggle heart ---- */
  const toggleLike = useCallback(() => {
    setIsLiked((prev) => !prev)
    setHeartAnimating(true)
    setTimeout(() => setHeartAnimating(false), 300)
  }, [])

  /* ---- Progress percentage ---- */
  const progress = duration > 0 ? (currentTime / duration) * 100 : 0

  /* ─────────── Render ─────────── */
  return (
    <div
      style={{
        background: '#000000',
        minHeight: '100vh',
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        justifyContent: 'center',
        padding: 'clamp(1.5rem, 4vw, 2.5rem) 1.25rem',
        fontFamily: "'Cinzel', serif",
        position: 'relative',
        overflow: 'hidden',
      }}
    >
      {/* ── Cover Art ── */}
      <motion.div
        initial={{ opacity: 0, scale: 0.9 }}
        animate={{ opacity: 1, scale: 1 }}
        transition={{ duration: 0.8, ease: 'easeOut' }}
        style={{
          width: 'clamp(220px, 65vw, 260px)',
          height: 'clamp(220px, 65vw, 260px)',
          borderRadius: '12px',
          overflow: 'hidden',
          boxShadow:
            '0 8px 40px rgba(204, 0, 0, 0.25), 0 0 80px rgba(204, 0, 0, 0.1)',
          flexShrink: 0,
        }}
      >
        <img
          src="/images/podcast/cover.jpg"
          alt="Podcast cover art"
          style={{
            width: '100%',
            height: '100%',
            objectFit: 'cover',
            display: 'block',
          }}
        />
      </motion.div>

      {/* ── Title ── */}
      <motion.h1
        initial={{ opacity: 0, y: 10 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.7, delay: 0.2, ease: 'easeOut' }}
        style={{
          fontSize: 'clamp(0.9rem, 3.5vw, 1.1rem)',
          fontWeight: 700,
          color: '#ffffff',
          textShadow: '0 0 20px rgba(204, 0, 0, 0.3)',
          textAlign: 'center',
          marginTop: 'clamp(1.25rem, 3vw, 1.75rem)',
          marginBottom: '0.35rem',
          lineHeight: 1.35,
          letterSpacing: '0.04em',
          maxWidth: '90%',
        }}
      >
        EL MÉTODO QUE ELLA NO PUEDE IGNORAR
      </motion.h1>

      {/* ── Subtitle ── */}
      <motion.p
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ duration: 0.6, delay: 0.3 }}
        style={{
          fontSize: 'clamp(0.65rem, 2vw, 0.78rem)',
          fontWeight: 400,
          color: '#999999',
          textAlign: 'center',
          marginBottom: 'clamp(1.5rem, 4vw, 2rem)',
        }}
      >
        Capítulo 1 — Solo para acceso temprano
      </motion.p>

      {/* ── Progress Bar ── */}
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ duration: 0.5, delay: 0.35 }}
        style={{
          width: '80%',
          maxWidth: '360px',
          marginBottom: '0.4rem',
        }}
      >
        <div
          style={{
            width: '100%',
            height: '3px',
            background: '#333333',
            borderRadius: '2px',
            overflow: 'hidden',
          }}
        >
          <div
            style={{
              width: `${progress}%`,
              height: '100%',
              background: '#CC0000',
              borderRadius: '2px',
              transition: 'width 0.3s linear',
            }}
          />
        </div>
        <div
          style={{
            display: 'flex',
            justifyContent: 'space-between',
            marginTop: '6px',
          }}
        >
          <span
            style={{
              fontSize: '0.65rem',
              color: '#777',
              fontFamily: "'Cinzel', serif",
            }}
          >
            {formatTime(currentTime)}
          </span>
          <span
            style={{
              fontSize: '0.65rem',
              color: '#777',
              fontFamily: "'Cinzel', serif",
            }}
          >
            {formatTime(duration)}
          </span>
        </div>
      </motion.div>

      {/* ── Controls Row ── */}
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ duration: 0.6, delay: 0.4 }}
        style={{
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          gap: 'clamp(1rem, 4vw, 1.75rem)',
          marginTop: 'clamp(0.75rem, 2vw, 1.25rem)',
          width: '100%',
          maxWidth: '360px',
        }}
      >
        {/* Shuffle — decorative */}
        <button
          type="button"
          style={{
            background: 'none',
            border: 'none',
            color: '#fff',
            opacity: 0.3,
            cursor: 'default',
            padding: 0,
            display: 'flex',
            alignItems: 'center',
          }}
          tabIndex={-1}
          aria-hidden="true"
        >
          <ShuffleIcon />
        </button>

        {/* Previous — decorative */}
        <button
          type="button"
          style={{
            background: 'none',
            border: 'none',
            color: '#fff',
            opacity: 0.3,
            cursor: 'default',
            padding: 0,
            display: 'flex',
            alignItems: 'center',
          }}
          tabIndex={-1}
          aria-hidden="true"
        >
          <PreviousIcon />
        </button>

        {/* Play / Pause — decorative only, no action */}
        <button
          type="button"
          tabIndex={-1}
          aria-hidden="true"
          style={{
            width: 'clamp(52px, 14vw, 64px)',
            height: 'clamp(52px, 14vw, 64px)',
            borderRadius: '50%',
            border: '2px solid #ffffff',
            background: 'transparent',
            color: '#ffffff',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            cursor: 'default',
            opacity: 0.3,
          }}
        >
          <PauseIcon />
        </button>

        {/* Next — decorative */}
        <button
          type="button"
          style={{
            background: 'none',
            border: 'none',
            color: '#fff',
            opacity: 0.3,
            cursor: 'default',
            padding: 0,
            display: 'flex',
            alignItems: 'center',
          }}
          tabIndex={-1}
          aria-hidden="true"
        >
          <NextIcon />
        </button>

        {/* Repeat — decorative */}
        <button
          type="button"
          style={{
            background: 'none',
            border: 'none',
            color: '#fff',
            opacity: 0.3,
            cursor: 'default',
            padding: 0,
            display: 'flex',
            alignItems: 'center',
          }}
          tabIndex={-1}
          aria-hidden="true"
        >
          <RepeatIcon />
        </button>
      </motion.div>

      {/* ── Heart / Like ── */}
      <motion.div
        animate={
          heartAnimating
            ? { scale: [1, 1.3, 1] }
            : { scale: 1 }
        }
        transition={
          heartAnimating
            ? { duration: 0.3, ease: 'easeInOut' }
            : { duration: 0 }
        }
        style={{
          marginTop: 'clamp(1.25rem, 3vw, 1.75rem)',
        }}
      >
        <button
          type="button"
          onClick={toggleLike}
          aria-label={isLiked ? 'Unlike' : 'Like'}
          style={{
            background: 'none',
            border: 'none',
            cursor: 'pointer',
            padding: '4px',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
          }}
        >
          <HeartIcon filled={isLiked} />
        </button>
      </motion.div>

      {/* ── Brand Watermark ── */}
      <p
        style={{
          position: 'absolute',
          bottom: 'clamp(1rem, 3vw, 1.5rem)',
          fontSize: 'clamp(0.55rem, 1.5vw, 0.65rem)',
          color: '#444',
          letterSpacing: '0.15em',
          textTransform: 'uppercase',
          fontFamily: "'Cinzel', serif",
          margin: 0,
          userSelect: 'none',
        }}
      >
        MÉTODO MAGNÉTICO
      </p>
    </div>
  )
}
