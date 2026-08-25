import { describe, it, expect } from 'vitest'
import {
  canEntityMount,
  coupleTokenToMount,
  decoupleTokenFromMount,
  getRiders,
  moveMountAndRiders,
} from '@shared/utils/mountCoupling.js'

describe('mountCoupling — Mounts & Vehicles Coupling System', () => {
  const dummyEntities = [
    { tableId: 'm1', name: 'Cavalo de Guerra', size: 'grande', mapX: 100, mapY: 100 },
    { tableId: 'r1', name: 'Cavaleiro', size: 'medio', mapX: 100, mapY: 100 },
    { tableId: 'r2', name: 'Arqueiro', size: 'medio', mapX: 120, mapY: 100 },
    { tableId: 'giant', name: 'Gigante', size: 'colossal', mapX: 200, mapY: 200 },
  ]

  it('checks if rider can mount based on size rank', () => {
    expect(canEntityMount(dummyEntities[1], dummyEntities[0])).toBe(true) // Medium on Large
    expect(canEntityMount(dummyEntities[3], dummyEntities[0])).toBe(false) // Colossal on Large
    expect(canEntityMount(dummyEntities[0], dummyEntities[0])).toBe(false) // Same entity
  })

  it('couples rider to mount and stores relative offset', () => {
    const updated = coupleTokenToMount('r1', 'm1', dummyEntities)
    const rider = updated.find(e => e.tableId === 'r1')
    expect(rider.mountId).toBe('m1')
    expect(rider.mountOffset).toEqual({ dx: 0, dy: 0 })
    expect(getRiders('m1', updated)).toHaveLength(1)
  })

  it('moves mount and all attached riders together', () => {
    let list = coupleTokenToMount('r1', 'm1', dummyEntities)
    list = coupleTokenToMount('r2', 'm1', list)

    // Move mount from (100, 100) to (300, 400) -> Delta (+200, +300)
    const moved = moveMountAndRiders('m1', 300, 400, list)
    const mount = moved.find(e => e.tableId === 'm1')
    const r1 = moved.find(e => e.tableId === 'r1')
    const r2 = moved.find(e => e.tableId === 'r2')

    expect(mount.mapX).toBe(300)
    expect(mount.mapY).toBe(400)
    expect(r1.mapX).toBe(300)
    expect(r1.mapY).toBe(400)
    expect(r2.mapX).toBe(320)
    expect(r2.mapY).toBe(400)
  })

  it('decouples rider cleanly', () => {
    const list = coupleTokenToMount('r1', 'm1', dummyEntities)
    const decoupled = decoupleTokenFromMount('r1', list)
    const r1 = decoupled.find(e => e.tableId === 'r1')
    expect(r1.mountId).toBeNull()
    expect(getRiders('m1', decoupled)).toHaveLength(0)
  })
})
