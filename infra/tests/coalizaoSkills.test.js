import { describe, it, expect } from 'vitest'
import {
  COALIZAO_SKILLS,
  castCoalizaoSkill,
} from '../../shared/utils/coalizaoSkills.js'

describe('Coalizão Canonical Skills System', () => {
  it('contains core active and legacy skills', () => {
    expect(COALIZAO_SKILLS.energy_blade).toBeDefined()
    expect(COALIZAO_SKILLS.seismic_shockwave).toBeDefined()
    expect(COALIZAO_SKILLS.blade_skill).toBeDefined()
    expect(COALIZAO_SKILLS.aimed_shot).toBeDefined()
  })

  it('casts skill when entity has sufficient ENR', () => {
    const hero = { name: 'Aurelio', enr: 4, effects: [] }
    const res = castCoalizaoSkill(hero, 'energy_blade')

    expect(res.success).toBe(true)
    expect(res.updatedPlayer.enr).toBe(3) // 4 - 1
    expect(res.updatedPlayer.effects.length).toBe(1)
    expect(res.updatedPlayer.effects[0].id).toBe('energy_blade')
    expect(res.updatedPlayer.effects[0].turnsRemaining).toBe(3)
  })

  it('rejects casting when ENR is insufficient', () => {
    const exhaustedHero = { name: 'Aurelio', enr: 0, effects: [] }
    const res = castCoalizaoSkill(exhaustedHero, 'seismic_shockwave') // costs 2 ENR

    expect(res.success).toBe(false)
    expect(res.message).toContain('Energia insuficiente')
    expect(exhaustedHero.enr).toBe(0)
  })
})
