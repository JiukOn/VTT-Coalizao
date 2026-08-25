import { describe, it, expect } from 'vitest'
import {
  calculateMaxMovement,
  calculatePathDistance,
  getTokensInCircleAoE,
  getTokensInConeAoE,
  getTokensInLineAoE
} from '@shared/utils/aoeTargeting.js'

describe('aoeTargeting — Movement and AoE Calculations', () => {
  const dummyTokens = [
    { id: 't1', name: 'Guerreiro', mapX: 100, mapY: 100 },
    { id: 't2', name: 'Arqueiro', mapX: 200, mapY: 100 },
    { id: 't3', name: 'Goblin 1', mapX: 150, mapY: 150 },
    { id: 't4', name: 'Goblin 2', mapX: 500, mapY: 500 }, // Far away
  ]

  it('calculates base movement from DEX', () => {
    const hero1 = { attributes: { dex: 10 } } // +2 bonus -> 9 + 3 = 12m
    const hero2 = { attributes: { dex: 20 } } // +4 bonus -> 9 + 6 = 15m
    expect(calculateMaxMovement(hero1).normalMeters).toBe(12)
    expect(calculateMaxMovement(hero1).runMeters).toBe(24)
    expect(calculateMaxMovement(hero2).normalMeters).toBe(15)
  })

  it('calculates path distances across waypoints', () => {
    const points = [
      { x: 0, y: 0 },
      { x: 100, y: 0 }, // 100px = 2 squares (grid 50) = 3m
      { x: 100, y: 100 }, // 100px = 2 squares = 3m -> Total 6m
    ]
    const res = calculatePathDistance(points, 50, 1.5)
    expect(res.totalPx).toBe(200)
    expect(res.totalSquares).toBe(4)
    expect(res.totalMeters).toBe(6)
  })

  it('detects tokens in Circle AoE (Explosion)', () => {
    const center = { x: 120, y: 120 }
    const radius = 100 // Covers t1, t2, t3 but not t4
    const targets = getTokensInCircleAoE(center, radius, dummyTokens, 50)
    const targetIds = targets.map(t => t.id)
    expect(targetIds).toContain('t1')
    expect(targetIds).toContain('t3')
    expect(targetIds).not.toContain('t4')
  })

  it('detects tokens in Cone AoE', () => {
    const origin = { x: 50, y: 100 }
    const angleRad = 0 // Pointing East (+X)
    const lengthPx = 180
    const targets = getTokensInConeAoE(origin, lengthPx, angleRad, 60, dummyTokens, 50)
    const targetIds = targets.map(t => t.id)
    expect(targetIds).toContain('t1')
    expect(targetIds).not.toContain('t4')
  })

  it('detects tokens in Line AoE', () => {
    const start = { x: 50, y: 100 }
    const end = { x: 250, y: 100 }
    const targets = getTokensInLineAoE(start, end, 30, dummyTokens, 50)
    const targetIds = targets.map(t => t.id)
    expect(targetIds).toContain('t1')
    expect(targetIds).toContain('t2')
    expect(targetIds).not.toContain('t4')
  })
})
