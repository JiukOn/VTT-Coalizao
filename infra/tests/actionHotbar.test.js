import { describe, it, expect } from 'vitest'
import {
  DEFAULT_HOTBAR_SLOTS,
  resolveMacroCommand,
  loadHotbar,
  saveHotbar,
} from '@shared/utils/actionHotbar.js'

describe('actionHotbar — Coalizão RPG Macro Hotbar System', () => {
  const dummyHero = {
    name: 'Guerreiro de Aço',
    attributes: {
      frc: 18, // bonus = Math.floor(18/5) = 3
      dex: 15, // bonus = 3
      int: 12, // bonus = 2
      vit: 14, // bonus = 2
      res: 16, // bonus = 3
      pre: 8,  // bonus = 1
      crm: 10, // bonus = 2
      enr: 20, // bonus = 4
    },
  }

  it('has 9 default slots configured for Coalizão RPG', () => {
    expect(DEFAULT_HOTBAR_SLOTS).toHaveLength(9)
    expect(DEFAULT_HOTBAR_SLOTS[0].label).toBe('Ataque FRC')
  })

  it('resolves attribute macro variables accurately', () => {
    const cmd = '/r 1d20+frc [Golpe de Espada]'
    const resolved = resolveMacroCommand(cmd, dummyHero)
    expect(resolved).toBe('/r 1d20+3 [Golpe de Espada]')
  })

  it('resolves multiple attributes in single command', () => {
    const cmd = '/r 1d20+dex+int [Tiro Arcano]'
    const resolved = resolveMacroCommand(cmd, dummyHero)
    expect(resolved).toBe('/r 1d20+3+2 [Tiro Arcano]')
  })

  it('handles empty commands safely', () => {
    expect(resolveMacroCommand('', dummyHero)).toBe('')
    expect(resolveMacroCommand(null, dummyHero)).toBe('')
  })

  it('loads and saves hotbar slots', () => {
    const slots = loadHotbar('test_hotbar_key')
    expect(slots).toHaveLength(9)
    saveHotbar(slots, 'test_hotbar_key')
  })
})
