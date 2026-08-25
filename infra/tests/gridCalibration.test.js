import { describe, it, expect } from 'vitest'
import {
  calculatePhysicalGridScale,
  calculatePpiFromMeasurement,
  STANDARD_MINI_SIZE_MM,
} from '@shared/utils/gridCalibration.js'

describe('gridCalibration', () => {
  it('calculates 1:1 scale when map grid equals target PPI pixels', () => {
    // 25.4mm = 1 inch = 96px at 96 PPI
    // If map grid is 96px, scale should be 1.0
    const scale = calculatePhysicalGridScale(25.4, 96, 96)
    expect(scale).toBe(1.0)
  })

  it('calculates accurate scale for 50px grid on 96 PPI display', () => {
    // 25.4mm = 96px. If grid is 50px, scale should be 96 / 50 = 1.92
    const scale = calculatePhysicalGridScale(25.4, 50, 96)
    expect(scale).toBe(1.92)
  })

  it('handles custom mini base sizes (e.g. 30mm large base)', () => {
    const scale = calculatePhysicalGridScale(30, 50, 96)
    expect(scale).toBeGreaterThan(1.92)
  })

  it('calculates PPI from physical ruler measurement accurately', () => {
    // 200px measuring 52.916mm = 2.083 inches -> ~96 PPI
    const ppi = calculatePpiFromMeasurement(200, 52.916)
    expect(Math.round(ppi)).toBe(96)
  })

  it('has valid standard mini constant', () => {
    expect(STANDARD_MINI_SIZE_MM).toBe(25.4)
  })
})
