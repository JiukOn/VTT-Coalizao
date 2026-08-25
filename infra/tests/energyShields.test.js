import { describe, it, expect } from 'vitest'
import { absorbDamageWithShield, regenerateShield } from '../../shared/utils/energyShields.js'

describe('Energy Shields & Barrier System', () => {
  it('absorbs partial damage with shield points first', () => {
    const res = absorbDamageWithShield(5, 20, 3)

    expect(res.absorbedByShield).toBe(3)
    expect(res.nextSp).toBe(2)
    expect(res.nextHp).toBe(20)
    expect(res.damageToHp).toBe(0)
  })

  it('absorbs full shield and bleeds excess damage to HP', () => {
    const res = absorbDamageWithShield(4, 20, 10)

    expect(res.absorbedByShield).toBe(4)
    expect(res.nextSp).toBe(0)
    expect(res.damageToHp).toBe(6)
    expect(res.nextHp).toBe(14)
  })

  it('regenerates shield points up to maximum capacity', () => {
    const res = regenerateShield(2, 5, 2)

    expect(res.nextSp).toBe(4)
    expect(res.regenerated).toBe(2)

    const capped = regenerateShield(4, 5, 3)
    expect(capped.nextSp).toBe(5)
    expect(capped.regenerated).toBe(1)
  })
})
