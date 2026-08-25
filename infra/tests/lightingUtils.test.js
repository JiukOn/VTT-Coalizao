import { describe, it, expect } from 'vitest'
import {
  calculateLightCells,
  mergeVisionWithLights,
  calculateRouteDistance
} from '../../shared/utils/lightingUtils.js'

describe('Dynamic Lighting & Route Calculations', () => {
  describe('calculateLightCells', () => {
    it('illuminates cells around a light source within radius', () => {
      const lights = [{ x: 100, y: 100, radius: 2, color: '#FBBF24' }]
      const lit = calculateLightCells(lights, [], 50)
      // center is (2,2) -> (2,2) is illuminated
      expect(lit.has('2,2')).toBe(true)
      expect(lit.get('2,2').color).toBe('#FBBF24')
    })

    it('blocks light propagation behind walls', () => {
      const lights = [{ x: 100, y: 100, radius: 4 }]
      // Solid wall between (2,2) and (2,4)
      const walls = [{ x1: 50, y1: 150, x2: 200, y2: 150 }]
      const lit = calculateLightCells(lights, walls, 50)
      // Cell (2,2) is lit
      expect(lit.has('2,2')).toBe(true)
      // Cell (2,4) is behind wall -> should be blocked
      expect(lit.has('2,4')).toBe(false)
    })

    it('returns empty map for empty lights array', () => {
      const lit = calculateLightCells([], [], 50)
      expect(lit.size).toBe(0)
    })
  })

  describe('mergeVisionWithLights', () => {
    it('adds lit cells that have line of sight to hero', () => {
      const naturalVision = new Set(['1,1'])
      const lightCells = new Map([
        ['5,5', { intensity: 0.8, color: '#FBBF24' }],
      ])
      const heroPos = { x: 50, y: 50 } // near (1,1)
      const visible = mergeVisionWithLights(naturalVision, lightCells, heroPos, [], 50)
      expect(visible.has('1,1')).toBe(true)
      expect(visible.has('5,5')).toBe(true)
    })
  })

  describe('calculateRouteDistance', () => {
    it('calculates orthogonal distance correctly', () => {
      const result = calculateRouteDistance(0, 0, 4, 0, 1.5)
      expect(result.distanceCells).toBe(4)
      expect(result.distanceMeters).toBe(6)
      expect(result.formatted).toBe('6m (4q)')
    })

    it('calculates diagonal distance correctly', () => {
      const result = calculateRouteDistance(0, 0, 3, 4, 1.5)
      // 3-4-5 triangle -> 5 cells * 1.5 = 7.5m
      expect(result.distanceCells).toBe(5)
      expect(result.distanceMeters).toBe(7.5)
    })
  })
})
