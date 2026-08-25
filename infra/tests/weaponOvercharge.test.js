import { describe, it, expect } from 'vitest'
import { resolveOvercharge } from '../../shared/utils/weaponOvercharge.js'
import { formatRadioMessage } from '../../shared/utils/radioComms.js'

describe('Weapon Overcharge & Radio Comms Systems', () => {
  describe('Weapon Overcharge', () => {
    it('applies extra plasma damage on stable overcharge (d20 > 3)', () => {
      const res = resolveOvercharge(14, 5) // d20=14, d6=5

      expect(res.isOverheated).toBe(false)
      expect(res.extraDamage).toBe(5)
      expect(res.enrDamageToUser).toBe(0)
    })

    it('triggers overheating on d20 <= 3', () => {
      const res = resolveOvercharge(2, 6)

      expect(res.isOverheated).toBe(true)
      expect(res.extraDamage).toBe(0)
      expect(res.enrDamageToUser).toBe(2)
      expect(res.message).toContain('SUPERAQUECIMENTO')
    })
  })

  describe('Radio Comms Formatting', () => {
    it('formats encrypted transmission with frequency label', () => {
      const formatted = formatRadioMessage('Capitão Vane', 'mil_command', 'Avançar para o Setor 7!')
      expect(formatted).toContain('104.2 MHz')
      expect(formatted).toContain('Capitão Vane')
      expect(formatted).toContain('Avançar para o Setor 7!')
    })
  })
})
