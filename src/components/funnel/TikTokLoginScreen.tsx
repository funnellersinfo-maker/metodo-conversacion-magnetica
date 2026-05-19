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
      }}
    >
      {/* ── TikTok Logo ── */}
      <div style={{ marginTop: 'clamp(60px, 15vh, 100px)', marginBottom: 40 }}>
        <svg width="118" height="42" viewBox="0 0 118 42" fill="none">
          {/* TikTok logo simplified */}
          <path d="M40.5 0h8.5c0 8 0 16 .1 24 .2 3.5-.5 7.2-2.9 10-2.9 3.3-7.4 4.8-11.6 4.2-4.5-.5-8.5-3.5-10.2-7.6-1.5-3.6-1-8 1.2-11.2 2.3-3.3 6.2-5.3 10.2-5.1 2.4.1 4.6 1 6.4 2.5V0h-1.7z" fill="#25F4EE"/>
          <path d="M40.5 12.8c-3.2-2.3-7.7-2-10.5.7-3.1 2.8-3.5 7.8-1 11.1 2.2 3 6.3 4.2 9.7 2.8 2.8-1.1 4.9-3.8 5.3-6.8.2-2.5.1-5.1.1-7.6-.9-.8-2.3-1.4-3.6-.2z" fill="#FE2C55"/>
          <path d="M41.7 12.8v16.7c0 3.4-2 6.6-5 8.2-3.5 1.9-8 1.4-11-1.2 2.7.6 5.7-.1 7.7-2 1.8-1.7 2.7-4.1 2.7-6.6V12.8c1-1 2.3-1.5 3.6-1.5 1.4 0 2.7.5 3.7 1.5h-1.7z" fill="white"/>
          {/* Text "TikTok" */}
          <text x="56" y="30" fill="white" fontSize="20" fontWeight="800" fontFamily="sans-serif">TikTok</text>
        </svg>
      </div>

      {/* ── Login Form ── */}
      <div style={{
        width: '85%',
        maxWidth: '360px',
        display: 'flex',
        flexDirection: 'column',
        gap: 14,
      }}>
        {/* Username field — pre-filled */}
        <div style={{
          background: '#1c1c1c',
          borderRadius: 4,
          padding: '14px 16px',
          border: '1px solid #3a3a3a',
        }}>
          <div style={{ color: '#6a6a6a', fontSize: '0.7rem', marginBottom: 4 }}>
            Usuario
          </div>
          <div style={{ color: '#ffffff', fontSize: '0.9rem', fontWeight: 500 }}>
            @ELCODIGODETEXTO
          </div>
        </div>

        {/* Password field — pre-filled with toggle */}
        <div style={{
          background: '#1c1c1c',
          borderRadius: 4,
          padding: '14px 16px',
          border: '1px solid #3a3a3a',
          display: 'flex',
          alignItems: 'center',
          gap: 10,
        }}>
          <div style={{ flex: 1 }}>
            <div style={{ color: '#6a6a6a', fontSize: '0.7rem', marginBottom: 4 }}>
              Contraseña
            </div>
            <div style={{ color: '#ffffff', fontSize: '0.9rem', fontWeight: 500 }}>
              {showPassword ? 'DANTE000' : '••••••••'}
            </div>
          </div>
          {/* Eye toggle */}
          <button
            type="button"
            onClick={() => setShowPassword(prev => !prev)}
            style={{
              background: 'none',
              border: 'none',
              cursor: 'pointer',
              padding: 4,
              display: 'flex',
              alignItems: 'center',
            }}
          >
            {showPassword ? (
              <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="#6a6a6a" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
                <path d="M17.94 17.94A10.07 10.07 0 0 1 12 20c-7 0-11-8-11-8a18.45 18.45 0 0 1 5.06-5.94M9.9 4.24A9.12 9.12 0 0 1 12 4c7 0 11 8 11 8a18.5 18.5 0 0 1-2.16 3.19m-6.72-1.07a3 3 0 1 1-4.24-4.24" />
                <line x1="1" y1="1" x2="23" y2="23" />
              </svg>
            ) : (
              <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="#6a6a6a" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
                <path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z" />
                <circle cx="12" cy="12" r="3" />
              </svg>
            )}
          </button>
        </div>

        {/* Login button */}
        <button
          type="button"
          style={{
            width: '100%',
            padding: '14px',
            background: '#FE2C55',
            border: 'none',
            borderRadius: 4,
            color: '#ffffff',
            fontSize: '0.95rem',
            fontWeight: 700,
            cursor: 'pointer',
            marginTop: 8,
            letterSpacing: '0.02em',
          }}
        >
          Iniciar sesión
        </button>

        {/* Forgot password / help links */}
        <div style={{
          display: 'flex',
          justifyContent: 'center',
          gap: 16,
          marginTop: 12,
        }}>
          <span style={{ color: '#6a6a6a', fontSize: '0.75rem' }}>
            ¿Olvidaste la contraseña?
          </span>
          <span style={{ color: '#6a6a6a', fontSize: '0.75rem' }}>
            Registrarse
          </span>
        </div>
      </div>

      {/* ── Bottom policy text ── */}
      <div style={{
        position: 'absolute',
        bottom: 'clamp(30px, 6vh, 60px)',
        left: 0,
        right: 0,
        textAlign: 'center',
        padding: '0 20px',
      }}>
        <p style={{ color: '#4a4a4a', fontSize: '0.65rem', lineHeight: 1.5, margin: 0 }}>
          Al continuar, aceptas los Términos de Servicio y la Política de Privacidad de TikTok.
        </p>
      </div>
    </motion.div>
  )
}
