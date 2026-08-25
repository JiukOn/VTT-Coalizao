import { describe, it, expect } from 'vitest'
import {
  installWeaponAttachment,
  removeWeaponAttachment,
  WEAPON_ATTACHMENTS,
} from '../../shared/utils/craftingWorkshop.js'

describe('Weapon Crafting Workshop & Attachments', () => {
  it('installs holographic sight adding +1 attack bonus', () => {
    const rifle = { name: 'Rifle', attackBonus: 0, ammoCapacity: 12, attachments: [] }
    const res = installWeaponAttachment(rifle, 'holo_sight')

    expect(res.success).toBe(true)
    expect(res.updatedWeapon.attackBonus).toBe(1)
    expect(res.updatedWeapon.attachments.length).toBe(1)
  })

  it('installs extended magazine increasing ammo capacity', () => {
    const pistol = { name: 'Pistola', attackBonus: 0, ammoCapacity: 12, currentAmmo: 12, attachments: [] }
    const res = installWeaponAttachment(pistol, 'extended_mag')

    expect(res.success).toBe(true)
    expect(res.updatedWeapon.ammoCapacity).toBe(18)
  })

  it('prevents installing duplicate attachment', () => {
    const rifle = {
      name: 'Rifle',
      attackBonus: 1,
      attachments: [{ id: 'holo_sight', name: 'Mira Holográfica' }],
    }
    const res = installWeaponAttachment(rifle, 'holo_sight')

    expect(res.success).toBe(false)
    expect(res.message).toContain('já está instalado')
  })

  it('removes installed attachment', () => {
    const rifle = {
      name: 'Rifle',
      attackBonus: 1,
      attachments: [{ id: 'holo_sight', attackBonus: 1 }],
    }
    const res = removeWeaponAttachment(rifle, 'holo_sight')

    expect(res.success).toBe(true)
    expect(res.updatedWeapon.attackBonus).toBe(0)
    expect(res.updatedWeapon.attachments.length).toBe(0)
  })
})
