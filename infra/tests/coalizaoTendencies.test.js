import { describe, it, expect } from 'vitest'
import {
  COALIZAO_TENDENCIES,
  getTendencyBonus,
} from '../../shared/utils/coalizaoTendencies.js'

describe('Coalizão Tendencies & Specialization System', () => {
  it('contains canonical tendencies list', () => {
    expect(COALIZAO_TENDENCIES.combat_tactics).toBeDefined()
    expect(COALIZAO_TENDENCIES.firearms).toBeDefined()
    expect(COALIZAO_TENDENCIES.first_aid).toBeDefined()
    expect(COALIZAO_TENDENCIES.parkour).toBeDefined()
  })

  it('calculates total tendency bonus for matching action type', () => {
    const tendencies = ['combat_tactics', 'first_aid']
    const attackBonus = getTendencyBonus(tendencies, 'melee_attack')
    expect(attackBonus).toBe(1)

    const healBonus = getTendencyBonus(tendencies, 'healing')
    expect(healBonus).toBe(2)

    const rangedBonus = getTendencyBonus(tendencies, 'ranged_attack')
    expect(rangedBonus).toBe(0)
  })
})
