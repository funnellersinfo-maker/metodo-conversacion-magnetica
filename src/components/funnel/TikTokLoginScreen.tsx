'use client'

import { useEffect, useRef, useState } from 'react'
import { motion } from 'framer-motion'

interface TikTokLoginScreenProps {
  onComplete: () => void
}

export default function TikTokLoginScreen({ onComplete }: TikTokLoginScreenProps) {
  const [showPassword, setShowPassword] = useState(false)
  const completedRef = useRef(false)
  const onCompleteRef = useRef(onComplete)

  useEffect(() => {
    onCompleteRef.current = onComplete
  }, [onComplete])

  const handleLogin = () => {
    if (completedRef.current) return
    completedRef.current = true
    onCompleteRef.current()
  }

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
        alignItems: 'center',
        fontFamily: '-apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif',
        overflow: 'hidden',
        userSelect: 'none',
      }}
    >
      {/* ── Android status bar ── */}
      <div style={{
        position: 'absolute',
        top: 0,
        left: 0,
        right: 0,
        padding: '8px 14px 4px',
        display: 'flex',
        justifyContent: 'space-between',
        alignItems: 'center',
        color: 'rgba(255,255,255,0.6)',
        fontSize: '0.68rem',
        fontWeight: 600,
        zIndex: 10,
      }}>
        <span>{new Date().getHours().toString().padStart(2, '0')}:{new Date().getMinutes().toString().padStart(2, '0')}</span>
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

      {/* ── TikTok Logo — REAL SVG ── */}
      <div style={{ marginTop: 'clamp(70px, 18vh, 110px)', marginBottom: 36 }}>
        <svg width="118" height="34" viewBox="0 0 118 34" fill="none">
          {/* TikTok music note icon */}
          <path d="M29.5 0H33v22c0 4.4-3.6 8-8 8s-8-3.6-8-8 3.6-8 8-8c1.5 0 2.9.4 4.1 1.1V9.2c-1.3-.5-2.7-.7-4.1-.7-6.1 0-11 4.9-11 11s4.9 11 11 11 11-4.9 11-11V0h-3.5v4.5c0 1.4-1.1 2.5-2.5 2.5s-2.5-1.1-2.5-2.5V0z" fill="#25F4EE"/>
          <path d="M33 0v4.5c0 1.4 1.1 2.5 2.5 2.5S38 5.9 38 4.5V0h-5z" fill="#FE2C55"/>
          <path d="M33 0v22c0 4.4-3.6 8-8 8-1.5 0-2.9-.4-4.1-1.1 1.2.7 2.6 1.1 4.1 1.1 4.4 0 8-3.6 8-8V0z" fill="white"/>
          {/* "TikTok" text */}
          <text x="46" y="26" fill="white" fontSize="22" fontWeight="800" fontFamily="proxima-nova, sans-serif" letterSpacing="-0.5">TikTok</text>
        </svg>
      </div>

      {/* ── Login Form ── */}
      <div style={{
        width: '85%',
        maxWidth: '360px',
        display: 'flex',
        flexDirection: 'column',
        gap: 12,
      }}>
        {/* Title */}
        <div style={{
          color: '#ffffff',
          fontSize: '1.15rem',
          fontWeight: 700,
          textAlign: 'center',
          marginBottom: 4,
        }}>
          Iniciar sesión en TikTok
        </div>

        <div style={{
          color: 'rgba(255,255,255,0.5)',
          fontSize: '0.78rem',
          textAlign: 'center',
          marginBottom: 8,
          lineHeight: 1.4,
        }}>
          Gestiona tu cuenta, revisa notificaciones, comenta en videos y más.
        </div>

        {/* Username field — pre-filled, NOT editable */}
        <div style={{
          background: '#1c1c1c',
          borderRadius: 4,
          padding: '13px 14px',
          border: '1px solid #3a3a3a',
          pointerEvents: 'none',
        }}>
          <div style={{ color: '#6a6a6a', fontSize: '0.68rem', marginBottom: 3, fontWeight: 500 }}>
            Teléfono / Usuario / Correo
          </div>
          <div style={{ color: '#ffffff', fontSize: '0.88rem', fontWeight: 500 }}>
            @ELCODIGODETEXTO
          </div>
        </div>

        {/* Password field — pre-filled, NOT editable, eye toggle works */}
        <div style={{
          background: '#1c1c1c',
          borderRadius: 4,
          padding: '13px 14px',
          border: '1px solid #3a3a3a',
          display: 'flex',
          alignItems: 'center',
          gap: 8,
        }}>
          <div style={{ flex: 1, pointerEvents: 'none' }}>
            <div style={{ color: '#6a6a6a', fontSize: '0.68rem', marginBottom: 3, fontWeight: 500 }}>
              Contraseña
            </div>
            <div style={{ color: '#ffffff', fontSize: '0.88rem', fontWeight: 500 }}>
              {showPassword ? 'DANTE000' : '••••••••'}
            </div>
          </div>
          {/* Eye toggle — ALWAYS clickable */}
          <button
            type="button"
            onClick={() => setShowPassword(prev => !prev)}
            style={{
              background: 'none',
              border: 'none',
              cursor: 'pointer',
              padding: 6,
              display: 'flex',
              alignItems: 'center',
              WebkitTapHighlightColor: 'transparent',
            }}
          >
            {showPassword ? (
              <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="#6a6a6a" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
                <path d="M17.94 17.94A10.07 10.07 0 0 1 12 20c-7 0-11-8-11-8a18.45 18.45 0 0 1 5.06-5.94M9.9 4.24A9.12 9.12 0 0 1 12 4c7 0 11 8 11 8a18.5 18.5 0 0 1-2.16 3.19m-6.72-1.07a3 3 0 1 1-4.24-4.24" />
                <line x1="1" y1="1" x2="23" y2="23" />
              </svg>
            ) : (
              <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="#6a6a6a" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
                <path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z" />
                <circle cx="12" cy="12" r="3" />
              </svg>
            )}
          </button>
        </div>

        {/* Login button — goes to feed */}
        <button
          type="button"
          onClick={handleLogin}
          style={{
            width: '100%',
            padding: '13px',
            background: '#FE2C55',
            border: 'none',
            borderRadius: 4,
            color: '#ffffff',
            fontSize: '0.92rem',
            fontWeight: 700,
            cursor: 'pointer',
            marginTop: 6,
            letterSpacing: '0.01em',
            WebkitTapHighlightColor: 'transparent',
          }}
        >
          Iniciar sesión
        </button>

        {/* Forgot password / help links */}
        <div style={{
          display: 'flex',
          justifyContent: 'center',
          gap: 16,
          marginTop: 10,
        }}>
          <span style={{ color: '#6a6a6a', fontSize: '0.74rem', cursor: 'pointer' }}>
            ¿Olvidaste la contraseña?
          </span>
          <span style={{ color: '#6a6a6a', fontSize: '0.74rem', cursor: 'pointer' }}>
            Registrarse
          </span>
        </div>
      </div>

      {/* ── Bottom policy text ── */}
      <div style={{
        position: 'absolute',
        bottom: 'clamp(28px, 5vh, 50px)',
        left: 0,
        right: 0,
        textAlign: 'center',
        padding: '0 20px',
      }}>
        <p style={{ color: '#4a4a4a', fontSize: '0.62rem', lineHeight: 1.5, margin: 0 }}>
          Al continuar, aceptas los Términos de Servicio y la Política de Privacidad de TikTok.
        </p>
      </div>
    </motion.div>
  )
}
