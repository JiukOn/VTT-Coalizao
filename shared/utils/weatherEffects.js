/* weatherEffects.js — Lightweight 2D canvas particle system for ambient weather effects */

/**
 * Initializes an array of particles for a given weather type
 * @param {'none'|'rain'|'acid_rain'|'snow'|'embers'|'fog'} type Weather preset
 * @param {number} width Canvas width
 * @param {number} height Canvas height
 * @param {number} count Particle count
 * @returns {Array<object>}
 */
export function createWeatherSystem(type, width = 1000, height = 1000, count = 80) {
  if (type === 'none') return []

  const particles = []
  const particleCount = type === 'rain' || type === 'acid_rain' ? count * 1.5 : count

  for (let i = 0; i < particleCount; i++) {
    particles.push(initParticle(type, width, height, true))
  }

  return particles
}

function initParticle(type, width, height, randomizeY = false) {
  const x = Math.random() * width
  const y = randomizeY ? Math.random() * height : -10

  switch (type) {
    case 'rain':
      return {
        x,
        y,
        speedX: -1 - Math.random() * 2,
        speedY: 12 + Math.random() * 8,
        length: 14 + Math.random() * 10,
        opacity: 0.3 + Math.random() * 0.4,
        size: 1.2,
      }

    case 'acid_rain':
      return {
        x,
        y,
        speedX: -2 - Math.random() * 2,
        speedY: 14 + Math.random() * 6,
        length: 16 + Math.random() * 8,
        opacity: 0.4 + Math.random() * 0.4,
        size: 1.4,
      }

    case 'snow':
      return {
        x,
        y,
        speedX: -0.5 + Math.random() * 1,
        speedY: 1.5 + Math.random() * 2,
        size: 1.5 + Math.random() * 3,
        opacity: 0.4 + Math.random() * 0.5,
        swing: Math.random() * Math.PI * 2,
        swingSpeed: 0.02 + Math.random() * 0.03,
      }

    case 'embers':
      return {
        x,
        y: randomizeY ? Math.random() * height : height + 10,
        speedX: -1 + Math.random() * 2,
        speedY: -1.5 - Math.random() * 2.5,
        size: 1.5 + Math.random() * 2.5,
        opacity: 0.5 + Math.random() * 0.5,
        life: Math.random() * 100,
      }

    case 'fog':
      return {
        x,
        y,
        speedX: 0.3 + Math.random() * 0.5,
        speedY: 0.05 + Math.random() * 0.1,
        size: 60 + Math.random() * 100,
        opacity: 0.08 + Math.random() * 0.12,
      }

    default:
      return { x, y, speedX: 0, speedY: 0, size: 1, opacity: 0 }
  }
}

/**
 * Updates particle physics in time
 * @param {Array<object>} particles
 * @param {number} width
 * @param {number} height
 * @param {string} type
 */
export function updateWeatherParticles(particles, width, height, type) {
  if (!particles || particles.length === 0 || type === 'none') return

  for (let i = 0; i < particles.length; i++) {
    const p = particles[i]

    p.x += p.speedX
    p.y += p.speedY

    if (type === 'snow' && p.swing !== undefined) {
      p.swing += p.swingSpeed
      p.x += Math.sin(p.swing) * 0.8
    }

    if (type === 'embers') {
      p.life = (p.life || 0) + 1
      p.opacity = Math.max(0, p.opacity - 0.003)
      if (p.y < -10 || p.opacity <= 0) {
        Object.assign(p, initParticle(type, width, height, false))
      }
    } else if (p.y > height + 20 || p.x < -20 || p.x > width + 20) {
      Object.assign(p, initParticle(type, width, height, false))
    }
  }
}

/**
 * Draws all weather particles on the 2D canvas context
 * @param {CanvasRenderingContext2D} ctx
 * @param {Array<object>} particles
 * @param {string} type
 */
export function drawWeatherParticles(ctx, particles, type) {
  if (!ctx || !particles || particles.length === 0 || type === 'none') return

  ctx.save()

  switch (type) {
    case 'rain':
      ctx.strokeStyle = 'rgba(186, 230, 253, 0.6)'
      for (const p of particles) {
        ctx.lineWidth = p.size
        ctx.beginPath()
        ctx.moveTo(p.x, p.y)
        ctx.lineTo(p.x + p.speedX * 1.5, p.y + p.length)
        ctx.stroke()
      }
      break

    case 'acid_rain':
      ctx.strokeStyle = 'rgba(163, 230, 53, 0.7)'
      for (const p of particles) {
        ctx.lineWidth = p.size
        ctx.beginPath()
        ctx.moveTo(p.x, p.y)
        ctx.lineTo(p.x + p.speedX * 1.5, p.y + p.length)
        ctx.stroke()
      }
      break

    case 'snow':
      ctx.fillStyle = 'rgba(255, 255, 255, 0.85)'
      for (const p of particles) {
        ctx.beginPath()
        ctx.arc(p.x, p.y, p.size, 0, Math.PI * 2)
        ctx.fill()
      }
      break

    case 'embers':
      for (const p of particles) {
        ctx.fillStyle = `rgba(249, 115, 22, ${p.opacity})`
        ctx.shadowColor = '#F97316'
        ctx.shadowBlur = 6
        ctx.beginPath()
        ctx.arc(p.x, p.y, p.size, 0, Math.PI * 2)
        ctx.fill()
      }
      break

    case 'fog':
      for (const p of particles) {
        const gradient = ctx.createRadialGradient(p.x, p.y, 0, p.x, p.y, p.size)
        gradient.addColorStop(0, `rgba(203, 213, 225, ${p.opacity})`)
        gradient.addColorStop(1, 'rgba(203, 213, 225, 0)')
        ctx.fillStyle = gradient
        ctx.beginPath()
        ctx.arc(p.x, p.y, p.size, 0, Math.PI * 2)
        ctx.fill()
      }
      break

    default:
      break
  }

  ctx.restore()
}
