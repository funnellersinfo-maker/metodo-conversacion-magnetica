'use client'

import { useCallback, useEffect, useRef, useState } from 'react'
import { motion, AnimatePresence } from 'framer-motion'

interface TikTokFeedScreenProps {
  onComplete: () => void
}

interface Comment {
  id: number
  username: string
  text: string
  pinned?: boolean
  isNew?: boolean
}

const INITIAL_COMMENTS: Comment[] = [
  { id: 1, username: 'danny', text: 'Brutal el contenido que he visto hasta ahora. Hay mucho power aquí', pinned: true },
  { id: 2, username: 'themarketographer', text: 'Que alucinanteeee' },
  { id: 3, username: 'hastadondepuedolllegar', text: 'Está Mega brutal' },
  { id: 4, username: 'nhyra_angelica', text: 'Wao me encantó bastante me abrió la mente' },
  { id: 5, username: 'luisfer_na', text: 'Esto es otra cosa 🔥' },
  { id: 6, username: 'carlosmendez_of', text: 'No puedo parar de verlo' },
  { id: 7, username: 'maria_paz22', text: 'Increíble lo que están haciendo' },
  { id: 8, username: 'jprodriguez', text: 'El mejor contenido que he visto en mucho tiempo' },
  { id: 9, username: 'andrea.sl', text: 'Me dio escalofríos todo esto' },
  { id: 10, username: 'elnegro2024', text: 'Puro fuego 🔥🔥🔥' },
]

const RANDOM_COMMENTS_POOL = [
  'Esto es lo que necesitaba ver hoy 💯',
  'Qué crack, sige así!',
  'Me encanta este tipo de contenido',
  'Brutal hermano 🔥🔥',
  'No sabía esto, gracias por compartir',
  'Ápplied! Esto cambia todo',
  'Dónde consigo más de esto?',
  'Se pasa de bueno este video',
  'Alguien más lo ve por tercera vez? 😂',
  'Nivel dios este contenido',
  'Compartido ya con todos mis amigos',
  'Esto merece más likes',
  'Yo ya no puedo dejar de verlo',
  'La verdad nunca había visto algo igual',
  'Gracias por esto, de verdad 🙏',
  'Me motivaste demasiado',
  'Voy a probarlo YA',
  'Increíble lo que están logrando',
  'Puro oro este video 🏆',
  'La gente necesita ver esto',
  'Sige subiendo contenido así!',
  'Me cambiaste la perspectiva 🔥',
  'Esto es arte puro',
  'Cuándo sale la segunda parte?',
  'Never seen something like this before 🔥',
]

const RANDOM_USERNAMES = [
  'jose_martin99',
  'laurita_mc',
  'pedroelgrande',
  'sofia_vibes',
  'juanito_londo',
  'cami_fit22',
  'diego_arts',
  'valentina.rx',
  'andres_fiero',
  'marcelo.tips',
  'isabella_moon',
  'roberto_gmz',
  'natasha.wolf',
  'felipe_urd',
  'gabriela_sun',
  'ricardo_fl',
  'daniela_stars',
  'miguelon_fire',
  'caro_beauty',
  'lucas_mindset',
]

let commentIdCounter = 100

