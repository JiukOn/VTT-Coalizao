import { describe, it, expect } from 'vitest'
import { getTouchDistance, getTouchCenter, isLongPress } from '../../shared/utils/touchUtils.js'

describe('Touch Gestures Calculations', () => {
  describe('getTouchDistance', () => {
    it('calculates distance between two touch points', () => {
      const t1 = { clientX: 0, clientY: 0 }
      const t2 = { clientX: 30, clientY: 40 }
      expect(getTouchDistance(t1, t2)).toBe(50)
    })

    it('returns 0 for missing touches', () => {
      expect(getTouchDistance(null, null)).toBe(0)
    })
  })

  describe('getTouchCenter', () => {
    it('calculates midpoint of two touches', () => {
      const t1 = { clientX: 10, clientY: 20 }
      const t2 = { clientX: 30, clientY: 60 }
      const center = getTouchCenter(t1, t2)
      expect(center.x).toBe(20)
      expect(center.y).toBe(40)
    })
  })

  describe('isLongPress', () => {
    it('detects long-press when duration exceeds threshold', () => {
      const start = 1000
      const end = 1600
      expect(isLongPress(start, end, 500)).toBe(true)
    })

    it('rejects short taps', () => {
      const start = 1000
      const end = 1200
      expect(isLongPress(start, end, 500)).toBe(false)
    })
  })
})
