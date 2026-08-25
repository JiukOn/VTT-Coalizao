import { describe, it, expect } from 'vitest'
import { resolveOpposedCheck } from '../../shared/utils/opposedRolls.js'

describe('Opposed Combat Checks', () => {
  it('resolves contest and identifies winner correctly', () => {
    const result = resolveOpposedCheck({
      attackerName: 'Aurelio',
      attackerAttr: 'FRC',
      attackerBonus: 5,
      defenderName: 'Mutante',
      defenderAttr: 'FRC',
      defenderBonus: 2,
    })

    expect(result.attacker.total).toBeGreaterThanOrEqual(6)
    expect(result.defender.total).toBeGreaterThanOrEqual(3)
    expect(['attacker', 'defender', 'draw']).toContain(result.winner)
    expect(typeof result.outcomeText).toBe('string')
    expect(result.outcomeText.length).toBeGreaterThan(0)
  })
})
