/**
 * ambientMusicSynth.js — Procedural Adaptive Music & Soundscapes for VTT Coalizão
 *
 * Generates continuous generative soundtracks using the Web Audio API without heavy MP3 downloads:
 * - 'exploration': Deep atmospheric drone, filtered noise breeze and gentle intervals
 * - 'combat': Fast rhythmic pulse bass, driving tempo and aggressive arpeggios
 * - 'tavern': Warm pentatonic chord pads and gentle safe haven resonance
 * - 'boss': Heavy detuned saw waves, sub-bass rumble and high tension modulations
 */

export const MUSIC_MOODS = {
  off: { id: 'off', label: 'Silêncio', desc: 'Música desligada' },
  exploration: { id: 'exploration', label: '🌲 Exploração', desc: 'Drones atmosféricos e mistério' },
  combat: { id: 'combat', label: '⚔️ Combate', desc: 'Pulsos rítmicos e tensão de batalha' },
  tavern: { id: 'tavern', label: '🏰 Taverna / Santuário', desc: 'Acordes harmônicos e calmaria' },
  boss: { id: 'boss', label: '⚡ Clímax / Chefe', desc: 'Graves pesados e ritmo acelerado' },
}

class DynamicAmbientMusic {
  constructor() {
    this._ctx = null
    this._activeMood = 'off'
    this._masterGain = null
    this._volume = 0.4
    this._intervalId = null
    this._activeNodes = []

    if (typeof window !== 'undefined') {
      const unlock = () => {
        this._initContext()
        if (this._ctx && this._ctx.state === 'suspended') {
          this._ctx.resume().catch(() => {})
        }
      }
      window.addEventListener('pointerdown', unlock, { once: true, passive: true })
      window.addEventListener('keydown', unlock, { once: true, passive: true })
    }
  }

  _initContext() {
    if (!this._ctx && typeof window !== 'undefined') {
      const AudioContextClass = window.AudioContext || window.webkitAudioContext
      if (AudioContextClass) {
        this._ctx = new AudioContextClass()
        this._masterGain = this._ctx.createGain()
        this._masterGain.gain.setValueAtTime(this._volume, this._ctx.currentTime)
        this._masterGain.connect(this._ctx.destination)
      }
    }
  }

  /**
   * Sets the active musical mood with a smooth crossfade.
   * @param {'off'|'exploration'|'combat'|'tavern'|'boss'} moodId
   */
  setMood(moodId) {
    if (this._activeMood === moodId) return
    this._initContext()

    if (this._ctx && this._ctx.state === 'suspended') {
      this._ctx.resume().catch(() => {})
    }

    this._stopCurrentMood()
    this._activeMood = moodId

    if (moodId === 'off' || !this._ctx) return

    if (moodId === 'exploration') this._startExploration()
    else if (moodId === 'combat') this._startCombat()
    else if (moodId === 'tavern') this._startTavern()
    else if (moodId === 'boss') this._startBoss()
  }

  getMood() {
    return this._activeMood
  }

  setVolume(val) {
    this._volume = Math.max(0, Math.min(1, val))
    if (this._masterGain && this._ctx) {
      this._masterGain.gain.setTargetAtTime(this._volume, this._ctx.currentTime, 0.1)
    }
  }

  getVolume() {
    return this._volume
  }

  _stopCurrentMood() {
    if (this._intervalId) {
      clearInterval(this._intervalId)
      this._intervalId = null
    }

    const now = this._ctx ? this._ctx.currentTime : 0
    this._activeNodes.forEach(node => {
      try {
        if (node.gain) {
          node.gain.setValueAtTime(node.gain.value, now)
          node.gain.exponentialRampToValueAtTime(0.0001, now + 1.2)
        }
        if (node.stop) {
          node.stop(now + 1.3)
        }
      } catch { /* ignore */ }
    })
    this._activeNodes = []
  }

