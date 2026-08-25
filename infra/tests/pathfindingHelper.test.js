import { describe, it, expect, vi, beforeEach } from 'vitest'
import { fetchTacticalPath } from '@shared/utils/pathfindingHelper.js'

describe('pathfindingHelper', () => {
  beforeEach(() => {
    vi.restoreAllMocks()
  })

  it('computes zero distance for the same point', async () => {
    const result = await fetchTacticalPath({
      startX: 100,
      startY: 100,
      endX: 100,
      endY: 100,
      gridSize: 50,
      metersPerSquare: 1.5,
    })

    expect(result.found).toBe(true)
    expect(result.distanceMeters).toBe(0)
    expect(result.squares).toBe(0)
    expect(result.path.length).toBe(1)
  })

  it('falls back to linear path when fetch fails or engine is offline', async () => {
    globalThis.fetch = vi.fn().mockRejectedValue(new Error('Network error'))

    const result = await fetchTacticalPath({
      startX: 0,
      startY: 0,
      endX: 150,
      endY: 0,
      gridSize: 50,
      metersPerSquare: 1.5,
    })

    expect(result.found).toBe(true)
    expect(result.squares).toBe(3)
    expect(result.distanceMeters).toBe(4.5)
    expect(result.path.length).toBe(2)
  })

  it('processes valid A* path response from Python Engine API', async () => {
    globalThis.fetch = vi.fn().mockResolvedValue({
      ok: true,
      json: async () => ({
        found: true,
        path: [[0, 0], [1, 0], [2, 0]],
        distance: 2,
      }),
    })

    const result = await fetchTacticalPath({
      startX: 25,
      startY: 25,
      endX: 125,
      endY: 25,
      gridSize: 50,
      metersPerSquare: 1.5,
    })

    expect(result.found).toBe(true)
    expect(result.squares).toBe(2)
    expect(result.distanceMeters).toBe(3.0)
    expect(result.path.length).toBe(3)
    expect(result.path[0]).toEqual({ x: 25, y: 25 })
    expect(result.path[1]).toEqual({ x: 75, y: 25 })
    expect(result.path[2]).toEqual({ x: 125, y: 25 })
  })
})
