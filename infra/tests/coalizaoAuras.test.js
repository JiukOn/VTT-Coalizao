import { describe, it, expect } from 'vitest'
import {
  COALIZAO_AURAS,
  isWithinAuraRange,
  getAuraModifiers,
} from '../../shared/utils/coalizaoAuras.js'

describe('Coalizão Tactical Auras System', () => {
  it('contains all canonical Coalizão auras', () => {
    expect(COALIZAO_AURAS.harmony).toBeDefined()
    expect(COALIZAO_AURAS.chaos).toBeDefined()
    expect(COALIZAO_AURAS.inspiration).toBeDefined()
    expect(COALIZAO_AURAS.oppressor).toBeDefined()
    expect(COALIZAO_AURAS.revelation).toBeDefined()
  })

  it('checks if token position is within aura radius', () => {
    const source = { x: 100, y: 100 }
    const closeTarget = { x: 120, y: 100 } // dist = 20px (<= 160px for 6m)
    const farTarget = { x: 400, y: 400 }   // dist = 424px (> 160px)

    expect(isWithinAuraRange(source, closeTarget, 6, 40)).toBe(true)
    expect(isWithinAuraRange(source, farTarget, 6, 40)).toBe(false)
  })

  it('returns correct modifiers for ally vs enemy', () => {
    const allyInspiration = getAuraModifiers('inspiration', true)
    expect(allyInspiration.damageBonus).toBe(2)

    const enemyChaos = getAuraModifiers('chaos', false)
    expect(enemyChaos.attackPenalty).toBe(-1)
  })
})
