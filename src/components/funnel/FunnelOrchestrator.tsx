'use client'

import { useState, useCallback } from 'react'
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

type FunnelStep = 
  | 'landing' 
  | 'pre_call_video' 
  | 'call_ringing' 
  | 'call_audio' 
  | 'quiz' 
  | 'clown_short' 
  | 'podcast' 
  | 'clown_full' 
  | 'lock_screen' 
  | 'whatsapp_chat'

const stepOrder: FunnelStep[] = [
  'landing',
  'pre_call_video',
  'call_ringing',
  'call_audio',
  'quiz',
  'clown_short',
  'podcast',
  'clown_full',
  'lock_screen',
  'whatsapp_chat',
]

export function FunnelOrchestrator() {
  const [currentStep, setCurrentStep] = useState<FunnelStep>('landing')

  // Use useCallback with functional state update to avoid stale closures
  const goToNextStep = useCallback(() => {
    setCurrentStep(prev => {
      const currentIndex = stepOrder.indexOf(prev)
      const nextIndex = currentIndex + 1
      if (nextIndex < stepOrder.length) {
        return stepOrder[nextIndex]
      }
      return prev
    })
  }, [])

  const renderStep = () => {
    switch (currentStep) {
      case 'landing':
        return <CinematicLanding onComplete={goToNextStep} />
      case 'pre_call_video':
        return <PreCallVideo onComplete={goToNextStep} />
      case 'call_ringing':
        return <CallHook onAnswer={goToNextStep} />
      case 'call_audio':
        return <AudioCallScreen onComplete={goToNextStep} />
      case 'quiz':
        return <FakeQuiz onComplete={goToNextStep} />
      case 'clown_short':
        return <ClownVideo videoSrc="/videos/payaso-vidrio.mp4" onComplete={goToNextStep} />
      case 'podcast':
        return <DantePodcast onComplete={goToNextStep} />
      case 'clown_full':
        return <ClownVideo videoSrc="/videos/payaso-completo.mp4" showSoundPrompt onComplete={goToNextStep} />
      case 'lock_screen':
        return <LockScreenNotification onOpen={goToNextStep} />
      case 'whatsapp_chat':
        return <WhatsAppChat onComplete={goToNextStep} />
      default:
        return null
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
          key={currentStep}
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
