import { describe, it, expect } from 'vitest'
import { calculateCover } from '../../shared/utils/coverUtils.js'

describe('Tactical Cover Calculator', () => {
  it('returns no cover when there are no walls', () => {
    const cover = calculateCover({ x: 0, y: 0 }, { x: 100, y: 100 }, [])
    expect(cover.coverType).toBe('none')
    expect(cover.bonusAC).toBe(0)
  })

  it('calculates total cover when wall directly blocks all sightlines', () => {
    const walls = [
      { x1: 50, y1: -50, x2: 50, y2: 150 }, // vertical wall between (0,0) and (100,0)
    ]
    const cover = calculateCover({ x: 0, y: 0 }, { x: 100, y: 0 }, walls, 20)
    expect(cover.coverType).toBe('total')
    expect(cover.bonusAC).toBe(99)
  })

  it('ignores open doors', () => {
    const walls = [
      { x1: 50, y1: -50, x2: 50, y2: 150, isDoor: true, doorState: 'open' },
    ]
    const cover = calculateCover({ x: 0, y: 0 }, { x: 100, y: 0 }, walls, 20)
    expect(cover.coverType).toBe('none')
    expect(cover.bonusAC).toBe(0)
  })
})
