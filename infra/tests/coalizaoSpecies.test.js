import { describe, it, expect } from 'vitest'
import {
  COALIZAO_SPECIES,
  applySpeciesModifiers,
} from '../../shared/utils/coalizaoSpecies.js'

describe('Coalizão Species & Racial Modifiers', () => {
  it('contains canonical species list', () => {
    expect(COALIZAO_SPECIES.human).toBeDefined()
    expect(COALIZAO_SPECIES.lancax).toBeDefined()
    expect(COALIZAO_SPECIES.elf).toBeDefined()
    expect(COALIZAO_SPECIES.dwarf).toBeDefined()
    expect(COALIZAO_SPECIES.gran).toBeDefined()
  })

  it('applies Lancax attribute modifiers (+2 DEX, +1 PRE, -1 VIT)', () => {
    const base = { vit: 10, dex: 10, crm: 10, frc: 10, int: 10, res: 10, pre: 10, enr: 10 }
    const res = applySpeciesModifiers(base, 'lancax')

    expect(res.dex).toBe(12)
    expect(res.pre).toBe(11)
    expect(res.vit).toBe(9)
    expect(res.frc).toBe(10)
  })

  it('applies Dwarf attribute modifiers (+2 RES, +1 VIT, -1 DEX)', () => {
    const base = { vit: 10, dex: 10, crm: 10, frc: 10, int: 10, res: 10, pre: 10, enr: 10 }
    const res = applySpeciesModifiers(base, 'dwarf')

    expect(res.res).toBe(12)
    expect(res.vit).toBe(11)
    expect(res.dex).toBe(9)
  })
})
