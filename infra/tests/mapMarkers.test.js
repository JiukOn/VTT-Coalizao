import { describe, it, expect } from 'vitest'
import { createMapMarker, filterVisibleMarkers, MARKER_TYPES } from '../../shared/utils/mapMarkers.js'
import { createImpactEffect, updateImpactEffects } from '../../shared/utils/visualFxUtils.js'

describe('Map Markers & Visual FX System', () => {
  describe('Map Markers', () => {
    it('creates a secret marker with custom fields', () => {
      const marker = createMapMarker({
        x: 250,
        y: 350,
        type: 'trap',
        title: 'Fosso com Estacas',
        description: 'Dano 2d6 perfurante',
        dc: 15,
      })

      expect(marker.id).toMatch(/^m_/)
      expect(marker.x).toBe(250)
      expect(marker.y).toBe(350)
      expect(marker.type).toBe('trap')
      expect(marker.title).toBe('Fosso com Estacas')
      expect(marker.dc).toBe(15)
      expect(marker.revealed).toBe(false)
    })

    it('filters hidden markers for players', () => {
      const markers = [
        createMapMarker({ title: 'Armadilha Secreta' }),
        { ...createMapMarker({ title: 'Estatua Revelada' }), revealed: true },
      ]

      const playerView = filterVisibleMarkers(markers, false)
      expect(playerView.length).toBe(1)
      expect(playerView[0].title).toBe('Estatua Revelada')

      const masterView = filterVisibleMarkers(markers, true)
      expect(masterView.length).toBe(2)
    })
  })

  describe('Visual FX Engine', () => {
    it('creates crit impact particles', () => {
      const fx = createImpactEffect(100, 100, 'crit')
      expect(fx.id).toMatch(/^fx_/)
      expect(fx.particles.length).toBeGreaterThan(0)
      expect(fx.type).toBe('crit')
    })

    it('updates physics and removes expired effects', () => {
      const fx = createImpactEffect(100, 100, 'spell')
      const updated = updateImpactEffects([fx])
      expect(updated.length).toBe(1)

      // Expired effect
      const expiredFx = { ...fx, startTime: Date.now() - 2000, duration: 1000 }
      expect(updateImpactEffects([expiredFx])).toEqual([])
    })
  })
})
