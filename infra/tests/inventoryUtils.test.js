import { describe, it, expect } from 'vitest'
import {
  calculateMaxWeight,
  calculateTotalWeight,
  getEncumbranceStatus,
  calculateEquippedBonuses
} from '../../shared/utils/inventoryUtils.js'

describe('Inventory & Encumbrance Calculations', () => {
  describe('calculateMaxWeight', () => {
    it('calculates max weight from force (FRC * 5)', () => {
      expect(calculateMaxWeight(14)).toBe(70)
      expect(calculateMaxWeight(20)).toBe(100)
    })

    it('enforces minimum 30 kg for low force', () => {
      expect(calculateMaxWeight(4)).toBe(30)
      expect(calculateMaxWeight(0)).toBe(30)
    })

    it('handles undefined or invalid force gracefully', () => {
      expect(calculateMaxWeight(undefined)).toBe(50)
      expect(calculateMaxWeight(null)).toBe(50)
    })
  })

  describe('calculateTotalWeight', () => {
    it('sums weight correctly considering quantities', () => {
      const items = [
        { name: 'Espada', weight: 2.5, quantity: 1 },
        { name: 'Poção', weight: 0.5, quantity: 4 },
        { name: 'Tocha', weight: 1.0, quantity: 3 },
      ]
      // 2.5*1 + 0.5*4 + 1*3 = 2.5 + 2 + 3 = 7.5
      expect(calculateTotalWeight(items)).toBe(7.5)
    })

    it('returns 0 for empty array', () => {
      expect(calculateTotalWeight([])).toBe(0)
    })
  })

  describe('getEncumbranceStatus', () => {
    it('classifies light encumbrance (<= 60%)', () => {
      const status = getEncumbranceStatus(30, 100)
      expect(status.status).toBe('light')
      expect(status.movementPenalty).toBe(0)
    })

    it('classifies medium encumbrance (61% - 100%)', () => {
      const status = getEncumbranceStatus(80, 100)
      expect(status.status).toBe('medium')
      expect(status.movementPenalty).toBe(0)
    })

    it('classifies overburdened (> 100%) with movement penalty', () => {
      const status = getEncumbranceStatus(110, 100)
      expect(status.status).toBe('overburdened')
      expect(status.movementPenalty).toBe(2)
    })
  })

  describe('calculateEquippedBonuses', () => {
    it('calculates unarmored AC based on DEX bonus', () => {
      const result = calculateEquippedBonuses({}, 3)
      expect(result.totalAc).toBe(13)
    })

    it('calculates AC with armor and shield', () => {
      const equipment = {
        armor: { name: 'Colete Balístico', ac: 14, dexCap: 2 },
        offHand: { name: 'Escudo de Energia', type: 'shield', shieldBonus: 2 },
      }
      const result = calculateEquippedBonuses(equipment, 3)
      // 14 + min(3, 2) + 2 = 14 + 2 + 2 = 18
      expect(result.totalAc).toBe(18)
      expect(result.shieldBonus).toBe(2)
    })
  })
})
