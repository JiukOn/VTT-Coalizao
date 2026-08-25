import { describe, it, expect } from 'vitest'
import { calculateDamageWithAffinities } from '../../shared/utils/damageTypes.js'
import { drawRandomFumble } from '../../shared/utils/fumbleTables.js'

describe('Damage Types, Affinities & Fumble Tables', () => {
  describe('Damage Affinities', () => {
    it('applies resistance correctly (halving damage)', () => {
      const affinities = { resistances: ['fire'] }
      const res = calculateDamageWithAffinities(14, 'fire', affinities)

      expect(res.finalDamage).toBe(7)
      expect(res.affinityType).toBe('resistance')
    })

    it('applies vulnerability correctly (doubling damage)', () => {
      const affinities = { vulnerabilities: ['acid'] }
      const res = calculateDamageWithAffinities(10, 'acid', affinities)

      expect(res.finalDamage).toBe(20)
      expect(res.affinityType).toBe('vulnerability')
    })

    it('applies immunity correctly (0 damage)', () => {
      const affinities = { immunities: ['energy'] }
      const res = calculateDamageWithAffinities(25, 'energy', affinities)

      expect(res.finalDamage).toBe(0)
      expect(res.affinityType).toBe('immunity')
    })
  })

  describe('Fumble Complications Table', () => {
    it('draws a valid complication on fumble', () => {
      const fumble = drawRandomFumble('melee')
      expect(fumble.id).toBeTypeOf('string')
      expect(fumble.title).toBeTypeOf('string')
      expect(fumble.desc).toBeTypeOf('string')
    })
  })
})
