import { describe, it, expect } from 'vitest'
import {
  validateCampaignPackage,
  createCampaignPackage,
} from '../../shared/utils/campaignPackage.js'

describe('Campaign Package Export & Import', () => {
  describe('validateCampaignPackage', () => {
    it('validates a correct campaign package', () => {
      const pkg = {
        app: 'VTT Coalizao',
        version: '1.0.0',
        exportDate: new Date().toISOString(),
        campaignName: 'Crônicas do Subsolo',
        data: {
          maps: [{ id: 1, name: 'Taverna' }],
          characters: [{ id: 1, name: 'Aurelio' }],
          creatures: [{ id: 1, name: 'Mutante' }],
          quests: [{ id: 'q1', title: 'Resgate' }],
          handouts: [{ id: 'h1', title: 'Carta' }],
          scenes: [{ id: 's1', title: 'Neo-Kyoto' }],
        },
      }

      const result = validateCampaignPackage(pkg)
      expect(result.valid).toBe(true)
      expect(result.summary.mapsCount).toBe(1)
      expect(result.summary.charactersCount).toBe(1)
      expect(result.summary.questsCount).toBe(1)
    })

    it('rejects null or invalid object', () => {
      expect(validateCampaignPackage(null).valid).toBe(false)
      expect(validateCampaignPackage('not an object').valid).toBe(false)
    })

    it('rejects package from different app', () => {
      const pkg = {
        app: 'Another VTT',
        data: {},
      }
      const result = validateCampaignPackage(pkg)
      expect(result.valid).toBe(false)
      expect(result.error).toContain('não é um pacote válido')
    })
  })

  describe('createCampaignPackage', () => {
    it('creates full package structure with given data', () => {
      const maps = [{ id: 1, name: 'Masmorra' }]
      const characters = [{ id: 2, name: 'Polaris' }]
      const pkg = createCampaignPackage({
        maps,
        characters,
        campaignName: 'Missão Alpha',
      })

      expect(pkg.app).toBe('VTT Coalizao')
      expect(pkg.campaignName).toBe('Missão Alpha')
      expect(pkg.data.maps).toEqual(maps)
      expect(pkg.data.characters).toEqual(characters)
    })
  })
})