  // ── Exploration: Deep drone & floating intervals ─────────────────────────
  _startExploration() {
    const ctx = this._ctx
    const now = ctx.currentTime

    // Base drone
    const osc1 = ctx.createOscillator()
    const osc2 = ctx.createOscillator()
    const gainNode = ctx.createGain()
    const filter = ctx.createBiquadFilter()

    osc1.type = 'sine'
    osc1.frequency.setValueAtTime(55, now) // A1

    osc2.type = 'triangle'
    osc2.frequency.setValueAtTime(110, now) // A2

    filter.type = 'lowpass'
    filter.frequency.setValueAtTime(400, now)

    gainNode.gain.setValueAtTime(0.0001, now)
    gainNode.gain.exponentialRampToValueAtTime(0.25, now + 2.0)

    osc1.connect(filter)
    osc2.connect(filter)
    filter.connect(gainNode)
    gainNode.connect(this._masterGain)

    osc1.start()
    osc2.start()

    this._activeNodes.push(osc1, osc2, gainNode)

    // Periodic gentle chimes (E3, A3, C#4, E4)
    const chimes = [164.81, 220.00, 277.18, 329.63]
    this._intervalId = setInterval(() => {
      if (this._activeMood !== 'exploration') return
      const chimeFreq = chimes[Math.floor(Math.random() * chimes.length)]
      const cOsc = ctx.createOscillator()
      const cGain = ctx.createGain()

      cOsc.type = 'sine'
      cOsc.frequency.setValueAtTime(chimeFreq, ctx.currentTime)

      cGain.gain.setValueAtTime(0.0001, ctx.currentTime)
      cGain.gain.exponentialRampToValueAtTime(0.12, ctx.currentTime + 0.5)
      cGain.gain.exponentialRampToValueAtTime(0.0001, ctx.currentTime + 3.0)

      cOsc.connect(cGain)
      cGain.connect(this._masterGain)

      cOsc.start()
      cOsc.stop(ctx.currentTime + 3.1)
    }, 4000)
  }

  // ── Combat: Rhythmic pulse bass ──────────────────────────────────────────
  _startCombat() {
    const ctx = this._ctx
    const now = ctx.currentTime

    // Low tension drone
    const drone = ctx.createOscillator()
    const droneGain = ctx.createGain()
    drone.type = 'sawtooth'
    drone.frequency.setValueAtTime(43.65, now) // F1

    const filter = ctx.createBiquadFilter()
    filter.type = 'lowpass'
    filter.frequency.setValueAtTime(280, now)

    droneGain.gain.setValueAtTime(0.0001, now)
    droneGain.gain.exponentialRampToValueAtTime(0.3, now + 1.0)

    drone.connect(filter)
    filter.connect(droneGain)
    droneGain.connect(this._masterGain)

    drone.start()
    this._activeNodes.push(drone, droneGain)

    // Driving rhythmic pulse beat
    let step = 0
    this._intervalId = setInterval(() => {
      if (this._activeMood !== 'combat') return
      step++
      const beatOsc = ctx.createOscillator()
      const beatGain = ctx.createGain()

      beatOsc.type = 'triangle'
      const freq = step % 4 === 0 ? 87.31 : 58.27
      beatOsc.frequency.setValueAtTime(freq, ctx.currentTime)
      beatOsc.frequency.exponentialRampToValueAtTime(30, ctx.currentTime + 0.15)

      beatGain.gain.setValueAtTime(0.35, ctx.currentTime)
      beatGain.gain.exponentialRampToValueAtTime(0.0001, ctx.currentTime + 0.2)

      beatOsc.connect(beatGain)
      beatGain.connect(this._masterGain)

      beatOsc.start()
      beatOsc.stop(ctx.currentTime + 0.22)
    }, 450)
  }

  // ── Tavern: Warm chord pads ──────────────────────────────────────────────
  _startTavern() {
    const ctx = this._ctx
    const now = ctx.currentTime

    const chords = [130.81, 164.81, 196.00] // C major
    chords.forEach(freq => {
      const osc = ctx.createOscillator()
      const gain = ctx.createGain()
      osc.type = 'sine'
      osc.frequency.setValueAtTime(freq, now)

      gain.gain.setValueAtTime(0.0001, now)
      gain.gain.exponentialRampToValueAtTime(0.18, now + 2.0)

      osc.connect(gain)
      gain.connect(this._masterGain)
      osc.start()
      this._activeNodes.push(osc, gain)
    })
  }

  // ── Boss: Heavy detuned saw waves ────────────────────────────────────────
  _startBoss() {
    const ctx = this._ctx
    const now = ctx.currentTime

    const bOsc1 = ctx.createOscillator()
    const bOsc2 = ctx.createOscillator()
    const bGain = ctx.createGain()

    bOsc1.type = 'sawtooth'
    bOsc1.frequency.setValueAtTime(36.71, now) // D1
    bOsc2.type = 'sawtooth'
    bOsc2.frequency.setValueAtTime(37.4, now) // D1 slightly detuned

    const filter = ctx.createBiquadFilter()
    filter.type = 'lowpass'
    filter.frequency.setValueAtTime(350, now)

    bGain.gain.setValueAtTime(0.0001, now)
    bGain.gain.exponentialRampToValueAtTime(0.35, now + 1.2)

    bOsc1.connect(filter)
    bOsc2.connect(filter)
    filter.connect(bGain)
    bGain.connect(this._masterGain)

    bOsc1.start()
    bOsc2.start()

    this._activeNodes.push(bOsc1, bOsc2, bGain)
  }
}

export const dynamicMusic = new DynamicAmbientMusic()
export default dynamicMusic
