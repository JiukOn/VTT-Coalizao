/* ambientSynth.js — Procedural ambient soundscape synthesizer using Web Audio API
   Generates rich atmospheric loops without external mp3 files.
   Supported environments: dungeon | forest | storm | tavern | battle | none
*/

class AmbientSynthesizer {
  constructor() {
    this._ctx = null
    this._currentTheme = 'none'
    this._gainNode = null
    this._nodes = []
    this._volume = 0.4
    this._muted = false
    this._intervalId = null
  }

  _initContext() {
    if (!this._ctx) {
      const AudioCtx = window.AudioContext || window.webkitAudioContext
      if (AudioCtx) {
        this._ctx = new AudioCtx()
        this._gainNode = this._ctx.createGain()
        this._gainNode.gain.setValueAtTime(this._muted ? 0 : this._volume, this._ctx.currentTime)
        this._gainNode.connect(this._ctx.destination)
      }
    }
    if (this._ctx && this._ctx.state === 'suspended') {
      this._ctx.resume().catch(() => {})
    }
  }

  /**
   * Set ambient volume (0.0 to 1.0)
   */
  setVolume(vol) {
    this._volume = Math.max(0, Math.min(1, vol))
    if (this._gainNode && this._ctx && !this._muted) {
      this._gainNode.gain.setTargetAtTime(this._volume, this._ctx.currentTime, 0.1)
    }
  }

  getVolume() {
    return this._volume
  }

  setMuted(muted) {
    this._muted = !!muted
    if (this._gainNode && this._ctx) {
      this._gainNode.gain.setTargetAtTime(this._muted ? 0 : this._volume, this._ctx.currentTime, 0.1)
    }
  }

  isMuted() {
    return this._muted
  }

  getTheme() {
    return this._currentTheme
  }

  /**
   * Start or switch to an ambient theme
   * @param {'dungeon'|'forest'|'storm'|'tavern'|'battle'|'none'} theme
   */
  play(theme = 'none') {
    this._initContext()
    if (!this._ctx) return

    if (this._currentTheme === theme) return
    this.stop()

    this._currentTheme = theme
    if (theme === 'none') return

    switch (theme) {
      case 'dungeon':
        this._startDungeon()
        break
      case 'forest':
        this._startForest()
        break
      case 'storm':
        this._startStorm()
        break
      case 'tavern':
        this._startTavern()
        break
      case 'battle':
        this._startBattle()
        break
      default:
        break
    }
  }

  /**
   * Stop all ambient sounds
   */
  stop() {
    if (this._intervalId) {
      clearInterval(this._intervalId)
      this._intervalId = null
    }

    this._nodes.forEach(node => {
      try {
        if (node.stop) node.stop()
        if (node.disconnect) node.disconnect()
      } catch { /* ignore */ }
    })
    this._nodes = []
    this._currentTheme = 'none'
  }

  // ── Noise Generator Helper ────────────────────────────────────────────────
  _createNoiseBuffer(seconds = 3) {
    const sampleRate = this._ctx.sampleRate
    const buffer = this._ctx.createBuffer(1, sampleRate * seconds, sampleRate)
    const data = buffer.getChannelData(0)
    let lastOut = 0.0
    for (let i = 0; i < buffer.length; i++) {
      const white = Math.random() * 2 - 1
      // Brown noise filter for natural ambiance
      data[i] = (lastOut + (0.02 * white)) / 1.02
      lastOut = data[i]
      data[i] *= 3.5
    }
    return buffer
  }

