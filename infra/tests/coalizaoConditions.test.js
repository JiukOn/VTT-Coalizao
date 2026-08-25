import { describe, it, expect } from 'vitest'
import {
  COALIZAO_CONDITIONS,
  resolveConditionTick,
} from '../../shared/utils/coalizaoConditions.js'

describe('Coalizão Canonical Conditions & Diseases System', () => {
  it('contains core Coalizão conditions', () => {
    expect(COALIZAO_CONDITIONS.sangralisia).toBeDefined()
    expect(COALIZAO_CONDITIONS.steel_flu).toBeDefined()
    expect(COALIZAO_CONDITIONS.short_circuit).toBeDefined()
    expect(COALIZAO_CONDITIONS.florescence).toBeDefined()
  })

  it('resolves Sangralisia test (d4 >= 2 passes, d4 < 2 immobilizes)', () => {
    const passed = resolveConditionTick('sangralisia', {}, 3)
    expect(passed.canMove).toBe(true)

    const failed = resolveConditionTick('sangralisia', {}, 1)
    expect(failed.canMove).toBe(false)
    expect(failed.message).toContain('paralisado')
  })

  it('resolves Steel Flu damage test (d20 <= 7 deals 1 damage)', () => {
    const damageTick = resolveConditionTick('steel_flu', {}, 5)
    expect(damageTick.damageTaken).toBe(1)

    const safeTick = resolveConditionTick('steel_flu', {}, 12)
    expect(damageTick.canMove).toBe(true)
    expect(safeTick.damageTaken).toBe(0)
  })
})
