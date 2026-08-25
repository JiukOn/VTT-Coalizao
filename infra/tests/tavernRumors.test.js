import { describe, it, expect } from 'vitest'
import { generateRandomRumor, RUMOR_CATEGORIES } from '../../shared/utils/tavernRumors.js'

describe('Tavern Rumors Generator', () => {
  it('generates a rumor with valid structure and fields', () => {
    const rumor = generateRandomRumor('all')

    expect(rumor.id).toMatch(/^rumor_/)
    expect(rumor.text).toBeTypeOf('string')
    expect(rumor.veracity).toBeTypeOf('string')
    expect(rumor.hook).toBeTypeOf('string')
    expect(rumor.rewardEstimate).toBeTypeOf('string')
  })

  it('filters rumors by requested category', () => {
    const urbanRumor = generateRandomRumor('urban')
    expect(urbanRumor.category).toBe('urban')

    const wastelandRumor = generateRandomRumor('wasteland')
    expect(wastelandRumor.category).toBe('wasteland')
  })
})