  // ── 1. Masmorra Sombria (Deep Drone + Resonant Drips) ─────────────────────
  _startDungeon() {
    // Deep low drone
    const drone = this._ctx.createOscillator()
    drone.type = 'sawtooth'
    drone.frequency.setValueAtTime(55, this._ctx.currentTime) // A1 (55Hz)

    const filter = this._ctx.createBiquadFilter()
    filter.type = 'lowpass'
    filter.frequency.setValueAtTime(140, this._ctx.currentTime)
    filter.Q.setValueAtTime(4, this._ctx.currentTime)

    const droneGain = this._ctx.createGain()
    droneGain.gain.setValueAtTime(0.25, this._ctx.currentTime)

    drone.connect(filter)
    filter.connect(droneGain)
    droneGain.connect(this._gainNode)
    drone.start()
    this._nodes.push(drone, filter, droneGain)

    // Occasional resonant water drip
    this._intervalId = setInterval(() => {
      if (this._currentTheme !== 'dungeon' || !this._ctx) return
      const drip = this._ctx.createOscillator()
      const dripGain = this._ctx.createGain()
      const freq = 1200 + Math.random() * 800
      drip.type = 'sine'
      drip.frequency.setValueAtTime(freq, this._ctx.currentTime)
      drip.frequency.exponentialRampToValueAtTime(freq * 0.4, this._ctx.currentTime + 0.12)

      dripGain.gain.setValueAtTime(0.12, this._ctx.currentTime)
      dripGain.gain.exponentialRampToValueAtTime(0.001, this._ctx.currentTime + 0.15)

      drip.connect(dripGain)
      dripGain.connect(this._gainNode)
      drip.start()
      drip.stop(this._ctx.currentTime + 0.18)
    }, 2800)
  }

  // ── 2. Floresta Mística (Wind Whisper + High Chimes) ───────────────────────
  _startForest() {
    // Wind noise
    const noise = this._ctx.createBufferSource()
    noise.buffer = this._createNoiseBuffer(4)
    noise.loop = true

    const bandpass = this._ctx.createBiquadFilter()
    bandpass.type = 'bandpass'
    bandpass.frequency.setValueAtTime(450, this._ctx.currentTime)
    bandpass.Q.setValueAtTime(1.5, this._ctx.currentTime)

    const windGain = this._ctx.createGain()
    windGain.gain.setValueAtTime(0.18, this._ctx.currentTime)

    noise.connect(bandpass)
    bandpass.connect(windGain)
    windGain.connect(this._gainNode)
    noise.start()
    this._nodes.push(noise, bandpass, windGain)

    // Gentle bird chimes
    this._intervalId = setInterval(() => {
      if (this._currentTheme !== 'forest' || !this._ctx) return
      const chirp = this._ctx.createOscillator()
      const chirpGain = this._ctx.createGain()
      const baseFreq = 2200 + Math.random() * 1200
      chirp.type = 'sine'
      chirp.frequency.setValueAtTime(baseFreq, this._ctx.currentTime)
      chirp.frequency.exponentialRampToValueAtTime(baseFreq * 1.3, this._ctx.currentTime + 0.08)

      chirpGain.gain.setValueAtTime(0.06, this._ctx.currentTime)
      chirpGain.gain.exponentialRampToValueAtTime(0.001, this._ctx.currentTime + 0.1)

      chirp.connect(chirpGain)
      chirpGain.connect(this._gainNode)
      chirp.start()
      chirp.stop(this._ctx.currentTime + 0.12)
    }, 3200)
  }

  // ── 3. Tempestade & Trovões (Heavy Rain + Thunder) ─────────────────────────
  _startStorm() {
    // Heavy rain noise
    const rain = this._ctx.createBufferSource()
    rain.buffer = this._createNoiseBuffer(3)
    rain.loop = true

    const lowpass = this._ctx.createBiquadFilter()
    lowpass.type = 'lowpass'
    lowpass.frequency.setValueAtTime(900, this._ctx.currentTime)

    const rainGain = this._ctx.createGain()
    rainGain.gain.setValueAtTime(0.35, this._ctx.currentTime)

    rain.connect(lowpass)
    lowpass.connect(rainGain)
    rainGain.connect(this._gainNode)
    rain.start()
    this._nodes.push(rain, lowpass, rainGain)

    // Periodic thunder
    this._intervalId = setInterval(() => {
      if (this._currentTheme !== 'storm' || !this._ctx) return
      const thunder = this._ctx.createBufferSource()
      thunder.buffer = this._createNoiseBuffer(2)
      const tFilter = this._ctx.createBiquadFilter()
      tFilter.type = 'lowpass'
      tFilter.frequency.setValueAtTime(120, this._ctx.currentTime)
      tFilter.frequency.linearRampToValueAtTime(60, this._ctx.currentTime + 1.5)

      const tGain = this._ctx.createGain()
      tGain.gain.setValueAtTime(0.5, this._ctx.currentTime)
      tGain.gain.exponentialRampToValueAtTime(0.01, this._ctx.currentTime + 1.8)

      thunder.connect(tFilter)
      tFilter.connect(tGain)
      tGain.connect(this._gainNode)
      thunder.start()
      thunder.stop(this._ctx.currentTime + 2)
    }, 7000)
  }

