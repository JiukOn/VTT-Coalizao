import { describe, it, expect } from 'vitest'
import { calculateShortRest, calculateLongRest } from '../../shared/utils/restUtils.js'

describe('Rest & Recovery System', () => {
  it('calculates short rest recovery (HP roll + ENR 50% + cleansing temporary conditions)', () => {
    const hero = {
      level: 2,
      hp: 5,
      maxHp: 20,
      enr: 2,
      maxEnr: 16,
      attributes: { vit: 5 },
      effects: ['stunned', 'poisoned'],
    }

    // Predetermined dice rolls: [3, 4] = 7 + vit bonus (+1) = 8 hp recovered
    const res = calculateShortRest(hero, [3, 4])

    expect(res.hpGained).toBe(8)
    expect(res.updatedEntity.hp).toBe(13)
    expect(res.enrGained).toBe(8) // 50% of 16
    expect(res.updatedEntity.enr).toBe(10)
    expect(res.cleansedConditions).toContain('stunned')
    expect(res.updatedEntity.effects).toEqual(['poisoned']) // poison persists past short rest
  })

  it('calculates long rest full restoration (100% HP, 100% ENR, +1 heroic point, clear all effects)', () => {
    const hero = {
      level: 2,
      hp: 4,
      maxHp: 24,
      enr: 0,
      maxEnr: 18,
      heroicPoints: 1,
      effects: ['poisoned', 'prone'],
    }

    const res = calculateLongRest(hero)

    expect(res.updatedEntity.hp).toBe(24)
    expect(res.updatedEntity.enr).toBe(18)
    expect(res.updatedEntity.heroicPoints).toBe(2)
    expect(res.updatedEntity.effects).toEqual([])
  })
})
