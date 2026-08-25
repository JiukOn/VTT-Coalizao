import { describe, it, expect } from 'vitest'
import {
  COALIZAO_BIOMES,
  getBiomeEffects,
} from '../../shared/utils/coalizaoBiomes.js'

describe('Coalizão Biomes & Environmental Conditions', () => {
  it('contains canonical biomes list', () => {
    expect(COALIZAO_BIOMES.ash_forest).toBeDefined()
    expect(COALIZAO_BIOMES.deep_purple_forest).toBeDefined()
    expect(COALIZAO_BIOMES.desert).toBeDefined()
    expect(COALIZAO_BIOMES.blue_stone_forest).toBeDefined()
  })

  it('retrieves specific biome effects and associated weather', () => {
    const ash = getBiomeEffects('ash_forest')
    expect(ash.weather).toBe('embers')
    expect(ash.visionLimitMeters).toBe(8)

    const purple = getBiomeEffects('deep_purple_forest')
    expect(purple.weather).toBe('acid_rain')
  })
})
