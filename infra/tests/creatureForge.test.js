import { describe, it, expect } from 'vitest'
import {
  calculateCreatureBaseStats,
  calculateCreatureXp,
  ARCHETYPES,
} from '@shared/utils/creatureForgeUtils.js'

describe('creatureForgeUtils', () => {
  it('calculates higher HP for Bruto archetype compared to Conjurador', () => {
    const bruto = calculateCreatureBaseStats(3, 'bruto')
    const conj = calculateCreatureBaseStats(3, 'conjurador')

    expect(bruto.hp).toBeGreaterThan(conj.hp)
    expect(conj.energy).toBeGreaterThan(bruto.energy)
  })

  it('calculates proper XP scaling for Challenge Ratings', () => {
    expect(calculateCreatureXp(0.25)).toBe(50)
    expect(calculateCreatureXp(1)).toBe(200)
    expect(calculateCreatureXp(5)).toBe(1800)
    expect(calculateCreatureXp(10)).toBeGreaterThan(5000)
  })

  it('generates complete 8 attributes with proper primary scaling', () => {
    const boss = calculateCreatureBaseStats(5, 'colosso')
    expect(boss.attributes.vit).toBeDefined()
    expect(boss.attributes.frc).toBeDefined()
    expect(boss.attributes.dex).toBeDefined()
    expect(boss.attributes.enr).toBeDefined()
    expect(boss.hp).toBeGreaterThan(80)
    expect(boss.defense).toBeGreaterThanOrEqual(12)
  })

  it('contains valid archetype definitions', () => {
    expect(ARCHETYPES.bruto).toBeDefined()
    expect(ARCHETYPES.assassino).toBeDefined()
    expect(ARCHETYPES.conjurador).toBeDefined()
    expect(ARCHETYPES.artilheiro).toBeDefined()
    expect(ARCHETYPES.colosso).toBeDefined()
  })
})
