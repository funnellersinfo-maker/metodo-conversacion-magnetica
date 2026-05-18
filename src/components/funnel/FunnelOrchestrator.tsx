'use client'

import { useState, useRef, useCallback } from 'react'
import { AnimatePresence, motion } from 'framer-motion'
import CinematicLanding from './CinematicLanding'
import PreCallVideo from './PreCallVideo'
import CallHook from './CallHook'
import AudioCallScreen from './AudioCallScreen'
import FakeQuiz from './FakeQuiz'
import ClownVideo from './ClownVideo'
import DantePodcast from './DantePodcast'
import LockScreenNotification from './LockScreenNotification'
import WhatsAppChat from './WhatsAppChat'

// 10 STEP FUNNEL — explicit numeric index, NO string matching
// 0: landing
// 1: pre_call_video
// 2: call_ringing
// 3: call_audio
// 4: quiz
// 5: clown_short
// 6: podcast
// 7: clown_full
// 8: lock_screen
// 9: whatsapp_chat

const TOTAL_STEPS = 10

export function FunnelOrchestrator() {
  const [stepIndex, setStepIndex] = useState(0)
  const transitioningRef = useRef(false)

  // goToNextStep is BULLETPROOF:
  // - Only advances ONE step at a time
  // - Has a transition lock to prevent rapid successive calls
  // - Lock releases after 1 second
  const goToNextStep = useCallback(() => {
    if (transitioningRef.current) return
    transitioningRef.current = true

    setStepIndex(prev => {
      if (prev >= TOTAL_STEPS - 1) return prev
      return prev + 1
    })

    // Release lock after 1 second
    setTimeout(() => {
      transitioningRef.current = false
    }, 1000)
  }, [])

  const renderStep = () => {
    switch (stepIndex) {
      case 0: return <CinematicLanding onComplete={goToNextStep} />
      case 1: return <PreCallVideo onComplete={goToNextStep} />
      case 2: return <CallHook onAnswer={goToNextStep} />
      case 3: return <AudioCallScreen onComplete={goToNextStep} />
      case 4: return <FakeQuiz onComplete={goToNextStep} />
      case 5: return <ClownVideo videoSrc="/videos/payaso-vidrio.mp4" onComplete={goToNextStep} />
      case 6: return <DantePodcast onComplete={goToNextStep} />
      case 7: return <ClownVideo videoSrc="/videos/payaso-completo-final.mp4" showSoundPrompt onComplete={goToNextStep} />
      case 8: return <LockScreenNotification onOpen={goToNextStep} />
      case 9: return <WhatsAppChat onComplete={goToNextStep} />
      default: return null
    }
  }

  return (
    <>
      {/* BRAND WATERMARK — fixed top-left on ALL screens */}
      <div
        className="fixed top-5 left-5 z-[999] flex items-center gap-2 pointer-events-none select-none"
        style={{ opacity: 0.85 }}
      >
        <div
          style={{
            width: 3,
            height: 22,
            backgroundColor: '#D32F2F',
            borderRadius: 1,
          }}
        />
        <span
          style={{
            fontFamily: "'Cinzel', serif",
            fontSize: 11,
            fontWeight: 500,
            color: '#FFFFFF',
            letterSpacing: '0.18em',
            textTransform: 'uppercase',
            lineHeight: 1,
          }}
        >
          MÉTODO MAGNÉTICO
        </span>
      </div>

      <AnimatePresence mode="wait">
        <motion.div
          key={stepIndex}
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          transition={{ duration: 0.3 }}
          className="fixed inset-0 z-50"
        >
          {renderStep()}
        </motion.div>
      </AnimatePresence>
    </>
  )
}
