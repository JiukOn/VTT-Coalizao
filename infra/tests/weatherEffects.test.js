import { describe, it, expect } from 'vitest'
import {
  createWeatherSystem,
  updateWeatherParticles,
} from '../../shared/utils/weatherEffects.js'

describe('Weather Effects Particle Engine', () => {
  it('creates empty particles array for none weather', () => {
    const particles = createWeatherSystem('none')
    expect(particles).toEqual([])
  })

  it('initializes rain particles with speed and opacity', () => {
    const particles = createWeatherSystem('rain', 800, 600, 50)
    expect(particles.length).toBeGreaterThan(0)
    const p = particles[0]
    expect(p.x).toBeGreaterThanOrEqual(0)
    expect(p.speedY).toBeGreaterThan(0)
    expect(p.length).toBeGreaterThan(0)
  })

  it('initializes embers with upward velocity and life', () => {
    const particles = createWeatherSystem('embers', 800, 600, 40)
    expect(particles.length).toBe(40)
    const p = particles[0]
    expect(p.speedY).toBeLessThan(0) // rising
    expect(p.opacity).toBeGreaterThan(0)
  })

  it('updates particle positions correctly', () => {
    const particles = createWeatherSystem('rain', 800, 600, 10)
    const initialY = particles[0].y
    updateWeatherParticles(particles, 800, 600, 'rain')
    expect(particles[0].y).toBeGreaterThan(initialY)
  })
})
