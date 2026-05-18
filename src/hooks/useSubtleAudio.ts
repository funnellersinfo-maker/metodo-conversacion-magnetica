'use client'

import { useRef, useCallback } from 'react'

// Minimal cinematic enhancement — ONLY light reverb for spatial warmth
// No distortion, no ring mod, no glitch, no filters, no delay

function createReverbImpulse(ctx: AudioContext, duration: number, decay: number): AudioBuffer {
  const rate = ctx.sampleRate
  const length = Math.floor(rate * duration)
  const buffer = ctx.createBuffer(2, length, rate)
  for (let ch = 0; ch < 2; ch++) {
    const data = buffer.getChannelData(ch)
    for (let i = 0; i < length; i++) {
      data[i] = (Math.random() * 2 - 1) * Math.pow(1 - i / length, decay)
    }
  }
  return buffer
}

export function useSubtleAudio() {
  const ctxRef = useRef<AudioContext | null>(null)
  const sourceRef = useRef<AudioBufferSourceNode | null>(null)
  const chainRef = useRef<{
    reverb: ConvolverNode
    reverbMix: GainNode
    reverbDry: GainNode
    masterGain: GainNode
  } | null>(null)
  const ambientRef = useRef<{
    masterGain: GainNode
    osc1: OscillatorNode
    osc2: OscillatorNode
    gain1: GainNode
    gain2: GainNode
    noise: AudioBufferSourceNode | null
    noiseGain: GainNode
    noiseFilter: BiquadFilterNode
  } | null>(null)

  const getCtx = useCallback(() => {
    if (!ctxRef.current) {
      ctxRef.current = new (window.AudioContext || (window as any).webkitAudioContext)()
    }
    if (ctxRef.current.state === 'suspended') {
      ctxRef.current.resume()
    }
    return ctxRef.current
  }, [])

  // Play audio with only a subtle reverb touch
  const play = useCallback(async (
    audioSrc: string,
    reverbAmount: number = 0.15,
    onEnded?: () => void
  ) => {
    const ctx = getCtx()

    // Stop previous
    if (sourceRef.current) {
      try { sourceRef.current.stop() } catch {}
      sourceRef.current = null
    }
    if (chainRef.current) {
      chainRef.current = null
    }

    // Fetch and decode
    const response = await fetch(audioSrc)
    const arrayBuffer = await response.arrayBuffer()
    const audioBuffer = await ctx.decodeAudioData(arrayBuffer)

    // Source
    const source = ctx.createBufferSource()
    source.buffer = audioBuffer
    sourceRef.current = source

    // Light reverb
    const reverb = ctx.createConvolver()
    reverb.buffer = createReverbImpulse(ctx, 1.8, 3.5)

    const reverbMix = ctx.createGain()
    reverbMix.gain.value = reverbAmount

    const reverbDry = ctx.createGain()
    reverbDry.gain.value = 1 - reverbAmount * 0.3

    const masterGain = ctx.createGain()
    masterGain.gain.value = 1.0

    // Connect: source → dry + wet → master → destination
    source.connect(reverbDry)
    source.connect(reverb)
    reverb.connect(reverbMix)
    reverbDry.connect(masterGain)
    reverbMix.connect(masterGain)
    masterGain.connect(ctx.destination)

    chainRef.current = { reverb, reverbMix, reverbDry, masterGain }

    source.onended = () => {
      chainRef.current = null
      onEnded?.()
    }

    source.start(0)
    return source
  }, [getCtx])

  // Start very subtle ambient background (barely audible)
  const startAmbient = useCallback(() => {
    const ctx = getCtx()
    if (ambientRef.current) return

    const masterGain = ctx.createGain()
    masterGain.gain.value = 0
    masterGain.connect(ctx.destination)

    // Very soft low drone
    const osc1 = ctx.createOscillator()
    osc1.type = 'sine'
    osc1.frequency.value = 65
    const gain1 = ctx.createGain()
    gain1.gain.value = 0.02
    osc1.connect(gain1)
    gain1.connect(masterGain)

    // Very soft second tone
    const osc2 = ctx.createOscillator()
    osc2.type = 'sine'
    osc2.frequency.value = 98
    const gain2 = ctx.createGain()
    gain2.gain.value = 0.012
    osc2.connect(gain2)
    gain2.connect(masterGain)

    // Very soft filtered noise (barely audible atmosphere)
    const noiseBuffer = ctx.createBuffer(1, ctx.sampleRate * 2, ctx.sampleRate)
    const noiseData = noiseBuffer.getChannelData(0)
    for (let i = 0; i < noiseData.length; i++) {
      noiseData[i] = Math.random() * 2 - 1
    }
    const noise = ctx.createBufferSource()
    noise.buffer = noiseBuffer
    noise.loop = true
    const noiseFilter = ctx.createBiquadFilter()
    noiseFilter.type = 'lowpass'
    noiseFilter.frequency.value = 400
    const noiseGain = ctx.createGain()
    noiseGain.gain.value = 0.008
    noise.connect(noiseFilter)
    noiseFilter.connect(noiseGain)
    noiseGain.connect(masterGain)

    osc1.start()
    osc2.start()
    noise.start()

    // Fade in very gently
    masterGain.gain.linearRampToValueAtTime(1, ctx.currentTime + 3)

    ambientRef.current = { masterGain, osc1, osc2, gain1, gain2, noise, noiseGain, noiseFilter }
  }, [getCtx])

  const stopAmbient = useCallback(() => {
    const amb = ambientRef.current
    if (!amb) return
    const ctx = ctxRef.current
    if (ctx) {
      amb.masterGain.gain.linearRampToValueAtTime(0, ctx.currentTime + 1.5)
    }
    setTimeout(() => {
      try {
        amb.osc1.stop()
        amb.osc2.stop()
        amb.noise?.stop()
      } catch {}
      ambientRef.current = null
    }, 2000)
  }, [])

  const stopPlayback = useCallback(() => {
    if (sourceRef.current) {
      try { sourceRef.current.stop() } catch {}
      sourceRef.current = null
    }
    chainRef.current = null
  }, [])

  const cleanupAll = useCallback(() => {
    stopPlayback()
    stopAmbient()
    if (ctxRef.current) {
      ctxRef.current.close()
      ctxRef.current = null
    }
  }, [stopPlayback, stopAmbient])

  return {
    play,
    stopPlayback,
    startAmbient,
    stopAmbient,
    cleanupAll,
  }
}
