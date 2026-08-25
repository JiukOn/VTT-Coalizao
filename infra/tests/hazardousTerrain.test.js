import { describe, it, expect } from 'vitest'
import {
  createTerrainZone,
  checkTokenInTerrainZones,
  TERRAIN_TYPES,
} from '../../shared/utils/hazardousTerrain.js'

describe('Hazardous Terrain System', () => {
  it('creates a terrain zone with valid coordinates and properties', () => {
    const zone = createTerrainZone({
      x: 100,
      y: 200,
      width: 80,
      height: 80,
      type: 'fire',
      name: 'Fogo Cruzado',
    })

    expect(zone.id).toMatch(/^tz_/)
    expect(zone.x).toBe(100)
    expect(zone.y).toBe(200)
    expect(zone.type).toBe('fire')
    expect(zone.color).toBe(TERRAIN_TYPES.fire.color)
  })

  it('detects when token is inside terrain zone', () => {
    const zones = [
      createTerrainZone({ x: 100, y: 100, width: 50, height: 50, type: 'toxic' }),
      createTerrainZone({ x: 300, y: 300, width: 50, height: 50, type: 'ice' }),
    ]

    const hit = checkTokenInTerrainZones({ x: 120, y: 120 }, zones)
    expect(hit.length).toBe(1)
    expect(hit[0].type).toBe('toxic')

    const miss = checkTokenInTerrainZones({ x: 50, y: 50 }, zones)
    expect(miss.length).toBe(0)
  })
})
