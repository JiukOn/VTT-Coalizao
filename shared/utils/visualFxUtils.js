/* visualFxUtils.js — Lightweight particle and shockwave visual effects for map canvas */

/**
 * Creates a new visual effect instance
 * @param {number} x World X
 * @param {number} y World Y
 * @param {'crit'|'spell'|'heal'} type
 * @returns {object}
 */
export function createImpactEffect(x, y, type = 'crit') {
  const particles = []
  const count = type === 'crit' ? 14 : (type === 'heal' ? 10 : 12)

  for (let i = 0; i < count; i++) {
    const angle = (Math.PI * 2 * i) / count + (Math.random() - 0.5) * 0.5
    const speed = type === 'heal' ? 1 + Math.random() * 1.5 : 2.5 + Math.random() * 3.5

    particles.push({
      x,
      y,
      vx: type === 'heal' ? (Math.random() - 0.5) * 1.5 : Math.cos(angle) * speed,
      vy: type === 'heal' ? -1.5 - Math.random() * 2 : Math.sin(angle) * speed,
      size: type === 'crit' ? 3 + Math.random() * 3 : 2.5 + Math.random() * 2.5,
      opacity: 1,
      life: 0,
      maxLife: 30 + Math.floor(Math.random() * 15),
    })
  }

  return {
    id: `fx_${Date.now()}_${Math.random().toString(36).slice(2, 6)}`,
    x,
    y,
    type,
    startTime: Date.now(),
    duration: 1000,
    particles,
  }
}

/**
 * Updates physics for all active visual effects
 * @param {Array<object>} effects
 * @returns {Array<object>} Filtered active effects
 */
export function updateImpactEffects(effects = []) {
  if (!Array.isArray(effects) || effects.length === 0) return []

  const now = Date.now()
  return effects.filter(fx => {
    const elapsed = now - fx.startTime
    if (elapsed >= fx.duration) return false

    for (const p of fx.particles) {
      p.x += p.vx
      p.y += p.vy
      p.life += 1
      p.opacity = Math.max(0, 1 - p.life / p.maxLife)
      if (fx.type !== 'heal') {
        p.vx *= 0.94
        p.vy *= 0.94
      }
    }
    return true
  })
}

/**
 * Renders active visual effects on the 2D canvas
 * @param {CanvasRenderingContext2D} ctx
 * @param {Array<object>} effects
 * @param {number} zoom Current map zoom scale
 */
export function drawImpactEffects(ctx, effects = [], zoom = 1) {
  if (!ctx || !Array.isArray(effects) || effects.length === 0) return

  const now = Date.now()
  ctx.save()

  for (const fx of effects) {
    const elapsed = now - fx.startTime
    const progress = Math.min(1, elapsed / fx.duration)
    const ringOpacity = Math.max(0, (1 - progress) * 0.8)

    // Expanding Shockwave Ring
    ctx.save()
    ctx.beginPath()
    ctx.arc(fx.x, fx.y, (10 + progress * 50) / zoom, 0, Math.PI * 2)

    if (fx.type === 'crit') {
      ctx.strokeStyle = `rgba(245, 158, 11, ${ringOpacity})`
      ctx.lineWidth = 3 / zoom
      ctx.shadowColor = '#F59E0B'
      ctx.shadowBlur = 10
    } else if (fx.type === 'heal') {
      ctx.strokeStyle = `rgba(16, 185, 129, ${ringOpacity})`
      ctx.lineWidth = 2.5 / zoom
      ctx.shadowColor = '#10B981'
      ctx.shadowBlur = 8
    } else {
      ctx.strokeStyle = `rgba(56, 189, 248, ${ringOpacity})`
      ctx.lineWidth = 3 / zoom
      ctx.shadowColor = '#38BDF8'
      ctx.shadowBlur = 10
    }
    ctx.stroke()
    ctx.restore()

    // Draw Particles
    for (const p of fx.particles) {
      if (p.opacity <= 0) continue
      ctx.save()
      ctx.beginPath()
      ctx.arc(p.x, p.y, p.size / zoom, 0, Math.PI * 2)

      if (fx.type === 'crit') {
        ctx.fillStyle = `rgba(251, 191, 36, ${p.opacity})`
        ctx.shadowColor = '#FBBF24'
        ctx.shadowBlur = 6
      } else if (fx.type === 'heal') {
        ctx.fillStyle = `rgba(52, 211, 153, ${p.opacity})`
        ctx.shadowColor = '#34D399'
        ctx.shadowBlur = 5
      } else {
        ctx.fillStyle = `rgba(96, 165, 250, ${p.opacity})`
        ctx.shadowColor = '#60A5FA'
        ctx.shadowBlur = 6
      }
      ctx.fill()
      ctx.restore()
    }
  }

  ctx.restore()
}
