import { describe, it, expect } from 'vitest'
import {
  getEntityName,
  getEntityInitials,
  entityNameMatches,
  getEntityDescription
} from '@shared/utils/entityFormatting.js'

describe('entityFormatting — Universal Polymorphic Sanitizer', () => {
  it('handles standard string names', () => {
    expect(getEntityName('Lobo Solitário')).toBe('Lobo Solitário')
    expect(getEntityInitials('Lobo Solitário')).toBe('L')
    expect(getEntityInitials('Lobo Solitário', 2)).toBe('LS')
  })

  it('handles multilingual object names', () => {
    const multi = { pt: 'Dragão de Cristal', en: 'Crystal Dragon' }
    expect(getEntityName(multi, 'pt')).toBe('Dragão de Cristal')
    expect(getEntityName(multi, 'en')).toBe('Crystal Dragon')
    expect(getEntityInitials(multi)).toBe('D')
    expect(getEntityInitials(multi, 2)).toBe('DC')
  })

  it('handles edge cases (null, undefined, numbers, empty objects)', () => {
    expect(getEntityName(null)).toBe('Sem Nome')
    expect(getEntityName(undefined)).toBe('Sem Nome')
    expect(getEntityName('')).toBe('Sem Nome')
    expect(getEntityInitials(null)).toBe('?')
    expect(getEntityInitials({})).toBe('?')
    expect(getEntityName(12345)).toBe('12345')
  })

  it('performs safe multilingual searches with entityNameMatches', () => {
    const multi = { pt: 'Guardião de Pedra', en: 'Stone Guardian' }
    expect(entityNameMatches(multi, 'guardião')).toBe(true)
    expect(entityNameMatches(multi, 'STONE')).toBe(true)
    expect(entityNameMatches(multi, 'fogo')).toBe(false)
    expect(entityNameMatches(null, 'teste')).toBe(false)
  })

  it('sanitizes entity descriptions', () => {
    expect(getEntityDescription({ pt: 'Uma fera antiga.', en: 'An ancient beast.' }, 'pt')).toBe('Uma fera antiga.')
    expect(getEntityDescription('Texto simples')).toBe('Texto simples')
    expect(getEntityDescription(null)).toBe('')
  })
})
