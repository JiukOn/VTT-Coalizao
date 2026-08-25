import { describe, it, expect } from 'vitest'
import {
  awardHeroicPoint,
  consumeHeroicPoint,
} from '../../shared/utils/heroicPoints.js'
import {
  createSessionTracker,
  recordSessionRoll,
  recordSessionDamage,
  generateSessionMarkdownReport,
} from '../../shared/utils/sessionRecap.js'

describe('Heroic Points & Session Recap Systems', () => {
  describe('Heroic Points', () => {
    it('awards heroic points up to maximum limit', () => {
      let hero = { name: 'Aurelio', heroicPoints: 0 }
      hero = awardHeroicPoint(hero, 2)
      expect(hero.heroicPoints).toBe(2)

      hero = awardHeroicPoint(hero, 5) // max is 3
      expect(hero.heroicPoints).toBe(3)
    })

    it('consumes heroic point for super-advantage', () => {
      const hero = { name: 'Aurelio', heroicPoints: 2 }
      const res = consumeHeroicPoint(hero, 'super_advantage')

      expect(res.success).toBe(true)
      expect(res.updatedEntity.heroicPoints).toBe(1)
    })

    it('consumes heroic point for energy surge', () => {
      const hero = { name: 'Aurelio', heroicPoints: 1, enr: 5, maxEnr: 20 }
      const res = consumeHeroicPoint(hero, 'energy_surge')

      expect(res.success).toBe(true)
      expect(res.updatedEntity.heroicPoints).toBe(0)
      expect(res.updatedEntity.enr).toBe(13)
    })
  })

  describe('Session Recap', () => {
    it('tracks damage, rolls and crits', () => {
      const tracker = createSessionTracker()
      recordSessionDamage(tracker, 35, 'Aurelio', 'Mutante')
      recordSessionRoll(tracker, { result: 20, classification: { id: 'crit' } })

      expect(tracker.totalDamageDealt).toBe(35)
      expect(tracker.highestCrit.damage).toBe(35)
      expect(tracker.totalCritsCount).toBe(1)

      const report = generateSessionMarkdownReport(tracker)
      expect(report).toContain('35 pts')
      expect(report).toContain('Aurelio')
    })
  })
})
