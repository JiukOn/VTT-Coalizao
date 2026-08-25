/**
 * sfxPlayer.js — Lightweight sound effects player using Web Audio API
 *
 * Pre-loads short audio clips and plays them on demand.
 * Supports mute toggle and volume control. Respects user preference
 * stored in localStorage.
 *
 * Usage:
 *   import { sfx } from '@shared/utils/sfxPlayer.js'
 *   sfx.play('dice_roll')
 *   sfx.setMuted(true)
 */

const STORAGE_KEY = 'vtt_sfx_prefs'
const BASE_PATH = '/VTT-Coalizao/sfx/'

// Available sound effects and their file names
const SFX_MANIFEST = {
  dice_roll:     'dice_roll.mp3',
  combat_hit:    'combat_hit.mp3',
  combat_miss:   'combat_miss.mp3',
  turn_alert:    'turn_alert.mp3',
  notification:  'notification.mp3',
}

class SFXPlayer {
  constructor() {
    this._ctx = null
    this._buffers = new Map()
    this._volume = 0.5
    this._muted = false
    this._loaded = false

    // Load preferences from localStorage
    try {
      const prefs = JSON.parse(localStorage.getItem(STORAGE_KEY) || '{}')
      if (typeof prefs.volume === 'number') this._volume = prefs.volume
      if (typeof prefs.muted === 'boolean') this._muted = prefs.muted
    } catch { /* ignore */ }

    // Auto-unlock Web Audio on first user interaction
    if (typeof window !== 'undefined') {
      const unlockAudio = () => {
        this.init().catch(() => {})
      }
      window.addEventListener('pointerdown', unlockAudio, { once: true, passive: true })
      window.addEventListener('keydown', unlockAudio, { once: true, passive: true })
    }
  }

  /**
   * Initialize the AudioContext and preload all sound buffers.
   * Must be called after a user gesture (browser autoplay policy).
   */
  async init() {
    if (this._loaded) return
    try {
      this._ctx = new (window.AudioContext || window.webkitAudioContext)()
      const entries = Object.entries(SFX_MANIFEST)
      await Promise.allSettled(
        entries.map(async ([name, file]) => {
          try {
            const res = await fetch(BASE_PATH + file)
            const contentType = res.headers.get('content-type') || ''
            if (!res.ok || !contentType.includes('audio')) {
              // Procedural audio synthesis fallback will be used
              return
            }
            const buf = await res.arrayBuffer()
            const decoded = await this._ctx.decodeAudioData(buf)
            this._buffers.set(name, decoded)
          } catch {
            // Procedural audio synthesis fallback
          }
        })
      )
      this._loaded = true
    } catch (err) {
      console.warn('[SFX] AudioContext initialization failed:', err.message)
    }
  }

  /**
   * Play a sound effect by name
   * @param {string} name - Key from SFX_MANIFEST
   */
  play(name) {
    if (this._muted) return

    // Instantiate if not created
    if (!this._ctx) {
      try {
        this._ctx = new (window.AudioContext || window.webkitAudioContext)()
      } catch {
        return // Context creation failed, can't play
      }
    }

    // Resume context if suspended (browser autoplay policy)
    if (this._ctx.state === 'suspended') {
      this._ctx.resume().catch(() => {})
    }

    if (this._buffers.has(name)) {
      const source = this._ctx.createBufferSource()
      source.buffer = this._buffers.get(name)

      const gainNode = this._ctx.createGain()
      gainNode.gain.value = this._volume

      source.connect(gainNode)
      gainNode.connect(this._ctx.destination)
      source.start(0)
    } else {
      // Fallback to procedural synthesis
      switch (name) {
        case 'dice_roll':
          this._synthDiceRoll()
          break
        case 'combat_hit':
          this._synthCombatHit()
          break
        case 'combat_miss':
          this._synthCombatMiss()
          break
        case 'turn_alert':
          this._synthTurnAlert()
          break
        case 'notification':
          this._synthNotification()
          break
      }
    }
  }

  /**
   * Set volume (0-1)
   */
  setVolume(vol) {
    this._volume = Math.max(0, Math.min(1, vol))
    this._savePrefs()
  }

  /**
   * Get current volume
   */
  getVolume() {
    return this._volume
  }

  /**
   * Set muted state
   */
  setMuted(muted) {
    this._muted = !!muted
    this._savePrefs()
  }

  /**
   * Get muted state
   */
  isMuted() {
    return this._muted
  }

  /**
   * Toggle mute and return new state
   */
  toggleMute() {
    this._muted = !this._muted
    this._savePrefs()
    return this._muted
  }

