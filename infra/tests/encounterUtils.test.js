import { describe, it, expect } from 'vitest'
import { calculateEncounterThreat, generateLoot } from '../../shared/utils/encounterUtils.js'

describe('Encounter Threat & Loot Generator', () => {
  describe('calculateEncounterThreat', () => {
    it('returns peaceful when no enemies are present', () => {
      const heroes = [{ level: 2, hp: 25, ac: 14 }]
      const threat = calculateEncounterThreat(heroes, [])
      expect(threat.difficulty).toBe('trivial')
      expect(threat.label).toBe('Pacífico')
    })

    it('calculates trivial threat for weak enemies', () => {
      const heroes = [
        { level: 3, hp: 30, ac: 15 },
        { level: 3, hp: 28, ac: 14 },
      ]
      const enemies = [{ hp: 10, ac: 10 }]
      const threat = calculateEncounterThreat(heroes, enemies)
      expect(threat.difficulty).toBe('trivial')
    })

    it('calculates deadly threat when outmatched', () => {
      const heroes = [{ level: 1, hp: 12, ac: 11 }]
      const enemies = [
        { hp: 45, ac: 16, attacks: [{ name: 'Canhão de Plasma' }] },
        { hp: 35, ac: 14, attacks: [{ name: 'Garras' }] },
      ]
      const threat = calculateEncounterThreat(heroes, enemies)
      expect(threat.difficulty).toBe('deadly')
      expect(threat.color).toBe('#EF4444')
    })
  })

  describe('generateLoot', () => {
    it('generates non-zero gold and enrCells', () => {
      const loot = generateLoot(3, 'challenging')
      expect(loot.gold).toBeGreaterThan(0)
      expect(loot.enrCells).toBeGreaterThan(0)
      expect(Array.isArray(loot.items)).toBe(true)
      expect(loot.items.length).toBeGreaterThan(0)
    })
  })
})