  // ── 4. Taverna Medieval (Warm chatter drone + Crackle) ─────────────────────
  _startTavern() {
    // Warm mid-frequency rumble (chatter simulation)
    const chatter = this._ctx.createBufferSource()
    chatter.buffer = this._createNoiseBuffer(3)
    chatter.loop = true

    const bandpass = this._ctx.createBiquadFilter()
    bandpass.type = 'bandpass'
    bandpass.frequency.setValueAtTime(320, this._ctx.currentTime)
    bandpass.Q.setValueAtTime(0.8, this._ctx.currentTime)

    const chatterGain = this._ctx.createGain()
    chatterGain.gain.setValueAtTime(0.2, this._ctx.currentTime)

    chatter.connect(bandpass)
    bandpass.connect(chatterGain)
    chatterGain.connect(this._gainNode)
    chatter.start()
    this._nodes.push(chatter, bandpass, chatterGain)

    // Hearth fire crackle
    this._intervalId = setInterval(() => {
      if (this._currentTheme !== 'tavern' || !this._ctx) return
      const pop = this._ctx.createOscillator()
      const popGain = this._ctx.createGain()
      pop.type = 'triangle'
      pop.frequency.setValueAtTime(160 + Math.random() * 200, this._ctx.currentTime)
      popGain.gain.setValueAtTime(0.08, this._ctx.currentTime)
      popGain.gain.exponentialRampToValueAtTime(0.001, this._ctx.currentTime + 0.04)

      pop.connect(popGain)
      popGain.connect(this._gainNode)
      pop.start()
      pop.stop(this._ctx.currentTime + 0.05)
    }, 450)
  }

  // ── 5. Combate Intenso (War Drums + Pulse) ────────────────────────────────
  _startBattle() {
    // War drum pulse
    this._intervalId = setInterval(() => {
      if (this._currentTheme !== 'battle' || !this._ctx) return
      const drum = this._ctx.createOscillator()
      drum.type = 'sine'
      drum.frequency.setValueAtTime(90, this._ctx.currentTime)
      drum.frequency.exponentialRampToValueAtTime(35, this._ctx.currentTime + 0.25)

      const drumGain = this._ctx.createGain()
      drumGain.gain.setValueAtTime(0.5, this._ctx.currentTime)
      drumGain.gain.exponentialRampToValueAtTime(0.01, this._ctx.currentTime + 0.3)

      drum.connect(drumGain)
      drumGain.connect(this._gainNode)
      drum.start()
      drum.stop(this._ctx.currentTime + 0.35)
    }, 800)

    // Low tension drone
    const drone = this._ctx.createOscillator()
    drone.type = 'sawtooth'
    drone.frequency.setValueAtTime(65, this._ctx.currentTime)
    const filter = this._ctx.createBiquadFilter()
    filter.type = 'lowpass'
    filter.frequency.setValueAtTime(180, this._ctx.currentTime)
    const dGain = this._ctx.createGain()
    dGain.gain.setValueAtTime(0.18, this._ctx.currentTime)

    drone.connect(filter)
    filter.connect(dGain)
    dGain.connect(this._gainNode)
    drone.start()
    this._nodes.push(drone, filter, dGain)
  }
}

export const ambientSynth = new AmbientSynthesizer()
export default ambientSynth
