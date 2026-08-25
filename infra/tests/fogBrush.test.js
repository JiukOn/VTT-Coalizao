import { describe, it, expect } from 'vitest'
import { getCellsInBrushRadius, applyRevealBrush, applyHideBrush } from '@shared/utils/fogUtils.js'

describe('fogUtils', () => {
  it('computes cells in a small brush radius', () => {
    const cells = getCellsInBrushRadius(25, 25, 30, 50)
    expect(cells).toContain('0,0')
  })

  it('computes multiple cells in a larger radius', () => {
    const cells = getCellsInBrushRadius(100, 100, 100, 50)
    expect(cells.length).toBeGreaterThan(4)
    expect(cells).toContain('2,2')
  })

  it('applies reveal brush to existing revealed cells', () => {
    const initial = new Set(['0,0', '1,1'])
    const toReveal = ['2,2', '3,3']
    const updated = applyRevealBrush(initial, toReveal)

    expect(updated.has('0,0')).toBe(true)
    expect(updated.has('2,2')).toBe(true)
    expect(updated.has('3,3')).toBe(true)
    expect(updated.size).toBe(4)
  })

  it('applies hide brush to remove revealed cells', () => {
    const initial = new Set(['0,0', '1,1', '2,2'])
    const toHide = ['1,1']
    const updated = applyHideBrush(initial, toHide)

    expect(updated.has('0,0')).toBe(true)
    expect(updated.has('1,1')).toBe(false)
    expect(updated.has('2,2')).toBe(true)
    expect(updated.size).toBe(2)
  })
})
