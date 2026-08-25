import { describe, it, expect } from 'vitest'
import {
  calculateStealthScore,
  isDetectedByPassivePerception,
  toggleStealthMode,
} from '../../shared/utils/stealthUtils.js'

describe('Tactical Stealth & Concealment System', () => {
  it('calculates stealth score accurately', () => {
    const score = calculateStealthScore(3, 14)
    expect(score).toBe(17)
  })

  it('checks detection against passive perception', () => {
    expect(isDetectedByPassivePerception(16, 12)).toBe(false) // hidden
    expect(isDetectedByPassivePerception(14, 15)).toBe(true)  // detected
    expect(isDetectedByPassivePerception(14, 14)).toBe(true)  // tie goes to observer
  })

  it('toggles stealth mode on entity', () => {
    let hero = { name: 'Aurelio', stealth: { active: false } }
    hero = toggleStealthMode(hero, true, 18)

    expect(hero.stealth.active).toBe(true)
    expect(hero.stealth.score).toBe(18)

    hero = toggleStealthMode(hero, false)
    expect(hero.stealth.active).toBe(false)
  })
})
