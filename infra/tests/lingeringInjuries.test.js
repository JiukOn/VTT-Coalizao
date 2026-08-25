import { describe, it, expect } from 'vitest'
import { rollLingeringInjury, LINGERING_INJURIES } from '../../shared/utils/lingeringInjuries.js'

describe('Lingering Injuries & Combat Trauma System', () => {
  it('draws valid lingering injury with effect and severity', () => {
    const injury = rollLingeringInjury()

    expect(injury.id).toBeTypeOf('string')
    expect(injury.name).toBeTypeOf('string')
    expect(injury.effect).toBeTypeOf('string')
    expect(injury.severity).toBeDefined()
  })

  it('retrieves specific injury by index', () => {
    const optical = rollLingeringInjury(0)
    expect(optical.id).toBe('optical_trauma')
    expect(optical.name).toContain('Trauma Óptico')
  })
})
