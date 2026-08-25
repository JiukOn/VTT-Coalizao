import { describe, it, expect } from 'vitest'
import {
  getWeaponAmmo,
  consumeWeaponAmmo,
  reloadWeaponAmmo,
} from '../../shared/utils/ammoTracker.js'

describe('Tactical Ammunition Tracker', () => {
  it('reads current ammo and capacity correctly', () => {
    const rifle = { name: 'Rifle Laser', ammoCapacity: 30, currentAmmo: 25 }
    const status = getWeaponAmmo(rifle)

    expect(status.capacity).toBe(30)
    expect(status.current).toBe(25)
    expect(status.isRanged).toBe(true)
  })

  it('consumes ammo on shots fired', () => {
    const pistol = { name: 'Pistola Pesada', ammoCapacity: 12, currentAmmo: 3 }
    const res = consumeWeaponAmmo(pistol, 2)

    expect(res.success).toBe(true)
    expect(res.remainingAmmo).toBe(1)
    expect(res.updatedWeapon.currentAmmo).toBe(1)
  })

  it('blocks shooting when out of ammo', () => {
    const emptyPistol = { name: 'Pistola Pesada', ammoCapacity: 12, currentAmmo: 0 }
    const res = consumeWeaponAmmo(emptyPistol, 1)

    expect(res.success).toBe(false)
    expect(res.message).toContain('Pente vazio')
  })

  it('reloads weapon back to full capacity', () => {
    const emptyRifle = { name: 'Rifle', ammoCapacity: 30, currentAmmo: 5 }
    const res = reloadWeaponAmmo(emptyRifle)

    expect(res.reloadedCount).toBe(25)
    expect(res.updatedWeapon.currentAmmo).toBe(30)
  })
})
