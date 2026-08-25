import { describe, it, expect } from 'vitest'
import {
  calculateLevelFromXp,
  calculateMaxHpOnLevelUp,
  calculateMaxEnrOnLevelUp,
  applyLevelUp,
} from '../../shared/utils/levelProgression.js'

describe('Level Progression System', () => {
  it('calculates level from XP thresholds', () => {
    expect(calculateLevelFromXp(0).level).toBe(1)
    expect(calculateLevelFromXp(299).level).toBe(1)
    expect(calculateLevelFromXp(300).level).toBe(2)
    expect(calculateLevelFromXp(950).level).toBe(3)
  })

  it('detects when entity is eligible to level up', () => {
    const status = calculateLevelFromXp(400, 1)
    expect(status.canLevelUp).toBe(true)
    expect(status.level).toBe(2)
  })

  it('calculates HP and ENR increase on level up', () => {
    const nextHp = calculateMaxHpOnLevelUp(20, 4)
    expect(nextHp).toBe(26) // 20 + (floor(4/2) + 4) = 26

    const nextEnr = calculateMaxEnrOnLevelUp(15, 3)
    expect(nextEnr).toBe(19) // 15 + (floor(3/2) + 3) = 19
  })

  it('applies level up updates to character entity', () => {
    const hero = {
      name: 'Aurelio',
      level: 1,
      maxHp: 22,
      hp: 15,
      maxEnr: 18,
      enr: 10,
      attributes: { frc: 3, vit: 3, enr: 2 },
    }

    const updated = applyLevelUp(hero, {
      attributeIncreases: { frc: 1, vit: 1 },
    })

    expect(updated.level).toBe(2)
    expect(updated.attributes.frc).toBe(4)
    expect(updated.attributes.vit).toBe(4)
    expect(updated.maxHp).toBeGreaterThan(hero.maxHp)
    expect(updated.hp).toBe(updated.maxHp) // restores full HP
  })
})