  _savePrefs() {
    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify({
        volume: this._volume,
        muted: this._muted,
      }))
    } catch { /* ignore */ }
  }

  // --- Procedural Synthesis Fallbacks ---

  _synthDiceRoll() {
    const ctx = this._ctx
    const now = ctx.currentTime
    const mainGain = ctx.createGain()
    mainGain.gain.value = this._volume
    mainGain.connect(ctx.destination)

    const numImpacts = 3 + Math.floor(Math.random() * 2)
    let time = now

    for (let i = 0; i < numImpacts; i++) {
      // Noise burst
      const bufferSize = ctx.sampleRate * 0.05
      const buffer = ctx.createBuffer(1, bufferSize, ctx.sampleRate)
      const data = buffer.getChannelData(0)
      for (let j = 0; j < bufferSize; j++) {
        data[j] = Math.random() * 2 - 1
      }
      
      const noiseSource = ctx.createBufferSource()
      noiseSource.buffer = buffer
      
      const noiseFilter = ctx.createBiquadFilter()
      noiseFilter.type = 'bandpass'
      noiseFilter.frequency.value = 800 + Math.random() * 400
      noiseFilter.Q.value = 1
      
      const noiseGain = ctx.createGain()
      noiseGain.gain.setValueAtTime(0.5, time)
      noiseGain.gain.exponentialRampToValueAtTime(0.01, time + 0.05)
      
      noiseSource.connect(noiseFilter)
      noiseFilter.connect(noiseGain)
      noiseGain.connect(mainGain)
      
      noiseSource.start(time)
      
      // Thud
      const osc = ctx.createOscillator()
      osc.type = 'sine'
      osc.frequency.setValueAtTime(100 + Math.random() * 50, time)
      osc.frequency.exponentialRampToValueAtTime(40, time + 0.05)
      
      const oscGain = ctx.createGain()
      oscGain.gain.setValueAtTime(0.6, time)
      oscGain.gain.exponentialRampToValueAtTime(0.01, time + 0.05)
      
      osc.connect(oscGain)
      oscGain.connect(mainGain)
      
      osc.start(time)
      osc.stop(time + 0.05)
      
      time += 0.05 + Math.random() * 0.05
    }
  }

  _synthCombatHit() {
    const ctx = this._ctx
    const now = ctx.currentTime
    const mainGain = ctx.createGain()
    mainGain.gain.value = this._volume
    mainGain.connect(ctx.destination)

    // Punch thud
    const osc = ctx.createOscillator()
    osc.type = 'sine'
    osc.frequency.setValueAtTime(150, now)
    osc.frequency.exponentialRampToValueAtTime(40, now + 0.1)
    
    const oscGain = ctx.createGain()
    oscGain.gain.setValueAtTime(1, now)
    oscGain.gain.exponentialRampToValueAtTime(0.01, now + 0.2)
    
    osc.connect(oscGain)
    oscGain.connect(mainGain)
    osc.start(now)
    osc.stop(now + 0.2)

    // Crunch noise
    const bufferSize = ctx.sampleRate * 0.15
    const buffer = ctx.createBuffer(1, bufferSize, ctx.sampleRate)
    const data = buffer.getChannelData(0)
    for (let i = 0; i < bufferSize; i++) {
      data[i] = Math.random() * 2 - 1
    }
    
    const noiseSource = ctx.createBufferSource()
    noiseSource.buffer = buffer
    
    const noiseFilter = ctx.createBiquadFilter()
    noiseFilter.type = 'lowpass'
    noiseFilter.frequency.value = 2000
    
    const noiseGain = ctx.createGain()
    noiseGain.gain.setValueAtTime(0.8, now)
    noiseGain.gain.exponentialRampToValueAtTime(0.01, now + 0.15)
    
    noiseSource.connect(noiseFilter)
    noiseFilter.connect(noiseGain)
    noiseGain.connect(mainGain)
    noiseSource.start(now)
  }

  _synthCombatMiss() {
    const ctx = this._ctx
    const now = ctx.currentTime
    const mainGain = ctx.createGain()
    mainGain.gain.value = this._volume
    mainGain.connect(ctx.destination)

    const bufferSize = ctx.sampleRate * 0.3
    const buffer = ctx.createBuffer(1, bufferSize, ctx.sampleRate)
    const data = buffer.getChannelData(0)
    for (let i = 0; i < bufferSize; i++) {
      data[i] = Math.random() * 2 - 1
    }

    const noiseSource = ctx.createBufferSource()
    noiseSource.buffer = buffer

    const noiseFilter = ctx.createBiquadFilter()
    noiseFilter.type = 'bandpass'
    noiseFilter.Q.value = 2
    noiseFilter.frequency.setValueAtTime(800, now)
    noiseFilter.frequency.exponentialRampToValueAtTime(200, now + 0.25)

    const noiseGain = ctx.createGain()
    noiseGain.gain.setValueAtTime(0.01, now)
    noiseGain.gain.linearRampToValueAtTime(0.5, now + 0.1)
    noiseGain.gain.exponentialRampToValueAtTime(0.01, now + 0.3)

    noiseSource.connect(noiseFilter)
    noiseFilter.connect(noiseGain)
    noiseGain.connect(mainGain)
    
    noiseSource.start(now)
  }

  _synthTurnAlert() {
    const ctx = this._ctx
    const now = ctx.currentTime
    const mainGain = ctx.createGain()
    mainGain.gain.value = this._volume
    mainGain.connect(ctx.destination)

    const playTone = (freq, startTime, duration) => {
      const osc = ctx.createOscillator()
      osc.type = 'sine'
      osc.frequency.value = freq
      
      const gain = ctx.createGain()
      gain.gain.setValueAtTime(0, startTime)
      gain.gain.linearRampToValueAtTime(0.5, startTime + 0.05)
      gain.gain.exponentialRampToValueAtTime(0.01, startTime + duration)
      
      osc.connect(gain)
      gain.connect(mainGain)
      osc.start(startTime)
      osc.stop(startTime + duration)
    }

    playTone(587.33, now, 0.6) // D5
    playTone(880, now + 0.15, 0.8) // A5
  }

  _synthNotification() {
    const ctx = this._ctx
    const now = ctx.currentTime
    const mainGain = ctx.createGain()
    mainGain.gain.value = this._volume
    mainGain.connect(ctx.destination)

    const osc = ctx.createOscillator()
    osc.type = 'sine'
    osc.frequency.value = 659.25 // E5
    
    const gain = ctx.createGain()
    gain.gain.setValueAtTime(0, now)
    gain.gain.linearRampToValueAtTime(0.5, now + 0.03)
    gain.gain.exponentialRampToValueAtTime(0.01, now + 0.4)
    
    osc.connect(gain)
    gain.connect(mainGain)
    
    osc.start(now)
    osc.stop(now + 0.4)
  }
}

// Singleton instance
export const sfx = new SFXPlayer()
export default sfx
