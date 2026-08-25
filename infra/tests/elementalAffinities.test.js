import { describe, it, expect } from 'vitest'
import {
  COALIZAO_ELEMENTS,
  calculateElementalDamageMultiplier,
} from '../../shared/utils/elementalAffinities.js'

describe('Coalizão Elemental Affinities & Matchups', () => {
  it('contains canonical elements', () => {
    expect(COALIZAO_ELEMENTS.fire).toBeDefined()
    expect(COALIZAO_ELEMENTS.water).toBeDefined()
    expect(COALIZAO_ELEMENTS.lightning).toBeDefined()
    expect(COALIZAO_ELEMENTS.earth).toBeDefined()
    expect(COALIZAO_ELEMENTS.wood).toBeDefined()
    expect(COALIZAO_ELEMENTS.ice).toBeDefined()
  })

  it('calculates super-effective damage (1.5x) for advantage matchup', () => {
    const fireVsWood = calculateElementalDamageMultiplier('fire', 'wood')
    expect(fireVsWood.multiplier).toBe(1.5)
    expect(fireVsWood.effectiveness).toBe('super_effective')

    const waterVsFire = calculateElementalDamageMultiplier('water', 'fire')
    expect(waterVsFire.multiplier).toBe(1.5)
  })

  it('calculates resistant damage (0.5x) for disadvantage matchup', () => {
    const fireVsWater = calculateElementalDamageMultiplier('fire', 'water')
    expect(fireVsWater.multiplier).toBe(0.5)
    expect(fireVsWater.effectiveness).toBe('not_effective')
  })

  it('calculates neutral damage (1.0x) for neutral matchup', () => {
    const fireVsEarth = calculateElementalDamageMultiplier('fire', 'earth')
    expect(fireVsEarth.multiplier).toBe(1.0)
    expect(fireVsEarth.effectiveness).toBe('neutral')
  })
})
