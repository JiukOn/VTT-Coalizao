import { describe, it, expect } from 'vitest'
import {
  buyItemFromMerchant,
  sellItemToMerchant,
  MERCHANT_CATALOGS,
} from '../../shared/utils/merchantShop.js'
import { exportRollsToCsv } from '../../shared/utils/diceAudit.js'

describe('Merchant Shop & Economy System', () => {
  it('allows buying an item when player has enough credits', () => {
    const player = { name: 'Aurelio', credits: 150, inventory: [] }
    const knife = { id: 'knife', name: 'Faca', cost: 45 }

    const res = buyItemFromMerchant(player, knife)

    expect(res.success).toBe(true)
    expect(res.updatedPlayer.credits).toBe(105)
    expect(res.updatedPlayer.inventory.length).toBe(1)
    expect(res.updatedPlayer.inventory[0].name).toBe('Faca')
  })

  it('rejects purchase when player lacks credits', () => {
    const poorPlayer = { name: 'Aurelio', credits: 20, inventory: [] }
    const rifle = { id: 'rifle', name: 'Rifle', cost: 280 }

    const res = buyItemFromMerchant(poorPlayer, rifle)

    expect(res.success).toBe(false)
    expect(res.message).toContain('Créditos insuficientes')
    expect(poorPlayer.credits).toBe(20)
  })

  it('sells item from inventory for 50% value', () => {
    const player = {
      name: 'Aurelio',
      credits: 50,
      inventory: [{ id: 'knife', name: 'Faca', cost: 60 }],
    }

    const res = sellItemToMerchant(player, 0, 0.5)

    expect(res.success).toBe(true)
    expect(res.earnedCredits).toBe(30)
    expect(res.updatedPlayer.credits).toBe(80)
    expect(res.updatedPlayer.inventory.length).toBe(0)
  })

  it('exports roll history to valid CSV', () => {
    const rolls = [
      { id: '1', time: '22:00', playerName: 'Aurelio', diceType: '1d20+3', result: 18, modifier: 3, raw: [15], label: 'Bom' },
    ]
    const csv = exportRollsToCsv(rolls)
    expect(csv).toContain('ID,Horário,Jogador')
    expect(csv).toContain('"Aurelio"')
    expect(csv).toContain('18')
  })
})