export default function TikTokFeedScreen({ onComplete }: TikTokFeedScreenProps) {
  const [liked, setLiked] = useState(false)
  const [likeCount, setLikeCount] = useState(375)
  const [commentsOpen, setCommentsOpen] = useState(false)
  const [comments, setComments] = useState<Comment[]>(INITIAL_COMMENTS)
  const [commentCount, setCommentCount] = useState(INITIAL_COMMENTS.length)
  const [instagramField, setInstagramField] = useState('')
  const [commentField, setCommentField] = useState('')
  const [likePulse, setLikePulse] = useState(false)

  const commentsListRef = useRef<HTMLDivElement>(null)
  const likeIntervalRef = useRef<ReturnType<typeof setInterval> | null>(null)
  const commentIntervalRef = useRef<ReturnType<typeof setInterval> | null>(null)

  // Simulated real-time likes
  useEffect(() => {
    likeIntervalRef.current = setInterval(() => {
      const increment = Math.floor(Math.random() * 5) + 1
      setLikeCount(prev => prev + increment)
      setLikePulse(true)
      setTimeout(() => setLikePulse(false), 300)
    }, (Math.random() * 2000) + 2000)

    return () => {
      if (likeIntervalRef.current) clearInterval(likeIntervalRef.current)
    }
  }, [])

  // Simulated real-time comments
  useEffect(() => {
    const scheduleNextComment = () => {
      const delay = (Math.random() * 3000) + 5000 // 5-8 seconds
      return setTimeout(() => {
        const randomText = RANDOM_COMMENTS_POOL[Math.floor(Math.random() * RANDOM_COMMENTS_POOL.length)]
        const randomUser = RANDOM_USERNAMES[Math.floor(Math.random() * RANDOM_USERNAMES.length)]
        const newComment: Comment = {
          id: ++commentIdCounter,
          username: randomUser,
          text: randomText,
          isNew: true,
        }
        setComments(prev => [...prev, newComment])
        setCommentCount(prev => prev + 1)

        // Scroll to bottom
        setTimeout(() => {
          if (commentsListRef.current) {
            commentsListRef.current.scrollTop = commentsListRef.current.scrollHeight
          }
        }, 100)

        // Schedule next
        commentIntervalRef.current = scheduleNextComment() as unknown as ReturnType<typeof setInterval>
      }, delay)
    }

    commentIntervalRef.current = scheduleNextComment() as unknown as ReturnType<typeof setInterval>

    return () => {
      if (commentIntervalRef.current) clearTimeout(commentIntervalRef.current)
    }
  }, [])

  const handleLikeToggle = useCallback(() => {
    setLiked(prev => !prev)
    if (!liked) {
      setLikeCount(prev => prev + 1)
    } else {
      setLikeCount(prev => Math.max(0, prev - 1))
    }
  }, [liked])

  const handleOpenComments = useCallback(() => {
    setCommentsOpen(true)
  }, [])

  const handleCloseComments = useCallback(() => {
    setCommentsOpen(false)
  }, [])

  const handleSendComment = useCallback(() => {
    if (!instagramField.trim()) return
    const newComment: Comment = {
      id: ++commentIdCounter,
      username: instagramField.trim().replace(/^@/, ''),
      text: commentField.trim() || '👍',
      isNew: true,
    }
    setComments(prev => [...prev, newComment])
    setCommentCount(prev => prev + 1)
    setCommentField('')
    // Don't clear instagram field

    setTimeout(() => {
      if (commentsListRef.current) {
        commentsListRef.current.scrollTop = commentsListRef.current.scrollHeight
      }
    }, 100)
  }, [instagramField, commentField])

  const formatCount = (count: number): string => {
    if (count >= 1000000) return (count / 1000000).toFixed(1).replace('.0', '') + 'M'
    if (count >= 1000) return (count / 1000).toFixed(1).replace('.0', '') + 'K'
    return count.toString()
  }

  const currentMinutes = new Date().getMinutes().toString().padStart(2, '0')
  const currentHours = new Date().getHours().toString().padStart(2, '0')

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      transition={{ duration: 0.3 }}
      style={{
        position: 'fixed',
        inset: 0,
        backgroundColor: '#000000',
        display: 'flex',
        flexDirection: 'column',
        fontFamily: '-apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif',
        overflow: 'hidden',
        userSelect: 'none',
      }}
    >
      {/* ── Status Bar ── */}
      <div style={{
        position: 'absolute',
        top: 0,
        left: 0,
        right: 0,
        padding: '8px 14px 4px',
        display: 'flex',
        justifyContent: 'space-between',
        alignItems: 'center',
        color: 'rgba(255,255,255,0.7)',
        fontSize: '0.72rem',
        fontWeight: 600,
        zIndex: 30,
      }}>
        <span>{currentHours}:{currentMinutes}</span>
        <div style={{ display: 'flex', gap: 5, alignItems: 'center' }}>
          {/* Signal bars */}
          <svg width="14" height="11" viewBox="0 0 16 12" fill="currentColor" opacity="0.7">
            <rect x="0" y="8" width="3" height="4" rx="0.5" />
            <rect x="4" y="5" width="3" height="7" rx="0.5" />
            <rect x="8" y="2" width="3" height="10" rx="0.5" />
            <rect x="12" y="0" width="3" height="12" rx="0.5" />
          </svg>
          {/* WiFi */}
          <svg width="14" height="11" viewBox="0 0 24 24" fill="currentColor" opacity="0.7">
            <path d="M1 9l2 2c4.97-4.97 13.03-4.97 18 0l2-2C16.93 2.93 7.08 2.93 1 9zm8 8l3 3 3-3c-1.65-1.66-4.34-1.66-6 0zm-4-4l2 2c2.76-2.76 7.24-2.76 10 0l2-2C15.14 9.14 8.87 9.14 5 13z" />
          </svg>
          {/* Battery */}
          <svg width="20" height="11" viewBox="0 0 22 12" fill="none">
            <rect x="0.5" y="0.5" width="16" height="11" rx="2" stroke="rgba(255,255,255,0.5)" strokeWidth="1" />
            <rect x="2" y="2" width="11" height="8" rx="1" fill="rgba(255,255,255,0.7)" />
            <rect x="17" y="3" width="2" height="6" rx="0.5" fill="rgba(255,255,255,0.5)" />
          </svg>
        </div>
      </div>

      {/* ── Video Area (gradient placeholder) ── */}
      <div style={{
        position: 'absolute',
        inset: 0,
        background: 'linear-gradient(180deg, #1a1a2e 0%, #0a0a0a 40%, #16213e 70%, #000000 100%)',
      }} />

      {/* Subtle moving shimmer effect on video */}
      <div style={{
        position: 'absolute',
        top: '30%',
        left: '10%',
        width: '80%',
        height: '40%',
        background: 'radial-gradient(ellipse at center, rgba(255,255,255,0.02) 0%, transparent 70%)',
        pointerEvents: 'none',
      }} />

      {/* ── Right Side Overlay Buttons ── */}
      <div style={{
        position: 'absolute',
        right: 10,
        bottom: 110,
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        gap: 18,
        zIndex: 20,
      }}>
        {/* Profile Picture */}
        <div style={{ position: 'relative', display: 'flex', flexDirection: 'column', alignItems: 'center' }}>
          <div style={{
            width: 48,
            height: 48,
            borderRadius: '50%',
            border: '2px solid #ffffff',
            overflow: 'hidden',
            background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
          }}>
            {/* Avatar placeholder - person icon */}
            <svg width="28" height="28" viewBox="0 0 24 24" fill="rgba(255,255,255,0.9)">
              <path d="M12 12c2.21 0 4-1.79 4-4s-1.79-4-4-4-4 1.79-4 4 1.79 4 4 4zm0 2c-2.67 0-8 1.34-8 4v2h16v-2c0-2.66-5.33-4-8-4z" />
            </svg>
          </div>
          {/* Follow "+" button */}
          <div style={{
            position: 'absolute',
            bottom: -8,
            width: 20,
            height: 20,
            borderRadius: '50%',
            background: '#FE2C55',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            boxShadow: '0 2px 4px rgba(0,0,0,0.3)',
          }}>
            <svg width="12" height="12" viewBox="0 0 24 24" fill="white">
              <path d="M19 13h-6v6h-2v-6H5v-2h6V5h2v6h6v2z" />
            </svg>
          </div>
        </div>

        {/* Like Button */}
        <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 2 }}>
          <motion.button
            onClick={handleLikeToggle}
            animate={liked ? { scale: [1, 1.3, 0.9, 1.1, 1] } : {}}
            transition={{ duration: 0.4 }}
            style={{
              background: 'none',
              border: 'none',
              cursor: 'pointer',
              padding: 0,
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              WebkitTapHighlightColor: 'transparent',
            }}
          >
            {liked ? (
              <svg width="34" height="34" viewBox="0 0 24 24" fill="#FE2C55">
                <path d="M12 21.35l-1.45-1.32C5.4 15.36 2 12.28 2 8.5 2 5.42 4.42 3 7.5 3c1.74 0 3.41.81 4.5 2.09C13.09 3.81 14.76 3 16.5 3 19.58 3 22 5.42 22 8.5c0 3.78-3.4 6.86-8.55 11.54L12 21.35z" />
              </svg>
            ) : (
              <svg width="34" height="34" viewBox="0 0 24 24" fill="none" stroke="#ffffff" strokeWidth="2">
                <path d="M12 21.35l-1.45-1.32C5.4 15.36 2 12.28 2 8.5 2 5.42 4.42 3 7.5 3c1.74 0 3.41.81 4.5 2.09C13.09 3.81 14.76 3 16.5 3 19.58 3 22 5.42 22 8.5c0 3.78-3.4 6.86-8.55 11.54L12 21.35z" />
              </svg>
            )}
          </motion.button>
          <motion.span
            key={likeCount}
            initial={likePulse ? { scale: 1.3 } : {}}
            animate={{ scale: 1 }}
            transition={{ duration: 0.2 }}
            style={{
              color: '#ffffff',
              fontSize: '0.72rem',
              fontWeight: 600,
            }}
          >
            {formatCount(likeCount)}
          </motion.span>
        </div>

        {/* Comment Button */}
        <button
          onClick={handleOpenComments}
          style={{
            background: 'none',
            border: 'none',
            cursor: 'pointer',
            padding: 0,
            display: 'flex',
            flexDirection: 'column',
            alignItems: 'center',
            gap: 2,
            WebkitTapHighlightColor: 'transparent',
          }}
        >
          <svg width="34" height="34" viewBox="0 0 24 24" fill="none" stroke="#ffffff" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
            <path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z" />
          </svg>
          <span style={{
            color: '#ffffff',
            fontSize: '0.72rem',
            fontWeight: 600,
          }}>
            {formatCount(commentCount)}
          </span>
        </button>

        {/* Share Button */}
        <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 2 }}>
          <svg width="34" height="34" viewBox="0 0 24 24" fill="none" stroke="#ffffff" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
            <path d="M4 12v8a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2v-8" />
            <polyline points="16,6 12,2 8,6" />
            <line x1="12" y1="2" x2="12" y2="15" />
          </svg>
          <span style={{
            color: '#ffffff',
            fontSize: '0.68rem',
            fontWeight: 500,
          }}>
            Compartir
          </span>
        </div>
      </div>

      {/* ── Bottom Left Overlay ── */}
      <div style={{
        position: 'absolute',
        left: 12,
        bottom: 68,
        right: 70,
        zIndex: 20,
        display: 'flex',
        flexDirection: 'column',
        gap: 6,
      }}>
        {/* Username */}
        <span style={{
          color: '#ffffff',
          fontSize: 15,
          fontWeight: 700,
          lineHeight: 1.2,
        }}>
          @copyfilms.official
        </span>

        {/* Caption */}
        <span style={{
          color: '#ffffff',
          fontSize: 13,
          fontWeight: 400,
          lineHeight: 1.3,
        }}>
          Ponte alerta que ahí vienen las piedras.
        </span>

        {/* Music info */}
        <div style={{
          display: 'flex',
          alignItems: 'center',
          gap: 6,
        }}>
          {/* Music note icon */}
          <svg width="14" height="14" viewBox="0 0 24 24" fill="#ffffff">
            <path d="M12 3v10.55c-.59-.34-1.27-.55-2-.55-2.21 0-4 1.79-4 4s1.79 4 4 4 4-1.79 4-4V7h4V3h-6z" />
          </svg>
          <span style={{
            color: '#ffffff',
            fontSize: 12,
            fontWeight: 400,
            overflow: 'hidden',
            whiteSpace: 'nowrap',
            textOverflow: 'ellipsis',
          }}>
            sonido original - copyfilms.official
          </span>
        </div>

        {/* Spinning disc (music indicator) */}
        <div style={{
          position: 'absolute',
          right: -60,
          bottom: 0,
          width: 40,
          height: 40,
          borderRadius: '50%',
          border: '8px solid #1a1a1a',
          background: 'linear-gradient(135deg, #333 0%, #111 100%)',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          animation: 'spin 3s linear infinite',
        }}>
          <div style={{
            width: 8,
            height: 8,
            borderRadius: '50%',
            background: '#888',
          }} />
        </div>
      </div>

      {/* Spinning disc keyframe — injected via style tag */}
      <style>{`
        @keyframes spin {
          from { transform: rotate(0deg); }
          to { transform: rotate(360deg); }
        }
      `}</style>

      {/* ── Bottom Navigation Bar ── */}
      <div style={{
        position: 'absolute',
        bottom: 0,
        left: 0,
        right: 0,
        height: 52,
        backgroundColor: '#000000',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'space-around',
        borderTop: '0.5px solid rgba(255,255,255,0.1)',
        zIndex: 25,
      }}>
        {/* Inicio */}
        <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 2, cursor: 'pointer' }}>
          <svg width="22" height="22" viewBox="0 0 24 24" fill="#ffffff">
            <path d="M10 20v-6h4v6h5v-8h3L12 3 2 12h3v8z" />
          </svg>
          <span style={{ color: '#ffffff', fontSize: 9, fontWeight: 600 }}>Inicio</span>
        </div>

        {/* Amigos */}
        <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 2, cursor: 'pointer' }}>
          <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="rgba(255,255,255,0.5)" strokeWidth="2">
            <path d="M16 11c1.66 0 2.99-1.34 2.99-3S17.66 5 16 5c-1.66 0-3 1.34-3 3s1.34 3 3 3zm-8 0c1.66 0 2.99-1.34 2.99-3S9.66 5 8 5C6.34 5 5 6.34 5 8s1.34 3 3 3zm0 2c-2.33 0-7 1.17-7 3.5V19h14v-2.5c0-2.33-4.67-3.5-7-3.5zm8 0c-.29 0-.62.02-.97.05 1.16.84 1.97 1.97 1.97 3.45V19h6v-2.5c0-2.33-4.67-3.5-7-3.5z" />
          </svg>
          <span style={{ color: 'rgba(255,255,255,0.5)', fontSize: 9, fontWeight: 500 }}>Amigos</span>
        </div>

        {/* + button */}
        <div style={{ cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
          <div style={{
            width: 48,
            height: 30,
            borderRadius: 8,
            background: 'linear-gradient(90deg, #25F4EE 0%, #FE2C55 50%, #ffffff 100%)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            position: 'relative',
          }}>
            <div style={{
              width: 44,
              height: 26,
              borderRadius: 6,
              background: '#ffffff',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
            }}>
              <svg width="20" height="20" viewBox="0 0 24 24" fill="#000000">
                <path d="M19 13h-6v6h-2v-6H5v-2h6V5h2v6h6v2z" />
              </svg>
            </div>
          </div>
        </div>

        {/* Mensajes */}
        <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 2, cursor: 'pointer' }}>
          <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="rgba(255,255,255,0.5)" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
            <path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z" />
          </svg>
          <span style={{ color: 'rgba(255,255,255,0.5)', fontSize: 9, fontWeight: 500 }}>Mensajes</span>
        </div>

        {/* Perfil */}
        <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 2, cursor: 'pointer' }}>
          <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="rgba(255,255,255,0.5)" strokeWidth="2">
            <path d="M12 12c2.21 0 4-1.79 4-4s-1.79-4-4-4-4 1.79-4 4 1.79 4 4 4zm0 2c-2.67 0-8 1.34-8 4v2h16v-2c0-2.66-5.33-4-8-4z" />
          </svg>
          <span style={{ color: 'rgba(255,255,255,0.5)', fontSize: 9, fontWeight: 500 }}>Perfil</span>
        </div>
      </div>

      {/* ── Comments Panel ── */}
      <AnimatePresence>
        {commentsOpen && (
          <motion.div
            initial={{ y: '100%' }}
            animate={{ y: 0 }}
            exit={{ y: '100%' }}
            transition={{ type: 'spring', damping: 28, stiffness: 300 }}
            style={{
              position: 'absolute',
              bottom: 0,
              left: 0,
              right: 0,
              height: '72%',
              backgroundColor: '#121212',
              borderTopLeftRadius: 14,
              borderTopRightRadius: 14,
              display: 'flex',
              flexDirection: 'column',
              zIndex: 40,
            }}
          >
            {/* Comments Header */}
            <div style={{
              padding: '12px 14px 10px',
              display: 'flex',
              justifyContent: 'space-between',
              alignItems: 'center',
              borderBottom: '0.5px solid rgba(255,255,255,0.1)',
              flexShrink: 0,
            }}>
              <span style={{
                color: '#ffffff',
                fontSize: 14,
                fontWeight: 700,
              }}>
                {commentCount} comentarios
              </span>
              <button
                onClick={handleCloseComments}
                style={{
                  background: 'none',
                  border: 'none',
                  cursor: 'pointer',
                  padding: 4,
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  WebkitTapHighlightColor: 'transparent',
                }}
              >
                <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="#ffffff" strokeWidth="2.5" strokeLinecap="round">
                  <line x1="18" y1="6" x2="6" y2="18" />
                  <line x1="6" y1="6" x2="18" y2="18" />
                </svg>
              </button>
            </div>

            {/* Comments List */}
            <div
              ref={commentsListRef}
              style={{
                flex: 1,
                overflowY: 'auto',
                padding: '8px 14px',
                display: 'flex',
                flexDirection: 'column',
                gap: 14,
                WebkitOverflowScrolling: 'touch',
              }}
            >
              {comments.map((comment) => (
                <motion.div
                  key={comment.id}
                  initial={comment.isNew ? { opacity: 0, x: -20 } : false}
                  animate={{ opacity: 1, x: 0 }}
                  transition={{ duration: 0.35, ease: 'easeOut' }}
                  style={{
                    display: 'flex',
                    gap: 10,
                  }}
                >
                  {/* Avatar */}
                  <div style={{
                    width: 32,
                    height: 32,
                    borderRadius: '50%',
                    flexShrink: 0,
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    fontSize: 13,
                    fontWeight: 700,
                    color: '#ffffff',
                    background: `hsl(${(comment.username.charCodeAt(0) * 37) % 360}, 50%, 35%)`,
                  }}>
                    {comment.username.charAt(0).toUpperCase()}
                  </div>

                  {/* Content */}
                  <div style={{ flex: 1, minWidth: 0 }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: 6, flexWrap: 'wrap' }}>
                      <span style={{
                        color: 'rgba(255,255,255,0.5)',
                        fontSize: 12,
                        fontWeight: 500,
                      }}>
                        @{comment.username}
                      </span>
                      {comment.pinned && (
                        <span style={{
                          backgroundColor: '#FFD600',
                          color: '#000000',
                          fontSize: 8,
                          fontWeight: 800,
                          padding: '1px 5px',
                          borderRadius: 3,
                          textTransform: 'uppercase',
                          letterSpacing: '0.05em',
                        }}>
                          FIJADO
                        </span>
                      )}
                    </div>
                    <p style={{
                      color: '#ffffff',
                      fontSize: 13,
                      fontWeight: 400,
                      lineHeight: 1.35,
                      margin: '3px 0 0',
                      wordBreak: 'break-word',
                    }}>
                      {comment.text}
                    </p>
                  </div>
                </motion.div>
              ))}
            </div>

            {/* Input Section */}
            <div style={{
              flexShrink: 0,
              padding: '8px 14px 16px',
              borderTop: '0.5px solid rgba(255,255,255,0.1)',
              backgroundColor: '#121212',
            }}>
              {/* Disclaimer */}
              <p style={{
                color: 'rgba(255,255,255,0.35)',
                fontSize: 12,
                textAlign: 'center',
                margin: '0 0 8px',
                fontWeight: 400,
              }}>
                Tu comentario será visible para todos
              </p>

              {/* Instagram field */}
              <div style={{
                display: 'flex',
                gap: 8,
                marginBottom: 8,
              }}>
                <input
                  type="text"
                  value={instagramField}
                  onChange={(e) => setInstagramField(e.target.value)}
                  placeholder="@tu_instagram (obligatorio)"
                  style={{
                    flex: 1,
                    background: '#1e1e1e',
                    border: '1px solid rgba(255,255,255,0.12)',
                    borderRadius: 20,
                    padding: '9px 14px',
                    color: '#ffffff',
                    fontSize: 13,
                    outline: 'none',
                    fontFamily: 'inherit',
                  }}
                />
              </div>

              {/* Comment field + send */}
              <div style={{
                display: 'flex',
                gap: 8,
                alignItems: 'center',
              }}>
                <input
                  type="text"
                  value={commentField}
                  onChange={(e) => setCommentField(e.target.value)}
                  placeholder="Escribe un comentario..."
                  onKeyDown={(e) => {
                    if (e.key === 'Enter') handleSendComment()
                  }}
                  style={{
                    flex: 1,
                    background: '#1e1e1e',
                    border: '1px solid rgba(255,255,255,0.12)',
                    borderRadius: 20,
                    padding: '9px 14px',
                    color: '#ffffff',
                    fontSize: 13,
                    outline: 'none',
                    fontFamily: 'inherit',
                  }}
                />
                <button
                  onClick={handleSendComment}
                  style={{
                    width: 38,
                    height: 38,
                    borderRadius: '50%',
                    background: '#FE2C55',
                    border: 'none',
                    cursor: 'pointer',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    flexShrink: 0,
                    WebkitTapHighlightColor: 'transparent',
                  }}
                >
                  <svg width="18" height="18" viewBox="0 0 24 24" fill="#ffffff">
                    <path d="M2.01 21L23 12 2.01 3 2 10l15 2-15 2z" />
                  </svg>
                </button>
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </motion.div>
  )
}
